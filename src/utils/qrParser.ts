/**
 * qrParser.ts — Frontend QR parser (mirrors backend qrParser.js exactly)
 * Handles both single-line (spaces) and multi-line (newlines) bin label QR codes.
 */

export interface BinQRResult {
  binNumber: string;
  productCode: string;
  casePack: number;
  totalBins: number;
  supplyQty: number;
  scheduleSentDate: string; // DD/MM/YY  — Supply Date label
  invoiceNumber: string;
  vendorCode: string | null;
  scheduleNumber: string | null;
  unloadLocation: string | null;
  supplyDate: string | null; // DD/MM/YYYY HH:MM AM/PM — Nagare Time label
}

export interface PickQRResult {
  productCode: string;
}

export function parseBinQR(raw: string): BinQRResult | null {
  try {
    // Normalize: collapse all whitespace (newlines, tabs, multiple spaces) → single space
    const t = raw.trim().replace(/\s+/g, ' ');

    // 1. Bin number — first 13 digits
    const binMatch = t.match(/^(\d{13})/);
    if (!binMatch) throw new Error('No bin number found');
    const binNumber = binMatch[1];

    // 2. Product code — first token after bin number (8–15 alphanumeric chars)
    const afterBin = t.replace(/^\d{13}\s*/, '');
    const codeMatch = afterBin.match(/^([A-Z0-9]{8,15})\s/i);
    if (!codeMatch) throw new Error('No product code found');
    const productCode = codeMatch[1];

    // 3. Case pack — second token after bin number (2–4 digits)
    const cpMatch = afterBin.match(/^[A-Z0-9]{8,15}\s+(\d{2,4})\s/i);
    if (!cpMatch) throw new Error('No case pack found');
    const casePack = parseInt(cpMatch[1]);

    // 4. Date block — anchored to the SECOND occurrence of the 13-digit bin number
    //    Use \s* to handle both formats (space-separated or merged)
    const dateBlock = t.match(
      new RegExp(binNumber + '\\s*(\\d{2}\\/\\d{2}\\/\\d{2})\\s*(\\d{8})\\s*(\\d{2,4})\\s*N')
    );
    if (!dateBlock) throw new Error('No date block found');
    const scheduleSentDate = dateBlock[1]; // DD/MM/YY
    const invoiceNumber    = dateBlock[2];
    const supplyQty        = parseInt(dateBlock[3]);

    // 5. Validate
    if (supplyQty % casePack !== 0) {
      throw new Error(`Supply qty ${supplyQty} not divisible by case pack ${casePack}`);
    }
    const totalBins = supplyQty / casePack;

    // 6. Vendor code
    const vcMatch = t.match(/N(\d{3})/);
    const vendorCode = vcMatch ? vcMatch[1] : null;

    // 7. Schedule number
    const snMatch = t.match(/N\d{3}\s*([0-9A-Z]{10,20})\s*(?=[A-Z]{2}-)/i);
    const scheduleNumber = snMatch ? snMatch[1] : null;

    // 8. Unload location
    const ulMatch = t.match(/([A-Z]{2}-\d+)/i);
    const unloadLocation = ulMatch ? ulMatch[1] : null;

    // 9. Supply date (full datetime)
    const sdMatch = t.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}(?:\s*[AP]M)?)/i);
    const supplyDate = sdMatch ? sdMatch[1] : null;

    return {
      binNumber,
      productCode,
      casePack,
      totalBins,
      supplyQty,
      scheduleSentDate,
      invoiceNumber,
      vendorCode,
      scheduleNumber,
      unloadLocation,
      supplyDate,
    };
  } catch {
    return null;
  }
}

export function normalizeCode(code: string): string {
  if (!code) return '';
  return code.toUpperCase().replace(/-/g, '').replace(/^M/, '');
}

export function parsePickQR(raw: string): PickQRResult | null {
  try {
    const t = raw.trim().replace(/\s+/g, ' ');
    const codeMatch = t.match(/([A-Z0-9]{8,15})/i);
    if (!codeMatch) return null;
    return { productCode: codeMatch[1] };
  } catch {
    return null;
  }
}