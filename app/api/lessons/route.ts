import { pool } from '@/backend/db';
import { NextResponse } from 'next/server';

type LessonsTable = {
  id: string;
  author: string;
  title: string;
  path: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    const result = await pool.query<LessonsTable>(`
      SELECT
        id,
        author,
        title,
        path
      FROM lessons
      WHERE id = $1
    `, [id]);

    // rows 배열을 반환
    return NextResponse.json({
      rows: result.rows,
      rowCount: result.rowCount
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons.' },
      { status: 500 }
    );
  }
}
