import type { Metadata, Viewport } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Studio — DJ Maarten Verhoef",
  description: "Contentbeheer voor maartenverhoef.nl",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
