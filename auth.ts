import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { User } from 'next-auth';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});

declare module 'next-auth' {
  interface User {
    role?: string;
  }
}

// 로깅 함수 추가
const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      data: args,
      timestamp: new Date().toISOString(),
      service: 'auth'
    }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      service: 'auth'
    }));
  }
};

async function getUser(email: string) {
  try {
    logger.info('사용자 조회 시도', { email });
    const user = await prisma.user.findUnique({
      where: { email }
    });
    logger.info('사용자 조회 결과', { email, found: !!user });
    return user;
  } catch (error) {
    logger.error('사용자 조회 실패', error);
    return null;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        logger.info('인증 시도 시작', { email: credentials?.email });
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          logger.info('인증 정보 유효성 검사 통과');
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          
          if (!user) {
            logger.info('사용자를 찾을 수 없음', { email });
            return null;
          }

          logger.info('비밀번호 검증 시도');
          const passwordsMatch = await bcrypt.compare(password, user.password);
          logger.info('비밀번호 검증 결과', { passwordsMatch });

          if (passwordsMatch) {
            logger.info('인증 성공', { email });
            return user;
          }
        }

        logger.info('잘못된 인증 정보');
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      logger.info('JWT 콜백 - 토큰 생성');
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      logger.info('세션 콜백 - 세션 생성');
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user }) {
      logger.info('로그인 콜백 시작');
      if (user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAt: new Date()
            }
          });
          logger.info('로그인 시간 업데이트 성공');
        } catch (error) {
          logger.error('로그인 시간 업데이트 실패', error);
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
  events: {
    async signIn({ user }) {
      logger.info('사용자 로그인', { user });
    },
  },
  debug: true
});
