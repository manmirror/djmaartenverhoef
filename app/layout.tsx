import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
