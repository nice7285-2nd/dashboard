import EditProjectForm from '@/ui/projects/edit-form';
import Breadcrumbs from '@/ui/projects/breadcrumbs';
import { fetchProjectById } from '@/backend/project-data';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  let project;

  try {
    project = await fetchProjectById(id);
    if (!project) {
      notFound();
      return; // 프로젝트가 없으면 함수를 종료합니다.
    }
  } catch (error) {
    notFound();
    return; // 오류가 발생하면 함수를 종료합니다.
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: '프로젝트', href: '/dashboard/projects' },
          {
            label: '프로젝트 수정',
            href: `/dashboard/projects/${id}/edit`,
            active: true,
          },
        ]}
      />
      <EditProjectForm project={project} />
    </main>
  );
}