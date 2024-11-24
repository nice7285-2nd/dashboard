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

# Prisma 스키마 복사
COPY prisma ./prisma/

# 소스 파일 복사
COPY . .

# 환경 변수 직접 설정
ENV DATABASE_URL="postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require"
ENV NEXT_PUBLIC_DATABASE_URL="postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require"
ENV POSTGRES_URL="postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require"
ENV POSTGRES_PRISMA_URL="postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require"
ENV POSTGRES_URL_NON_POOLING="postgres://default:fIs4yN3tPvoH@ep-polished-water-a17o20lb.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require"
ENV POSTGRES_USER="default"
ENV POSTGRES_HOST="ep-polished-water-a17o20lb-pooler.ap-southeast-1.aws.neon.tech"
ENV POSTGRES_PASSWORD="fIs4yN3tPvoH"
ENV POSTGRES_DATABASE="verceldb"

# .env 파일 생성
RUN echo "DATABASE_URL=$DATABASE_URL" > .env && \
    echo "NEXT_PUBLIC_DATABASE_URL=$NEXT_PUBLIC_DATABASE_URL" >> .env && \
    echo "POSTGRES_URL=$POSTGRES_URL" >> .env && \
    echo "POSTGRES_PRISMA_URL=$POSTGRES_PRISMA_URL" >> .env && \
    echo "POSTGRES_URL_NON_POOLING=$POSTGRES_URL_NON_POOLING" >> .env && \
    echo "POSTGRES_USER=$POSTGRES_USER" >> .env && \
    echo "POSTGRES_HOST=$POSTGRES_HOST" >> .env && \
    echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> .env && \
    echo "POSTGRES_DATABASE=$POSTGRES_DATABASE" >> .env

# Prisma 클라이언트 생성
RUN npx prisma generate

# Next.js 빌드
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
