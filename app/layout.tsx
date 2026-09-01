import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DJ Maarten Verhoef — maartenverhoef.nl",
  description:
    "DJ Maarten Verhoef — al ruim 30 jaar de dansvloer vol in en rond Uithoorn. Van cafés tot Koningsdag.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
