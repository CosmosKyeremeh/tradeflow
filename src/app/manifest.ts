import type { MetadataRoute } from "next";

// Next's native manifest route convention: auto-served at
// /manifest.webmanifest and auto-linked in <head>, so this replaces the
// static public/site.webmanifest the favicon generator produced (that file
// had empty name/short_name and was never linked from anywhere).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TradeFlow",
    short_name: "TradeFlow",
    description: "Shipment, client, and duty management for Ghanaian traders and freight forwarders.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10233f",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
