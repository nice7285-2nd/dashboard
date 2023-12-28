import { fetchMetricsData } from '@/backend/project-metric-data';

import {
  Card, Grid, Metric, Text, Title, Subtitle,
  Flex, AreaChart,
  BadgeDelta, CategoryBar,
} from "@tremor/react";
import type { Session } from "next-auth"

export async function MetricCardHolder({ session, project = null }: { session: Session | null, project?: string | null}) {
  const email = session?.user?.email || '';

  return (
    <div className="flex-grow">
      <Title>지표별 현황</Title>
      <Subtitle>24H동안 각 지표별로 수집된 값의 평균</Subtitle>
      <Grid numItemsMd={3} className="gap-2 mt-6">
        <VitalCard metric="TTFB" email={email} project={project} />
        <VitalCard metric="FCP" email={email} project={project} />
        <VitalCard metric="LCP" email={email} project={project} />
        <VitalCard metric="FID" email={email} project={project} />
        <VitalCard metric="CLS" email={email} project={project} />
        <VitalCard metric="INP" email={email} project={project} />
      </Grid>
    </div>
  );
}

function calculateDelta(value: number, range: number[], normal: number): string[] {
  const percentageValue = value * (100 / normal);

  if (percentageValue <= range[0]) {
    return ['Great', 'increase'];
  } else if (percentageValue <= range[0] + range[1]) {
    return ['Not Good', 'unchanged'];
  } else {
    return ['Poor', 'decrease'];
  }
}

// 메트릭 정보 타입 정의
type MetricInfoType = {
  fullName: string;
  unit: string;
  range: number[];
  normal: number;
  ms2s: boolean;
};

const metricMeta: Record<string, MetricInfoType> = {
  TTFB: {
    fullName: "Time to First Byte",
    unit: "초",
    range: [40, 50, 10],
    normal: 2,
    ms2s: true,
  },
  FCP: {
    fullName: "First Contentful Paint",
    unit: "초",
    range: [45, 30, 25],
    normal: 4,
    ms2s: true,
  },
  LCP: {
    fullName: "Largest Contentful Paint",
    unit: "초",
    range: [50, 30, 20],
    normal: 5,
    ms2s: true,
  },
  FID: {
    fullName: "First Input Delay",
    unit: "밀리초",
    range: [25, 50, 25],
    normal: 4,
    ms2s: false,
  },
  CLS: {
    fullName: "Cumulative Layout Shift",
    unit: "",
    range: [20, 30, 50],
    normal: 5,
    ms2s: false,
  },
  INP: {
    fullName: "Interaction to Next Paint",
    unit: "밀리초",
    range: [20, 30, 50],
    normal: 10,
    ms2s: false,
  },
};

export async function VitalCard(
  { metric, email, project = null }
  : { metric: string, email: string, project?: string | null })
{
  const metricInfo = metricMeta[metric];

  const chartData = await fetchMetricsData(email, metric, project);
  const processedChartData = metricInfo.ms2s? chartData.map(data => {
    return {
        ...data,
        Value: Math.round((data.Value / 1000) * 100) / 100
      };
    }): chartData.map(data => {
    return {
        ...data,
        Value: Math.round((data.Value) * 100) / 100
      };
    });

  const totalValue = processedChartData.reduce((acc, data) => acc + data.Value, 0);
  const averageValue = totalValue / processedChartData.length;
  const roundedAverage = Math.round(averageValue * 100) / 100;

  const deltas = calculateDelta(roundedAverage, metricInfo.range, metricInfo.normal)

  const calculateValue = (average:number, normal:number) => {
    const value = (average * (100 / normal));
    return value > 100 ? 100 : value;
  }

  const item = {
    title: metric,
    metric: roundedAverage,
    value: calculateValue(roundedAverage, metricInfo.normal),
    delta: deltas[0],
    deltaType: deltas[1],
  };

  return (
    <Card key={item.title} className="max-w-lg mx-auto">
      <Flex justifyContent="start" alignItems="baseline" className="space-x-1">
        <Title>{item.title}</Title>
        <Text>{metricMeta[metric].fullName}</Text>
      </Flex>
      <Flex justifyContent="start" alignItems="center">
        <Flex justifyContent="start" alignItems="baseline" className="space-x-1">
          <Metric>{item.metric}</Metric>
          <Text>{metricInfo.unit}</Text>
        </Flex>
        <BadgeDelta deltaType={item.deltaType}>{item.delta}</BadgeDelta>
      </Flex>
      <CategoryBar
        values={metricInfo.range}
        colors={["emerald", "yellow", "rose"]}
        markerValue={item.value}
        tooltip={`${item.metric}`}
        showLabels={false}
        className="mt-5"
      />
      <AreaChart
        className="h-32 mt-6"
        data={processedChartData}
        index="Date"
        categories={["Value"]}
        colors={["blue"]}
        showXAxis={true}
        showGridLines={false}
        startEndOnly={true}
        showYAxis={false}
        showLegend={false}
      />
    </Card>
  );
}


