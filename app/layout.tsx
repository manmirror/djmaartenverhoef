import type { Metadata } from "next";
import { Archivo_Black } from "next/font/google";
import "./globals.css";

// Echt zwaar display-lettertype voor het woordmerk; Arial en Helvetica houden
// op bij gewicht 900 en zijn daarvoor te licht.
const displayFont = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const siteUrl = "https://djmaartenverhoef.nl";
const description =
  "DJ Maarten Verhoef — al ruim 30 jaar de dansvloer vol in en rond Uithoorn. Van cafés tot Koningsdag.";

export const metadata: Metadata = {
  // Zorgt dat links en deelafbeeldingen naar het juiste domein wijzen.
  metadataBase: new URL(siteUrl),
  title: "DJ Maarten Verhoef — djmaartenverhoef.nl",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: siteUrl,
    siteName: "DJ Maarten Verhoef",
    title: "DJ Maarten Verhoef",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={displayFont.variable}>
      <body>{children}</body>
    </html>
  );
}
