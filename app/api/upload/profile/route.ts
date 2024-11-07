import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { sql } from '@vercel/postgres';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'profile');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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

    // 업로드 디렉토리 생성
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 파일 이름 생성
    const fileType = file.type.split('/')[1];
    const fileName = `${email}-${Date.now()}.${fileType}`;
    
    // 실제 파일이 저장될 전체 경로
    const filePath = join(UPLOAD_DIR, fileName);
    
    // 파일 저장
    await writeFile(filePath, buffer);
    
    // DB에 저장될 URL 경로 (public 폴더 기준 상대 경로)
    const imageUrl = `/uploads/profile/${fileName}`;  // public 폴더는 자동으로 루트 경로로 처리됨

    // DB 업데이트
    await sql`
      UPDATE users 
      SET profile_image_url = ${imageUrl}
      WHERE email = ${email}
    `;

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