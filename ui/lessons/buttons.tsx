'use client';

import { PencilIcon, PlusIcon, TrashIcon, ChartBarIcon, PlayIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteLesson } from '@/backend/lessons-actions';

export function CreateLesson() {
  return (
    <Link
      href="/dashboard/studyboard/new/edit"
      className="flex items-center h-10 px-4 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">교안 만들기</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function PlayLesson({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/studyboard/${id}/edit/?mode=play`}
      className="p-2 text-white transition-colors bg-blue-600 border rounded-md hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <PlayIcon className="w-5" />
    </Link>
  );
}

export function EditLesson({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/studyboard/${id}/edit/?mode=edit`}
      className="p-2 border rounded-md hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteLesson({ id }: { id: string }) {
  const deleteLessonWithId = async () => {
    // 사용자에게 삭제 확인 요청
    if (window.confirm('이 프로젝트를 정말 삭제하시겠습니까?')) {
      await deleteLesson(id);
    }
  };

  return (
    <button onClick={deleteLessonWithId} className="p-2 border rounded-md hover:bg-gray-100">
      <span className="sr-only">Delete</span>
      <TrashIcon className="w-5" />
    </button>
  );
}

