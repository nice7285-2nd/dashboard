FROM node:18-alpine

WORKDIR /app

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

# Next.js 빌드 전에 환경 변수 파일 생성
RUN echo "DATABASE_URL=${DATABASE_URL}\n\
DB_HOST=${DB_HOST}\n\
DB_USER=${DB_USER}\n\
DB_PASSWORD=${DB_PASSWORD}\n\
DB_NAME=${DB_NAME}\n\
DB_PORT=${DB_PORT}" > .env.production.local

# Next.js 빌드
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
