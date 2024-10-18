import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: Request) {
  try {
    // URL에서 id 파라미터를 추출합니다
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID가 제공되지 않았습니다.' }, { status: 400 });
    }

    // 데이터베이스에서 레코드 삭제
    const result = await sql`DELETE FROM studyreclist WHERE id = ${id}`;

    if (result.rowCount === 0) {
      return NextResponse.json({ message: '삭제할 레코드를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ message: '레코드가 성공적으로 삭제되었습니다.' }, { status: 200 });
  } catch (error) {
    console.error('삭제 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
