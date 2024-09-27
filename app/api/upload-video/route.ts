import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const uploadDir = join(process.cwd(), 'public', 'uploads');

export async function POST(req: Request) {
  console.log('POST 요청 시작');
  try {
    await mkdir(uploadDir, { recursive: true });
    console.log('업로드 디렉토리 생성 완료:', uploadDir);

    const formData = await req.formData();
    console.log('FormData 파싱 완료');

    // FormData의 모든 키 출력
    for (const key of formData.keys()) {
      console.log('FormData 키:', key);
    }

    const file = formData.get('file') as File | null;

    if (!file) {
      console.log('파일이 없습니다.');
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    console.log('파일 정보:', file.name, file.type, file.size);

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `recording-${Date.now()}.webm`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);
    console.log('파일 저장 완료:', filepath);

    return NextResponse.json({ success: true, filepath });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json({ error: '파일 업로드 실패' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'GET 요청은 허용되지 않습니다.' },
    { status: 405 }
  );
}
