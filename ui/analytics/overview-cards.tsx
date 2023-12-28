import {
  DocumentChartBarIcon,
  DocumentDuplicateIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { fetchOverviewData } from '@/backend/project-metric-data';

import { Card, Grid, Metric, Text, Flex } from "@tremor/react";
import type { Session } from "next-auth"

export async function OverviewCard({ session }: { session: Session | null }) {
  const email = session?.user?.email || '';

  const {
      numberOfProjects,
      numberOfPages,
      numberOfCollections,
  } = await fetchOverviewData(email);

  const categories = [
    {
      title: "프로젝트",
      metric: numberOfProjects,
      unit: "개",
      icon: DocumentChartBarIcon,
    },
    {
      title: "수집 페이지",
      metric: numberOfPages,
      unit: "개 (24H 이내)",
      icon: DocumentDuplicateIcon,
    },
    {
      title: "총 수집",
      metric: numberOfCollections,
      unit: "건 (24H 이내)",
      icon: ExclamationCircleIcon,
    },
  ];

  return (
    <div className="flex-grow">
      <Grid numItemsSm={2} numItemsLg={3} className="gap-6">
        {categories.map((item) => (
          <Card key={item.title}>
            <Flex justifyContent="start" alignItems="baseline" className="space-x-1 truncate">
              <item.icon className="w-5 h-5 text-gray-700" />
              <Text>{item.title}</Text>
            </Flex>
            <Flex justifyContent="start" alignItems="baseline" className="space-x-1 truncate">
              <Metric>{item.metric}</Metric>
              <Text className="truncate">{item.unit}</Text>
            </Flex>
          </Card>
        ))}
      </Grid>
    </div>
  );
}
