import { auth } from '@/auth';
import LogoutForm from '@/ui/account/logout-form';

export default async function Page() {
  const session = await auth();

  // 세션 정보가 없으면 로그인 페이지로 리다이렉트 등의 처리를 할 수 있습니다.
  if (!session) {
    // 예: 리다이렉트 로직
    // return <Redirect to="/login" />;
    // 여기서는 단순히 null을 반환합니다.
    return null;
  }

  return (
    <main className="p-0">
      <h2 className="mb-4 text-xl md:text-2xl">대시보드</h2>

      {/* 사용자 이름 */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 md:text-base">이름: { session?.user?.name } </p>
      </div>

      {/* 사용자 이메일 */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 md:text-base">이메일: { session?.user?.email } </p>
      </div>

      {/* 로그아웃 버튼 */}
      <LogoutForm />
    </main>
  );
}
