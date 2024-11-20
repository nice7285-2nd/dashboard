'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { pool } from './db';
import type { User } from '@/types/definitions';
import { unstable_noStore as noStore } from 'next/cache';

export async function getUser(email: string): Promise<User | undefined> {
  try {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

const EmailSchema = z.string().email({ message: 'Invalid email address.' });
const PasswordSchema = z
  .string()
  .min(6, { message: 'Password must be at least 6 characters long.' });
const NameSchema = z.string().min(1, { message: 'Name cannot be empty.' });

export async function signUp(
  prevState: string | undefined,
  formData: FormData
) {
  const emailValidation = EmailSchema.safeParse(formData.get('email'));
  const passwordValidation = PasswordSchema.safeParse(formData.get('password'));
  const nameValidation = NameSchema.safeParse(formData.get('name'));

  if (!emailValidation.success) return emailValidation.error.message;
  if (!passwordValidation.success) return passwordValidation.error.message;
  if (!nameValidation.success) return nameValidation.error.message;

  const email = emailValidation.data;
  const password = passwordValidation.data;
  const name = nameValidation.data;
  const authKey = uuidv4();

  try {
    // 이메일 중복 검사
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (existingUser?.rows?.length > 0) {
      return 'Email already exists.';
    }

    // 비밀번호 해싱 및 사용자 추가
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, role, password, auth_key) VALUES ($1, $2, $3, $4, $5)',
      [name, email, 'manager', hashedPassword, authKey]
    );
  } catch (error) {
    console.error('Database error:', error);
    return 'Failed to create user.';
  }

  revalidatePath('/login');
  redirect(`/login?signup=success&email=${email}`);
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
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
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    return { message: 'Deleted User.' };
  } catch (error) {
    console.error('Database error:', error);
    return { message: 'Database Error: Failed to Delete User.' };
  }
}

export async function fetchLoggedInUser(email: string) {
  noStore();

  try {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

import { signOut } from '@/auth';

export async function performLogout() {
  'use server';
  try {
    await signOut();
    console.log('Successfully logged out');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}
