import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const filedir = formData.get('path') as string;
  const filename = file.name;
  const lessonsDir = path.join(process.cwd(), 'public', filedir);
  const filePath = path.join(lessonsDir, filename);

  try {
    if (!fs.existsSync(lessonsDir)) {
      fs.mkdirSync(lessonsDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return NextResponse.json({ message: '교안 파일이 성공적으로 저장되었습니다.', filename });
  } catch (error) {
    console.error('파일 저장 중 오류 발생:', error);
    return NextResponse.json({ message: '교안 파일 저장에 실패했습니다.' }, { status: 500 });
  }
}
