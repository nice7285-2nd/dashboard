/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fsbone-bucket.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  optimizeFonts: true,
  reactStrictMode: false,
  env: {
    DATABASE_URL: process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL,
    DATABASE_HOST: process.env.DATABASE_HOST || process.env.NEXT_PUBLIC_DATABASE_HOST,
    DATABASE_USER: process.env.DATABASE_USER || process.env.NEXT_PUBLIC_DATABASE_USER,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || process.env.NEXT_PUBLIC_DATABASE_PASSWORD,
    DATABASE_NAME: process.env.DATABASE_NAME || process.env.NEXT_PUBLIC_DATABASE_NAME,
    DATABASE_PORT: process.env.DATABASE_PORT || process.env.NEXT_PUBLIC_DATABASE_PORT,
  }
}

module.exports = nextConfig;