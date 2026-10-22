import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo en desarrollo: abrir la app también en 127.0.0.1 (otra sesión que en localhost)
  allowedDevOrigins: ["127.0.0.1"],
  // Las URLs del sitio estático anterior siguen funcionando
  async redirects() {
    return [
      { source: "/admin.html", destination: "/admin", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
