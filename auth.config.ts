import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard/lessons', nextUrl));
      }
      return true;
    },
  },
  providers: [], // 실제 provider는 auth.ts에서 설정됨
  trustHost: true,
  session: {
    strategy: "jwt",
    // maxAge: 30 * 24 * 60 * 60, // 30일 (초 단위)
    // 또는 더 짧게 설정할 수 있습니다:
    // maxAge: 24 * 60 * 60, // 24시간
    maxAge: 60 * 60, // 1시간
  },
} satisfies NextAuthConfig;