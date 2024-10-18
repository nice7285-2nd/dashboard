'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import path from 'path';

const CreateLessonSchema = z.object({
  title: z.string().nonempty({ message: 'Please enter a project name.' }),
  path: z.string().optional(),
});

export type LessonState = {
  errors?: {
    title?: string[];
    path?: string[];
  };
  message?: string | undefined;
};

export async function createLesson(prevState: LessonState, formData: FormData) {
  // 폼 데이터 유효성 검사
  const validatedFields = CreateLessonSchema.safeParse({
    title: formData.get('title'),
    path: formData.get('path'),
  });

  // 유효성 검사 실패 시 에러 반환
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields.',
    };
  }

  const { title, path } = validatedFields.data;
  const session = await auth();
  const userEmail = session?.user?.email || '';

  if (userEmail == '') {
    return {
      message: 'Non User Error: Failed to Create Lesson.',
    };
  }

  try {
    const existingLesson = await sql`SELECT * FROM lessons WHERE title = ${title}`;
    if (existingLesson.rowCount > 0) {
      return { message: 'Lesson name already exists.' };
    }
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Lesson.',
    };
  }
  
  // 데이터베이스에 데이터 삽입
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

  // 성공적으로 프로젝트가 생성된 후의 처리 (예: 캐시 무효화, 페이지 리디렉션)
  revalidatePath('/dashboard/studyboard');
  redirect('/dashboard/studyboard');
}


const UpdateLessonSchema = z.object({
  title: z.string().nonempty({ message: 'Please enter a lesson name.' }),
  path: z.string().optional(),
});

export async function updateLesson(
  id: string,
  prevState: LessonState,
  formData: FormData,
) {
  const validatedFields = UpdateLessonSchema.safeParse({
    title: formData.get('title'),
    path: formData.get('path')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Lesson.',
    };
  }

  const { title, path } = validatedFields.data;

  try {
    await sql`
      UPDATE lessons
      SET title = ${title}, path = ${path}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Lesson.' };
  }

  revalidatePath('/dashboard/studyboard');
  redirect('/dashboard/studyboard');
}

export async function deleteLesson(id: string) {
  try {
    await sql`DELETE FROM lessons WHERE id = ${id}`;
    revalidatePath('/dashboard/studyboard');
    return { message: 'Deleted Lesson.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Lesson.' };
  }
}
