'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import path from 'path';
import fs from 'fs/promises';

const CreateLessonSchema = z.object({
  id: z.string().optional(),
  author: z.string().optional(),
  title: z.string().nonempty({ message: 'Please enter a project name.' }),
  path: z.string().optional(),
});

export type LessonState = {
  errors?: {
    id?: string[];
    author?: string[];
    title?: string[]; 
    path?: string[];
  };
  message?: string | undefined;
};

export async function createLesson(prevState: LessonState, formData: FormData) {

  // 폼 데이터 유효성 검사
  const validatedFields = CreateLessonSchema.safeParse({
    id: formData.get('id'),
    author: formData.get('author'),
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

  const { id, author, title, path } = validatedFields.data;
  console.log(id, author, title, path);

  // 현재 날짜를 created_at 값으로 사용 (시간 정보 제외)
  // const created_at = new Date().toISOString().split('T')[0];

  // 데이터베이스에 데이터 삽입
  try {
    await sql`
      INSERT INTO lessons (id, author, title, path)
      VALUES (${id}, ${author}, ${title}, ${path})
    `;
  } catch (error) {
    console.error('Database Error1:', error);
    return {
      message: 'Database Error1: Failed to Create Lesson.',
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
    // 먼저 레슨 정보를 가져옵니다.
    const result = await sql`
      SELECT path FROM lessons WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return { message: 'Lesson not found.' };
    }

    const lessonPath = result.rows[0].path;

    // 파일이 존재하면 삭제합니다.
    if (lessonPath) {
      const fullPath = path.join(process.cwd(), 'public', lessonPath);
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        console.error('File deletion error:', error);
        // 파일 삭제 실패를 로그로 남기지만, 프로세스는 계속 진행합니다.
      }
    }

    // 데이터베이스에서 레슨을 삭제합니다.
    await sql`DELETE FROM lessons WHERE id = ${id}`;

    revalidatePath('/dashboard/studyboard');
    return { message: 'Lesson and associated file deleted successfully.' };
  } catch (error) {
    console.error('Lesson deletion error:', error);
    return { message: 'Database Error: Failed to Delete Lesson.' };
  }
}
