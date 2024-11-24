import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// PrismaClient 인스턴스 관리
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 });
  }

  try {
    const updatedRecord = await prisma.studyreclist.update({
      where: {
        id: parseInt(id)
      },
      data: {
        views: {
          increment: 1
        }
      }
    });
    
    return NextResponse.json({ message: '조회수가 업데이트되었습니다', record: updatedRecord });
  } catch (error) {
    console.error('조회수 업데이트 중 오류 발생:', error);
    return NextResponse.json({ error: '조회수 업데이트에 실패했습니다' }, { status: 500 });
  }
}
