'use client';

import { ProjectTable } from '@/types/definitions';
import {
  AtSymbolIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/ui/component/button';
import { updateProject } from '@/backend/project-actions';
import { useFormState } from 'react-dom';

export default function EditProjectForm({
  project
}: {
  project: ProjectTable;
}) {
  const initialState = { message: '', errors: {} };
  const updateProjectWithId = updateProject.bind(null, project.id);
  const [state, dispatch] = useFormState(updateProjectWithId, initialState);

  return (
    <form action={dispatch}>
      <input type="hidden" name="id" value={project.id} />
      <div className="p-4 rounded-md bg-gray-50 md:p-6">
        {/* Project Name */}
        <div className="mb-4">
          <label htmlFor="amount" className="block mb-2 text-lg font-medium">
            프로젝트 이름
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={project.name}
                placeholder="Enter project name"
                required
                className="block w-full py-2 pl-10 text-sm border border-gray-200 rounded-md peer outline-2 placeholder:text-gray-500"
              />
              <DocumentIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>
        {/* 프로젝트 주소 */}
        <div className="mb-4">
          <label htmlFor="amount" className="block mb-2 text-lg font-medium">
            웹 주소
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="website_url"
                name="website_url"
                type="text"
                defaultValue={project.website_url}
                placeholder="Enter project web url"
                className="block w-full py-2 pl-10 text-sm border border-gray-200 rounded-md peer outline-2 placeholder:text-gray-500"
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>
      <div className="flex justify-end gap-4 mt-6">
        <Link
          href="/dashboard/projects"
          className="flex items-center h-10 px-4 text-sm font-medium text-gray-600 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          취소
        </Link>
        <Button type="submit">수정하기</Button>
      </div>
      </div>
    </form>
  );
}
