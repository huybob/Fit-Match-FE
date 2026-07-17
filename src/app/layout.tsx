import type { Metadata } from "next";
import { AppProviders } from "@/core/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FitMatch - Gym & PT Booking",
    template: "%s | FitMatch",
  },
  description:
    "Modern ecommerce interface for gym packages, personal trainers, booking, checkout and member profile.",
  keywords: [
    "quản lý phòng gym",
    "phần mềm fitness",
    "quản lý PT",
    "booking lịch tập",
    "gym SaaS",
    "QR check-in",
  ],
  openGraph: {
    title: "FitMatch OS - Workspace quản lý phòng gym",
    description:
      "Check lịch, quản lý PT, hội viên, QR check-in và booking lịch tập trong một workspace.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* No-flash: áp theme đã lưu / theo hệ điều hành TRƯỚC khi paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fitmatch.theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
