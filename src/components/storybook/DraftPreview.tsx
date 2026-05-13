'use client';

import { useState } from 'react';

interface Props {
  markdown: string;
  charCount: number;
}

export function DraftPreview({ markdown, charCount }: Props) {
  const [view, setView] = useState<'rendered' | 'source'>('rendered');
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-md p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold text-sm sm:text-base">📝 블로그 초안 미리보기</h3>
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <span className={`${charCount < 1500 || charCount > 2500 ? 'text-yellow-300' : 'text-white/60'}`}>
            {charCount}자
          </span>
          <button
            type="button"
            onClick={() => setView(view === 'rendered' ? 'source' : 'rendered')}
            className="px-2 py-1 border border-white/20 rounded hover:bg-white/5 min-h-[36px]"
          >
            {view === 'rendered' ? 'MD 원문' : '렌더링'}
          </button>
        </div>
      </div>
      <div className="max-h-[60vh] sm:max-h-[600px] overflow-y-auto bg-[#0F1320] border border-white/5 rounded p-3 sm:p-4">
        {view === 'rendered' ? (
          <pre className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed font-sans break-words">{markdown}</pre>
        ) : (
          <pre className="whitespace-pre-wrap text-[11px] sm:text-xs leading-relaxed font-mono text-white/70 break-words">{markdown}</pre>
        )}
      </div>
    </div>
  );
}
