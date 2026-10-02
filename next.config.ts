import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las URLs del sitio estático anterior siguen funcionando
  async redirects() {
    return [
      { source: "/admin.html", destination: "/admin", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
