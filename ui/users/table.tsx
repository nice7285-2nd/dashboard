import {
  EditUser,
  DeleteUser,
} from '@/ui/users/buttons';
import { fetchFilteredUsers } from '@/backend/users-data';
import Image from 'next/image';

function formatDate(date: Date) {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

export default async function UsersTable({
  query,
  currentPage,
  email,
  userRole,
}: {
  query: string;
  currentPage: number;
  email: string;
  userRole: string;
}) {
  const users = await fetchFilteredUsers(query, currentPage, email);
  const isManager = userRole === 'admin';

  return (
    <div className="flow-root mt-6">
      <div className="inline-block min-w-full align-middle">
        <div className="p-2 rounded-lg bg-gray-50 md:pt-0">
          <div className="md:hidden">
            {users?.map((user) => (
              <div
                key={user.id}
                className="w-full p-4 mb-2 bg-white rounded-md"
              >
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3">
                        <Image
                          src={user.profile_image_url || '/default-profile.svg'}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p>{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.role}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(user.login_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full pt-4">
                      <div className="flex justify-end gap-2">
                        {isManager && (
                          <>
                            <EditUser user={user} />
                            <DeleteUser email={user.email} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="text-sm font-normal text-left rounded-lg">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium sm:pl-6">
                  성명
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  이메일
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  역할
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  생성일
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  로그인
                </th>
                <th scope="col" className="relative px-3 py-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {users?.map((user) => (
                <tr
                  key={user.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={user.profile_image_url || '/default-profile.svg'}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p>{user.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {user.email}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {user.role}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatDate(user.login_at)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex gap-3">
                      {isManager && (
                        <>
                          <EditUser user={user} />
                          <DeleteUser email={user.email} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
