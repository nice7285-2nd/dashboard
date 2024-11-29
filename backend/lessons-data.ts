import { PrismaClient } from '@prisma/client';
import { LessonsTable } from '@/types/definitions';
import { unstable_noStore as noStore } from 'next/cache';

const LESSONS_PER_PAGE = 12;

const prisma = new PrismaClient();

export async function fetchFilteredLessons(
  query: string,
  currentPage: number,
) {
  noStore();
  const offset = (currentPage - 1) * LESSONS_PER_PAGE;

  try {
    const lessons = await prisma.lesson.findMany({
      take: LESSONS_PER_PAGE,
      skip: offset,
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } }
        ]
      },
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

    console.log("lessons", lessons);

    return lessons.map(lesson => ({
      ...lesson,
      id: lesson.id.toString(),
      user: lesson.user ? {
        ...lesson.user,
        profileImageUrl: lesson.user.profileImageUrl || null
      } : undefined
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch lessons.');
  }
}

export async function fetchLessonById(id: string) {
  noStore();

  try {
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: parseInt(id)
      },
      select: {
        id: true,
        title: true,
        author: true,
        createdAt: true,
        path: true
      }
    });

    return lesson;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch lesson.');
  }
}

export async function fetchLessonsPages(query: string) {
  noStore();

  try {
    const count = await prisma.lesson.count({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { path: { contains: query, mode: 'insensitive' } }
        ]
      }
    });

    const totalPages = Math.ceil(count / LESSONS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of lessons.');
  }
}
