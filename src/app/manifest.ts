import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "KLYP — AI YouTube clipper",
    short_name: "KLYP",
    description:
      "Paste a YouTube link. KLYP finds the moments worth sharing and cuts them into scored, captioned, vertical clips — then posts them to TikTok.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#07070C",
    theme_color: "#07070C",
    categories: ["video", "productivity", "social"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Studio",
        short_name: "Studio",
        description: "Your clip library",
        url: "/studio",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Publish Center",
        short_name: "Publish",
        description: "TikTok upload queue",
        url: "/publish",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    // Share YouTube links straight from the YouTube app into the pipeline.
    share_target: {
      action: "/share",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  } as MetadataRoute.Manifest;
}
