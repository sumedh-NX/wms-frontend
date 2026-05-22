import jsPDF from 'jspdf';

// ─────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────
const C = {
  GREEN:    [120, 190,  32] as [number,number,number],
  DARK:     [ 30,  30,  30] as [number,number,number],
  GRAY:     [110, 110, 110] as [number,number,number],
  LGRAY:    [180, 180, 180] as [number,number,number],
  ROW_ALT:  [245, 247, 250] as [number,number,number],
  ROW_HEAD: [230, 245, 210] as [number,number,number],
  RED:      [200,  50,  50] as [number,number,number],
  WHITE:    [255, 255, 255] as [number,number,number],
  BG:       [248, 249, 250] as [number,number,number],
};
const PAGE_W = 210;
const MARGIN = 12;
const COL_W  = PAGE_W - MARGIN * 2;

// ─────────────────────────────────────────────
// ERROR CODE MAP
// ─────────────────────────────────────────────
const ERROR_LEGEND: { code: string; desc: string }[] = [
  { code: 'INVB', desc: 'Invalid Bin QR Format' },
  { code: 'INVP', desc: 'Invalid Pick / Part QR Format' },
  { code: 'INVX', desc: 'Invalid NX QR (Usui)' },
  { code: 'DUPB', desc: 'Bin Already Scanned' },
  { code: 'DUPP', desc: 'Pick / Part Already Scanned' },
  { code: 'PRDM', desc: 'Product Code Mismatch' },
  { code: 'CPKM', desc: 'Case Pack Mismatch' },
  { code: 'DATM', desc: 'Supply Date Mismatch' },
  { code: 'SCHM', desc: 'Schedule Number Mismatch' },
  { code: 'GENF', desc: 'General / Unknown Failure' },
];

function toErrorCode(msg: string | null | undefined): string {
  if (!msg) return '—';
  const m = msg.toLowerCase();
  if (m.includes('invalid') && m.includes('bin'))                     return 'INVB';
  if (m.includes('invalid') && (m.includes('pick') || m.includes('part'))) return 'INVP';
  if (m.includes('invalid') && m.includes('nx'))                      return 'INVX';
  if (m.includes('bin already'))                                       return 'DUPB';
  if (m.includes('pick already') || m.includes('part already'))        return 'DUPP';
  if (m.includes('product code'))                                      return 'PRDM';
  if (m.includes('case pack'))                                         return 'CPKM';
  if (m.includes('date'))                                              return 'DATM';
  if (m.includes('schedule'))                                          return 'SCHM';
  return 'GENF';
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function safe(val: any): string {
  if (val === null || val === undefined || val === '') return '—';
  return String(val);
}

function sectionHeader(pdf: jsPDF, y: number, title: string): number {
  pdf.setFillColor(...C.GREEN);
  pdf.rect(MARGIN, y, COL_W, 7, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.WHITE);
  pdf.text(title.toUpperCase(), MARGIN + 3, y + 5);
  pdf.setTextColor(...C.DARK);
  return y + 10;
}

function kv(pdf: jsPDF, x: number, y: number, label: string, value: string): void {
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.GRAY);
  pdf.text(label, x, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.DARK);
  pdf.text(value, x, y + 4.5);
}

function checkPage(pdf: jsPDF, y: number, needed = 12): number {
  if (y + needed > 282) { pdf.addPage(); return 16; }
  return y;
}

function footer(pdf: jsPDF): void {
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(...C.LGRAY);
    pdf.text(`Generated: ${new Date().toLocaleString('en-IN')} | WMS Outbound Portal`, MARGIN, 290);
    pdf.text(`Page ${i} of ${totalPages}`, PAGE_W - MARGIN - 20, 290);
  }
}

