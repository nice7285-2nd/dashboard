import { sql } from '@vercel/postgres';
import { ProjectTable, } from '@/types/definitions';
import { unstable_noStore as noStore } from 'next/cache';

const PROJECTS_PER_PAGE = 6;

export async function fetchFilteredProjectsSimple(
  query: string,
  currentPage: number,
  email: string,
) {
  noStore();

  const offset = (currentPage - 1) * PROJECTS_PER_PAGE;

  try {
    const projects = await sql<ProjectTable>`
      SELECT
        projects.id,
        projects.name,
        projects.website_url
      FROM projects
      WHERE
        projects.name ILIKE ${`%${query}%`} AND
        user_email = ${email}
      ORDER BY projects.name DESC
      LIMIT ${PROJECTS_PER_PAGE} OFFSET ${offset}
    `;
    return projects.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch project metrics.');
  }
}

export async function fetchProjectById(id: string) {
  noStore();

  try {
    const data = await sql<ProjectTable>`
      SELECT
        projects.id,
        projects.name,
        projects.website_url
      FROM projects
      WHERE projects.id = ${id};
    `;

    const project = data.rows.map((project) => ({
      ...project
    }));

    // console.log(project[0]);
    return project[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchProjectsPages(query: string, email: string) {
  noStore();

  try {
    const count = await sql`SELECT COUNT(*)
    FROM projects
    WHERE
      (projects.name ILIKE ${`%${query}%`} OR
      projects.website_url ILIKE ${`%${query}%`}) AND
      projects.user_email = ${email}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / PROJECTS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of projects.');
  }
}





// export async function fetchOverviewData(email: string,) {
//   noStore();

//   try {
//     // You can probably combine these into a single SQL query
//     // However, we are intentionally splitting them to demonstrate
//     // how to initialize multiple queries in parallel with JS.
//     const projectCountPromise = sql`SELECT COUNT(*) 
//         FROM projects 
//         WHERE projects.user_email = ${email}; `;

//     const pageCountPromise = sql`SELECT COUNT(DISTINCT pathname) 
//         FROM metrics 
//         WHERE user_email = ${email}
//         AND date > NOW() - INTERVAL '24 hours'; `;

//     const collectCountPromise = sql`SELECT COUNT(*) FROM metrics WHERE date > NOW() - INTERVAL '24 hours';`;

//     const data = await Promise.all([
//       projectCountPromise,
//       pageCountPromise,
//       collectCountPromise,
//     ]);

//     const numberOfProjects = Number(data[0].rows[0].count ?? '0').toLocaleString();
//     const numberOfPages = Number(data[1].rows[0].count ?? '0').toLocaleString();
//     const numberOfCollections = Number(data[2].rows[0].count ?? '0').toLocaleString();

//     return {
//       numberOfProjects,
//       numberOfPages,
//       numberOfCollections,
//     };
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch card data.');
//   }
// }

// export async function fetchTopPathnames(email: string, metric: string, project: string | null) {
//   try {
//     const data = await sql`
//       SELECT
//         sub.pathname AS name,
//         sub.max_value AS value
//       FROM (
//         SELECT
//           metrics.pathname,
//           MAX(metrics.value) AS max_value
//         FROM metrics
//         WHERE
//           metrics.user_email = ${email} AND
//           metrics.metric = ${metric} AND
//           metrics.project = ${project} AND
//           metrics.date > NOW() - INTERVAL '24 hours'
//         GROUP BY metrics.pathname
//       ) AS sub
//       ORDER BY sub.max_value DESC
//       LIMIT 5
//     `;

//     const barData = data.rows.map(row => ({
//       name: row.name,
//       value: row.value
//     }));

//     return barData;
//   } catch (error) {
//     console.error('Database error:', error);
//     throw new Error('Failed to fetch top pathnames data.');
//   }
// }



// export async function fetchMetricsData(email: string, metric: string, project: string | null) {
//   noStore();

//   try {
//     const data = project ? await sql`
//       SELECT
//         to_char(metrics.date + INTERVAL '9 hours', 'DD일 HH24:MI') AS "Date",
//         metrics.value AS "Value"
//       FROM metrics
//       WHERE
//         metrics.user_email = ${email} AND
//         metrics.metric = ${metric} AND
//         metrics.date > NOW() - INTERVAL '24 hours' AND
//         metrics.project = ${project}
//       ORDER BY metrics.date
//     `: await sql`
//       SELECT
//         to_char(metrics.date + INTERVAL '9 hours', 'DD일 HH24:MI') AS "Date",
//         metrics.value AS "Value"
//       FROM metrics
//       WHERE
//         metrics.user_email = ${email} AND
//         metrics.metric = ${metric} AND
//         metrics.date > NOW() - INTERVAL '24 hours'
//       ORDER BY metrics.date
//     `;

//     return data.rows;
//   } catch (error) {
//     console.error('Database Error:', error);
//     // return null
//     throw new Error('Failed to fetch metrics data.');
//   }
// }

// export async function fetchProjectByName(name: string) {
//   noStore();

//   try {
//     const data = await sql<ProjectForm>`
//       SELECT
//         projects.id,
//         projects.name,
//         projects.website_url
//       FROM projects
//       WHERE projects.name = ${name};
//     `;

//     const project = data.rows.map((project) => ({
//       ...project
//     }));

//     // console.log(project[0]);
//     return project[0];
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch invoice.');
//   }
// }
