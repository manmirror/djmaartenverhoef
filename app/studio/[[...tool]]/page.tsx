"use client";

import dynamic from "next/dynamic";

import { isSanityConfigured } from "../../../sanity/env";

// Loaded only when a real Sanity project is configured — this keeps
// sanity.config.ts (which needs a real projectId) out of the server bundle
// entirely until then, so the rest of the site keeps building and running
// fine before the CMS is linked.
const StudioClient = dynamic(() => import("./StudioClient"), { ssr: false });

export default function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0a12",
          color: "#f3eefc",
          fontFamily: "Helvetica Neue, Arial, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
            Studio nog niet gekoppeld
          </h1>
          <p style={{ color: "#a99cc4", lineHeight: 1.6 }}>
            Zet <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> en{" "}
            <code>NEXT_PUBLIC_SANITY_DATASET</code> in je environment
            variables (bv. via <code>vercel integration add sanity</code> en{" "}
            <code>vercel env pull</code>) en herstart de app om deze pagina te
            gebruiken.
          </p>
        </div>
      </div>
    );
  }

  return <StudioClient />;
}
