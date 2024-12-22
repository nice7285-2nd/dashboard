import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type NodePattern = {
  id: number;
  text1: string;
  text2: string;
  text3: string | null;
  nodeShape: string | null;
  x: number;
  y: number;
  frequency: number;
  lessonId: number;
};

export async function POST(request: Request) {
  try {
    const { text1, text2 } = await request.json();
    console.log('Searching for patterns:', { text1, text2 });

    let words = text2.trim().split(/\s+/);
    console.log('Words to search:', words);

    // 모든 가능한 단어 조합 생성 (긴 조합부터)
    const combinations: string[] = [];
    for (let length = words.length; length > 0; length--) {
      for (let i = 0; i <= words.length - length; i++) {
        combinations.push(words.slice(i, i + length).join(' '));
      }
    }
    console.log('Word combinations:', combinations);

    // 각 조합별로 패턴 검색
    const allPatterns: NodePattern[] = [];
    for (const phrase of combinations) {
      const patterns = await prisma.nodePattern.findMany({
        where: {
          AND: [
            {
              text2: {
                equals: phrase,
                mode: 'insensitive'
              }
            },
            {
              text1: {
                not: ''
              }
            }
          ]
        },
        orderBy: {
          frequency: 'desc'
        },
        take: 1
      });

      if (patterns.length > 0) {
        allPatterns.push(...patterns);
        // 이미 사용된 단어들은 제외
        const usedWords = phrase.split(/\s+/);
        words = words.filter(word => !usedWords.includes(word));
      }
    }

    console.log('Found patterns:', allPatterns);

    // 연결 패턴 검색 (인접한 패턴들 간의 연결만)
    console.log('Search criteria:', allPatterns.map(p => p.text1));

    const connections = await prisma.connectionPattern.findMany({
      where: {
        AND: [
          {
            sourceText1: {
              in: allPatterns.map(p => p.text1)
            }
          },
          {
            targetText1: {
              in: allPatterns.map(p => p.text1)
            }
          }
        ]
      },
      distinct: ['sourceText1', 'targetText1'],  // 중복 제거
      orderBy: {
        frequency: 'desc'
      }
    });

    console.log('Found connections detail:', connections.map(c => ({
      source: c.sourceText1,
      target: c.targetText1,
      lineStyle: c.lineStyle,
      text: c.text
    })));

    return NextResponse.json({
      nodes: allPatterns,
      connections: connections
    });

  } catch (error) {
    console.error('Pattern suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest patterns' },
      { status: 500 }
    );
  }
} 