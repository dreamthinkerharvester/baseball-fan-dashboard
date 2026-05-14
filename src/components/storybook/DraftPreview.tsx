'use client';

import { useState } from 'react';

import { ElevatedCard } from './ElevatedCard';

interface Props {
  markdown: string;
  charCount: number;
}

export function DraftPreview({ markdown, charCount }: Props) {
  const [view, setView] = useState<'rendered' | 'source'>('rendered');
  const offRange = charCount < 1500 || charCount > 2500;

  return (
    <ElevatedCard overline="⑤ 마크다운 미리보기" headline="블로그 초안" mono>
      <div className="flex items-center justify-between gap-2 mb-3" style={{ marginTop: -4 }}>
        <span
          className="tabular"
          style={{
            fontSize: 12,
            color: offRange ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {charCount.toLocaleString()}자
          {offRange && <span style={{ marginLeft: 6 }}>· 권장 1,500~2,500</span>}
        </span>
        <button
          type="button"
          onClick={() => setView(view === 'rendered' ? 'source' : 'rendered')}
          className="m3-btn m3-btn-outlined"
          style={{ height: 32, padding: '0 12px', fontSize: 12 }}
        >
          {view === 'rendered' ? 'MD 원문' : '렌더링 보기'}
        </button>
      </div>
      <div
        className="m3-md-preview"
        style={{
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        {view === 'rendered' ? (
          <pre className="whitespace-pre-wrap" style={{ margin: 0, fontFamily: 'var(--md-ref-typeface-plain)', fontSize: 13, lineHeight: '20px' }}>
            {markdown}
          </pre>
        ) : (
          <pre className="whitespace-pre-wrap" style={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {markdown}
          </pre>
        )}
      </div>
    </ElevatedCard>
  );
}
