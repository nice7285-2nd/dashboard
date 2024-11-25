FROM node:18-alpine

WORKDIR /app

# 환경 변수 정의
ARG DATABASE_URL
ARG DATABASE_HOST
ARG DATABASE_USER
ARG DATABASE_PASSWORD
ARG DATABASE_NAME
ARG DATABASE_PORT

# 환경 변수를 시스템에 설정
ENV DATABASE_URL=$DATABASE_URL \
    DATABASE_HOST=$DATABASE_HOST \
    DATABASE_USER=$DATABASE_USER \
    DATABASE_PASSWORD=$DATABASE_PASSWORD \
    DATABASE_NAME=$DATABASE_NAME \
    DATABASE_PORT=$DATABASE_PORT

# 필요한 시스템 패키지 설치
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# 패키지 파일 복사 및 설치
COPY package*.json ./
RUN npm install --build-from-source

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
