// Design Ref: §5.4 — 오늘 / 이번 주 / 이번 달 탭. URL 동기화는 page.tsx 단에서 결정.

'use client';

import { Tabs } from '@/components/ui/Tabs';

import type { ScheduleRange } from './hooks/useGames';

export interface ScheduleTabsProps {
  value: ScheduleRange;
  onChange: (value: ScheduleRange) => void;
}

const ITEMS = [
  { value: 'day' as const, label: '오늘' },
  { value: 'week' as const, label: '이번 주' },
  { value: 'month' as const, label: '이번 달' },
];

export function ScheduleTabs({ value, onChange }: ScheduleTabsProps) {
  return <Tabs items={ITEMS} value={value} onChange={onChange} ariaLabel="기간 선택" />;
}
