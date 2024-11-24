FROM node:18-alpine

WORKDIR /app

# Build arguments
ARG DATABASE_URL
ARG POSTGRES_URL
ARG POSTGRES_PRISMA_URL
ARG POSTGRES_URL_NON_POOLING
ARG POSTGRES_USER
ARG POSTGRES_HOST
ARG POSTGRES_PASSWORD
ARG POSTGRES_DATABASE

# 환경 변수 설정
ENV DATABASE_URL=${DATABASE_URL}
ENV POSTGRES_URL=${POSTGRES_URL}
ENV POSTGRES_PRISMA_URL=${POSTGRES_PRISMA_URL}
ENV POSTGRES_URL_NON_POOLING=${POSTGRES_URL_NON_POOLING}
ENV POSTGRES_USER=${POSTGRES_USER}
ENV POSTGRES_HOST=${POSTGRES_HOST}
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ENV POSTGRES_DATABASE=${POSTGRES_DATABASE}

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

# Prisma 생성
RUN npx prisma generate

# Next.js 빌드
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
