import Link from 'next/link';
import { FaceFrownIcon } from '@heroicons/react/24/outline';
 
export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center h-full gap-2">
      <FaceFrownIcon className="w-10 text-gray-400" />
      <h2 className="text-xl font-semibold">404 Not Found</h2>
      <p>요청한 프로젝트를 찾을 수 없습니다.</p>
      <Link
        href="/dashboard/projects"
        className="px-4 py-2 mt-4 text-sm text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-400"
      >
        프로젝트 리스트로 돌아가기
      </Link>
    </main>
  );
}