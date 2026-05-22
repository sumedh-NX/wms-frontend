import jsPDF from 'jspdf';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const C = {
  GREEN:    [120, 190,  32] as [number,number,number],
  DKGREEN:  [  0, 110,   0] as [number,number,number],
  DARK:     [ 30,  30,  30] as [number,number,number],
  GRAY:     [110, 110, 110] as [number,number,number],
  LGRAY:    [180, 180, 180] as [number,number,number],
  ROW_ALT:  [245, 247, 250] as [number,number,number],
  ROW_HEAD: [230, 245, 210] as [number,number,number],
  RED:      [200,  50,  50] as [number,number,number],
  WHITE:    [255, 255, 255] as [number,number,number],
  BG:       [248, 249, 250] as [number,number,number],
  CUSTBG:   [ 27,  27,  75] as [number,number,number],
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
  { code: 'INVX', desc: 'Invalid NX Label QR (Usui)' },
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
  if (m.includes('invalid') && m.includes('bin'))                          return 'INVB';
  if (m.includes('invalid') && (m.includes('pick') || m.includes('part'))) return 'INVP';
  if (m.includes('invalid') && m.includes('nx'))                           return 'INVX';
  if (m.includes('bin already'))                                            return 'DUPB';
  if (m.includes('pick already') || m.includes('part already'))             return 'DUPP';
  if (m.includes('product code'))                                           return 'PRDM';
  if (m.includes('case pack'))                                              return 'CPKM';
  if (m.includes('date'))                                                   return 'DATM';
  if (m.includes('schedule'))                                               return 'SCHM';
  return 'GENF';
}

// ─────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────
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

function trunc(val: string, max: number): string {
  if (val.length <= max) return val;
  return val.substring(0, max - 2) + '..';
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
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.GRAY);
  pdf.text(label, x, y);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.DARK);
  pdf.text(value, x, y + 5);
}

function checkPage(pdf: jsPDF, y: number, needed = 12): number {
  if (y + needed > 282) { pdf.addPage(); return 16; }
  return y;
}

function footer(pdf: jsPDF): void {
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(...C.LGRAY);
    pdf.line(MARGIN, 286, PAGE_W - MARGIN, 286);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.LGRAY);
    pdf.text(`Generated: ${new Date().toLocaleString('en-IN')} | WMS Outbound Portal | Nippon Express India`, MARGIN, 290);
    pdf.text(`Page ${i} / ${totalPages}`, PAGE_W - MARGIN - 18, 290);
  }
}

// ─────────────────────────────────────────────
// SIGNATURE BOXES
// ─────────────────────────────────────────────
function drawSignatureBoxes(pdf: jsPDF, y: number): number {
  y = checkPage(pdf, y, 36);
  y += 6;
  const gap = 5;
  const boxW = (COL_W - gap * 2) / 3;
  const boxH = 20;
  const labels = ['Scanned By', 'Confirmed By', 'Approved By'];

  labels.forEach((label, i) => {
    const x = MARGIN + i * (boxW + gap);
    pdf.setFillColor(252, 252, 252);
    pdf.setDrawColor(...C.LGRAY);
    pdf.roundedRect(x, y, boxW, boxH, 2, 2, 'FD');

    // Label strip at top
    pdf.setFillColor(...C.ROW_HEAD);
    pdf.rect(x, y, boxW, 6, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.DARK);
    pdf.text(label, x + boxW / 2, y + 4.2, { align: 'center' });

    // Signature line
    pdf.setDrawColor(160, 160, 160);
    pdf.line(x + 5, y + boxH - 5, x + boxW - 5, y + boxH - 5);
    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.LGRAY);
    pdf.text('Signature & Stamp', x + boxW / 2, y + boxH - 1, { align: 'center' });
  });

  return y + boxH + 5;
}

// ─────────────────────────────────────────────
// ERROR LEGEND
// ─────────────────────────────────────────────
function drawErrorLegend(pdf: jsPDF, y: number, logs: any[]): number {
  const failLogs = logs.filter(l => l.result === 'FAIL');
  if (failLogs.length === 0) return y;

  const usedCodes = new Set(failLogs.map(l => toErrorCode(l.error_message)));
  const entries = ERROR_LEGEND.filter(e => usedCodes.has(e.code));
  if (entries.length === 0) return y;

  const needed = 18 + entries.length * 6;
  y = checkPage(pdf, y, needed);
  y = sectionHeader(pdf, y, 'Error Code Reference');

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.GRAY);
  pdf.text('CODE', MARGIN + 3, y + 4);
  pdf.text('MEANING', MARGIN + 22, y + 4);
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

  return y + 5;
}

