/**
 * Suy ra hộp thư web từ địa chỉ email để mở thẳng inbox sau khi đăng ký.
 *
 * Chỉ nhận diện các nhà cung cấp có URL webmail ổn định — domain lạ (mail nội bộ
 * công ty, tên miền riêng) trả về null để UI hiện hướng dẫn thay vì link đoán mò
 * dẫn tới trang lỗi.
 */

export interface MailProvider {
  /** Tên hiển thị trên nút, ví dụ "Gmail". */
  name: string;
  /** URL hộp thư đến của nhà cung cấp. */
  inboxUrl: string;
}

const PROVIDERS: Record<string, MailProvider> = {
  "gmail.com": { name: "Gmail", inboxUrl: "https://mail.google.com/mail/u/0/#inbox" },
  "googlemail.com": { name: "Gmail", inboxUrl: "https://mail.google.com/mail/u/0/#inbox" },
  "outlook.com": { name: "Outlook", inboxUrl: "https://outlook.live.com/mail/0/inbox" },
  "hotmail.com": { name: "Outlook", inboxUrl: "https://outlook.live.com/mail/0/inbox" },
  "live.com": { name: "Outlook", inboxUrl: "https://outlook.live.com/mail/0/inbox" },
  "msn.com": { name: "Outlook", inboxUrl: "https://outlook.live.com/mail/0/inbox" },
  "yahoo.com": { name: "Yahoo Mail", inboxUrl: "https://mail.yahoo.com" },
  "yahoo.com.vn": { name: "Yahoo Mail", inboxUrl: "https://mail.yahoo.com" },
  "icloud.com": { name: "iCloud Mail", inboxUrl: "https://www.icloud.com/mail" },
  "me.com": { name: "iCloud Mail", inboxUrl: "https://www.icloud.com/mail" },
  "proton.me": { name: "Proton Mail", inboxUrl: "https://mail.proton.me" },
  "protonmail.com": { name: "Proton Mail", inboxUrl: "https://mail.proton.me" },
  "zoho.com": { name: "Zoho Mail", inboxUrl: "https://mail.zoho.com" },
};

/** Trả về hộp thư web tương ứng, hoặc null nếu không nhận diện được domain. */
export function resolveMailProvider(email: string): MailProvider | null {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return null;

  // Email trường học/doanh nghiệp ở VN phần lớn chạy trên Google Workspace.
  if (domain.endsWith(".edu.vn")) return PROVIDERS["gmail.com"];

  return PROVIDERS[domain] ?? null;
}
