import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export async function POST(request: NextRequest) {

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;
    const outputPath = formData.get('outputPath') as string;

    if (!file) {
      throw new Error('파일이 없습니다.');
    }

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    
    // WebM을 MP4로 변환하고 코덱 설정
    const options = {
      video: {
        codec: 'h264',
        width: 1280,  // 원하는 해상도
        height: 720,
        bitrate: 2500000,  // 2.5 Mbps
      },
      audio: {
        codec: 'aac',
        sampleRate: 44100,
        bitrate: 128000,  // 128 kbps
      }
    };

    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: outputPath.startsWith('/') ? outputPath.slice(1) : outputPath,
        Body: file,
        ContentType: 'video/mp4',
        ContentEncoding: 'h264',  // 비디오 코덱 명시
        Metadata: {
          'video-codec': 'h264',
          'audio-codec': 'aac'
        }
      },
      queueSize: 1,
      partSize: 5 * 1024 * 1024,
    });

    await upload.done();

    return NextResponse.json(
      { success: true, message: '파일이 성공적으로 업로드되었습니다.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Upload failed',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
