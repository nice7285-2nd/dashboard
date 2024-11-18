'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function deleteLesson(id: string) {
  try {
    const result = await sql`
      SELECT path FROM lessons WHERE id = ${id}
    `;

    if (result.rows.length === 0) {
      return { message: '레슨을 찾을 수 없습니다.' };
    }

    const lessonPath = result.rows[0].path
      .replace(/^\//, '')
      .replace(/\\/g, '/');

    if (lessonPath) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: lessonPath,
          })
        );
        console.log('S3 파일 삭제 성공:', lessonPath);
      } catch (error) {
        console.error('S3 파일 삭제 오류:', error);
      }
    }

    await sql`DELETE FROM lessons WHERE id = ${id}`;
    revalidatePath('/dashboard/studyboard');
    return { message: '레슨과 관련 파일이 성공적으로 삭제되었습니다.' };
  } catch (error) {
    console.error('레슨 삭제 오류:', error);
    return { message: '데이터베이스 오류: 레슨 삭제에 실패했습니다.' };
  }
}
