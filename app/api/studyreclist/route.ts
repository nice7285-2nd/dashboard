import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const revalidate = 0; // 이 줄을 추가합니다

type StudyRecListTable = {
  id: string;
  name: string;
  website_url: string;
};

export async function GET() {
  try {
    const result = await sql<StudyRecListTable>`
    SELECT * FROM studyreclist
    `;
    // NextResponse.json()을 사용하여 결과를 JSON 형식으로 반환합니다.
    return NextResponse.json(result);
  } catch (error) {
    console.error('Database Error:', error);
    // 오류 발생 시 500 상태 코드와 함께 오류 메시지를 반환합니다.
    return NextResponse.json(
      { error: 'Failed to fetch study recommendations.' },
      { status: 500 }
    );
  }
}