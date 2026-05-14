// /storybook — Blog draft builder for KIA players.
// Design Ref: kia-player-storybook.design.md §6.

'use client';

import { useState } from 'react';
import useSWR from 'swr';

import { PlayerSearchBox } from '@/components/storybook/PlayerSearchBox';
import { ResultPanel } from '@/components/storybook/ResultPanel';
import { ImageGallery } from '@/components/storybook/ImageGallery';
import { DraftPreview } from '@/components/storybook/DraftPreview';
import { DraftActions } from '@/components/storybook/DraftActions';
import { fetcher } from '@/lib/api-client';

import type { Storybook } from '@/types';

interface KiaRosterResp {
  players: Array<{
    id: string;
    name: string;
    position: string;
    isPitcher: boolean;
    uniformNumber?: number;
  }>;
}

export default function StorybookPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [imageAssignments, setImageAssignments] = useState<Record<1 | 2 | 3, string | null>>({
    1: null,
    2: null,
    3: null,
  });

  const { data: rosterData } = useSWR<KiaRosterResp>(
    '/api/storybook/kia-players',
    fetcher,
  );

  const { data: storybook, error: storyError, isLoading } = useSWR<Storybook>(
    selectedId ? `/api/storybook/${selectedId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const roster = rosterData?.players ?? [];

  const handleImageClick = (imageUrl: string) => {
    setImageAssignments((prev) => {
      const nextSlot = ([1, 2, 3] as const).find((i) => prev[i] === null);
      if (!nextSlot) return prev;
      return { ...prev, [nextSlot]: imageUrl };
    });
  };

  const renderedMarkdown = storybook ? applyImageSlots(storybook.draft.markdown, imageAssignments) : '';

  return (
    <main className="min-h-screen bg-[#0F1320] text-[#F7F8FA]">
      <header className="sticky top-0 z-10 bg-[#0F1320]/95 backdrop-blur border-b border-white/10 px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
        <h1 className="text-sm sm:text-lg font-semibold truncate">📝 Storybook<span className="hidden sm:inline"> — KIA 블로그 초안 빌더</span></h1>
        <a href="/" className="text-xs sm:text-sm text-white/60 hover:text-white shrink-0">← 대시보드</a>
      </header>

      <section className="px-3 sm:px-4 py-4 sm:py-6 max-w-6xl mx-auto">
        <PlayerSearchBox
          roster={roster}
          onSelect={(id) => {
            setSelectedId(id);
            setImageAssignments({ 1: null, 2: null, 3: null });
          }}
        />

        {isLoading && (
          <div className="py-8 text-center text-white/60">데이터 수집 중... (2~5초)</div>
        )}
        {storyError && (
          <div className="py-8 text-center text-red-400">스토리북 생성 실패. 잠시 후 다시 시도해주세요.</div>
        )}

        {storybook && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
            <div className="lg:col-span-2 order-1">
              <ResultPanel storybook={storybook} />
            </div>
            <aside className="order-2">
              <ImageGallery
                images={storybook.imagePool}
                assignments={imageAssignments}
                onImageClick={handleImageClick}
                onClear={(slot) =>
                  setImageAssignments((prev) => ({ ...prev, [slot]: null }))
                }
              />
            </aside>
          </div>
        )}

        {storybook && (
          <div className="mt-6 sm:mt-8">
            <DraftPreview markdown={renderedMarkdown} charCount={renderedMarkdown.length} />
            <DraftActions
              markdown={renderedMarkdown}
              playerName={storybook.player.name}
              date={storybook.today.date}
              onRegenerate={() => {
                if (selectedId) {
                  setSelectedId(null);
                  setTimeout(() => setSelectedId(selectedId), 50);
                }
              }}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function applyImageSlots(
  markdown: string,
  assignments: Record<1 | 2 | 3, string | null>,
): string {
  let out = markdown;
  for (const slot of [1, 2, 3] as const) {
    const url = assignments[slot];
    const placeholder = `<!-- IMG_SLOT_${slot} -->`;
    if (url) {
      out = out.replace(placeholder, `![](${url})`);
    }
  }
  return out;
}
