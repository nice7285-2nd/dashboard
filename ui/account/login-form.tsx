'use client';

import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@/ui/component/button';
import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/backend/account-actions';
import { useSearchParams } from 'next/navigation'
import React, { useState, useEffect } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);
  const searchParams = useSearchParams()
  const signup = searchParams.get('signup')
  const signupEmail = searchParams.get('email')

  // 쿼리 파라미터에서 이메일 값을 받아와서 상태를 설정합니다.
  useEffect(() => {
    if (signup === 'success' && signupEmail) {
      setEmail(signupEmail);
    }
  }, [signup, signupEmail]);

  return (
    <form action={dispatch} className="space-y-3">
      <div className="flex-1 px-6 pt-8 pb-4 rounded-lg bg-gray-50">
      {signup === 'success' && (
          <div className="mb-3 text-xl text-center text-blue-600">
            회원가입이 정상적으로 완료 되었습니다.
          </div>
        )}
        <h1 className="mb-3 text-xl">
          대시보드를 이용하기 위해 로그인 해 주세요.
        </h1>
        <div className="w-full">
          <div>
            <label
              className="block mt-5 mb-3 font-normal text-gray-900 text-xm"
              htmlFor="email"
            >
              이메일
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          <div className="mt-4">
            <label
              className="block mt-5 mb-3 font-medium text-gray-900 text-xm"
              htmlFor="password"
            >
              암호
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>
        <LoginButton />
        <div
          className="flex items-end h-8 space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
        <div className="flex items-end h-8 space-x-1">
          {/* Add form errors here */}
        </div>
      </div>
    </form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full mt-4" aria-disabled={pending}>
      로그인 <ArrowRightIcon className="w-5 h-5 ml-auto text-gray-50" />
    </Button>
  );
}
