/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyTimeout: 120000, // 120 segundos (2 minutos)
  },
};

export default nextConfig;