'use client';
 
import { useEffect } from 'react';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 오류 로깅 (옵션)
    console.error(error);
  }, [error]);
 
  return (
    <main className="flex flex-col items-center justify-center h-full">
      <h2 className="text-center">Something went wrong!</h2>
      <button
        className="px-4 py-2 mt-4 text-sm text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-400"
        onClick={
          // 재시도 기능
          () => reset()
        }
      >
        재시도 하기
      </button>
    </main>
  );
}