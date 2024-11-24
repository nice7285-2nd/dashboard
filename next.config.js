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
  // experimental 객체 자체를 제거하거나, 다른 실험적 기능만 남겨두세요
  // experimental: {
  //   // appDir 옵션 제거
  // },
  optimizeFonts: true,
  reactStrictMode: false,
  // 다른 필요한 설정들...
  experimental: {
    serverActions: true,
  },
  env: {
    DATABASE_URL: "postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require",
    NEXT_PUBLIC_DATABASE_URL: "postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require",
    POSTGRES_URL: "postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require",
    POSTGRES_PRISMA_URL: "postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require",
    POSTGRES_URL_NON_POOLING: "postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require",
    POSTGRES_USER: "default",
    POSTGRES_HOST: "ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech",
    POSTGRES_PASSWORD: "fIs4yN3tPvoH",
    POSTGRES_DATABASE: "verceldb"
  }
}

module.exports = nextConfig;