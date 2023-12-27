import {
  AnalyticsProject,
  UpdateProject,
  DeleteProject
} from '@/ui/projects/buttons';
import { fetchFilteredProjectsSimple } from '@/backend/project-data';

export default async function ProjectsTable({
  query,
  currentPage,
  email,
}: {
  query: string;
  currentPage: number;
  email: string
}) {
  const projects = await fetchFilteredProjectsSimple(query, currentPage, email);

  return (
    <div className="flow-root mt-6">
      <div className="inline-block min-w-full align-middle">
        <div className="p-2 rounded-lg bg-gray-50 md:pt-0">
          <div className="md:hidden">
            {projects?.map((project) => (
              <div
                key={project.id}
                className="w-full p-4 mb-2 bg-white rounded-md"
              >
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <div className="flex items-center mb-2">
                      <p>{project.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">{project.website_url}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full pt-4">
                  <div className="flex justify-end gap-2">
                    <AnalyticsProject id={project.name} />
                    <UpdateProject id={project.id} />
                    <DeleteProject id={project.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="text-sm font-normal text-left rounded-lg">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  프로젝트 이름
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  웹 주소
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {projects?.map((project) => (
                <tr
                  key={project.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="py-3 pl-6 pr-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <p>{project.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {project.website_url}
                  </td>
                  <td className="py-3 pl-6 pr-3 whitespace-nowrap">
                    <div className="flex justify-end gap-3">
                      <AnalyticsProject id={project.name} />
                      <UpdateProject id={project.id} />
                      <DeleteProject id={project.id} />
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
