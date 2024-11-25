import { Pool } from 'pg';

if (!process.env.DATABASE_HOST || 
    !process.env.DATABASE_USER || 
    !process.env.DATABASE_PASSWORD || 
    !process.env.DATABASE_NAME) {
  throw new Error('Database credentials not properly configured in environment variables.');
}

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

export { pool };
