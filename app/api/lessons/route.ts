import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

type LessonsTable = {
  id: number;
  email: string;
  author: string;
  title: string;
  path: string;
  views: number;
  createdAt: Date;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const prisma = getPrismaClient();

  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        id: id ? parseInt(id) : undefined
      }
    });

    return NextResponse.json({
      rows: lessons,
      rowCount: lessons.length
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
