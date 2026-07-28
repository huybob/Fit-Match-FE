import { QueryClient } from "@tanstack/react-query";
import { getErrorStatus } from "@/shared/utils/error.util";

// Singleton để code ngoài React (vd auth.store) truy cập được —
// F-6 (audit 2026-07-17): logout phải clear() cache, tránh user sau
// thấy dữ liệu (bookings/payments/notifications) của user trước trên cùng tab.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // BUG-08/BUG-13: mặc định của React Query là retry 3 lần, nên mỗi lỗi 4xx
      // biến thành 4 request và 4 dòng đỏ trong console (404 khi operator chưa có
      // hồ sơ, 403 khi vào trang ngoài quyền). Lỗi phía client không bao giờ là
      // tạm thời — thử lại chỉ tạo nhiễu và làm chậm việc hiện đúng trạng thái.
      // Lỗi mạng/5xx thì vẫn đáng thử lại.
      retry: (failureCount, error) => {
        const status = getErrorStatus(error);
        if (status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