/** Compact 3 signature boxes */
function drawSignatureBoxes(pdf: jsPDF, y: number): number {
  y = checkPage(pdf, y, 30);
  y += 5;
  const gap = 6;
  const boxW = (COL_W - gap * 2) / 3;
  const boxH = 18;
  const labels = ['Scanned by', 'Confirmed By', 'Approved By'];

  labels.forEach((label, i) => {
    const x = MARGIN + i * (boxW + gap);
    pdf.setFillColor(250, 250, 250);
    pdf.setDrawColor(180, 180, 180);
    pdf.roundedRect(x, y, boxW, boxH, 2, 2, 'FD');
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.DARK);
    pdf.text(label, x + boxW / 2, y + 5, { align: 'center' });
    pdf.setDrawColor(210, 210, 210);
    pdf.line(x + 3, y + 7, x + boxW - 3, y + 7);
    pdf.setDrawColor(150, 150, 150);
    pdf.line(x + 5, y + boxH - 4, x + boxW - 5, y + boxH - 4);
    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.LGRAY);
    pdf.text('Signature & Stamp', x + boxW / 2, y + boxH - 1, { align: 'center' });
  });

  return y + boxH + 4;
}

/** Error code legend — only shows codes that appear in FAIL entries */
function drawErrorLegend(pdf: jsPDF, y: number, logs: any[]): number {
  const failLogs = logs.filter(l => l.result === 'FAIL');
  if (failLogs.length === 0) return y;

  const usedCodes = new Set(failLogs.map(l => toErrorCode(l.error_message)));
  const entries = ERROR_LEGEND.filter(e => usedCodes.has(e.code));
  if (entries.length === 0) return y;

  const needed = 14 + entries.length * 5.5;
  y = checkPage(pdf, y, needed);
  y = sectionHeader(pdf, y, 'Error Code Legend');

  // Column headers
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.GRAY);
  pdf.text('CODE', MARGIN + 3, y + 4);
  pdf.text('DESCRIPTION', MARGIN + 22, y + 4);
  y += 7;

  entries.forEach((entry, i) => {
    y = checkPage(pdf, y, 6);
    if (i % 2 === 0) {
      pdf.setFillColor(...C.ROW_ALT);
      pdf.rect(MARGIN, y - 0.5, COL_W, 5.5, 'F');
    }
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.RED);
    pdf.text(entry.code, MARGIN + 3, y + 3.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.DARK);
    pdf.text(entry.desc, MARGIN + 22, y + 3.5);
    y += 5.5;
  });

  return y + 4;
}

