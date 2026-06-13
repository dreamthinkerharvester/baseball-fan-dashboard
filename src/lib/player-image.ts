// Design Ref: kia-fan-service §7 (FR-08) — 선수 사진 소스 추상화 단일 진입점.
// IP 재검토 시 env 플래그 하나로 magu SD 일러스트 ↔ 일반 photoUrl 전환.
//   NEXT_PUBLIC_PLAYER_IMAGE_SOURCE = 'magu' (기본) | 'avatar'

import { playerByLineupSlot } from './assets-magu';

import type { Player } from '@/types';

type ImageSource = 'magu' | 'avatar';

function imageSource(): ImageSource {
  return process.env.NEXT_PUBLIC_PLAYER_IMAGE_SOURCE === 'avatar' ? 'avatar' : 'magu';
}

/**
 * 라인업 카드 face 이미지 해석.
 * magu 모드: KIA 타순 1~9 SD 일러스트 우선 → photoUrl 폴백.
 * avatar 모드: photoUrl만 (SD 일러스트 미사용 — IP 세이프).
 */
export function getLineupFaceImage(
  player: Player | null,
  battingOrder: number,
): string | null {
  if (!player) return null;
  if (imageSource() === 'magu') {
    const isKiaBatter = player.teamCode === 'KIA' && battingOrder >= 1 && battingOrder <= 9;
    const sd = isKiaBatter ? playerByLineupSlot(battingOrder - 1) : null;
    if (sd) return sd;
  }
  return player.photoUrl ?? null;
}
