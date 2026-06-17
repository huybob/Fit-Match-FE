import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/core/providers/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FitMatch - Quản lý phòng Gym & Fitness toàn diện",
    template: "%s | FitMatch",
  },
  description:
    "Nền tảng quản lý phòng gym, fitness, personal trainer, hội viên, gói tập và booking lịch tập toàn diện.",
  keywords: [
    "quản lý phòng gym",
    "phần mềm fitness",
    "quản lý PT",
    "booking lịch tập",
    "gym SaaS",
    "QR check-in",
  ],
  openGraph: {
    title: "FitMatch - Quản lý phòng Gym & Fitness toàn diện",
    description:
      "Quản lý hội viên, PT, lịch tập, gói tập và booking chỉ trên một nền tảng.",
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
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-zinc-950">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
