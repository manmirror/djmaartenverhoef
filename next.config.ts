import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  /* config options here */
};

// Zet de bot-controle van Vercel aan voor het terugbelformulier.
export default withBotId(nextConfig);
