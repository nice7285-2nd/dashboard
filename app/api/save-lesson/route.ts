import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const data = await request.json();
  const { filedir, filename } = data;
  const lessonsDir = path.join(process.cwd(), 'public', filedir);
  const filePath = path.join(lessonsDir, filename);

  try { 
    if (!fs.existsSync(lessonsDir)) {
      fs.mkdirSync(lessonsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(data));
    return NextResponse.json({ message: '교안 파일이 성공적으로 저장되었습니다.', filename });
  } catch (error) {
    console.error('파일 저장 중 오류 발생:', error);
    return NextResponse.json({ message: '교안 파일 저장에 실패했습니다.' }, { status: 500 });
  }
}
