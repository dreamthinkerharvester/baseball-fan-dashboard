'use client';

import { useState } from 'react';

interface Props {
  markdown: string;
  playerName: string;
  date: string;
  onRegenerate: () => void;
}

export function DraftActions({ markdown, playerName, date, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — older browsers
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${date}_${playerName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 mt-3">
      <button
        type="button"
        onClick={handleCopy}
        className="col-span-2 sm:col-span-1 px-4 py-3 sm:py-2 bg-[#E63946] text-white rounded font-medium hover:bg-[#d62836] active:bg-[#c0202f] min-h-[44px]"
      >
        {copied ? '✓ 복사됨' : '📋 마크다운 복사'}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="px-3 py-3 sm:py-2 border border-white/20 rounded hover:bg-white/5 active:bg-white/10 text-sm sm:text-base min-h-[44px]"
      >
        ⬇ .md 다운로드
      </button>
      <button
        type="button"
        onClick={onRegenerate}
        className="px-3 py-3 sm:py-2 border border-white/20 rounded hover:bg-white/5 active:bg-white/10 text-sm sm:text-base min-h-[44px]"
      >
        🔄 재생성
      </button>
    </div>
  );
}
