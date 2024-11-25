import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const email = formData.get('email') as string;

    if (!file || !email) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검사
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검사
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 파일 이름 생성
    const fileType = file.type.split('/')[1];
    const fileName = `${email}-${Date.now()}.${fileType}`;
    const filePath = `profiles/${fileName}`;

    // 파일을 Buffer로 변환
    const buffer = Buffer.from(await file.arrayBuffer());

    // S3에 업로드
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // S3 URL 생성
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;

    // DB 업데이트 (Prisma 사용)
    await prisma.user.update({
      where: { email: email },
      data: { profileImageUrl: imageUrl }
    });

    return NextResponse.json({ 
      success: true, 
      url: imageUrl 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '이미지 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
} 