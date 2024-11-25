FROM node:18-alpine

WORKDIR /app

# 환경 변수 설정
ENV DATABASE_URL="postgresql://postgres:Sj2497%21%21@fsbone-ft.c1eew0mcaf28.ap-northeast-2.rds.amazonaws.com:5432/postgres"

# 필요한 시스템 패키지 설치 (canvas 관련 패키지 포함)
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
