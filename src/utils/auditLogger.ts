import db from '../config/db'; // we'll create a tiny wrapper later (optional)

// Simple function – you can call it from any route after a scan
export async function logAudit(entry: {
  dispatchId: number;
  type: 'BIN_LABEL' | 'PICKLIST';
  code: string;               // bin number or pick code
  product_code?: string;
  result: 'PASS' | 'FAIL';
  operator_user_id: number;
  raw_qr: string;
  error_message?: string;
}) {
  const {
    dispatchId,
    type,
    code,
    product_code,
    result,
    operator_user_id,
    raw_qr,
    error_message = null,
  } = entry;

  // Direct SQL – we are not using an ORM for this tiny helper
  const sql = `
    INSERT INTO audit_logs
      (dispatch_id, type, code, product_code, result,
       operator_user_id, raw_qr, error_message)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
  `;

  await db.query(sql, [
    dispatchId,
    type,
    code,
    product_code,
    result,
    operator_user_id,
    raw_qr,
    error_message,
  ]);
}
