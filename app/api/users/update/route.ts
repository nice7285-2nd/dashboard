import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role },
    });

    if (!updatedUser) {
      return NextResponse.json({ message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ message: '사용자 정보 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
