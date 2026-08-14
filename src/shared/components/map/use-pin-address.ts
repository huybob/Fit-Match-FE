"use client";

import { useCallback, useRef, useState } from "react";
import { marketplaceService } from "@/services/marketplace.service";
import { canonicalCityName } from "@/shared/constants/vn-locations";

/** Địa chỉ đọc được tại chỗ ghim, đã tách sẵn cấp hành chính. */
export interface PinAddress {
  formattedAddress?: string;
  /** V66: phường/xã — Việt Nam bỏ cấp huyện từ đợt sắp xếp hành chính 2025. */
  ward?: string;
  city?: string;
}

/**
 * Tra ngược địa chỉ tại chỗ operator vừa thả ghim (UC-18).
 *
 * <p>Trước đây kéo ghim chỉ đổi lat/lng: ô địa chỉ vẫn giữ nguyên chuỗi cũ và hai
 * ô quận/huyện + tỉnh/thành vẫn trống, nên người dùng phải tự gõ lại đúng cái
 * địa chỉ mà hệ thống hoàn toàn biết. Tệ hơn: chuỗi địa chỉ được lưu có thể mô tả
 * một nơi khác hẳn chỗ ghim, và không có gì trên màn hình cho thấy điều đó.
 *
 * <p>Bộ đếm `seq` là phần bắt buộc chứ không phải tối ưu: kéo ghim là thao tác
 * liên tục, người dùng thường thả hai ba lần liền nhau. Không có nó thì một
 * response đến muộn của ghim CŨ sẽ ghi đè địa chỉ của ghim mới nhất — form hiển
 * thị một địa chỉ không khớp với ghim đang thấy.
 */
export function usePinAddress() {
  const [resolving, setResolving] = useState(false);
  const seqRef = useRef(0);

  const resolve = useCallback(async (lat: number, lng: number): Promise<PinAddress | null> => {
    const seq = ++seqRef.current;
    setResolving(true);
    try {
      const result = await marketplaceService.reverseGeocode(lat, lng);
      // Ghim đã dời tiếp trong lúc chờ -> kết quả này đã lỗi thời.
      if (seq !== seqRef.current) return null;

      const formattedAddress = result.formattedAddress?.trim();
      if (!formattedAddress && !result.city && !result.ward) return null;
      return {
        formattedAddress: formattedAddress || undefined,
        // Phường giữ nguyên chuỗi nhà cung cấp trả về — không có danh mục rút gọn
        // nào để đối chiếu như với tỉnh/thành.
        ward: result.ward,
        // Chuẩn hoá về đúng chuỗi trong danh mục VN_CITIES khi khớp: bộ lọc
        // marketplace gửi lên chuỗi của danh mục, lưu tên dạng khác là gym rớt
        // khỏi bộ lọc.
        city: canonicalCityName(result.city) ?? result.city,
      };
    } catch {
      // Không tra được (dịch vụ tắt, 404 giữa biển, mạng chập chờn) KHÔNG phải
      // lỗi người dùng cần biết: toạ độ vẫn đã được ghim và vẫn lưu được, chỉ là
      // không có chữ để điền hộ. Báo toast ở đây chỉ tổ nhiễu.
      return null;
    } finally {
      if (seq === seqRef.current) setResolving(false);
    }
  }, []);

  return { resolving, resolve };
}
