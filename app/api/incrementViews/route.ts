import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 });
  }

  try {
    await sql`UPDATE studyreclist SET views = views + 1 WHERE id = ${id}`;
    return NextResponse.json({ message: '조회수가 업데이트되었습니다' });
  } catch (error) {
    console.error('조회수 업데이트 중 오류 발생:', error);
    return NextResponse.json({ error: '조회수 업데이트에 실패했습니다' }, { status: 500 });
  }
}
