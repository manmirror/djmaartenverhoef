export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-01";

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";

// True once a real Sanity project is linked (via `vercel integration add sanity`
// or manually in `.env.local`). Until then the site falls back to the copy in
// sanity/lib/fallback.ts so it keeps working with zero configuration.
export const isSanityConfigured = Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
