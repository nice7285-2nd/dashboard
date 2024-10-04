import {
  AnalyticsLesson,
  UpdateLesson,
  DeleteLesson
} from '@/ui/lessons/buttons';
import { fetchFilteredLessonsSimple } from '@/backend/lessons-data';

export default async function LessonsTable({
  query,
  currentPage,
  email,
}: {
  query: string;
  currentPage: number;
  email: string
}) {
  const lessons = await fetchFilteredLessonsSimple(query, currentPage, email);

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
                      <p>{lesson.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">{lesson.path}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full pt-4">
                  <div className="flex justify-end gap-2">
                    <AnalyticsLesson id={lesson.name} />
                    <UpdateLesson id={lesson.id} />
                    <DeleteLesson id={lesson.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="text-sm font-normal text-left rounded-lg">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  교안 이름
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  경로
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
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
                  <td className="py-3 pl-6 pr-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <p>{lesson.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {lesson.path}
                  </td>
                  <td className="py-3 pl-6 pr-3 whitespace-nowrap">
                    <div className="flex justify-end gap-3">
                      <AnalyticsLesson id={lesson.name} />
                      <UpdateLesson id={lesson.id} />
                      <DeleteLesson id={lesson.id} />
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
