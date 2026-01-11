import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Cấu hình Metadata (SEO, Title, Description)
export const metadata: Metadata = {
  title: "OpPortal - Hệ thống Quản lý Điều hành",
  description: "Hệ thống quản lý điều hành doanh nghiệp - Chấm công, KPI, Phê duyệt",
  keywords: ["operation management", "attendance", "kpi", "shift scheduling"],
  authors: [{ name: "OpPortal Team" }],
  manifest: "/manifest.json",
  // Lưu ý: Đã xóa themeColor và viewport ở đây để đưa xuống dưới
};

// 2. Cấu hình Viewport (Màu thanh trạng thái, Zoom...) - Next.js 14+ yêu cầu tách riêng
export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}