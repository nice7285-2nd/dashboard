# 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

# 패키지 파일만 먼저 복사하고 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# 실행 스테이지
FROM node:18-alpine AS runner

WORKDIR /app

# 필요한 파일만 복사
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 환경변수 설정
ARG NEXT_PUBLIC_AWS_REGION
ARG NEXT_PUBLIC_AWS_BUCKET_NAME
ARG AWS_REGION
ARG AWS_BUCKET_NAME

ENV NEXT_PUBLIC_AWS_REGION=${NEXT_PUBLIC_AWS_REGION}
ENV NEXT_PUBLIC_AWS_BUCKET_NAME=${NEXT_PUBLIC_AWS_BUCKET_NAME}
ENV AWS_REGION=${AWS_REGION}
ENV AWS_BUCKET_NAME=${AWS_BUCKET_NAME}

EXPOSE 3000

CMD ["node", "server.js"]
