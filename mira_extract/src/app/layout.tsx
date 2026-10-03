import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Otomasyon Sorun Asistanı | n8n YouTube Shorts Akışı",
  description:
    "n8n YouTube Shorts otomasyonunun hatalarını teşhis eden, çözüm adımları öneren ve sorunları takip eden asistan.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen text-slate-100 antialiased">{children}</body>
    </html>
  );
}
