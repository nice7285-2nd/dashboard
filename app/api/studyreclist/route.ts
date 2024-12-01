import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const revalidate = 0;

export async function GET() {
  try {
    const studyrecs = await prisma.studyreclist.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const flattenedResult = studyrecs.map(studyrec => ({
      ...studyrec,
      id: studyrec.id.toString(),
      profileImageUrl: '/default-profile.svg'
    }));

    return NextResponse.json(flattenedResult);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study recommendations.' },
      { status: 500 }
    );
  }
}
