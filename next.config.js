/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fsbone-bucket.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['fsbone.com', '3.37.136.30', '15.165.0.110'],
      allowedForwardedHosts: ['fsbone.com', '3.37.136.30:80', '15.165.0.110:80'],
    },
  },
}

module.exports = nextConfig;