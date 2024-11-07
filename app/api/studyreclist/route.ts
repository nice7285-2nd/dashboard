import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const revalidate = 0; // 이 줄을 추가합니다

type StudyRecListTable = {
  id: string;
  title: string;
  path: string;
  author: string;
  email: string;
  views: number;
  profile_image_url: string;
};

export async function GET() {
  try {
    const result = await sql<StudyRecListTable>`
      SELECT 
        s.*,
        u.profile_image_url
      FROM studyreclist s
      LEFT JOIN users u ON s.email = u.email
      ORDER BY s.created_at DESC
    `;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study recommendations.' },
      { status: 500 }
    );
  }
}
