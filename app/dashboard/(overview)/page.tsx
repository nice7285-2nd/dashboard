
import { OverviewCard }  from '@/ui/analytics/overview-cards';
import { MetricCardHolder }  from '@/ui/analytics/metric-cards';
import { CardSkeleton } from "@/ui/skeletons";

import { Suspense } from 'react';
import { auth } from '@/auth';

export default async function Page() {
  const session = await auth()

  return (
    <main className="p-0">
      <h2 className="mb-4 text-xl md:text-2xl">대시보드</h2>
      <div className="flex flex-col mb-6 md:flex-row md:justify-between">
        <Suspense fallback={<CardSkeleton />}>
          <OverviewCard session={session} />
        </Suspense>
      </div>

      <div className="flex flex-col mb-6 md:flex-row md:justify-between">
        <MetricCardHolder session={session} />
      </div>
    </main>
  );
}
