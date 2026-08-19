import { createHmac } from "node:crypto";
import { E2E } from "./env";

/**
 * Giả lập webhook đối soát Casso để "chuyển tiền" trong e2e.
 *
 * Đây là cách DUY NHẤT đưa một vé sang ACTIVE + settlement HELD mà vẫn đi qua
 * code thật: backend không có endpoint mô phỏng thanh toán nào
 * (HealthService.isPaymentSimulatorEnabled trả false cứng), và sửa thẳng
 * payment_orders bằng SQL sẽ bỏ qua cả việc giữ tiền vào ví lẫn kích hoạt vé.
 *
 * Chữ ký phải khớp CassoWebhookController.verifySignature:
 *   HMAC-SHA512( timestamp + "." + JSON(sort key A→Z đệ quy) )
 * gửi ở header `X-Casso-Signature: t=<unix_millis>,v1=<hex>`.
 */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value !== null && typeof value === "object") {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).sort()) out[key] = sortKeysDeep(src[key]);
    return out;
  }
  return value;
}

export interface CassoResult {
  status: number;
  matched: number;
  body: string;
}

/**
 * Bắn một giao dịch tiền VÀO.
 *
 * @param refCode mã đơn thanh toán (đọc được trên màn checkout của khách)
 * @param amount  số tiền chuyển; nhỏ hơn số phải trả -> UNDERPAID (vé không kích hoạt)
 * @param txnId   id giao dịch Casso — khoá idempotency, đổi giá trị để test trùng lặp
 */
export async function payViaCasso(
  refCode: string,
  amount: number,
  txnId = `e2e-${Date.now()}`,
): Promise<CassoResult> {
  const body = {
    error: 0,
    data: [
      {
        id: txnId,
        amount,
        // refCode phải nằm trong nội dung chuyển khoản; BE dò bằng regex FM\d+[0-9A-F]{6}.
        description: `CK tu khach ${refCode} chuyen tien`,
        reference: txnId,
        transactionDateTime: new Date().toISOString(),
        accountNumber: "0123456789",
        bankName: "Vietcombank",
      },
    ],
  };

  const raw = JSON.stringify(body);
  const timestamp = String(Date.now());
  const signed = `${timestamp}.${JSON.stringify(sortKeysDeep(JSON.parse(raw)))}`;
  const hmac = createHmac("sha512", E2E.cassoSecret).update(signed, "utf8").digest("hex");

  const response = await fetch(`${E2E.apiUrl}/webhooks/casso`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Casso-Signature": `t=${timestamp},v1=${hmac}`,
    },
    body: raw,
  });

  const text = await response.text();
  let matched = 0;
  try {
    matched = JSON.parse(text)?.data?.matched ?? 0;
  } catch {
    matched = 0;
  }
  return { status: response.status, matched, body: text };
}
