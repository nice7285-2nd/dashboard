import { pool } from './db';
import { LessonsTable } from '@/types/definitions';
import { unstable_noStore as noStore } from 'next/cache';

const LESSONS_PER_PAGE = 12;

export async function fetchFilteredLessons(
  query: string,
  currentPage: number,
) {
  noStore();
  const offset = (currentPage - 1) * LESSONS_PER_PAGE;

  try {
    const result = await pool.query(`
      SELECT 
        l.*,
        u.profile_image_url
      FROM lessons l
      LEFT JOIN users u ON l.email = u.email
      WHERE
        l.title ILIKE $1 OR
        l.author ILIKE $1
      ORDER BY l.created_at DESC
      LIMIT $2 OFFSET $3
    `, [`%${query}%`, LESSONS_PER_PAGE, offset]);
    
    return result.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch lessons.');
  }
}

export async function fetchLessonById(id: string) {
  noStore();

  try {
    const result = await pool.query<LessonsTable>(`
      SELECT
        id,
        title,
        author,
        created_at,
        path
      FROM lessons
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch lesson.');
  }
}

export async function fetchLessonsPages(query: string) {
  noStore();

  try {
    const result = await pool.query(`
      SELECT COUNT(*)
      FROM lessons
      WHERE
        (lessons.title ILIKE $1 OR
        lessons.path ILIKE $1)
    `, [`%${query}%`]);

    const totalPages = Math.ceil(Number(result.rows[0].count) / LESSONS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of lessons.');
  }
}
