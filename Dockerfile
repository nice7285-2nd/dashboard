FROM node:18-alpine

WORKDIR /app

# 환경 변수 설정
ENV DATABASE_URL="postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require"

# 필요한 시스템 패키지 설치
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    build-base

# 패키지 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# Prisma 스키마 복사
COPY prisma ./prisma/

# 소스 파일 복사
COPY . .

# Prisma 클라이언트 생성
RUN npx prisma generate

# Next.js 빌드
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
