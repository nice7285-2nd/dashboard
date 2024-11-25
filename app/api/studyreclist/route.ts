import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const revalidate = 0;

export async function GET() {
  try {
    const result = await prisma.studyreclist.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study recommendations.' },
      { status: 500 }
    );
  }
}
