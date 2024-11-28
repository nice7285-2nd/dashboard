import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const filedir = formData.get('path') as string;
  const filename = file.name;
  
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `${filedir}/${filename}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    return NextResponse.json({ 
      message: '교안 파일이 성공적으로 저장되었습니다.',
      filename,
      url: `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${s3Key}`
    });
  } catch (error) {
    console.error('파일 저장 중 오류 발생:', error);
    return NextResponse.json({ message: '교안 파일 저장에 실패했습니다.' }, { status: 500 });
  }
}
