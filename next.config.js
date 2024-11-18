/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'fsbone-bucket.s3.ap-northeast-2.amazonaws.com',
      // ... 기존에 있던 다른 도메인들
    ],
  },
  // experimental 객체 자체를 제거하거나, 다른 실험적 기능만 남겨두세요
  // experimental: {
  //   // appDir 옵션 제거
  // },
  optimizeFonts: true,
  reactStrictMode: false,
  // 다른 필요한 설정들...
};

module.exports = nextConfig;
