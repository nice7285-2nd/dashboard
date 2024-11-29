# 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

# 필요한 시스템 의존성 설치
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    python3

# 패키지 파일 복사 및 설치
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Prisma 클라이언트 생성
RUN npx prisma generate

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# 실행 스테이지
FROM node:18-alpine AS runner

WORKDIR /app

# 런타임 의존성 설치
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib

# 필요한 파일만 복사
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# 환경변수 설정
ARG NEXT_PUBLIC_AWS_REGION
ARG NEXT_PUBLIC_AWS_BUCKET_NAME
ARG AWS_REGION
ARG AWS_BUCKET_NAME
ARG DATABASE_URL

ENV NODE_ENV=production
ENV NEXT_PUBLIC_AWS_REGION=${NEXT_PUBLIC_AWS_REGION}
ENV NEXT_PUBLIC_AWS_BUCKET_NAME=${NEXT_PUBLIC_AWS_BUCKET_NAME}
ENV AWS_REGION=${AWS_REGION}
ENV AWS_BUCKET_NAME=${AWS_BUCKET_NAME}
ENV DATABASE_URL=${DATABASE_URL}

# Prisma 클라이언트 생성
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
