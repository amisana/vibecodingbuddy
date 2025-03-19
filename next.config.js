/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't run ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously skip TS checks in production build
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 