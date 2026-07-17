import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import "react-datepicker/dist/react-datepicker.css";
import Topbar from "../components/topbar"
import AppShell from "../components/appshell"

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "V-Repair Service - ระบบใบแจ้งซ่อม",
  description: "Internal repair request system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${prompt.variable} font-sans antialiased bg-gray-100 text-gray-900 md:overflow-x-hidden`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
