import jsPDF from 'jspdf';

export const C = {
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
};
export const PAGE_W = 210;
export const MARGIN = 12;
export const COL_W  = PAGE_W - MARGIN * 2;

export const ERROR_LEGEND: { code: string; desc: string }[] = [
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

export function toErrorCode(msg: string | null | undefined): string {
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

export function fmtDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function safe(val: any): string {
  if (val === null || val === undefined || val === '') return '—';
  return String(val);
}

export function trunc(val: string, max: number): string {
  if (val.length <= max) return val;
  return val.substring(0, max - 2) + '..';
}

export function sectionHeader(pdf: jsPDF, y: number, title: string): number {
  pdf.setFillColor(...C.GREEN);
  pdf.rect(MARGIN, y, COL_W, 7, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.WHITE);
  pdf.text(title.toUpperCase(), MARGIN + 3, y + 5);
  pdf.setTextColor(...C.DARK);
  return y + 10;
}

export function kv(pdf: jsPDF, x: number, y: number, label: string, value: string): void {
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.GRAY);
  pdf.text(label, x, y);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.DARK);
  pdf.text(value, x, y + 5);
}

export function checkPage(pdf: jsPDF, y: number, needed = 12): number {
  if (y + needed > 282) { pdf.addPage(); return 16; }
  return y;
}

export function footer(pdf: jsPDF): void {
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

export function drawSignatureBoxes(pdf: jsPDF, y: number): number {
  y = checkPage(pdf, y, 36);
  y += 6;
  const gap  = 5;
  const boxW = (COL_W - gap * 2) / 3;
  const boxH = 20;
  const labels = ['Scanned By', 'Confirmed By', 'Approved By'];

  labels.forEach((label, i) => {
    const x = MARGIN + i * (boxW + gap);
    pdf.setFillColor(252, 252, 252);
    pdf.setDrawColor(...C.LGRAY);
    pdf.roundedRect(x, y, boxW, boxH, 2, 2, 'FD');

    pdf.setFillColor(...C.ROW_HEAD);
    pdf.rect(x, y, boxW, 6, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...C.DARK);
    pdf.text(label, x + boxW / 2, y + 4.2, { align: 'center' });

    pdf.setDrawColor(160, 160, 160);
    pdf.line(x + 5, y + boxH - 5, x + boxW - 5, y + boxH - 5);
    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.LGRAY);
    pdf.text('Signature & Stamp', x + boxW / 2, y + boxH - 1, { align: 'center' });
  });

  return y + boxH + 5;
}

export function drawErrorLegend(pdf: jsPDF, y: number, logs: any[]): number {
  const failLogs = logs.filter(l => l.result === 'FAIL');
  if (failLogs.length === 0) return y;

  const usedCodes = new Set(failLogs.map(l => toErrorCode(l.error_message)));
  const entries   = ERROR_LEGEND.filter(e => usedCodes.has(e.code));
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

export function drawAuditLog(pdf: jsPDF, y: number, logs: any[]): number {
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

    const isFail   = log.result === 'FAIL';
    const errCode  = toErrorCode(log.error_message);
    const rowData  = [
      fmtDate(log.created_at),
      safe(log.type),
      trunc(safe(log.code), 18),
      trunc(safe(log.product_code), 18),
      safe(log.result),
      trunc(safe(log.operator_name), 16),
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

export function drawReportHeader(pdf: jsPDF, dispatch: any, logs: any[], customer: string): number {
  pdf.setFillColor(...C.GREEN);
  pdf.rect(0, 0, PAGE_W, 22, 'F');

  pdf.setFillColor(90, 155, 22);
  pdf.rect(0, 19, PAGE_W, 3, 'F');

  pdf.setFontSize(17);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.WHITE);
  pdf.text('SCANNING CHALAN', MARGIN, 13.5);

  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(215, 248, 160);
  pdf.text('WMS Outbound  ·  Nippon Express India', MARGIN, 18.5);

  const custLabel = customer.toUpperCase();
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const cw = pdf.getTextWidth(custLabel);
  const bp = 5;
  const bw = cw + bp * 2;
  const bx = PAGE_W - MARGIN - bw;
  pdf.setFillColor(...C.WHITE);
  pdf.roundedRect(bx, 5.5, bw, 11, 2, 2, 'F');
  pdf.setTextColor(30, 90, 10);
  pdf.text(custLabel, bx + bp, 13);

  let y = 26;

  const logTypes    = customer.toUpperCase() === 'USUI' ? ['PART', 'NX_QR'] : ['PICKLIST', 'BIN_LABEL'];
  const lastPassLog = logs.filter(l => logTypes.includes(l.type) && l.result === 'PASS').pop();
  const dispatchedAt = lastPassLog ? fmtDate(lastPassLog.created_at) : '—';
  const createdBy    = logs.find(l => l.operator_name)?.operator_name || '—';

  const col1 = MARGIN + 4, col2 = MARGIN + 64, col3 = MARGIN + 126;

  pdf.setFillColor(...C.BG);
  pdf.roundedRect(MARGIN, y, COL_W, 30, 2, 2, 'F');
  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(MARGIN, y, COL_W, 30, 2, 2, 'D');
  kv(pdf, col1, y + 7,  'DISPATCH NO', `DSP-${safe(dispatch?.dispatch_number)}`);
  kv(pdf, col2, y + 7,  'STATUS',      safe(dispatch?.status));
  kv(pdf, col3, y + 7,  'CUSTOMER',    customer);
  kv(pdf, col1, y + 20, 'OPERATOR',    trunc(createdBy, 28));
  kv(pdf, col2, y + 20, 'CREATED',     fmtDate(dispatch?.created_at));
  kv(pdf, col3, y + 20, 'DISPATCHED',  dispatchedAt);
  y += 34;

  pdf.setFillColor(...C.BG);
  pdf.roundedRect(MARGIN, y, COL_W, 15, 2, 2, 'F');
  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(MARGIN, y, COL_W, 15, 2, 2, 'D');
  kv(pdf, col1, y + 7, 'NAGARE TIME', safe(dispatch?.ref_supply_date));
  kv(pdf, col2, y + 7, 'SUPPLY DATE', safe(dispatch?.ref_schedule_sent_date));
  kv(pdf, col3, y + 7, 'SCHEDULE NO', safe(dispatch?.ref_schedule_number));
  y += 19;

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
