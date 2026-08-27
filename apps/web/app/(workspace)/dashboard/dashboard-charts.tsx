'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import type { DashboardStats } from '@veb/api-contracts';
import { BarChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useMemo, useRef } from 'react';

echarts.use([
  BarChart,
  CanvasRenderer,
  GridComponent,
  LegendComponent,
  PieChart,
  TooltipComponent,
]);

const tooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  borderColor: 'rgba(226, 232, 240, 0.82)',
  borderWidth: 1,
  textStyle: { color: '#1e293b', fontSize: 12 },
  extraCssText:
    'backdrop-filter: blur(18px) saturate(160%); border-radius: 10px; box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);',
};

function ChartSurface({
  label,
  option,
  height,
}: {
  label: string;
  option: EChartsCoreOption;
  height: { base: string; md: string };
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = echarts.init(container, undefined, { renderer: 'canvas' });
    chart.setOption(option);

    const resize = () => chart.resize();
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    resizeObserver?.observe(container);
    window.addEventListener('resize', resize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      chart.dispose();
    };
  }, [option]);

  return (
    <Box
      ref={containerRef}
      role="img"
      aria-label={label}
      w="full"
      h={height}
      minW={0}
    />
  );
}

export function ActivityTrendChart({
  trend,
}: {
  trend: DashboardStats['operationTrend'];
}) {
  const total = trend.reduce(
    (sum, item) => sum + item.successCount + item.failureCount,
    0,
  );
  const option = useMemo<EChartsCoreOption>(
    () => ({
      animationDuration: 420,
      color: ['#1677ff', '#ef4444'],
      tooltip: { trigger: 'axis', ...tooltipStyle },
      legend: {
        top: 0,
        right: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      grid: {
        left: 4,
        right: 4,
        top: 46,
        bottom: 6,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: trend.map((item) => item.date.slice(5).replace('-', '/')),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11, margin: 12 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.12)' } },
      },
      series: [
        {
          name: '成功',
          type: 'bar',
          stack: 'operations',
          barMaxWidth: 28,
          data: trend.map((item) => item.successCount),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          emphasis: { focus: 'series' },
        },
        {
          name: '失败',
          type: 'bar',
          stack: 'operations',
          barMaxWidth: 28,
          data: trend.map((item) => item.failureCount),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          emphasis: { focus: 'series' },
        },
      ],
    }),
    [trend],
  );

  return (
    <Box position="relative" minW={0}>
      <ChartSurface
        label={`最近 7 天操作趋势，共 ${total} 次操作`}
        option={option}
        height={{ base: '240px', md: '292px' }}
      />
      {total === 0 ? (
        <Flex
          position="absolute"
          inset={0}
          pt="38px"
          align="center"
          justify="center"
          pointerEvents="none"
        >
          <Text color="ink.400" fontSize="sm">
            最近 7 天暂无操作记录
          </Text>
        </Flex>
      ) : null}
    </Box>
  );
}

export function ContentStatusChart({
  articleCount,
  publishedArticleCount,
}: {
  articleCount: number;
  publishedArticleCount: number;
}) {
  const draftArticleCount = Math.max(articleCount - publishedArticleCount, 0);
  const hasArticles = articleCount > 0;
  const option = useMemo<EChartsCoreOption>(
    () => ({
      animationDuration: 420,
      color: ['#1677ff', '#cbd5e1'],
      tooltip: hasArticles
        ? { trigger: 'item', ...tooltipStyle }
        : { show: false },
      series: [
        {
          name: '文章状态',
          type: 'pie',
          radius: ['62%', '82%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: hasArticles ? 3 : 0,
            borderRadius: 4,
          },
          emphasis: { scaleSize: 4 },
          data: hasArticles
            ? [
                { value: publishedArticleCount, name: '已发布' },
                { value: draftArticleCount, name: '草稿' },
              ]
            : [{ value: 1, name: '暂无文章', itemStyle: { color: '#e2e8f0' } }],
        },
      ],
    }),
    [draftArticleCount, hasArticles, publishedArticleCount],
  );

  return (
    <Box position="relative" maxW="280px" mx="auto">
      <ChartSurface
        label={`文章发布构成，已发布 ${publishedArticleCount} 篇，草稿 ${draftArticleCount} 篇`}
        option={option}
        height={{ base: '220px', md: '240px' }}
      />
      <Flex
        position="absolute"
        inset={0}
        align="center"
        justify="center"
        direction="column"
        pointerEvents="none"
      >
        <Text
          color="ink.900"
          fontSize="2xl"
          fontWeight="800"
          lineHeight="1"
          sx={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {articleCount}
        </Text>
        <Text mt={1.5} color="ink.500" fontSize="xs" fontWeight="600">
          文章总数
        </Text>
      </Flex>
    </Box>
  );
}
