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
    <html lang="vi">
      <body className="min-h-full bg-white text-zinc-950">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
