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
ENV DATABASE_URL=$DATABASE_URL
ENV DATABASE_HOST=$DATABASE_HOST
ENV DATABASE_USER=$DATABASE_USER
ENV DATABASE_PASSWORD=$DATABASE_PASSWORD
ENV DATABASE_NAME=$DATABASE_NAME
ENV DATABASE_PORT=$DATABASE_PORT

# .env 파일 생성
RUN echo "DATABASE_URL=$DATABASE_URL" > .env && \
    echo "DATABASE_HOST=$DATABASE_HOST" >> .env && \
    echo "DATABASE_USER=$DATABASE_USER" >> .env && \
    echo "DATABASE_PASSWORD=$DATABASE_PASSWORD" >> .env && \
    echo "DATABASE_NAME=$DATABASE_NAME" >> .env && \
    echo "DATABASE_PORT=$DATABASE_PORT" >> .env && \
    echo "Created .env file with database credentials"

# .env.local 파일도 생성
RUN cp .env .env.local

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
