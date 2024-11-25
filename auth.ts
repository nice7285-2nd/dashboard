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

async function getUser(email: string) {
  try {
    console.log('사용자 조회 시도:', email);
    const user = await prisma.user.findUnique({
      where: { email }
    });
    console.log('사용자 조회 결과:', user ? '찾음' : '없음');
    return user;
  } catch (error) {
    console.error('사용자 조회 실패:', error);
    return null;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log('인증 시도 시작');
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          console.log('인증 정보 유효성 검사 통과');
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          
          if (!user) {
            console.log('사용자를 찾을 수 없음:', email);
            return null;
          }

          console.log('비밀번호 검증 시도');
          const passwordsMatch = await bcrypt.compare(password, user.password);
          console.log('비밀번호 검증 결과:', passwordsMatch ? '일치' : '불일치');

          if (passwordsMatch) {
            console.log('인증 성공:', email);
            return user;
          }
        }

        console.log('잘못된 인증 정보');
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT 콜백 - 토큰 생성');
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('세션 콜백 - 세션 생성');
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user }) {
      console.log('로그인 콜백 시작');
      if (user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAt: new Date()
            }
          });
          console.log('로그인 시간 업데이트 성공');
        } catch (error) {
          console.error('로그인 시간 업데이트 실패:', error);
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
      console.log('사용자 로그인:', user);
    },
  },
  debug: true
});
