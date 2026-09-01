import { client } from "./client";
import { fallbackContent } from "./fallback";
import type { MediaItem, SiteSettings, Track, Venue } from "./types";

const FETCH_OPTIONS = { next: { revalidate: 30 } };

const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  eyebrow, heroTitleLine1, heroTitleLine2, tagline,
  primaryButtonLabel, secondaryButtonLabel,
  whatsappNumber, whatsappMessage, phoneNumber, email,
  sequenceHeading, aboutHeading, aboutText, aboutPhoto,
  chatHeading, chatText,
  mediaHeading, mediaSubtext,
  musicHeading, musicSubtext,
  contactHeading, contactText, footerCopyright
}`;

const venuesQuery = `*[_type == "venue"] | order(order asc, name asc){ _id, name }`;

const mediaItemsQuery = `*[_type == "mediaItem"] | order(order asc){
  _id, label, image, gradientFrom, gradientTo, tall
}`;

const tracksQuery = `*[_type == "track"] | order(order asc){
  _id, title, dotColor, externalUrl,
  "audioUrl": audioFile.asset->url
}`;

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!client) return fallbackContent.siteSettings;
  const data = await client.fetch<Partial<SiteSettings> | null>(
    siteSettingsQuery,
    {},
    FETCH_OPTIONS
  );
  return { ...fallbackContent.siteSettings, ...(data ?? {}) };
}

export async function getVenues(): Promise<Venue[]> {
  if (!client) return fallbackContent.venues;
  const data = await client.fetch<Venue[]>(venuesQuery, {}, FETCH_OPTIONS);
  return data?.length ? data : fallbackContent.venues;
}

export async function getMediaItems(): Promise<MediaItem[]> {
  if (!client) return fallbackContent.mediaItems;
  const data = await client.fetch<MediaItem[]>(mediaItemsQuery, {}, FETCH_OPTIONS);
  return data?.length ? data : fallbackContent.mediaItems;
}

export async function getTracks(): Promise<Track[]> {
  if (!client) return fallbackContent.tracks;
  const data = await client.fetch<Track[]>(tracksQuery, {}, FETCH_OPTIONS);
  return data?.length ? data : fallbackContent.tracks;
}
