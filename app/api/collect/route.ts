import { sql } from '@vercel/postgres';

export async function POST(request: Request) {
  const { userEmail, authKey, project, ...metric } = await request.json();

  // console.log(userEmail, metric.pathname, metric.name, metric.value, metric.rating)

  try {
    // 데이터베이스에서 사용자 조회
    const user = await sql`SELECT * FROM users WHERE email = ${userEmail} AND auth_key = ${authKey}`;

    // 사용자가 존재하고, authKey가 일치하는 경우
    if (user.rows.length > 0) {
      // 성능 지표 데이터 저장
      await sql`INSERT INTO metrics (user_email, project, pathname, metric, value) VALUES (${userEmail}, ${project}, ${metric.pathname}, ${metric.name}, ${metric.value})`;

      return new Response('Metric data saved successfully', { status: 200 });
    } else {
      return new Response('Unauthorized user', { status: 401 });
    }
  } catch (error) {
    console.error('Failed to process metric data:', error);
    return new Response('Server error', { status: 500 });
  }
}
