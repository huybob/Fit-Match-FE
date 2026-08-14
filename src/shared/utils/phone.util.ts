/**
 * Số điện thoại Việt Nam (UC-016).
 *
 * Bản sao đúng luật của `VietnamPhoneValidator` phía BE. Có mặt ở FE không phải
 * để thay BE kiểm tra — BE vẫn là nơi chốt — mà để người nhập biết sai NGAY tại
 * ô, thay vì bấm Lưu rồi ăn một lỗi 400 sau vòng gọi mạng.
 *
 * Sửa luật ở đây thì phải sửa cả `VietnamPhoneValidator`, và ngược lại.
 */

/** Ký tự trình bày người dùng hay gõ: "(028) 3822-1234", "0901.234.567". */
const SEPARATORS = /[\s.()-]/g;

/**
 * Số nội địa đã đưa về dạng bắt đầu bằng 0.
 * - Di động: 0 + đầu số 3/5/7/8/9 + 8 chữ số = 10 chữ số (đầu số 4 và 6 không
 *   còn được cấp sau đợt chuyển 11 -> 10 số năm 2018).
 * - Cố định: 02 + 9 chữ số = 11 chữ số — chi nhánh phòng gym hay khai số bàn.
 */
const NATIONAL = /^0(?:[35789]\d{8}|2\d{9})$/;

/**
 * Đưa dạng quốc tế về dạng nội địa. Số nội địa LUÔN bắt đầu bằng 0 nên "84..."
 * không thể là số nội địa — không có chuyện nhầm với đầu số 08x.
 */
function toNational(compact: string): string {
  let rest: string;
  if (compact.startsWith("+84")) rest = compact.slice(3);
  else if (compact.startsWith("0084")) rest = compact.slice(4);
  else if (compact.startsWith("84")) rest = compact.slice(2);
  else return compact;
  // "+84901234567" bỏ số 0 đầu, "+840901234567" thì giữ — cả hai cách viết đều
  // gặp ngoài đời.
  return rest.startsWith("0") ? rest : `0${rest}`;
}

/** Chuỗi rỗng trả false: "bắt buộc" là ràng buộc riêng, kiểm tra trước. */
export function isVietnamPhone(value: string): boolean {
  const compact = value.replace(SEPARATORS, "");
  return NATIONAL.test(toNational(compact));
}
