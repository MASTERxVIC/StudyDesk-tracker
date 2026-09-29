/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/practice', destination: '/mock', permanent: true },
    ];
  },
};

module.exports = nextConfig;
