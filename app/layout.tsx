import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마음로그 | 매일 아침 감정일기",
  description: "등교 전 1분, 지금 내 마음을 기록하는 감정일기.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
