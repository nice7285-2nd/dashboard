import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { User } from 'next-auth';

const prisma = new PrismaClient();

declare module 'next-auth' {
  interface User {
    role?: string;
  }
}

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
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
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        console.log('잘못된 인증 정보');
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user }) {
      if (user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAt: new Date()
            }
          });
        } catch (error) {
          console.error('로그인 시간 업데이트 실패:', error);
          // 로그인 자체는 실패하지 않도록 합니다.
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
});