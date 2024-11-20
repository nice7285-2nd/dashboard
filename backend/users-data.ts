import { pool } from './db';
import { UsersTable } from '@/types/definitions';
import { unstable_noStore as noStore } from 'next/cache';

const USERS_PER_PAGE = 12;

export async function fetchFilteredUsers(
  query: string,
  currentPage: number,
  email: string,
) {   
  noStore();
  const offset = (currentPage - 1) * USERS_PER_PAGE;

  try {
    const users = await pool.query<UsersTable>(
      `SELECT
        id,
        name,
        email,
        role,
        created_at,
        login_at,
        profile_image_url
      FROM users
      WHERE
        name ILIKE $1 OR
        email ILIKE $1
      ORDER BY login_at DESC
      LIMIT $2 OFFSET $3`,
      [`%${query}%`, USERS_PER_PAGE, offset]
    );
    return users.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch users.');
  }
}

export async function fetchUserById(id: string) {
  noStore();

  try {
    const data = await pool.query<UsersTable>(
      `SELECT
        id,
        name,
        path
      FROM users
      WHERE id = $1`,
      [id]
    );

    if (data.rows.length === 0) {
      return null;
    }

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch account.');
  }
}

export async function fetchUsersPages(query: string, email: string) {
  noStore();

  try {
    const count = await pool.query(
      `SELECT COUNT(*)
      FROM users
      WHERE
        name ILIKE $1 OR
        email ILIKE $1`,
      [`%${query}%`]
    );

    const totalPages = Math.ceil(Number(count.rows[0].count) / USERS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of accounts.');
  }
}
