# 크레파스 인물화 (crayon portraits) — 슬롯 규칙

선수 상세페이지 `/players/[id]` 가 이 폴더에서 크레파스 화풍 인물화를 읽는다.
저작권(초상권) 회피용으로, 실제 사진을 그대로 쓰지 않고 **초등학생이 크레파스로
그린 듯한 코믹 인물화**로 대체한다. 사진이 없으면 페이지는 자동으로 점선
플레이스홀더("크레파스 초상화 · {각도}")를 보여준다.

## 파일명 규칙

```
{playerId}_{slot}.png
```

- `playerId` — `data/players/{id}.json` 의 id (예: 김도영 = `52605`)
- `slot` — 아래 5종

| slot     | 페이지 위치        | 권장 비율 | 설명                         |
| -------- | ------------------ | --------- | ---------------------------- |
| `hero`   | HERO 메인 비주얼   | 3:4 세로  | 정면 대표 컷 (타격/투구 자세) |
| `side`   | 우측 레일 Side     | 4:3       | 측면 컷                       |
| `action` | 우측 레일 In Action| 4:3       | 스윙/투구 등 액션 컷          |
| `back`   | Crayon Gallery     | 3:4 세로  | 뒷모습 (등번호 보이게)        |
| `face`   | Crayon Gallery     | 3:4 세로  | 얼굴 클로즈업 (코믹 표정)     |

예) 김도영(52605): `52605_hero.png`, `52605_side.png`, `52605_action.png`,
`52605_back.png`, `52605_face.png`

## 공용 폴백 (`_generic/`) — 투수/타자만 구분

선수 전용 `{id}_{slot}.png` 가 없으면 페이지는 점선 대신 **역할별 공용 크레파스 컷**을
보여준다. 파일명 규칙:

```
_generic/{role}_{slot}.png      # role = pitcher | batter, slot = 위 5종
```

해석 순서(`portraitSrc`): `{id}_{slot}.png` → `_generic/{role}_{slot}.png`
→ `_generic/{role}_hero.png` → 점선 플레이스홀더.

특정 선수 그림을 채우면 그 컷만 교체되고 나머지는 투수/타자 공용으로 자동 노출된다.
공용 컷은 번호·이름이 없는(또는 식별 무의미한) 일반 컷으로 골라 모든 선수에 붙어도
오인되지 않게 한다. 입력 원본↔배치 매핑은 `_MAP.md` 참고.

## 생성 방법

- 각 선수·각도별 프롬프트는 OUT 허브의
  `kia-fan-service_crayon-portraits_{날짜}.md` 에 종합 정리돼 있다.
- PNG (투명/단색 배경 무관, `object-fit: cover` 로 표시됨) 권장.
- 권장 캔버스: hero/back/face = 1024×1365 내외(3:4), side/action = 1365×1024(4:3).
- 파일을 이 폴더에 넣고 배포(또는 `pnpm build`)하면 즉시 반영된다.
