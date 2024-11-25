import { PrismaClient } from '@prisma/client';
import { unstable_noStore as noStore } from 'next/cache';

const prisma = new PrismaClient();
const USERS_PER_PAGE = 12;

export async function fetchFilteredUsers(
  query: string,
  currentPage: number,
  email: string,
) {   
  noStore();
  const offset = (currentPage - 1) * USERS_PER_PAGE;

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        loginAt: true,
        profileImageUrl: true
      },
      orderBy: {
        loginAt: 'desc'
      },
      take: USERS_PER_PAGE,
      skip: offset
    });
    return users;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch users.');
  }
}

export async function fetchUserById(id: string) {
  noStore();

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        loginAt: true,
        profileImageUrl: true
      }
    });

    return user;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch account.');
  }
}

export async function fetchUsersPages(query: string, email: string) {
  noStore();

  try {
    const count = await prisma.user.count({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      }
    });

    const totalPages = Math.ceil(count / USERS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of accounts.');
  }
}
