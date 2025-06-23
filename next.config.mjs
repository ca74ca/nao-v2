/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true, // 💥 this disables ESLint from breaking your build
  },
};

export default nextConfig;
