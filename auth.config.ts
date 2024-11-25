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
  secret: process.env.NEXTAUTH_SECRET,
  basePath: "/api/auth",
  url: "https://www.fsbone.com",
  debug: true,
  allowedHosts: ["www.fsbone.com", "192.168.130.85"],
};