// ─────────────────────────────────────────────
// AUDIT LOG TABLE
// ─────────────────────────────────────────────
function drawAuditLog(pdf: jsPDF, y: number, logs: any[]): number {
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, 'Scan Audit Log');

  const cols = [
    { l: 'Timestamp',  x: MARGIN,       w: 37 },
    { l: 'Type',       x: MARGIN + 37,  w: 19 },
    { l: 'Code',       x: MARGIN + 56,  w: 39 },
    { l: 'Product',    x: MARGIN + 95,  w: 29 },
    { l: 'Result',     x: MARGIN + 124, w: 17 },
    { l: 'Operator',   x: MARGIN + 141, w: 28 },
    { l: 'Err',        x: MARGIN + 169, w: 17 },
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

    const isFail = log.result === 'FAIL';
    const errCode = toErrorCode(log.error_message);
    const displayCode  = trunc(safe(log.code), 18);
    const displayOp    = trunc(safe(log.operator_name), 16);

    const rowData = [
      fmtDate(log.created_at),
      safe(log.type),
      displayCode,
      trunc(safe(log.product_code), 18),
      safe(log.result),
      displayOp,
      errCode,
    ];

    cols.forEach((c, ci) => {
      const isErrCol = ci === cols.length - 1;
      if (isErrCol && isFail && errCode !== '—') {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(...C.RED);
      } else if (isFail) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.setTextColor(...C.RED);
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.setTextColor(...C.DARK);
      }
      pdf.text(rowData[ci], c.x + 1, y + 4.5);
    });

    pdf.setTextColor(...C.DARK);
    y += 6;
  });

  return y + 4;
}

// ─────────────────────────────────────────────
// REPORT HEADER  (shared by Nitera + USUI)
// ─────────────────────────────────────────────
function drawReportHeader(pdf: jsPDF, dispatch: any, logs: any[], customer: string): number {
  // ── Green header bar ──
  pdf.setFillColor(...C.GREEN);
  pdf.rect(0, 0, PAGE_W, 22, 'F');

  // Darker accent strip at bottom of bar
  pdf.setFillColor(90, 155, 22);
  pdf.rect(0, 19, PAGE_W, 3, 'F');

  // Title
  pdf.setFontSize(17);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.WHITE);
  pdf.text('SCANNING CHALAN', MARGIN, 13.5);

  // Subtitle
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(215, 248, 160);
  pdf.text('WMS Outbound  ·  Nippon Express India', MARGIN, 18.5);

  // Customer badge — white pill on green bar
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const custLabel = customer.toUpperCase();
  const cw = pdf.getTextWidth(custLabel);
  const bp = 5;
  const bw = cw + bp * 2;
  const bx = PAGE_W - MARGIN - bw;
  pdf.setFillColor(...C.WHITE);
  pdf.roundedRect(bx, 5.5, bw, 11, 2, 2, 'F');
  pdf.setTextColor(30, 90, 10);
  pdf.text(custLabel, bx + bp, 13);

  let y = 26;

  // ── Info boxes ──
  const logTypes = customer === 'USUI' ? ['PART', 'NX_QR'] : ['PICKLIST', 'BIN_LABEL'];
  const lastPassLog = logs.filter(l => logTypes.includes(l.type) && l.result === 'PASS').pop();
  const dispatchedAt = lastPassLog ? fmtDate(lastPassLog.created_at) : '—';
  const createdBy = logs.find(l => l.operator_name)?.operator_name || '—';

  const col1 = MARGIN + 4, col2 = MARGIN + 64, col3 = MARGIN + 126;

  // Box 1 — Dispatch meta
  pdf.setFillColor(...C.BG);
  pdf.roundedRect(MARGIN, y, COL_W, 30, 2, 2, 'F');
  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(MARGIN, y, COL_W, 30, 2, 2, 'D');
  kv(pdf, col1, y + 7,  'DISPATCH NO',  `DSP-${safe(dispatch?.dispatch_number)}`);
  kv(pdf, col2, y + 7,  'STATUS',       safe(dispatch?.status));
  kv(pdf, col3, y + 7,  'CUSTOMER',     customer);
  kv(pdf, col1, y + 20, 'OPERATOR',     trunc(createdBy, 28));
  kv(pdf, col2, y + 20, 'CREATED',      fmtDate(dispatch?.created_at));
  kv(pdf, col3, y + 20, 'DISPATCHED',   dispatchedAt);
  y += 34;

  // Box 2 — Schedule
  pdf.setFillColor(...C.BG);
  pdf.roundedRect(MARGIN, y, COL_W, 15, 2, 2, 'F');
  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(MARGIN, y, COL_W, 15, 2, 2, 'D');
  kv(pdf, col1, y + 7, 'NAGARE TIME', safe(dispatch?.ref_supply_date));
  kv(pdf, col2, y + 7, 'SUPPLY DATE', safe(dispatch?.ref_schedule_sent_date));
  kv(pdf, col3, y + 7, 'SCHEDULE NO', safe(dispatch?.ref_schedule_number));
  y += 19;

  // ── "THIS BATCH IS READY TO DISPATCH" — only when COMPLETED ──
  if (dispatch?.status === 'COMPLETED') {
    y = checkPage(pdf, y, 16);
    y += 3;
    pdf.setFillColor(...C.DKGREEN);
    pdf.rect(MARGIN, y, COL_W, 11, 'F');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.WHITE);
    pdf.text('THIS BATCH IS READY TO DISPATCH', PAGE_W / 2, y + 7.5, { align: 'center' });
    pdf.setTextColor(...C.DARK);
    y += 15;
  }

  return y;
}

