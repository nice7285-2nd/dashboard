import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 현재 호스트와 프로토콜 가져오기
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  
  // NEXTAUTH_URL을 동적으로 설정
  process.env.NEXTAUTH_URL = `${protocol}://${host}`
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|uploads|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.svg$|.*\\.pdf$|.*\\.doc$|.*\\.docx$|.*\\.xls$|.*\\.xlsx$|.*\\.zip$|.*\\.pptx$|.*\\.webm$|.*\\.mp4$|.*\\.json$).*)',
  ],
};
