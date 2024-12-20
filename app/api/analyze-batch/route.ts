import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();
const s3Client = new S3Client({ region: process.env.AWS_REGION });

export async function POST() {
  try {
    // 1. 미분석 교안 조회
    const unanalyzedLessons = await prisma.lesson.findMany({
      where: {
        analysis: 'N'
      },
      take: 10  // 한 번에 처리할 수량 제한
    });

    console.log(`Found ${unanalyzedLessons.length} unanalyzed lessons`);

    for (const lesson of unanalyzedLessons) {
      try {
        // 2. S3에서 교안 파일 읽기
        const getCommand = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME as string,
          Key: lesson.path.startsWith('/') ? lesson.path.slice(1) : lesson.path  // 앞의 '/' 제거
        });
        
        const response = await s3Client.send(getCommand);
        const content = await response.Body?.transformToString();
        
        if (!content) {
          console.error(`Empty content for lesson ${lesson.id}, path: ${lesson.path}`);
          continue;
        }

        const lessonData = JSON.parse(content);
        
        // 3. 패턴 분석 및 저장
        for (const node of lessonData.nodes) {
          if (node.text1 && node.text2) {
            await prisma.nodePattern.upsert({
              where: {
                text1_text2: {
                  text1: node.text1,
                  text2: node.text2
                }
              },
              update: {
                frequency: { increment: 1 }
              },
              create: {
                text1: node.text1,
                text2: node.text2,
                text3: node.text3,
                nodeShape: node.nodeShape,
                lessonId: lesson.id,
                x: node.x,
                y: node.y,
                frequency: 1
              }
            });

            // 연결 패턴 저장
            for (const link of node.links) {
              const targetNode = lessonData.nodes.find(
                (n: any) => n.id === parseInt(link.id)
              );
              
              if (targetNode && targetNode.text1) {
                await prisma.connectionPattern.upsert({
                  where: {
                    sourceText1_targetText1: {
                      sourceText1: node.text1,
                      targetText1: targetNode.text1
                    }
                  },
                  update: {
                    frequency: { increment: 1 }
                  },
                  create: {
                    sourceText1: node.text1,
                    targetText1: targetNode.text1,
                    lineStyle: link.lineStyle,
                    lessonId: lesson.id,
                    frequency: 1
                  }
                });
              }
            }
          }
        }

        // 4. 분석 상태 업데이트
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { analysis: 'Y' }
        });

        console.log(`Analyzed lesson ${lesson.id}`);
      } catch (error) {
        console.error(`Error analyzing lesson ${lesson.id}:`, error);
        continue;  // 개별 교안 처리 실패 시 다음으로 진행
      }
    }

    return NextResponse.json({ 
      message: `Analyzed ${unanalyzedLessons.length} lessons` 
    });
  } catch (error) {
    console.error('Batch analysis error:', error);
    return NextResponse.json(
      { error: 'Batch analysis failed' }, 
      { status: 500 }
    );
  }
} 