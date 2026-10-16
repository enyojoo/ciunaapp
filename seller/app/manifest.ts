import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ciuna Seller",
    short_name: "Seller",
    description: "Run your store or expert business on Ciuna.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#F97316",
    icons: [
      { src: "https://seeqjiebmrnolcyydewj.supabase.co/storage/v1/object/public/brand/Ciuna%20favicon.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  }
}
