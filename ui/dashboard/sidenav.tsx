import NavLinks from '@/ui/dashboard/nav-links';
import LevelupLogo from '@/ui/logo';
import { LogoutButton } from '@/ui/account/logout-form';

export default function SideNav() {
  return (
    <div className="flex flex-col h-full px-3 py-4 md:px-2">
      {/* 로고 */}
      <div className="flex items-end justify-start h-20 p-4 mb-2 bg-blue-600 rounded-md md:h-40">
        <LevelupLogo />
      </div>

      {/* 내비게이션 링크 및 로그아웃 버튼 */}
      <div className="flex flex-row justify-between space-x-2 grow md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden grow bg-gray-50 md:block md:h-auto md:rounded-md"></div>
        <LogoutButton />
      </div>
    </div>
  );
}
