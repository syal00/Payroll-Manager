import type { NextConfig } from "next";

/**
 * Allow dev-only assets / HMR WebSocket when the app is opened via a LAN IP (e.g. iPad).
 * Next.js blocks cross-origin `/_next/*` by default; patterns match hostname only (no port).
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
 */
const privateLanOriginPatterns = [
  "192.168.*.*",
  "10.*.*.*",
  ...["16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"].map(
    (n) => `172.${n}.*.*`
  ),
];

const extraDevOrigins =
  process.env.NEXT_DEV_EXTRA_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: [...privateLanOriginPatterns, ...extraDevOrigins],
  }),
};

export default nextConfig;
