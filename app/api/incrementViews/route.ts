import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// PrismaClient 초기화를 함수로 분리
function getPrismaClient() {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  return client;
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 });
  }

  const prisma = getPrismaClient();

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
  } finally {
    await prisma.$disconnect();
  }
}
