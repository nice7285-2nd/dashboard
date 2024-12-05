'use client';

import {
  HomeIcon,
  UserCircleIcon,
  UsersIcon,
  PlayCircleIcon,
  ClipboardDocumentListIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  {
    name: '교안목록보기',
    href: '/dashboard/lessons',
    icon: ClipboardDocumentListIcon,
  },
  {
    name: '학습영상 보기',
    href: '/dashboard/studyvideo',
    icon: PlayCircleIcon,
  },
  {
    name: '계정관리',
    href: '/dashboard/users',
    icon: UsersIcon,
  },
  {
    name: 'AI 테스트',
    href: '/dashboard/ai-study',
    icon: ComputerDesktopIcon,
  },
  { name: '사용자 계정', href: '/dashboard/account', icon: UserCircleIcon },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ name, href, icon: LinkIcon }) => (
        <Link
          key={name}
          href={href}
          className={clsx(
            'flex h-[48px] items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:justify-start md:p-2 md:px-3',
            { 'bg-sky-100 text-blue-600': pathname === href }
          )}
        >
          <LinkIcon className="h-6 w-6" />
          <span className="hidden md:block">{name}</span>
        </Link>
      ))}
    </>
  );
}
