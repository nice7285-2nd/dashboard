import { Pool } from 'pg';

if (!process.env.DB_HOST || 
    !process.env.DB_USER || 
    !process.env.DB_PASSWORD || 
    !process.env.DB_NAME) {
  throw new Error('Database credentials not properly configured in environment variables.');
}

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

export { pool };
