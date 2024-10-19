import {
  EditLesson,
  DeleteLesson,
  PlayLesson
} from '@/ui/lessons/buttons';
import { fetchFilteredLessons } from '@/backend/lessons-data';
import { auth } from '@/auth';

function formatDate(date: Date) {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
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
                      <p>{lesson.author}</p>
                      <p>{lesson.title}</p>
                      <p>{formatDate(lesson.created_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full pt-4">
                  <div className="flex justify-end gap-2">
                    <PlayLesson id={lesson.id} disabled={email !== lesson.email}  />
                    <EditLesson id={lesson.id} disabled={email !== lesson.email} />
                    <DeleteLesson id={lesson.id} disabled={email !== lesson.email} />
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
                    {lesson.author}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {lesson.title}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {formatDate(lesson.created_at)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex justify-end gap-3">
                      <PlayLesson id={lesson.id} disabled={email !== lesson.email}  />
                      <EditLesson id={lesson.id} disabled={email !== lesson.email} />
                      <DeleteLesson id={lesson.id} disabled={email !== lesson.email} />
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
