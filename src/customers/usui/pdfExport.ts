import jsPDF from 'jspdf';
import {
  C, MARGIN, COL_W,
  safe, trunc, fmtDate, sectionHeader, checkPage,
  drawReportHeader, drawAuditLog, drawErrorLegend, drawSignatureBoxes, footer,
} from '../../utils/pdf/shared';

export function exportUsuiPDF(
  dispatch: any, logs: any[], bins: any[], _picks: any[], parts: any[]
): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = drawReportHeader(pdf, dispatch, logs, 'USUI');

  // ── Dispatch Summary ──
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, 'Dispatch Summary');
  const sumCols = [
    { l: 'Product Code', x: MARGIN       },
    { l: 'Schedule No',  x: MARGIN + 32  },
    { l: 'Supply Qty',   x: MARGIN + 72  },
    { l: 'Total Bins',   x: MARGIN + 92  },
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

  const totalParts    = parts.length;
  const expectedTotal = dispatch?.total_schedule_bins && dispatch?.ref_case_pack
    ? dispatch.total_schedule_bins * dispatch.ref_case_pack : '—';
  pdf.setFillColor(...C.ROW_ALT);
  pdf.rect(MARGIN, y, COL_W, 6, 'F');
  pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
  [safe(dispatch?.ref_product_code), safe(dispatch?.ref_schedule_number),
   safe(dispatch?.supply_quantity),  safe(dispatch?.total_schedule_bins),
   safe(dispatch?.ref_case_pack),    `${totalParts} / ${safe(expectedTotal)}`,
   safe(dispatch?.smg_qty),          safe(dispatch?.status)]
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
      const binParts   = parts.filter((p: any) => p.bin_id === bin.id);
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
  drawSignatureBoxes(pdf, y);
  footer(pdf);
  pdf.save(`USUI_Dispatch_${dispatch?.dispatch_number}.pdf`);
}