// ─────────────────────────────────────────────
// SHARED: Report Header Block
// ─────────────────────────────────────────────
function drawReportHeader(pdf: jsPDF, title: string, dispatch: any, logs: any[], customer: string): number {
  pdf.setFillColor(...C.GREEN);
  pdf.rect(0, 0, PAGE_W, 14, 'F');
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.WHITE);
  pdf.text(title, MARGIN, 10);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Customer: ${customer}`, PAGE_W - MARGIN - 40, 10);

  let y = 20;

  const logTypes = customer === 'USUI' ? ['PART', 'NX_QR'] : ['PICKLIST', 'BIN_LABEL'];
  const lastActionLog = logs.filter(l => logTypes.includes(l.type) && l.result === 'PASS').pop();
  const dispatchedAt = lastActionLog ? fmtDate(lastActionLog.created_at) : '—';
  const createdBy = logs.find(l => l.operator_name)?.operator_name || '—';

  const col1 = MARGIN, col2 = MARGIN + 62, col3 = MARGIN + 124;

  pdf.setFillColor(...C.BG);
  pdf.roundedRect(MARGIN, y, COL_W, 28, 2, 2, 'F');
  kv(pdf, col1 + 4, y + 6,  'DISPATCH NO',   `DSP-${safe(dispatch?.dispatch_number)}`);
  kv(pdf, col2,     y + 6,  'STATUS',         safe(dispatch?.status));
  kv(pdf, col3,     y + 6,  'CUSTOMER',       customer);
  kv(pdf, col1 + 4, y + 18, 'OPERATOR',       createdBy);
  kv(pdf, col2,     y + 18, 'CREATED AT',     fmtDate(dispatch?.created_at));
  kv(pdf, col3,     y + 18, 'DISPATCHED AT',  dispatchedAt);
  y += 32;

  pdf.setFillColor(...C.BG);
  pdf.roundedRect(MARGIN, y, COL_W, 14, 2, 2, 'F');
  kv(pdf, col1 + 4, y + 6, 'NAGARE TIME', safe(dispatch?.ref_supply_date));
  kv(pdf, col2,     y + 6, 'SUPPLY DATE', safe(dispatch?.ref_schedule_sent_date));
  kv(pdf, col3,     y + 6, 'SCHEDULE NO', safe(dispatch?.ref_schedule_number));
  y += 18;
  return y;
}

// ─────────────────────────────────────────────
// SHARED: Audit Log Section
// ─────────────────────────────────────────────
function drawAuditLog(pdf: jsPDF, y: number, logs: any[]): number {
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, 'Scan Audit Log');

  const cols = [
    { l: 'Timestamp',  x: MARGIN       },
    { l: 'Type',       x: MARGIN + 37  },
    { l: 'Code',       x: MARGIN + 56  },
    { l: 'Product',    x: MARGIN + 95  },
    { l: 'Result',     x: MARGIN + 124 },
    { l: 'Operator',   x: MARGIN + 141 },
    { l: 'Err',        x: MARGIN + 172 }, // short header — 4-letter code fits here
  ];

  pdf.setFillColor(...C.ROW_HEAD);
  pdf.rect(MARGIN, y, COL_W, 6, 'F');
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.DARK);
  cols.forEach(c => pdf.text(c.l, c.x + 1, y + 4.5));
  y += 7;

  if (logs.length === 0) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(...C.LGRAY);
    pdf.text('No audit records found.', MARGIN + 4, y + 5);
    return y + 10;
  }

  logs.forEach((log, i) => {
    y = checkPage(pdf, y, 7);
    if (i % 2 === 1) {
      pdf.setFillColor(...C.ROW_ALT);
      pdf.rect(MARGIN, y, COL_W, 6, 'F');
    }

    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    if (log.result === 'FAIL') pdf.setTextColor(...C.RED);
    else pdf.setTextColor(...C.DARK);

    const code = safe(log.code);
    const displayCode = code.length > 18 ? code.substring(0, 16) + '..' : code;

    const rowData = [
      fmtDate(log.created_at),
      safe(log.type),
      displayCode,
      safe(log.product_code),
      safe(log.result),
      safe(log.operator_name),
      toErrorCode(log.error_message),   // 4-letter code instead of truncated text
    ];

    cols.forEach((c, ci) => pdf.text(rowData[ci], c.x + 1, y + 4.5));
    pdf.setTextColor(...C.DARK);
    y += 6;
  });

  return y + 4;
}

// ═══════════════════════════════════════════════════════
// NITERA PDF
// ═══════════════════════════════════════════════════════
export function exportNiteraPDF(dispatch: any, logs: any[], bins: any[], picks: any[]): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = drawReportHeader(pdf, 'Scanning Chalan', dispatch, logs, 'Nitera');

  // ── Dispatch Summary ──
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, 'Dispatch Summary');
  const sumCols = [
    { l: 'Product Code',  x: MARGIN },
    { l: 'Schedule No',   x: MARGIN + 30 },
    { l: 'Supply Qty',    x: MARGIN + 72 },
    { l: 'Total Bins',    x: MARGIN + 92 },
    { l: 'Bins Scanned',  x: MARGIN + 110 },
    { l: 'Picks Scanned', x: MARGIN + 130 },
    { l: 'Case Pack',     x: MARGIN + 152 },
    { l: 'Status',        x: MARGIN + 170 },
  ];
  pdf.setFillColor(...C.ROW_HEAD);
  pdf.rect(MARGIN, y, COL_W, 6, 'F');
  pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...C.DARK);
  sumCols.forEach(c => pdf.text(c.l, c.x + 1, y + 4.5));
  y += 7;
  pdf.setFillColor(...C.ROW_ALT);
  pdf.rect(MARGIN, y, COL_W, 6, 'F');
  pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
  [safe(dispatch?.ref_product_code), safe(dispatch?.ref_schedule_number),
   safe(dispatch?.supply_quantity), safe(dispatch?.total_schedule_bins),
   safe(dispatch?.smg_qty), safe(dispatch?.bin_qty),
   safe(dispatch?.ref_case_pack), safe(dispatch?.status)]
    .forEach((v, i) => pdf.text(v, sumCols[i].x + 1, y + 4.5));
  y += 10;

  // ── Scanned Bins ──
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, `Scanned Bins (${bins.length})`);
  const binCols = [
    { l: '#',            x: MARGIN       },
    { l: 'Bin Number',   x: MARGIN + 9   },
    { l: 'Product Code', x: MARGIN + 40  },
    { l: 'Case Pack',    x: MARGIN + 71  },
    { l: 'Supply Qty',   x: MARGIN + 90  },
    { l: 'Supply Date',  x: MARGIN + 109 },
    { l: 'Invoice No',   x: MARGIN + 132 },
    { l: 'Scanned At',   x: MARGIN + 161 },
  ];
  pdf.setFillColor(...C.ROW_HEAD);
  pdf.rect(MARGIN, y, COL_W, 6, 'F');
  pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...C.DARK);
  binCols.forEach(c => pdf.text(c.l, c.x + 1, y + 4.5));
  y += 7;
  if (bins.length === 0) {
    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...C.LGRAY);
    pdf.text('No bins scanned.', MARGIN + 4, y + 4); y += 10;
  } else {
    bins.forEach((bin, i) => {
      y = checkPage(pdf, y, 7);
      if (i % 2 === 1) { pdf.setFillColor(...C.ROW_ALT); pdf.rect(MARGIN, y, COL_W, 6, 'F'); }
      pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...C.DARK);
      [String(i+1), safe(bin.bin_number), safe(bin.product_code), safe(bin.case_pack),
       safe(bin.supply_quantity), safe(bin.supply_date), safe(bin.invoice_number), fmtDate(bin.created_at)]
        .forEach((v, ci) => pdf.text(v, binCols[ci].x + 1, y + 4.5));
      y += 6;
    });
    y += 4;
  }

  // ── Scanned Picks ──
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, `Scanned Picks (${picks.length})`);
  const pickCols = [
    { l: '#',            x: MARGIN       },
    { l: 'Pick Code',    x: MARGIN + 9   },
    { l: 'Product Code', x: MARGIN + 65  },
    { l: 'Case Pack',    x: MARGIN + 101 },
    { l: 'Scanned At',   x: MARGIN + 120 },
  ];
  pdf.setFillColor(...C.ROW_HEAD);
  pdf.rect(MARGIN, y, COL_W, 6, 'F');
  pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...C.DARK);
  pickCols.forEach(c => pdf.text(c.l, c.x + 1, y + 4.5));
  y += 7;
  if (picks.length === 0) {
    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...C.LGRAY);
    pdf.text('No picks scanned.', MARGIN + 4, y + 4); y += 10;
  } else {
    picks.forEach((pick, i) => {
      y = checkPage(pdf, y, 7);
      if (i % 2 === 1) { pdf.setFillColor(...C.ROW_ALT); pdf.rect(MARGIN, y, COL_W, 6, 'F'); }
      pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...C.DARK);
      [String(i+1), safe(pick.pick_code), safe(pick.product_code),
       safe(pick.case_pack), fmtDate(pick.created_at)]
        .forEach((v, ci) => pdf.text(v, pickCols[ci].x + 1, y + 4.5));
      y += 6;
    });
    y += 4;
  }

  // ── Audit Log ──
  y = drawAuditLog(pdf, y, logs);

  // ── Error Legend (only if FAILs exist) ──
  y = drawErrorLegend(pdf, y, logs);

  // ── Signature Boxes ──
  y = drawSignatureBoxes(pdf, y);

  footer(pdf);
  pdf.save(`Nitera_Dispatch_${dispatch?.dispatch_number}.pdf`);
}

// ═══════════════════════════════════════════════════════
// USUI PDF
// ═══════════════════════════════════════════════════════
export function exportUsuiPDF(dispatch: any, logs: any[], bins: any[], parts: any[]): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = drawReportHeader(pdf, 'Scanning Chalan', dispatch, logs, 'USUI');

  // ── Dispatch Summary ──
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, 'Dispatch Summary');
  const sumCols = [
    { l: 'Product Code', x: MARGIN },
    { l: 'Schedule No',  x: MARGIN + 30 },
    { l: 'Supply Qty',   x: MARGIN + 72 },
    { l: 'Total Bins',   x: MARGIN + 92 },
    { l: 'Parts / Bin',  x: MARGIN + 110 },
    { l: 'Total Parts',  x: MARGIN + 130 },
    { l: 'Bins Scanned', x: MARGIN + 152 },
    { l: 'Status',       x: MARGIN + 170 },
  ];
  pdf.setFillColor(...C.ROW_HEAD);
  pdf.rect(MARGIN, y, COL_W, 6, 'F');
  pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...C.DARK);
  sumCols.forEach(c => pdf.text(c.l, c.x + 1, y + 4.5));
  y += 7;

  const totalParts = parts.length;
  const expectedTotal = dispatch?.total_schedule_bins && dispatch?.ref_case_pack
    ? dispatch.total_schedule_bins * dispatch.ref_case_pack : '—';
  pdf.setFillColor(...C.ROW_ALT);
  pdf.rect(MARGIN, y, COL_W, 6, 'F');
  pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
  [safe(dispatch?.ref_product_code), safe(dispatch?.ref_schedule_number),
   safe(dispatch?.supply_quantity), safe(dispatch?.total_schedule_bins),
   safe(dispatch?.ref_case_pack), `${totalParts} / ${safe(expectedTotal)}`,
   safe(dispatch?.smg_qty), safe(dispatch?.status)]
    .forEach((v, i) => pdf.text(v, sumCols[i].x + 1, y + 4.5));
  y += 10;

  // ── Bin Details with Part Codes ──
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, `Bin Details — ${bins.length} Bins, ${totalParts} Parts Total`);

  if (bins.length === 0) {
    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...C.LGRAY);
    pdf.text('No bins scanned.', MARGIN + 4, y + 4); y += 10;
  } else {
    bins.forEach((bin, binIdx) => {
      const binParts = parts.filter((p: any) => p.bin_id === bin.id);
      const binComplete = binParts.length >= (dispatch?.ref_case_pack || 0);
      y = checkPage(pdf, y, 14);

      pdf.setFillColor(binComplete ? 210 : 255, binComplete ? 240 : 230, binComplete ? 210 : 210);
      pdf.rect(MARGIN, y, COL_W, 8, 'F');
      pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...C.DARK);
      pdf.text(
        `Bin ${binIdx+1}: ${safe(bin.bin_number)}   |   Product: ${safe(bin.product_code)}   |   Parts: ${binParts.length}/${safe(dispatch?.ref_case_pack)}   |   Supply Date: ${safe(bin.supply_date)}   |   Status: ${binComplete ? 'COMPLETE' : 'INCOMPLETE'}`,
        MARGIN + 2, y + 5.5
      );
      y += 10;

      if (binParts.length === 0) {
        y = checkPage(pdf, y, 6);
        pdf.setFontSize(6.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...C.LGRAY);
        pdf.text('   No parts scanned for this bin.', MARGIN + 4, y + 4); y += 7;
      } else {
        const partColW = COL_W / 3;
        let colIdx = 0, rowY = y;
        binParts.forEach((part: any, pIdx: number) => {
          if (colIdx === 0) {
            y = checkPage(pdf, rowY, 6); rowY = y;
            if (pIdx % 6 === 0 && pIdx > 0) {
              pdf.setFillColor(...C.ROW_ALT); pdf.rect(MARGIN, rowY, COL_W, 5.5, 'F');
            }
          }
          pdf.setFontSize(6.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...C.DARK);
          pdf.text(`${pIdx+1}. ${safe(part.part_code)}`, MARGIN + colIdx * partColW + 2, rowY + 4);
          colIdx++;
          if (colIdx === 3) { colIdx = 0; rowY += 5.5; }
        });
        if (colIdx !== 0) rowY += 5.5;
        y = rowY + 3;
      }

      if (binIdx < bins.length - 1) {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(MARGIN, y, MARGIN + COL_W, y); y += 3;
      }
    });
    y += 4;
  }

  // ── Audit Log ──
  y = drawAuditLog(pdf, y, logs);

  // ── Error Legend (only if FAILs exist) ──
  y = drawErrorLegend(pdf, y, logs);

  // ── Signature Boxes ──
  y = drawSignatureBoxes(pdf, y);

  footer(pdf);
  pdf.save(`USUI_Dispatch_${dispatch?.dispatch_number}.pdf`);
}