// ═══════════════════════════════════════════════════════
// NITERA PDF EXPORT
// ═══════════════════════════════════════════════════════
export function exportNiteraPDF(dispatch: any, logs: any[], bins: any[], picks: any[]): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = drawReportHeader(pdf, dispatch, logs, 'Nitera');

  // ── Dispatch Summary ──
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, 'Dispatch Summary');
  const sumCols = [
    { l: 'Product Code',  x: MARGIN },
    { l: 'Schedule No',   x: MARGIN + 32 },
    { l: 'Supply Qty',    x: MARGIN + 72 },
    { l: 'Total Bins',    x: MARGIN + 92 },
    { l: 'Bins Scanned',  x: MARGIN + 112 },
    { l: 'Picks Scanned', x: MARGIN + 132 },
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
  pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
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
    { l: 'Product Code', x: MARGIN + 42  },
    { l: 'Case Pack',    x: MARGIN + 72  },
    { l: 'Supply Qty',   x: MARGIN + 90  },
    { l: 'Supply Date',  x: MARGIN + 108 },
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
      [String(i+1), trunc(safe(bin.bin_number), 18), safe(bin.product_code),
       safe(bin.case_pack), safe(bin.supply_quantity), safe(bin.supply_date),
       safe(bin.invoice_number), fmtDate(bin.created_at)]
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
      [String(i+1), trunc(safe(pick.pick_code), 30), safe(pick.product_code),
       safe(pick.case_pack), fmtDate(pick.created_at)]
        .forEach((v, ci) => pdf.text(v, pickCols[ci].x + 1, y + 4.5));
      y += 6;
    });
    y += 4;
  }

  y = drawAuditLog(pdf, y, logs);
  y = drawErrorLegend(pdf, y, logs);
  y = drawSignatureBoxes(pdf, y);
  footer(pdf);
  pdf.save(`Nitera_Dispatch_${dispatch?.dispatch_number}.pdf`);
}

// ═══════════════════════════════════════════════════════
// USUI PDF EXPORT
// ═══════════════════════════════════════════════════════
export function exportUsuiPDF(dispatch: any, logs: any[], bins: any[], parts: any[]): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = drawReportHeader(pdf, dispatch, logs, 'USUI');

  // ── Dispatch Summary ──
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, 'Dispatch Summary');
  const sumCols = [
    { l: 'Product Code', x: MARGIN },
    { l: 'Schedule No',  x: MARGIN + 32 },
    { l: 'Supply Qty',   x: MARGIN + 72 },
    { l: 'Total Bins',   x: MARGIN + 92 },
    { l: 'Parts / Bin',  x: MARGIN + 112 },
    { l: 'Total Parts',  x: MARGIN + 132 },
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
  pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
  [safe(dispatch?.ref_product_code), safe(dispatch?.ref_schedule_number),
   safe(dispatch?.supply_quantity), safe(dispatch?.total_schedule_bins),
   safe(dispatch?.ref_case_pack), `${totalParts} / ${safe(expectedTotal)}`,
   safe(dispatch?.smg_qty), safe(dispatch?.status)]
    .forEach((v, i) => pdf.text(v, sumCols[i].x + 1, y + 4.5));
  y += 10;

  // ── Bin Details with Parts ──
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

      pdf.setFillColor(binComplete ? 210 : 255, binComplete ? 240 : 228, binComplete ? 210 : 210);
      pdf.rect(MARGIN, y, COL_W, 8, 'F');
      pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...C.DARK);
      pdf.text(
        `Bin ${binIdx+1}: ${trunc(safe(bin.bin_number), 22)}   |   Product: ${safe(bin.product_code)}   |   Parts: ${binParts.length}/${safe(dispatch?.ref_case_pack)}   |   Supply: ${safe(bin.supply_date)}   |   ${binComplete ? 'COMPLETE' : 'INCOMPLETE'}`,
        MARGIN + 2, y + 5.5
      );
      y += 10;

      if (binParts.length === 0) {
        y = checkPage(pdf, y, 6);
        pdf.setFontSize(6.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...C.LGRAY);
        pdf.text('No parts scanned for this bin.', MARGIN + 4, y + 4); y += 7;
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
          pdf.text(`${pIdx+1}. ${trunc(safe(part.part_code), 22)}`, MARGIN + colIdx * partColW + 2, rowY + 4);
          colIdx++;
          if (colIdx === 3) { colIdx = 0; rowY += 5.5; }
        });
        if (colIdx !== 0) rowY += 5.5;
        y = rowY + 3;
      }

      if (binIdx < bins.length - 1) {
        pdf.setDrawColor(210, 210, 210);
        pdf.line(MARGIN, y, MARGIN + COL_W, y); y += 3;
      }
    });
    y += 4;
  }

  y = drawAuditLog(pdf, y, logs);
  y = drawErrorLegend(pdf, y, logs);
  y = drawSignatureBoxes(pdf, y);
  footer(pdf);
  pdf.save(`USUI_Dispatch_${dispatch?.dispatch_number}.pdf`);
}
