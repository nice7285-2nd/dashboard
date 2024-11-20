import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { getUser } from '@/backend/account-actions';
import { User } from 'next-auth';
import { pool } from '@/backend/db';

declare module 'next-auth' {
  interface User {
    role?: string;
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
          await pool.query(
            `UPDATE users
             SET login_at = $1
             WHERE id = $2`,
            [new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"}), user.id]
          );
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
