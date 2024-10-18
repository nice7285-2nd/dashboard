import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json();

    // SQL 쿼리를 사용하여 사용자 역할 업데이트
    const result = await sql`
      UPDATE users
      SET role = ${role}
      WHERE email = ${email}
      RETURNING *
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const updatedUser = result.rows[0];
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: '사용자 정보 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
