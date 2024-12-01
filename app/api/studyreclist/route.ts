import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const revalidate = 0;

export async function GET() {
  try {
    const studyrecs = await prisma.studyreclist.findMany({
      include: {
        user: {
          select: {
            profileImageUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log("studyrecs", studyrecs);  // 데이터 확인용

    const flattenedResult = studyrecs.map(studyrec => ({
      ...studyrec,
      id: studyrec.id.toString(),
      user: studyrec.user ? {
        ...studyrec.user,
        profileImageUrl: studyrec.user.profileImageUrl || null
      } : undefined
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
