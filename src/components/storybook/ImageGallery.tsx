'use client';

interface Props {
  images: string[];
  assignments: Record<1 | 2 | 3, string | null>;
  onImageClick: (url: string) => void;
  onClear: (slot: 1 | 2 | 3) => void;
}

export function ImageGallery({ images, assignments, onImageClick, onClear }: Props) {
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-md p-4 space-y-4">
      <h3 className="font-semibold">🖼️ 이미지 풀 ({images.length}장)</h3>

      <div className="space-y-2 text-sm">
        {([1, 2, 3] as const).map((slot) => (
          <div key={slot} className="flex items-center justify-between gap-2">
            <span className="text-white/70">슬롯 {slot}:</span>
            {assignments[slot] ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <img
                  src={assignments[slot] as string}
                  alt={`slot-${slot}`}
                  className="w-10 h-10 object-cover rounded border border-white/20"
                />
                <span className="truncate text-white/50">
                  {extractName(assignments[slot] as string)}
                </span>
                <button
                  type="button"
                  onClick={() => onClear(slot)}
                  className="text-red-400 hover:text-red-300"
                  aria-label={`슬롯 ${slot} 비우기`}
                >
                  ✕
                </button>
              </div>
            ) : (
              <span className="text-white/40">비어있음</span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-3 gap-2 max-h-[280px] sm:max-h-[400px] overflow-y-auto">
        {images.map((url) => {
          const used = (Object.values(assignments) as Array<string | null>).includes(url);
          return (
            <button
              key={url}
              type="button"
              onClick={() => onImageClick(url)}
              disabled={used}
              className={`relative aspect-square overflow-hidden rounded border ${
                used ? 'border-[#E63946] opacity-50' : 'border-white/10 hover:border-white/50 active:border-white/80'
              }`}
              aria-label={used ? `${extractName(url)} (사용중)` : `${extractName(url)} 선택`}
            >
              <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
              {used && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs bg-black/50">
                  사용중
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-white/50">
        이미지를 클릭하면 첫 빈 슬롯에 자동 채워집니다.
      </p>
    </div>
  );
}

function extractName(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] ?? url;
}
