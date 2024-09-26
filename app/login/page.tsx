import LevelupLogo from '@/ui/logo';
import LoginForm from '@/ui/account/login-form';

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex items-center w-full h-auto p-4 bg-blue-500 rounded-lg md:h-auto">
          <LevelupLogo />
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
