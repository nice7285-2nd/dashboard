'use server'

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';

const FormSchema = z.object({
  name: z.string(),
  path: z.string(),
});

const StudyRecSchema = z.object({
  name: z.string(),
  path: z.string(),
});

export async function createLesson(formData: FormData) {
  const { name, path } = FormSchema.parse({
    name: formData.get('name'),
    path: formData.get('path'),
  });

  try {
    await sql`
      INSERT INTO lessons (name, path)
      VALUES (${name}, ${path})
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
  const { name, path } = StudyRecSchema.parse({
    name: formData.get('name'),
    path: formData.get('path'),
  });

  try {
    await sql`
      INSERT INTO studyRecList (name, path)
      VALUES (${name}, ${path})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create StudyRec.',
    };
  }

  revalidatePath('/dashboard/studyRec');
  return { message: 'Created StudyRec.' };
}
