// Pre-mortem F2 완화: 등급 산출 알고리즘을 100% 공개. 팬 반발 시 신뢰 회복 가능.

import Link from 'next/link';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { GRADE_PERCENTILES } from '@/lib/constants';

export const metadata = {
  title: '등급 산출 방식',
  description: '카드 등급 (엘리트/레어/스페셜/노멀)이 어떻게 결정되는지 100% 공개.',
};

export default function GradesPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <article className="prose prose-invert mx-auto max-w-screen-md px-4 py-8 text-body">
        <h1 className="text-display">등급 산출 방식</h1>

        <p>
          모든 라인업 카드의 색상은 다음 알고리즘으로 자동 산출됩니다. 임의 선정이나
          편집권 개입은 일체 없습니다.
        </p>

        <h2 className="mt-6 text-heading">1. 지표 선택</h2>
        <ul>
          <li>
            <strong>타자</strong>: 최근 10경기 wRC+ 평균. 데이터 없으면 OPS로 대체.
          </li>
          <li>
            <strong>투수</strong>: 최근 10등판 FIP 평균. 데이터 없으면 ERA로 대체.
          </li>
          <li>최근 경기가 5경기 미만이면 시즌 누적 스탯으로 대체.</li>
        </ul>

        <h2 className="mt-6 text-heading">2. 백분위 산출</h2>
        <p>
          해당 시즌 규정 타석/이닝 기준의 모든 선수 모집단 안에서 백분위를 계산합니다
          (mid-rank 방식, 동률 안전 처리). 투수의 FIP/ERA는 낮을수록 우수하므로 역순
          처리합니다.
        </p>

        <h2 className="mt-6 text-heading">3. 4단계 매핑</h2>
        <table className="w-full border-collapse text-caption">
          <thead className="bg-bg-card">
            <tr>
              <th className="border border-text-dim/20 px-2 py-1 text-left">등급</th>
              <th className="border border-text-dim/20 px-2 py-1 text-left">백분위</th>
              <th className="border border-text-dim/20 px-2 py-1 text-left">색상</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-text-dim/20 px-2 py-1">엘리트</td>
              <td className="border border-text-dim/20 px-2 py-1">{GRADE_PERCENTILES.elite} 이상</td>
              <td className="border border-text-dim/20 px-2 py-1 text-grade-elite">보라</td>
            </tr>
            <tr>
              <td className="border border-text-dim/20 px-2 py-1">레어</td>
              <td className="border border-text-dim/20 px-2 py-1">{GRADE_PERCENTILES.rare} ~ {GRADE_PERCENTILES.elite - 1}</td>
              <td className="border border-text-dim/20 px-2 py-1 text-grade-rare">빨강</td>
            </tr>
            <tr>
              <td className="border border-text-dim/20 px-2 py-1">스페셜</td>
              <td className="border border-text-dim/20 px-2 py-1">{GRADE_PERCENTILES.special} ~ {GRADE_PERCENTILES.rare - 1}</td>
              <td className="border border-text-dim/20 px-2 py-1 text-grade-special">노랑</td>
            </tr>
            <tr>
              <td className="border border-text-dim/20 px-2 py-1">노멀</td>
              <td className="border border-text-dim/20 px-2 py-1">0 ~ {GRADE_PERCENTILES.special - 1}</td>
              <td className="border border-text-dim/20 px-2 py-1 text-grade-normal">파랑</td>
            </tr>
          </tbody>
        </table>

        <h2 className="mt-6 text-heading">4. 갱신 주기</h2>
        <ul>
          <li>매일 오전 6:30 KST에 전체 선수 등급을 일괄 재산출합니다.</li>
          <li>시즌 초 (모든 선수 경기 수 10 미만)에는 등급 시스템이 비활성화됩니다.</li>
          <li>비시즌에는 마지막 시즌의 최종 등급을 유지합니다.</li>
        </ul>

        <h2 className="mt-6 text-heading">자주 묻는 질문</h2>
        <p>
          <strong>Q. 왜 김도영이 스페셜인가요?</strong>
          <br />
          최근 10경기 wRC+ 평균이 모집단의 백분위 31~69 구간에 있기 때문입니다. 카드를
          탭하면 정확한 백분위와 평균값을 확인할 수 있습니다. 시즌이 진행되며 등급은
          매일 자동 변경됩니다.
        </p>

        <p>
          <strong>Q. 등급에 이의가 있어요</strong>
          <br />
          알고리즘은 위와 같이 100% 공개되어 있고 임의 조정은 없습니다. 입력 데이터
          오류가 의심되면 GitHub Issues로 제보해주세요.
        </p>

        <p className="mt-8">
          <Link href="/" className="text-grade-elite underline">
            대시보드로 돌아가기
          </Link>
        </p>
      </article>
      <Footer />
    </main>
  );
}
