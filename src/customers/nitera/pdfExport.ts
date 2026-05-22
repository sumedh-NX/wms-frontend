import jsPDF from 'jspdf';
import {
  C, MARGIN, COL_W,
  safe, trunc, fmtDate, sectionHeader, checkPage,
  drawReportHeader, drawAuditLog, drawErrorLegend, drawSignatureBoxes, footer,
} from '../../utils/pdf/shared';

export function exportNiteraPDF(
  dispatch: any, logs: any[], bins: any[], picks: any[], _parts?: any[]
): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = drawReportHeader(pdf, dispatch, logs, 'Nitera');

  // ── Dispatch Summary ──
  y = checkPage(pdf, y, 20);
  y = sectionHeader(pdf, y, 'Dispatch Summary');
  const sumCols = [
    { l: 'Product Code',  x: MARGIN       },
    { l: 'Schedule No',   x: MARGIN + 32  },
    { l: 'Supply Qty',    x: MARGIN + 72  },
    { l: 'Total Bins',    x: MARGIN + 92  },
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
   safe(dispatch?.supply_quantity),  safe(dispatch?.total_schedule_bins),
   safe(dispatch?.smg_qty),          safe(dispatch?.bin_qty),
   safe(dispatch?.ref_case_pack),    safe(dispatch?.status)]
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
  drawSignatureBoxes(pdf, y);
  footer(pdf);
  pdf.save(`Nitera_Dispatch_${dispatch?.dispatch_number}.pdf`);
}
