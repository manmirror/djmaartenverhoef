import type { SanityImageSource } from "@sanity/image-url";

export interface SiteSettings {
  eyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  tagline: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  whatsappNumber: string;
  whatsappMessage: string;
  phoneNumber: string;
  email: string;
  sequenceHeading: string;
  aboutHeading: string;
  aboutText: string;
  aboutPhoto?: SanityImageSource | null;
  chatHeading: string;
  chatText: string;
  mediaHeading: string;
  mediaSubtext: string;
  musicHeading: string;
  musicSubtext: string;
  contactHeading: string;
  contactText: string;
  footerCopyright: string;
}

export interface Venue {
  _id?: string;
  name: string;
}

export interface MediaItem {
  _id?: string;
  label: string;
  image?: SanityImageSource | null;
  gradientFrom?: string;
  gradientTo?: string;
  tall?: boolean;
}

export interface Track {
  _id?: string;
  title: string;
  dotColor?: string;
  audioUrl?: string | null;
  externalUrl?: string | null;
}
