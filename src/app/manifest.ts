import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "냥점",
    short_name: "냥점",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F4FD",
    theme_color: "#F8F4FD",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
