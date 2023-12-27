'use client';

import { PencilIcon, PlusIcon, TrashIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteProject } from '@/backend/project-actions';

export function CreateProject() {
  return (
    <Link
      href="/dashboard/projects/create"
      className="flex items-center h-10 px-4 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">프로젝트 생성</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateProject({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/projects/${id}/edit`}
      className="p-2 border rounded-md hover:bg-gray-100 "
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function AnalyticsProject({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/projects/${id}/analytics`}
      className="p-2 text-white transition-colors bg-blue-600 border rounded-md hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <ChartBarIcon className="w-5" />
    </Link>
  );
}

export function DeleteProject({ id }: { id: string }) {
  const deleteProjectWithId = async () => {
    // 사용자에게 삭제 확인 요청
    if (window.confirm('이 프로젝트를 정말 삭제하시겠습니까?')) {
      await deleteProject(id);
    }
  };

  return (
    <button onClick={deleteProjectWithId} className="p-2 border rounded-md hover:bg-gray-100">
      <span className="sr-only">Delete</span>
      <TrashIcon className="w-5" />
    </button>
  );
}

