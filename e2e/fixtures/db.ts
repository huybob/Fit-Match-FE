import mysql from "mysql2/promise";
import { E2E } from "./env";

/**
 * Truy cập DB trực tiếp cho e2e.
 *
 * Nguyên tắc (xem kế hoạch test §1): SQL CHỈ được dùng cho hai việc mà nghiệp vụ
 * không thể tạo ra trong lúc test — DU HÀNH THỜI GIAN (lùi ngày để job nền chạy)
 * và ÉP TRẠNG THÁI TIỀN hiếm. Tuyệt đối không tạo vé / buổi tập / ca bằng SQL:
 * dữ liệu không đi qua code nghiệp vụ thì test có xanh cũng không chứng minh
 * được gì.
 *
 * Mọi hàm can thiệp ở đây đều trả về số dòng bị ảnh hưởng để spec assert được
 * là mình vừa sửa ĐÚNG một dòng, không phải quét trúng cả bảng.
 */
let pool: mysql.Pool | null = null;

function db(): mysql.Pool {
  if (!pool) pool = mysql.createPool({ ...E2E.db, connectionLimit: 4 });
  return pool;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/** Tham số truy vấn — mysql2 chỉ nhận kiểu vô hướng, không nhận `unknown`. */
export type SqlParam = string | number | boolean | null | Date;

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T[]> {
  const [rows] = await db().query(sql, params);
  return rows as T[];
}

export async function one<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T | undefined> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

export async function exec(sql: string, params: SqlParam[] = []): Promise<number> {
  const [result] = await db().execute(sql, params);
  return (result as mysql.ResultSetHeader).affectedRows;
}

// ---------------------------------------------------------------------------
// Can thiệp — chỉ 4 loại được phép
// ---------------------------------------------------------------------------

/** Kéo một buổi tập về ngày chỉ định để job nền coi là "đã tới hạn". */
export async function backdateSession(sessionId: number, date: string): Promise<number> {
  return exec("update training_sessions set session_date = ? where id = ?", [date, sessionId]);
}

/** Ép một đơn thanh toán thành quá hạn để kiểm nhánh LATE_ARRIVAL của webhook. */
export async function expirePaymentOrder(refCode: string): Promise<number> {
  return exec(
    "update payment_orders set expires_at = date_sub(now(), interval 1 hour) where ref_code = ?",
    [refCode],
  );
}

/** Ép vé rời trạng thái giữ tiền — kiểm chốt chặn phòng thủ khi hoàn phụ phí PT. */
export async function forceSettlementStatus(ticketId: number, status: string): Promise<number> {
  return exec("update tickets set settlement_status = ? where id = ?", [status, ticketId]);
}

// ---------------------------------------------------------------------------
// Kiểm chứng
// ---------------------------------------------------------------------------

export interface TicketMoney {
  id: number;
  status: string;
  settlement_status: string;
  total_amount: string;
  payable_amount: string;
  pt_surcharge_per_day: string | null;
  pt_refunded_amount: string;
}

export function ticketMoney(ticketId: number): Promise<TicketMoney | undefined> {
  return one<TicketMoney>(
    `select id, status, settlement_status, total_amount, payable_amount,
            pt_surcharge_per_day, pt_refunded_amount
       from tickets where id = ?`,
    [ticketId],
  );
}

/** Tổng đã hoàn lẻ theo từng buổi của một vé — đối chiếu với tickets.pt_refunded_amount. */
export async function refundedSumOfTicket(ticketId: number): Promise<number> {
  const row = await one<{ total: string }>(
    `select coalesce(sum(c.refund_amount), 0) as total
       from session_pt_cancellations c
       join training_sessions s on s.id = c.training_session_id
      where s.ticket_id = ? and c.status = 'REFUNDED'`,
    [ticketId],
  );
  return Number(row?.total ?? 0);
}

/** Bất biến chống đặt trùng: không PT nào có hai buổi cùng ngày cùng giờ. */
export async function duplicateSlotCount(): Promise<number> {
  const rows = await query<{ n: number }>(
    `select count(*) n from (
       select pt_profile_id, session_date, pt_slot_start
         from training_sessions
        where pt_profile_id is not null and pt_slot_start is not null
        group by 1,2,3 having count(*) > 1) d`,
  );
  return Number(rows[0]?.n ?? 0);
}

export interface WalletRow {
  owner_type: string;
  held_balance: string;
  pending_balance: string;
  available_balance: string;
}

export function wallets(): Promise<WalletRow[]> {
  return query<WalletRow>(
    "select owner_type, held_balance, pending_balance, available_balance from wallets order by id",
  );
}
