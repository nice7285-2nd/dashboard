import { NextResponse } from 'next/server';
import { pool } from '@/backend/db';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const videoUrl = searchParams.get('videoUrl');

    if (!id || !videoUrl) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' }, 
        { status: 400 }
      );
    }

    // S3에서 파일 삭제
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: videoUrl,
      });
      await s3Client.send(deleteCommand);
    } catch (s3Error) {
      // S3 삭제 실패해도 DB에서는 삭제 진행
    }

    // Vercel Postgres의 sql`` 대신 pool.query 사용
    await pool.query('DELETE FROM studyreclist WHERE id = $1', [id]);

    return NextResponse.json({ 
      message: '비디오가 성공적으로 삭제되었습니다.',
      id: id 
    });
  } catch (error) {
    console.error('삭제 중 에러 발생:', error);
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다.' }, 
      { status: 500 }
    );
  }
}
