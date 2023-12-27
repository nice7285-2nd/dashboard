'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

const CreateProjectSchema = z.object({
  name: z.string().nonempty({ message: 'Please enter a project name.' }),
  website_url: z.string().optional(),
});

export type ProjectState = {
  errors?: {
    name?: string[];
    website_url?: string[];
  };
  message?: string | undefined;
};

export async function createProject(prevState: ProjectState, formData: FormData) {
  // 폼 데이터 유효성 검사
  const validatedFields = CreateProjectSchema.safeParse({
    name: formData.get('name'),
    website_url: formData.get('website_url'),
  });

  // 유효성 검사 실패 시 에러 반환
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields.',
    };
  }

  const { name, website_url } = validatedFields.data;
  const session = await auth();
  const userEmail = session?.user?.email || '';

  if (userEmail == '') {
    return {
      message: 'Non User Error: Failed to Create Project.',
    };
  }

  try {
    const existingProject = await sql`SELECT * FROM projects WHERE name = ${name}`;
    if (existingProject.rowCount > 0) {
      return { message: 'Project name already exists.' };
    }
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Project.',
    };
  }

  // 데이터베이스에 데이터 삽입
  try {
    await sql`
      INSERT INTO projects (user_email, name, website_url)
      VALUES (${userEmail}, ${name}, ${website_url})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Project.',
    };
  }

  // 성공적으로 프로젝트가 생성된 후의 처리 (예: 캐시 무효화, 페이지 리디렉션)
  revalidatePath('/dashboard/projects');
  redirect('/dashboard/projects');
}


const UpdateProjectSchema = z.object({
  name: z.string().nonempty({ message: 'Please enter a project name.' }),
  website_url: z.string().optional(),
});

export async function updateProject(
  id: string,
  prevState: ProjectState,
  formData: FormData,
) {
  const validatedFields = UpdateProjectSchema.safeParse({
    name: formData.get('name'),
    website_url: formData.get('website_url')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { name, website_url } = validatedFields.data;

  try {
    await sql`
      UPDATE projects
      SET name = ${name}, website_url = ${website_url}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Project.' };
  }

  revalidatePath('/dashboard/projects');
  redirect('/dashboard/projects');
}

export async function deleteProject(id: string) {
  try {
    await sql`DELETE FROM projects WHERE id = ${id}`;
    revalidatePath('/dashboard/projects');
    return { message: 'Deleted Project.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Project.' };
  }
}
