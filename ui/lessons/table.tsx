import {
  EditLesson,
  DeleteLesson,
  PlayLesson
} from '@/ui/lessons/buttons';
import { fetchFilteredLessons } from '@/backend/lessons-data';
import { auth } from '@/auth';
import Image from 'next/image';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul'
  }).format(date).replace(/\. /g, '/').replace('.', '');
}

export default async function LessonsTable({
  query,
  currentPage,
  email,
}: {
  query: string;
  currentPage: number;
  email: string;
}) {
  const lessons = await fetchFilteredLessons(query, currentPage);

  return (
    <div className="flow-root mt-6">
      <div className="inline-block min-w-full align-middle">
        <div className="p-2 rounded-lg bg-gray-50 md:pt-0">
          <div className="md:hidden">
            {lessons?.map((lesson) => (
              <div
                key={lesson.id}
                className="w-full p-4 mb-2 bg-white rounded-md"
              >
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-2">
                        <Image
                          src={lesson.user?.profileImageUrl || '/default-profile.svg'}
                          alt={lesson.author}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p>{lesson.author}</p>
                      <p>{lesson.title}</p>
                      <p>{formatDate(lesson.createdAt)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full pt-4">
                  <div className="flex justify-end gap-2">
                    <PlayLesson id={lesson.id.toString()} disabled={false} />
                    <EditLesson id={lesson.id.toString()} disabled={false} />
                    <DeleteLesson id={lesson.id.toString()} disabled={email !== lesson.email} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="text-sm font-normal text-left rounded-lg">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">
                  생성자
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  제목
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  생성일
                </th>
                <th scope="col" className="relative px-3 py-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {lessons?.map((lesson) => (
                <tr
                  key={lesson.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={lesson.user?.profileImageUrl || '/default-profile.svg'}
                          alt={lesson.author}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>{lesson.author}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {lesson.title}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatDate(lesson.createdAt)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex justify-end gap-3">
                      <PlayLesson id={lesson.id.toString()} disabled={false} />
                      <EditLesson id={lesson.id.toString()} disabled={false} />
                      <DeleteLesson id={lesson.id.toString()} disabled={email !== lesson.email} />
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
