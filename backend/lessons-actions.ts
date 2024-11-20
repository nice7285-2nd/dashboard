'use server';

import { z } from 'zod';
import { pool } from './db';
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
  const validatedFields = CreateLessonSchema.safeParse({
    id: formData.get('id'),
    author: formData.get('author'),
    title: formData.get('title'),
    path: formData.get('path'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields.',
    };
  }

  const { id, author, title, path } = validatedFields.data;
  console.log(id, author, title, path);

  try {
    await pool.query(
      'INSERT INTO lessons (id, author, title, path) VALUES ($1, $2, $3, $4)',
      [id, author, title, path]
    );
  } catch (error) {
    console.error('Database Error1:', error);
    return {
      message: 'Database Error1: Failed to Create Lesson.',
    };
  }

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
    await pool.query(
      'UPDATE lessons SET title = $1, path = $2 WHERE id = $3',
      [title, path, id]
    );
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
    const result = await pool.query(
      'SELECT path FROM lessons WHERE id = $1',
      [id]
    );

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

    await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
    revalidatePath('/dashboard/studyboard');
    return { message: '레슨과 관련 파일이 성공적으로 삭제되었습니다.' };
  } catch (error) {
    console.error('레슨 삭제 오류:', error);
    return { message: '데이터베이스 오류: 레슨 삭제에 실패했습니다.' };
  }
}
