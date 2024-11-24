'use server'

import { z } from 'zod';
import { pool } from '@/backend/db';
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

export async function createLesson(formData: FormData) {
  const { author, email, title, path, created_at } = FormSchema.parse({
    title: formData.get('title'),
    path: formData.get('path'),
    author: formData.get('author'),
    email: formData.get('email'),
    created_at: formData.get('created_at'),
  });

  try {
    await pool.query(
      `INSERT INTO lessons (title, path, author, email, created_at)
       VALUES ($1, $2, $3, $4, $5::timestamp)`,
      [title, path, author, email, created_at]
    );
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
    await pool.query(
      `INSERT INTO studyRecList (title, path, author, email)
       VALUES ($1, $2, $3, $4)`,
      [title, path, author, email]
    );
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create StudyRec.',
    };
  }

  revalidatePath('/dashboard/studyRec');
  return { message: 'Created StudyRec.' };
}
