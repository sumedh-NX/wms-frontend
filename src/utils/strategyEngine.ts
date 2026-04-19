// src/utils/strategyEngine.ts

// Simple code normalization (still needed for product codes)
function normalizeCode(code: string | undefined | null): string {
  if (!code) return '';
  return String(code)
    .replace(/-/g, '')
    .replace(/M/g, '')
    .toUpperCase()
    .trim();
}

interface ValidationResult {
  ok: boolean;
  message: string;
}

export function runStrategy(dispatch: any, parsed: any, type: 'BIN_LABEL' | 'PICKLIST'): ValidationResult {
  const fieldsToMatch = [
    'ref_product_code',
    'ref_case_pack',
    'ref_supply_date',
    'ref_schedule_sent_date',
    'ref_schedule_number',
  ];

  const map: Record<string, string> = {
    ref_product_code: 'productCode',
    ref_case_pack: 'casePack',
    ref_supply_date: 'supplyDate',
    ref_schedule_sent_date: 'scheduleSentDate',
    ref_schedule_number: 'scheduleNumber',
  };

  for (const dbField of fieldsToMatch) {
    const refVal = dispatch[dbField];
    if (refVal == null) continue;

    const parsedVal = parsed[map[dbField]];

    if (dbField === 'ref_product_code') {
      // Product codes need normalization (M vs - variations)
      if (normalizeCode(refVal) !== normalizeCode(parsedVal)) {
        return { ok: false, message: 'Product Code mismatch' };
      }
    } 
    else if (dbField === 'ref_supply_date') {
      // DATE FIELDS ARE TEXT NOW - Direct string comparison!
      // No normalization needed!
      if (String(refVal).trim() !== String(parsedVal).trim()) {
        return { ok: false, message: 'Supply Date mismatch' };
      }
    } 
    else if (dbField === 'ref_case_pack' && type === 'PICKLIST' && parsedVal === null) {
      continue; 
    }
    else {
      // All other fields (Nagare Time, Schedule Number) are TEXT - Direct comparison
      if (String(refVal) !== String(parsedVal)) {
        const friendly = dbField.replace('ref_', '').replace('_', ' ');
        return { ok: false, message: `${friendly} mismatch` };
      }
    }
  }

  return { ok: true, message: 'Success' };
}
