/**
 * qrParser.ts — Frontend QR parser (mirrors backend qrParser.js exactly)
 * Handles both single-line and multi-line bin label QR codes,
 * and all 6 picklist QR formats.
 */

export interface BinQRResult {
  binNumber: string;
  productCode: string;
  casePack: number;
  totalBins: number;
  supplyQty: number;
  scheduleSentDate: string; // DD/MM/YY  → Supply Date label
  invoiceNumber: string;
  vendorCode: string | null;
  scheduleNumber: string | null;
  unloadLocation: string | null;
  supplyDate: string | null; // DD/MM/YYYY HH:MM AM/PM → Nagare Time label
}

export interface PickQRResult {
  productCode: string;
}

/**
 * Parse Bin Label QR
 */
export function parseBinQR(raw: string): BinQRResult | null {
  try {
    const t = raw.trim().replace(/\s+/g, ' ');

    // 1. Bin number
    const binMatch = t.match(/^(\d{13})/);
    if (!binMatch) throw new Error('No bin number found');
    const binNumber = binMatch[1];

    // 2. Product code — first token after bin number
    const afterBin = t.replace(/^\d{13}\s*/, '');
    const codeMatch = afterBin.match(/^([A-Z0-9]{8,15})\s/i);
    if (!codeMatch) throw new Error('No product code found');
    const productCode = codeMatch[1];

    // 3. Case pack
    const cpMatch = afterBin.match(/^[A-Z0-9]{8,15}\s+(\d{2,4})\s/i);
    if (!cpMatch) throw new Error('No case pack found');
    const casePack = parseInt(cpMatch[1]);

    // 4. Date block anchored to BIN13 repeat
    const dateBlock = t.match(
      new RegExp(binNumber + '\\s*(\\d{2}\\/\\d{2}\\/\\d{2})\\s*(\\d{8})\\s*(\\d{2,4})\\s*N')
    );
    if (!dateBlock) throw new Error('No date block found');
    const scheduleSentDate = dateBlock[1];
    const invoiceNumber    = dateBlock[2];
    const supplyQty        = parseInt(dateBlock[3]);

    if (supplyQty % casePack !== 0) {
      throw new Error(`Supply qty ${supplyQty} not divisible by case pack ${casePack}`);
    }
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

/**
 * Parse Picklist QR
 * Product code appears after the G-header, may contain dashes
 */
export function parsePickQR(raw: string): PickQRResult | null {
  try {
    const t = raw.trim().replace(/\s+/g, ' ');

    // Skip G-header, extract product code (may contain dashes: 18213-74T10, 18640M-72R00)
    const afterHeader = t.replace(/^G[A-Z0-9_]+\s+/i, '');
    const codeMatch = afterHeader.match(/^([A-Z0-9]{5,6}-?[A-Z0-9]+(?:-[A-Z0-9]+)?)\s/i);
    if (!codeMatch) return null;

    return { productCode: codeMatch[1] };
  } catch {
    return null;
  }
}

/**
 * Normalize product code for comparison
 * Bin QR:      18213M74T10  → 1821374T10
 * Picklist QR: 18213-74T10  → 1821374T10
 * Bin QR:      18640M72R00  → 1864072R00
 * Picklist QR: 18640M-72R00 → 1864072R00
 * Regular:     09482M00651  → 0948200651
 */
export function normalizeCode(code: string): string {
  if (!code) return '';
  return code
    .toUpperCase()
    .replace(/-/g, '')
    .replace(/(?<=\d)M(?=\d)/g, '');
}