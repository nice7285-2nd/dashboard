'use server';

import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

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
    await prisma.lesson.create({
      data: {
        id: id ? parseInt(id) : undefined,
        author: author ?? '',
        title,
        path: path ?? '',
        email: '',
      },
    });
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to Create Lesson.',
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
    await prisma.lesson.update({
      where: { id: parseInt(id) },
      data: {
        title,
        path,
      },
    });
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
    const lesson = await prisma.lesson.findUnique({
      where: { id: parseInt(id) },
      select: { path: true },
    });

    if (!lesson) {
      return { message: '레슨을 찾을 수 없습니다.' };
    }

    const lessonPath = lesson.path
      ?.replace(/^\//, '')
      .replace(/\\/g, '/');

    if (lessonPath) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: lessonPath,
          })
        );
      } catch (error) {
      }
    }

    await prisma.lesson.delete({
      where: { id: parseInt(id) },
    });
    
    revalidatePath('/dashboard/studyboard');
    return { message: '레슨과 관련 파일이 성공적으로 삭제되었습니다.' };
  } catch (error) {
    console.error('레슨 삭제 오류:', error);
    return { message: '데이터베이스 오류: 레슨 삭제에 실패했습니다.' };
  }
}
