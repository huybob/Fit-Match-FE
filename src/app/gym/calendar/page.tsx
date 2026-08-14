import { GymCalendarPage } from "@/modules/ticket/components/gym-calendar";

// Không bọc SiteLayout ở đây: src/app/gym/layout.tsx đã bọc GymLayout (sidebar +
// WorkspaceHeader + AuthGuard ROLE_GYM_OPERATOR). Trang này trước đây tự bọc
// thêm SiteLayout nên header/footer của trang công khai bị lồng vào giữa khung
// dashboard — đó là chỗ giao diện vỡ. Các trang gym khác đều trả thẳng <main>.
export default function GymCalendarRoute() {
  return <GymCalendarPage />;
}
