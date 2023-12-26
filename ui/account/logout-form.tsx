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

