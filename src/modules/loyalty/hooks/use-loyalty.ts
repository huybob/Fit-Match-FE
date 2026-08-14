"use client";

import { useQuery } from "@tanstack/react-query";
import { loyaltyService } from "@/services/loyalty.service";

export const loyaltyKeys = {
  /** Một khoá duy nhất cho số dư điểm: trang điểm thưởng và popup mua vé dùng
   *  chung cache, tiêu điểm ở đâu thì cả hai chỗ đều thấy số mới. */
  balance: ["loyalty"] as const,
};

/**
 * Số dư điểm + TỶ LỆ quy đổi (bao nhiêu đồng được 1 điểm, 1 điểm giảm bao nhiêu).
 * Tỷ lệ nằm ở BE (`LoyaltyServiceImpl`) nên FE không hằng số hoá — đổi chính sách
 * điểm thì không phải sửa hai nơi.
 *
 * Endpoint yêu cầu ROLE_CUSTOMER; màn hình nào không chắc vai trò thì truyền
 * `enabled` để khỏi ăn 403.
 */
export function useLoyaltyBalance(enabled = true) {
  return useQuery({
    queryKey: loyaltyKeys.balance,
    queryFn: () => loyaltyService.balance(),
    enabled,
  });
}
