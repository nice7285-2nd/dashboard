import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchLoggedInUser } from '@/backend/account-actions';
import { Metadata } from 'next';
import { auth } from '@/auth';
import DeleteAccount from '@/ui/account/delete-account'
import ProfileImageUploader from '@/ui/component/ProfileImageUploader';

interface User {
  profile_image_url?: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  loginAt: Date;
  id: string;
  authKey: string;
} 

function formatDate(date: Date): string {
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  
  return `${yy}/${mm}/${dd} ${hh}:${min}:${ss}`;
}

export const metadata: Metadata = {
  title: 'Account',
};

export default async function Page() {

  const session = await auth();
  const email = session?.user?.email || '';
  const user = await fetchLoggedInUser(email) as User;

  return (
    <div className="w-full">
      <div className="p-4 rounded-md shadow bg-gray-50 md:p-6">
        <h1 className="text-xl font-semibold mb-6">Your Account</h1>
        <div className="flex flex-col items-start space-y-4 mb-6">
          <ProfileImageUploader 
            currentImageUrl={user.profile_image_url} 
            email={user.email}
          />
        </div>

        <div className="grid gap-6 mb-6 md:grid-cols-2">
          {/* Name */}
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-700">Name</h2>
            <input
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
              type="text"
              value={user.name}
              readOnly
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-700">Email</h2>
            <input
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
              type="email"
              value={user.email}
              readOnly
            />
          </div>

          {/* 역할 */}
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-700">역할</h2>
            <input
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
              type="text"
              value={user.role}
              readOnly
            />
          </div>

          {/* 생성일 */}
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-700">생성일</h2>
            <input
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
              type="text"
              value={formatDate(user.createdAt)}
              readOnly
            />
          </div>


          {/* 최근 로그인 */}
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-700">최근 로그인</h2>
            <input
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
              type="text"
              value={formatDate(user.loginAt)}
              readOnly
            />
          </div>

          {/* UUID와 Auth Key를 숨기기 위해 주석 처리 또는 제거 */}
          {/*
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-gray-700">UUID</h2>
              <p className="text-sm">{user.id}</p>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-medium text-gray-700">Auth Key</h2>
              <p className="text-sm">{user.auth_key}</p>
            </div>
          */}
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={1000} />
      <DeleteAccount deleteEmail={user.email} />
    </div>
  );
}
