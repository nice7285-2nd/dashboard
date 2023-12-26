This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## 주요 특징
- 버셀(Vercel) Postgres 데이터베이스: 회원 관리, 프로젝트 관리, 웹 바이탈(Web Vitals) 성능 지표를 위한 사용.
- 로그인: next-auth를 기반으로 한 이메일 기반의 회원 가입, 로그인, 인증 관리.
- 대시보드 차트: tremor 라이브러리를 사용한 차트 적용.
- 웹 성능 지표 분석: 6가지 종류의 지표를 통한 프로젝트 및 웹 페이지별 성능 지표 추이 및 점수 분석.
- 외부 웹 애플리케이션과의 연동: 라우터 핸들러를 통해 외부 Next.js 웹 애플리케이션 지원.
- 사용자 별 인증 키 발급: 외부 웹 애플리케이션을 위한 인증 키 관리.
- 서스펜스(Suspense) 스트리밍: 대시보드 화면에 적용.
- 서버 액션: 회원 관리 및 프로젝트 관리 시 사용자 폼을 통한 데이터베이스 접근.
- 아이콘: heroicons 라이브러리를 기반으로 한 아이콘 적용.
- 미들웨어: 인증된 사용자만이 대시보드에 접근 가능.

## 라우트별 페이지
- `/`: 메인 홈
- `/signup`: 메인 홈
- `/login`: 메인 홈
- `/dashboard`: 전체 프로젝트 대시보드
- `/dashboard/account`: 사용자 계정 관리
- `/dashboard/projects`: 프로젝트 리스트
- `/dashboard/projects/create`: 프로젝트 생성
- `/dashboard/projects/[projectId]/edit`: 프로젝트 정보 수정
- `/dashboard/projects/[projecName]/analytics`: 프로젝트 대시보드

## 라우트 핸들러
- `/api/collect/`: 분석 정보 수집(타 앱 애플리케이션에서 AuthKey와 함께 접근 가능)
- `/api/analytics`: 분석 정보 보내기(서버에서 `/api/collect/` 정보 송신, 타 앱에서 사용하려면 이 웹 API를 타 앱에서 구현 필요)

## 필요 설치 라이브러리
```bash
$ npm install @heroicons/react @tailwindcss/forms @tremor/react @vercel/postgres autoprefixer bcrypt clsx next-auth uuid zod

$ npm install --save-dev @types/bcrypt @types/uuid @vercel/style-guide dotenv eslint-config-prettier prettier prettier-plugin-tailwindcss
```
