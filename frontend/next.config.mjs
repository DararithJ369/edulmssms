import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  optimizeFonts: false,
  images: {
    remotePatterns: [
      { hostname: "images.pexels.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "res.cloudinary.com" },
      { hostname: "localhost" },
      { hostname: "127.0.0.1" },
    ],
  },
  webpack: (config) => {
    config.resolve.alias["react-toastify"] = path.resolve(
      __dirname,
      "src/lib/react-toastify-shim.tsx"
    );
    return config;
  },
};

export default nextConfig;
