import { QueryClient } from "@tanstack/react-query";

// Singleton để code ngoài React (vd auth.store) truy cập được —
// F-6 (audit 2026-07-17): logout phải clear() cache, tránh user sau
// thấy dữ liệu (bookings/payments/notifications) của user trước trên cùng tab.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
