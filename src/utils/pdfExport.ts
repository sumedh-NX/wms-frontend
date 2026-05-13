import jsPDF from 'jspdf';

export function exportDispatchPDF(dispatch: any, logs: any[]) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const W = pdf.internal.pageSize.getWidth();
  const PRIMARY_GREEN: [number, number, number] = [120, 190, 32];
  const DARK_TEXT: [number, number, number] = [40, 40, 40];
  const GRAY_TEXT: [number, number, number] = [120, 120, 120];
  const ROW_BG: [number, number, number] = [245, 247, 250];

  pdf.setFillColor(...PRIMARY_GREEN);
  pdf.rect(0, 0, W, 10, 'F');
  pdf.setFontSize(18);
  pdf.setTextColor(...DARK_TEXT);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WMS Dispatch Report', 14, 20);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const lastLog = logs.filter(l => l.type === 'PICKLIST' || l.type === 'PART').pop();
  const dispatchedAt = lastLog ? new Date(lastLog.created_at).toLocaleString('en-IN') : '—';

  const summary = [
    ['Dispatch No:', `DSP-${dispatch?.dispatch_number}`],
    ['Status:', dispatch?.status || 'IN_PROGRESS'],
    ['Created By:', logs[0]?.operator_name || 'System'],
    ['Created At:', new Date(dispatch?.created_at || '').toLocaleString('en-IN')],
    ['Nagare Time:', dispatch?.ref_supply_date || '—'],
    ['Dispatched At:', dispatchedAt],
  ];

  let y = 30;
  summary.forEach(([label, val]) => {
    pdf.setTextColor(...GRAY_TEXT);
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, 14, y);
    pdf.setTextColor(...DARK_TEXT);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(val), 45, y);
    y += 7;
  });

  y += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DARK_TEXT);
  pdf.text('Dispatch Items', 14, y);

  y += 7;
  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY_TEXT);
  const itemCols = [
    { l: 'Product', x: 14 }, { l: 'Sched No', x: 40 }, { l: 'S-Qty', x: 80 },
    { l: 'S-Bins', x: 100 }, { l: 'SMG', x: 115 }, { l: 'Bin', x: 125 },
    { l: 'Status', x: 135 }, { l: 'Nagare Time', x: 160 }, { l: 'Supply Date', x: 190 }
  ];
  itemCols.forEach(col => pdf.text(col.l, col.x, y));

  y += 6;
  pdf.setFillColor(...ROW_BG);
  pdf.rect(14, y - 4, W - 28, 8, 'F');
  pdf.setTextColor(...DARK_TEXT);
  pdf.setFont('helvetica', 'normal');
  const rowData = [
    dispatch?.ref_product_code, dispatch?.ref_schedule_number, dispatch?.supply_quantity,
    dispatch?.total_schedule_bins, dispatch?.smg_qty, dispatch?.bin_qty,
    'COMPLETE', dispatch?.ref_supply_date, dispatch?.ref_schedule_sent_date
  ];
  itemCols.forEach((col, i) => { pdf.text(String(rowData[i] || '—'), col.x, y); });

  y += 20;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DARK_TEXT);
  pdf.text('Scan Audit Log', 14, y);

  y += 7;
  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY_TEXT);
  const logCols = [
    { l: 'Timestamp', x: 14 }, { l: 'Type', x: 50 }, { l: 'Code', x: 80 },
    { l: 'Product', x: 120 }, { l: 'Result', x: 150 }, { l: 'Operator', x: 180 }
  ];
  logCols.forEach(col => pdf.text(col.l, col.x, y));

  y += 6;
  logs.forEach((log, index) => {
    if (index % 2 === 1) {
      pdf.setFillColor(...ROW_BG);
      pdf.rect(14, y - 4, W - 28, 7, 'F');
    }
    pdf.setTextColor(...DARK_TEXT);
    pdf.setFont('helvetica', 'normal');
    if (log.result === 'FAIL') pdf.setTextColor(200, 0, 0);
    else if (log.result === 'PASS') pdf.setTextColor(0, 150, 0);

    let displayCode = log.code || '—';
    if (displayCode.length > 17) displayCode = displayCode.substring(0, 17) + '...';

    const logData = [
      new Date(log.created_at).toLocaleString('en-IN'),
      log.type,
      displayCode,
      log.product_code,
      log.result,
      log.operator_name || 'Unknown'
    ];
    logCols.forEach((col, i) => { pdf.text(String(logData[i] || '—'), col.x, y); });
    pdf.setTextColor(...DARK_TEXT);
    y += 7;
    if (y > 280) { pdf.addPage(); y = 20; }
  });

  pdf.setFontSize(8);
  pdf.setTextColor(...GRAY_TEXT);
  pdf.text(`Generated: ${new Date().toLocaleString('en-IN')} | WMS Dispatch Portal`, 14, 290);
  pdf.text(`Page 1 of 1`, W - 30, 290);
  pdf.save(`Dispatch_${dispatch?.dispatch_number}.pdf`);
}