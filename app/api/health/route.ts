import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return new NextResponse("Error", { status: 500 });
  }
} 