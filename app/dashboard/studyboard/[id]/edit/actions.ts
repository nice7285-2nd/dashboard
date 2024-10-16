'use server'

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

const FormSchema = z.object({
  title: z.string(),
  path: z.string(),
});

const StudyRecSchema = z.object({
  title: z.string(),
  path: z.string(),
});

export async function createLesson(formData: FormData) {
  const { title, path } = FormSchema.parse({
    title: formData.get('title'),
    path: formData.get('path'),
  });

  try {
    await sql`
      INSERT INTO lessons (title, path)
      VALUES (${title}, ${path})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Lesson.',
    };
  }

  revalidatePath('/dashboard/lessons');
  return { message: 'Created Lesson.' };
}

export async function createStudyRec(formData: FormData) {
  const { title, path } = StudyRecSchema.parse({
    title: formData.get('title'),
    path: formData.get('path'),
  });

  try {
    await sql`
      INSERT INTO studyRecList (title, path)
      VALUES (${title}, ${path})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create StudyRec.',
    };
  }

  revalidatePath('/dashboard/studyRec');
  return { message: 'Created StudyRec.' };
}
