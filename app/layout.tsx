import type { Metadata } from "next";
import { Archivo_Black } from "next/font/google";
import { BotIdClient } from "botid/client";
import { siteContent } from "@/content/site";

import "./globals.css";

// Onzichtbare bot-controle op het terugbelformulier: bezoekers merken er niets
// van, bots worden op de server geweigerd.
//
// Het verzoekjesformulier staat hier bewust niet bij. De bot-controle hangt aan
// een script van Vercel; laadt dat niet — adblocker, haperende gast-wifi op een
// zaal — dan komt het verzoek niet eens de deur uit. Op een feest is dat erger
// dan af en toe een rare regel in de lijst, en daar staan de honeypot, de rem
// per ip en de knop "Lijst wissen" al voor.
const protectedRoutes = [{ path: "/api/terugbellen", method: "POST" }];

// Echt zwaar display-lettertype voor het woordmerk; Arial en Helvetica houden
// op bij gewicht 900 en zijn daarvoor te licht.
const displayFont = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const siteUrl = siteContent.siteUrl;
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
    // suppressHydrationWarning: de boothpagina zet vóór het laden van React een
    // attribuut op <html> voor de lichte weergave.
    <html lang="nl" className={displayFont.variable} suppressHydrationWarning>
      <head>
        <BotIdClient protect={protectedRoutes} />
      </head>
      <body>{children}</body>
    </html>
  );
}
