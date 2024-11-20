import { NextResponse } from 'next/server';
import { pool } from '@/backend/db';

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json();

    const result = await pool.query(
      `UPDATE users
       SET role = $1
       WHERE email = $2
       RETURNING *`,
      [role, email]
    );

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
