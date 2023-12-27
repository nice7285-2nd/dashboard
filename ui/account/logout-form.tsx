import React from 'react';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from '@/auth';
import { Button } from '@/ui/component/button';

export default function LogoutForm() {
  return (
    <div className="mb-6">
      <form
        action={async () => {
          'use server';
           await signOut();
        }}
      >
        <Button className="text-sm font-medium text-white bg-blue-500 rounded-lg" >
          <PowerIcon className="w-6" />
          <div className="hidden md:block">로그아웃</div>
        </Button>
      </form>
    </div>
  );
}

// 로그아웃 버튼 컴포넌트
export function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server';
        await signOut();
      }}
    >
      <button className="flex items-center justify-center gap-2 h-[48px] w-full grow rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
        <PowerIcon className="w-6" />
        <span className="hidden md:block">로그아웃</span>
      </button>
    </form>
  );
}
