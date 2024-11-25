'use server'

import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const FormSchema = z.object({
  title: z.string(),
  path: z.string(),
  author: z.string(),
  email: z.string(),
  created_at: z.string(),
});

const StudyRecSchema = z.object({
  title: z.string(),
  path: z.string(),
  author: z.string(),
  email: z.string(),
});

const prisma = new PrismaClient();

export async function createLesson(formData: FormData) {
  const { author, email, title, path, created_at } = FormSchema.parse({
    title: formData.get('title'),
    path: formData.get('path'),
    author: formData.get('author'),
    email: formData.get('email'),
    created_at: formData.get('created_at'),
  });

  try {
    await prisma.lesson.create({
      data: {
        title,
        path,
        author,
        email,
        createdAt: new Date(created_at),
      },
    });
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Lesson.',
    };
  }

  revalidatePath('/dashboard/lessons');
  return { message: 'Created Lesson.' };
}

export async function createStudyRec(formData: FormData) {
  const { title, path, author, email } = StudyRecSchema.parse({
    title: formData.get('title'),
    path: formData.get('path'),
    author: formData.get('author'),
    email: formData.get('email'),
  });

  try {
    await prisma.studyreclist.create({
      data: {
        title,
        path,
        author,
        email,
      },
    });
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create StudyRec.',
    };
  }

  revalidatePath('/dashboard/studyRec');
  return { message: 'Created StudyRec.' };
}
