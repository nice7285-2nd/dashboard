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

# Next.js 설정 파일 복사
COPY next.config.js ./

# Prisma 스키마 복사
COPY prisma ./prisma/

# 소스 파일 복사
COPY . .

# .env 파일 생성
RUN echo "DATABASE_URL=postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require" > .env && \
    echo "NEXT_PUBLIC_DATABASE_URL=postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require" >> .env && \
    echo "POSTGRES_URL=postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require" >> .env && \
    echo "POSTGRES_PRISMA_URL=postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require" >> .env && \
    echo "POSTGRES_URL_NON_POOLING=postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require" >> .env && \
    echo "POSTGRES_USER=default" >> .env && \
    echo "POSTGRES_HOST=ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech" >> .env && \
    echo "POSTGRES_PASSWORD=fIs4yN3tPvoH" >> .env && \
    echo "POSTGRES_DATABASE=verceldb" >> .env

# Prisma 클라이언트 생성
RUN npx prisma generate

# Next.js 빌드
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
