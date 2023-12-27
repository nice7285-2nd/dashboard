import Breadcrumbs from '@/ui/projects/breadcrumbs';
import { fetchProjectByName } from '@/backend/project-metric-data';
import { notFound } from 'next/navigation';
import { MetricCardHolder }  from '@/ui/analytics/project-metric-cards';
import { auth } from '@/auth';

export default async function Page({ params }: { params: { id: string } }) {
  const project_name = params.id;
  const [project] = await Promise.all([
    fetchProjectByName(project_name)
  ]);

  if (!project) {
    notFound();
  }
  const session = await auth()

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: '프로젝트', href: '/dashboard/projects' },
          {
            label: `[${project_name}] 대시보드`,
            href: `/dashboard/projects/${project_name}/analytics`,
            active: true,
          },
        ]}
      />
      <div className="flex flex-col mb-6 md:flex-row md:justify-between">
        <MetricCardHolder session={session} project={project_name}/>
      </div>
    </main>
  );
}