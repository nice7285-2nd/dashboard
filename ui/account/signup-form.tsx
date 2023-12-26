'use client';

import React, { useState, useEffect } from 'react';
import { UserPlusIcon, AtSymbolIcon, KeyIcon, ExclamationCircleIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button } from '@/ui/component/button';
import { useFormState, useFormStatus } from 'react-dom';
import { signUp } from '@/backend/account-actions';


export default function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [errorMessage, dispatch] = useFormState(signUp, undefined);

  useEffect(() => {
    // 비밀번호와 확인 비밀번호가 동일한지 확인
    if (password !== confirmPassword && confirmPassword !== '') {
      setPasswordError('Passwords do not match.');
    } else {
      setPasswordError('');
    }
  }, [password, confirmPassword]);


  return (
    <form action={dispatch} className="space-y-3">
      <div className="flex-1 px-6 pt-8 pb-4 rounded-lg bg-gray-50">
        <h1 className="mb-3 text-2xl">
          회원가입
        </h1>
        <div className="w-full">
          {/* Name Input */}
          <div>
            <label className="block mt-5 mb-3 font-medium text-gray-900 text-md" htmlFor="name">
              이름
            </label>
            <div className="relative">
              <input
                className="block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="name"
                type="text"
                name="name"
                placeholder="Enter your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          {/* Email Input */}
          <div>
            <label className="block mt-5 text-gray-900 mb-3font-medium" htmlFor="email">
              이메일
            </label>
            <div className="relative">
              <input
                className="block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
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

          {/* Password Input */}
          <div className="mt-4">
            <label className="block mt-5 mb-3 font-medium text-gray-900" htmlFor="password">
              암호
            </label>
            <div className="relative">
              <input
                className="block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="mt-4">
            <label className="block mt-5 mb-3 font-medium text-gray-900" htmlFor="confirmPassword">
              암호 확인
            </label>
            <div className="relative">
              <input
                className="block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          {passwordError && (
            <div className="mt-2 text-sm text-red-500">{passwordError}</div>
          )}
        </div>
        <SignUpButton />
        <div className="flex items-end h-8 space-x-1" aria-live="polite" aria-atomic="true">
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function SignUpButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full mt-4" aria-disabled={pending}>
      회원가입 <UserPlusIcon className="w-5 h-5 ml-auto text-gray-50" />
    </Button>
  );
}
