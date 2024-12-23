import LevelupLogo from '@/ui/logo';
import { ArrowRightIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { shimmer } from '@/ui/animations';

export default function Page() {
  return (
    <main className="flex flex-col min-h-screen p-4">
      <div className={`${shimmer} relative overflow-hidden `}>
        {/* <div className="relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-shimmer before:from-transparent before:via-white/60 before:to-transparent"> */}
        <div className="flex items-center h-auto p-4 bg-blue-500 rounded-lg">
          <LevelupLogo />
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-4 grow md:flex-row">
        <div className="flex flex-col justify-center gap-6 px-6 py-10 rounded-lg bg-gray-50 md:w-2/5 md:px-10">
          <p className="text-xl text-gray-800 md:text-2xl md:leading-normal">
            <strong>환영합니다.</strong> <br />
            Fishbone Workbooks를 통한 스터디 사이트 입니다.
          </p>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="flex items-center self-start gap-2 px-6 py-3 text-sm font-medium text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-400 md:text-base"
            >
              로그인 <ArrowRightIcon className="w-5 md:w-2 lg:w-6" />
            </Link>
            <Link
              href="/signup"
              className="flex items-center self-start gap-2 px-6 py-3 text-sm font-medium text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-400 md:text-base"
            >
              회원가입 <UserPlusIcon className="w-5 md:w-2 lg:w-6" />
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center p-6 md:w-4/5 md:px-70 md:py-12">
          <div className="relative w-full h-full flex justify-center">
            <Image
              src="/fishbone-desktop.png"
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              className="hidden md:block object-contain"
              alt="Screenshots of the dashboard project showing desktop version"
            />
            <Image
              src="/fishbone-mobile.png"
              width={560}
              height={620}
              className="block md:hidden mx-auto"
              alt="Screenshot of the dashboard project showing mobile version"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
