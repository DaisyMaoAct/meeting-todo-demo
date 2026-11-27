import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const sans = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  preload: false,
});

export const metadata: Metadata = {
  title: "会议待办",
  description: "把会议纪要提取成待办，确认派发后在应用内通知负责人，并按模拟时间提醒。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
