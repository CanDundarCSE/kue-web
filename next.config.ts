import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Reuse client router cache entries for dynamic pages for 30s so that
    // re-visiting a section does not immediately trigger another RSC request.
    staleTimes: {
      dynamic: 30,
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
      {
        protocol: "https",
        hostname: "s4.anilist.co",
        pathname: "/file/anilistcdn/media/**",
      },
      {
        protocol: "https",
        hostname: "images.igdb.com",
        pathname: "/igdb/image/upload/**",
      },
    ],
  },
};

export default nextConfig;
