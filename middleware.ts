import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.pdf$|.*\\.doc$|.*\\.docx$|.*\\.xls$|.*\\.xlsx$|.*\\.zip$|.*\\.pptx$|.*\\.webm$|.*\\.json$).*)',
  ],
};
