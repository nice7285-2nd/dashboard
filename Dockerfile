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

# 환경 변수 설정을 위한 .env 파일 생성
RUN echo "DATABASE_URL=${DATABASE_URL}" > .env && \
    echo "POSTGRES_URL=${POSTGRES_URL}" >> .env && \
    echo "POSTGRES_PRISMA_URL=${POSTGRES_PRISMA_URL}" >> .env && \
    echo "POSTGRES_URL_NON_POOLING=${POSTGRES_URL_NON_POOLING}" >> .env && \
    echo "POSTGRES_USER=${POSTGRES_USER}" >> .env && \
    echo "POSTGRES_HOST=${POSTGRES_HOST}" >> .env && \
    echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" >> .env && \
    echo "POSTGRES_DATABASE=${POSTGRES_DATABASE}" >> .env

# Prisma 클라이언트 생성
RUN npx prisma generate

# 소스 파일 복사
COPY . .

# Next.js 빌드
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
