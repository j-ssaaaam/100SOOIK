import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "백점수익 | 틀린 문제를 다시, 내 힘으로",
  description: "초등학생을 위한 단계적 수학 완성학습 웹앱 백점수익",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
