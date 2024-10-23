'use client';

import { useRouter } from 'next/navigation';
import { deleteUser, performLogout } from '@/backend/account-actions';

export default function DeleteAccount({ deleteEmail }: { deleteEmail: string }) {
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (window.confirm('회원을 탈퇴 하시겠습니까? 이 작업은 취소할 수 없습니다.')) {
      const response = await deleteUser(deleteEmail);
      if (response.message === 'Deleted User.') {
        console.info(response.message);
        await performLogout(); // 로그아웃 함수 호출
        router.push('/login'); // 로그인 페이지로 리다이렉트
      } else {
        console.error(response.message);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleDeleteAccount}
        className="px-4 py-2 mt-4 text-white text-sm bg-rose-600 bg-opacity-90 rounded-md hover:bg-rose-700"
      >
        회원 탈퇴
      </button>
    </>
  );
}
