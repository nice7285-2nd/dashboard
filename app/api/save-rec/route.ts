import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const filePath = formData.get('path') as string;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const studyRecDir = path.join(process.cwd(), 'public', 'studyRec');
  if (!fs.existsSync(studyRecDir)) {
    fs.mkdirSync(studyRecDir, { recursive: true });
  }

  const fullPath = path.join(process.cwd(), 'public', filePath);

  try {
    fs.writeFileSync(fullPath, buffer);
    return NextResponse.json({ message: '녹화 파일이 성공적으로 저장되었습니다.' });
  } catch (error) {
    console.error('파일 저장 중 오류 발생:', error);
    return NextResponse.json({ message: '녹화 파일 저장에 실패했습니다.' }, { status: 500 });
  }
}
