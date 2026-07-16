/**
 * D-17 (audit 2026-07-17): danh sách ngân hàng VN cho form rút tiền — tách khỏi
 * component. Khi cần chính xác hơn (BIN, tên đầy đủ), chuyển sang master data BE.
 */
export const VIETNAM_BANKS = [
  "Vietcombank", "VietinBank", "BIDV", "Agribank", "Techcombank",
  "MB Bank", "ACB", "VPBank", "Sacombank", "TPBank", "SHB", "HDBank",
  "VIB", "OCB", "Eximbank", "MSB", "SeABank", "LienVietPostBank",
  "ABBank", "Bac A Bank", "Nam A Bank", "PVcomBank", "SCB", "Saigonbank",
  "VietBank", "Cake by VPBank", "Timo",
] as const;
