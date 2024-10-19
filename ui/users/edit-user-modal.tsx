import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  name: string;
  role: string;
}

const roles = ['user', 'admin', 'manager', 'editor', 'lock']; // 실제 역할 목록으로 수정해 주세요

export default function EditUserModal({ user, onClose }: { user: User, onClose: () => void }) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setRole(user.role);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, role }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('User updated:', updatedUser);
        router.refresh();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || '사용자 정보 업데이트 실패');
      }
    } catch (error) {
      console.error('오류 발생:', error);
      setError('오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="relative w-full max-w-xs mx-auto">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          <div className="p-5">
            <h3 className="text-lg font-semibold mb-3">사용자 정보 수정</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="role">
                  역할
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
              <div className="flex items-center justify-end">
                <button
                  className="text-slate-500 background-transparent font-bold uppercase px-4 py-2 text-xs outline-none focus:outline-none mr-2"
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  className="bg-blue-500 text-white active:bg-blue-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '처리 중...' : '수정'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
