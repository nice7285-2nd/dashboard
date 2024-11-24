FROM node:18-alpine

WORKDIR /app

# 필요한 시스템 패키지 설치
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    build-base

# 패키지 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# 소스 파일 복사
COPY . .

# 빌드 시 필요한 환경 변수 설정
ENV DATABASE_URL="postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require"
ENV NEXT_PUBLIC_API_URL="http://localhost:3000"

# Next.js 빌드
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
