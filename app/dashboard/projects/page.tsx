import Pagination from '@/ui/projects/pagination';
import Search from '@/ui/search';
import Table from '@/ui/projects/table';
import { CreateProject } from '@/ui/projects/buttons';
import { ProjectTableSkeleton } from '@/ui/skeletons';
import { Suspense } from 'react';
import { fetchProjectsPages } from '@/backend/project-data';
import { Metadata } from 'next';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Projects',
};

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const session = await auth();

  if (!session || !session.user?.email) {
    // 세션이 없거나 이메일이 없는 경우 처리
    return null;
  }

  const totalPages = await fetchProjectsPages(query, session?.user?.email);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full">
        <h1 className={`text-2xl`}>프로젝트</h1>
      </div>
      <div className="flex items-center justify-between gap-2 mt-4 md:mt-8">
        <Search placeholder="프로젝트 검색..." />
        <CreateProject />
      </div>
       <Suspense key={query + currentPage} fallback={<ProjectTableSkeleton />}>
        <Table query={query} currentPage={currentPage} email={session?.user?.email} />
      </Suspense>
      <div className="flex justify-center w-full mt-5">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}