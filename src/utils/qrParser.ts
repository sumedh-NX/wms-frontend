/**
 * qrParser.ts — Frontend QR parser (mirrors backend qrParser.js exactly)
 */

export interface BinQRResult {
  binNumber: string;
  productCode: string;
  casePack: number;
  totalBins: number;
  supplyQty: number;
  scheduleSentDate: string;
  invoiceNumber: string;
  vendorCode: string | null;
  scheduleNumber: string | null;
  unloadLocation: string | null;
  supplyDate: string | null;
}

export interface PickQRResult {
  pickCode: string;      // G-header token — unique pick identifier
  productCode: string;   // product code (may have dashes: 18213-74T10)
  casePack: number | null;
}

export function parseBinQR(raw: string): BinQRResult | null {
  try {
    const t = raw.trim().replace(/\s+/g, ' ');

    const binMatch = t.match(/^(\d{13})/);
    if (!binMatch) throw new Error('No bin number found');
    const binNumber = binMatch[1];

    const afterBin = t.replace(/^\d{13}\s*/, '');
    const codeMatch = afterBin.match(/^([A-Z0-9]{8,15})\s/i);
    if (!codeMatch) throw new Error('No product code found');
    const productCode = codeMatch[1];

    const cpMatch = afterBin.match(/^[A-Z0-9]{8,15}\s+(\d{2,4})\s/i);
    if (!cpMatch) throw new Error('No case pack found');
    const casePack = parseInt(cpMatch[1]);

    const dateBlock = t.match(
      new RegExp(binNumber + '\\s*(\\d{2}\\/\\d{2}\\/\\d{2})\\s*(\\d{8})\\s*(\\d{2,4})\\s*N')
    );
    if (!dateBlock) throw new Error('No date block found');
    const scheduleSentDate = dateBlock[1];
    const invoiceNumber    = dateBlock[2];
    const supplyQty        = parseInt(dateBlock[3]);

    if (supplyQty % casePack !== 0) throw new Error('Not divisible');
    const totalBins = supplyQty / casePack;

    const vcMatch = t.match(/N(\d{3})/);
    const vendorCode = vcMatch ? vcMatch[1] : null;

    const snMatch = t.match(/N\d{3}\s*([0-9A-Z]{10,20})\s*(?=[A-Z]{2}-)/i);
    const scheduleNumber = snMatch ? snMatch[1] : null;

    const ulMatch = t.match(/([A-Z]{2}-\d+)/i);
    const unloadLocation = ulMatch ? ulMatch[1] : null;

    const sdMatch = t.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}(?:\s*[AP]M)?)/i);
    const supplyDate = sdMatch ? sdMatch[1] : null;

    return {
      binNumber, productCode, casePack, totalBins, supplyQty,
      scheduleSentDate, invoiceNumber, vendorCode, scheduleNumber,
      unloadLocation, supplyDate,
    };
  } catch {
    return null;
  }
}

export function parsePickQR(raw: string): PickQRResult | null {
  try {
    const t = raw.trim().replace(/\s+/g, ' ');

    const pickCodeMatch = t.match(/^(G\S+)/i);
    if (!pickCodeMatch) return null;
    const pickCode = pickCodeMatch[1];

    const afterHeader = t.replace(/^G[A-Z0-9_]+\s+/i, '');
    const codeMatch = afterHeader.match(/^([A-Z0-9]{5,6}-?[A-Z0-9]+(?:-[A-Z0-9]+)?)\s/i);
    if (!codeMatch) return null;
    const productCode = codeMatch[1];

    const qtyMatch = t.match(/(\d{4,7})\s*$/);
    const casePack = qtyMatch ? parseInt(qtyMatch[1]) : null;

    return { pickCode, productCode, casePack };
  } catch {
    return null;
  }
}

export function normalizeCode(code: string): string {
  if (!code) return '';
  return code
    .toUpperCase()
    .replace(/-/g, '')
    .replace(/(?<=\d)M(?=\d)/g, '');
}
