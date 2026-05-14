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
    <div className="flex flex-col gap-2 mt-1">
      <button
        type="button"
        onClick={handleCopy}
        className="m3-btn m3-btn-filled"
        style={{ width: '100%', height: 48 }}
      >
        <span className="mso" style={{ fontSize: 18 }}>{copied ? 'check' : 'content_copy'}</span>
        {copied ? '복사됨' : '마크다운 복사'}
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={handleDownload} className="m3-btn m3-btn-tonal" style={{ height: 44 }}>
          <span className="mso" style={{ fontSize: 18 }}>download</span>
          .md 다운로드
        </button>
        <button type="button" onClick={onRegenerate} className="m3-btn m3-btn-tonal" style={{ height: 44 }}>
          <span className="mso" style={{ fontSize: 18 }}>refresh</span>
          재생성
        </button>
      </div>
    </div>
  );
}
