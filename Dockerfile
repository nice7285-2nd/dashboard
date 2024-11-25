FROM node:18-alpine

WORKDIR /app

# 환경 변수 정의
ARG DATABASE_URL
ARG DATABASE_HOST
ARG DATABASE_USER
ARG DATABASE_PASSWORD
ARG DATABASE_NAME
ARG DATABASE_PORT

# 디버깅을 위한 환경 변수 출력
RUN echo "Checking build args..."
RUN echo "DATABASE_URL: ${DATABASE_URL:-not set}"
RUN echo "DATABASE_HOST: ${DATABASE_HOST:-not set}"
RUN echo "DATABASE_USER: ${DATABASE_USER:-not set}"
RUN echo "DATABASE_PASSWORD: ${DATABASE_PASSWORD:-not set}"
RUN echo "DATABASE_NAME: ${DATABASE_NAME:-not set}"
RUN echo "DATABASE_PORT: ${DATABASE_PORT:-not set}"

# 환경 변수 설정
ENV DATABASE_URL=${DATABASE_URL}
ENV DATABASE_HOST=${DATABASE_HOST}
ENV DATABASE_USER=${DATABASE_USER}
ENV DATABASE_PASSWORD=${DATABASE_PASSWORD}
ENV DATABASE_NAME=${DATABASE_NAME}
ENV DATABASE_PORT=${DATABASE_PORT}

# .env 파일 생성 (따옴표 추가)
RUN printf "DATABASE_URL=\"${DATABASE_URL}\"\n\
DATABASE_HOST=\"${DATABASE_HOST}\"\n\
DATABASE_USER=\"${DATABASE_USER}\"\n\
DATABASE_PASSWORD=\"${DATABASE_PASSWORD}\"\n\
DATABASE_NAME=\"${DATABASE_NAME}\"\n\
DATABASE_PORT=\"${DATABASE_PORT}\"\n" > .env

# 생성된 .env 파일 확인
RUN cat .env

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
