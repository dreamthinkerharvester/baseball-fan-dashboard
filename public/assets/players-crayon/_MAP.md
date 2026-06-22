# 크레파스 입력 → 배치 매핑 (2026-06-19)

원본: `iCloud/.../0. 클로드코드/input/야구서비스/*.jpeg` (해시 이름, AI 크레파스 chibi 70컷)
처리: 최대 장변 1000px, PNG 변환. 원본은 입력 폴더에 보존(삭제·이동 안 함 — 추가 매칭 여지).

방침: **이름이 뚜렷한 컷만 해당 선수에 매칭**, 나머지는 투수/타자 공용 폴백.
(AI 그림 특성상 등번호·텍스트가 들쭉날쭉 → 번호 단독 매칭은 보류, 이름/번호 동시 일치만 채택)

## 선수 전용 매칭 (6명 · 7컷)

| 입력 파일      | 식별 단서              | 선수      | id    | slot |
| -------------- | ---------------------- | --------- | ----- | ---- |
| `5BJf1kQN`     | "KIM SUN-BIN"          | 김선빈    | 78603 | hero |
| `GrPoaqG2`     | "HAN SEUNG-YEON #31"   | 한승연    | 52628 | hero |
| `I8UAXwtl`     | "ADERLIN" #24          | 아데를린  | 56613 | hero |
| `izMUcvwB`     | "OLLER"                | 올러      | 55633 | hero |
| `sepaJz6X`     | "KIM TAE-GUN #42" (포수) | 김태군  | 78122 | hero |
| `u9m8qHYF`     | 뒷모습 #42             | 김태군    | 78122 | back |
| `Yv0qwajt`     | #27 + "호…령"          | 김호령    | 65653 | hero |

## 공용 폴백 (`_generic/`, 투수/타자 × 5슬롯)

| 입력 파일   | role    | slot   | 비고                    |
| ----------- | ------- | ------ | ----------------------- |
| `ojCDYCV8`  | batter  | hero   | 정면 타격, 번호 없음    |
| `SmZZS8Ud`  | batter  | side   | 배트 어깨, 번호 없음    |
| `UJfx3CSb`  | batter  | action | "SUPER BATTER!" 스윙    |
| `HjTl91dN`  | batter  | back   | 뒷모습                  |
| `h6v9GVAD`  | batter  | face   | 호랑이 모자 클로즈업    |
| `MfQEg2I2`  | pitcher | hero   | 정면 투구 준비          |
| `O2xnHt8B`  | pitcher | side   | 측면 투구               |
| `ZLQq8GyY`  | pitcher | action | 투구 모션               |
| `06BGRQ8Z`  | pitcher | back   | 뒷모습 마운드           |
| `cxE6S0U7`  | pitcher | face   | 호랑이 모자 클로즈업    |

## 남은 작업 (후속)
- 매칭 안 된 입력 컷 다수 → 이름 식별되면 `{id}_{slot}.png` 로 추가 배치하면 그 컷만 교체됨.
- 공용 PNG ~1.5MB/장 → 트래픽 민감하면 JPEG/추가 리사이즈 권장(현재는 "일단" 우선).
- 재생성 스크립트: `scripts/crayon/build-assets.py` (MATCHES/GENERIC dict 수정 후 `python3` 재실행).
