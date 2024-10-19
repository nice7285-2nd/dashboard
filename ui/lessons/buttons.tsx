'use client';

import { useState } from 'react';
import { PencilIcon, PlusIcon, TrashIcon, ChartBarIcon, PlayIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteLesson } from '@/backend/lessons-actions';
import { useRouter } from 'next/navigation';

export function CreateLesson() {
  return (
    <Link
      href="/dashboard/studyboard/new/edit/?mode=edit"
      className="flex items-center h-10 px-4 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">교안 만들기</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function PlayLesson({ id, disabled }: { id: string; disabled: boolean }) {
  const router = useRouter();
  const linkPath = `/dashboard/studyboard/${id}/edit/?mode=play`;

  const handlePlay = () => {
    if (!disabled) {
      router.push(linkPath);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={disabled}
      className={`px-3 py-1 rounded-md ${
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      }`}
    >
      학습
    </button>
  );
}

export function EditLesson({ id, disabled }: { id: string; disabled: boolean }) {
  const router = useRouter();
  const linkPath = `/dashboard/studyboard/${id}/edit/?mode=edit`;

  const handlePlay = () => {
    if (!disabled) {
      router.push(linkPath);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={disabled}
      className={`px-3 py-1 rounded-md ${
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'p-2 border rounded-md hover:bg-gray-100'
      }`}
    >
      수정
    </button>
  );
}

export function DeleteLesson({ id, disabled }: { id: string, disabled: boolean }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  const deleteLessonWithId = async () => {
    await deleteLesson(id);
    closePopup();
  };

  return (
    <>
      <button
        onClick={openPopup}
        disabled={disabled}
        className={`px-3 py-1 rounded-md ${
          disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'p-2 border rounded-md hover:bg-gray-100'
      }`}
>
        <span className="sr-only">삭제</span>
        <TrashIcon className="w-5" />
      </button>
      {isPopupOpen && (
        <DeleteConfirmPopup
          onConfirm={deleteLessonWithId}
          onCancel={closePopup}
        />
      )}
    </>
  );
}

function DeleteConfirmPopup({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">삭제 확인</h2>
        <p className="mb-6">이 교안을 삭제하시겠습니까?</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
