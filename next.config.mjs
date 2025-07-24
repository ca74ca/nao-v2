/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    appDir: false, // 🚫 disable /app router to prevent build errors
  },
};

export default nextConfig;
