import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const outputPath = formData.get('outputPath') as string;
    
    // 임시 디렉토리 경로 설정
    const tempDir = join(process.cwd(), 'public/temp');
    const outputDir = join(process.cwd(), 'public/studyRec');
    
    // 디렉토리가 없으면 생성
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // 임시 WebM 파일 저장
    const tempWebmPath = join(tempDir, `${Date.now()}.webm`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempWebmPath, buffer);

    // MP4로 변환
    const outputFilePath = join(process.cwd(), 'public', outputPath);
    
    await execAsync(`ffmpeg -i ${tempWebmPath} -c:v libx264 -c:a aac -strict experimental ${outputFilePath}`);

    // 임시 파일 삭제
    await unlink(tempWebmPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving recording:', error);
    return NextResponse.json(
      { error: 'Failed to save recording' },
      { status: 500 }
    );
  }
}
