import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

type LessonsTable = {
  id: string;
  name: string;
  path: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    const result = await sql<LessonsTable>`
      SELECT
        id,
        name,
        path
      FROM lessons
      WHERE id = ${id};
    `;
    // NextResponse.json()을 사용하여 결과를 JSON 형식으로 반환합니다.
    return NextResponse.json(result);
  } catch (error) {
    console.error('Database Error:', error);
    // 오류 발생 시 500 상태 코드와 함께 오류 메시지를 반환합니다.
    return NextResponse.json(
      { error: 'Failed to fetch lessons.' },
      { status: 500 }
    );
  }
}
