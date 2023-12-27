'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { sql } from '@vercel/postgres';
import type { User } from '@/types/definitions';
import { unstable_noStore as noStore } from 'next/cache';

export async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

const EmailSchema = z.string().email({ message: 'Invalid email address.' });
const PasswordSchema = z.string().min(6, { message: 'Password must be at least 6 characters long.' });
const NameSchema = z.string().min(1, { message: 'Name cannot be empty.' });

export async function signUp(prevState: string | undefined, formData: FormData) {
  // 각 필드 유효성 검사
  const emailValidation = EmailSchema.safeParse(formData.get('email'));
  const passwordValidation = PasswordSchema.safeParse(formData.get('password'));
  const nameValidation = NameSchema.safeParse(formData.get('name'));

  // 유효성 검사 실패 시 에러 메시지 반환
  if (!emailValidation.success) {
    return emailValidation.error.message;
  }
  if (!passwordValidation.success) {
    return passwordValidation.error.message;
  }
  if (!nameValidation.success) {
    return nameValidation.error.message;
  }

  const email = emailValidation.data;
  const password = passwordValidation.data;
  const name = nameValidation.data;
  const authKey = uuidv4();

  try {
    // 이메일 중복 검사
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (existingUser.rowCount > 0) {
      return 'Email already exists.';
    }

    // 비밀번호 해싱 및 사용자 추가
    const hashedPassword = await bcrypt.hash(password, 10);
    await sql`
      INSERT INTO users (name, email, password, auth_key)
      VALUES (${name}, ${email}, ${hashedPassword}, ${authKey})
    `;
    // return 'User successfully created.';
  } catch (error) {
    console.error('Database error:', error);
    return 'Failed to create user.';
  }

  revalidatePath('/login');
  redirect(`/login?signup=success&email=${email}`);
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function deleteUser(email: string) {
  console.info('deleteUser:', email);
  try {
    // 데이터베이스에서 사용자 삭제
    await sql`DELETE FROM users WHERE email = ${email}`;
    // 필요한 경우 캐시 무효화 및 추가 작업 수행

    return { message: 'Deleted User.' };
  } catch (error) {
    console.error('Database error:', error);
    return { message: 'Database Error: Failed to Delete User.' };
  }
}

export async function fetchLoggedInUser(email: string) {
  noStore();

  try {
    const user = await sql`SELECT * FROM users WHERE email = ${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

import { signOut } from '@/auth';

/**
 * 로그아웃을 수행하는 함수
 */
export async function performLogout() {
  'use server'; // Next.js 서버 사이드 코드 표시
  try {
    await signOut(); // 로그아웃 실행
    console.log('Successfully logged out');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}