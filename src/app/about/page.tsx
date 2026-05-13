// Static About page (Footer 링크).

import Link from 'next/link';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: '소개',
  description: 'KBO 야구 카드 대시보드 소개와 운영 원칙.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <article className="prose prose-invert mx-auto max-w-screen-md px-4 py-8 text-body">
        <h1 className="text-display">소개</h1>

        <h2 className="mt-6 text-heading">무엇을 하는 서비스인가요?</h2>
        <p>
          KBO 팬이 경기 전 30초 안에 마이팀의 오늘 라인업·일정·순위를 한 화면에서
          판독할 수 있는 정보 밀집형 대시보드입니다. 통계 입문자에게는 카드 색상으로,
          매니아에게는 wRC+/FIP 같은 세이버 지표로 동시에 답합니다.
        </p>

        <h2 className="mt-6 text-heading">왜 만들었나요?</h2>
        <p>
          네이버 스포츠는 정보가 풍부하지만 마이팀 라인업까지 가는 데 3~4번 클릭이
          필요하고, 스탯티즈는 데이터 깊이가 깊지만 모바일에서 보기 어려웠습니다.
          그 사이 공백을 메우는 작은 팬 도구입니다.
        </p>

        <h2 className="mt-6 text-heading">데이터는 어디에서 오나요?</h2>
        <ul>
          <li>경기 일정·순위·라인업 — KBO 공식 사이트 (koreabaseball.com)</li>
          <li>선수 성적 (wRC+, FIP 등) — 스탯티즈 (statiz.co.kr)</li>
          <li>모든 데이터는 캐시되어 제공되며 로봇 약관을 준수해 수집합니다.</li>
        </ul>

        <h2 className="mt-6 text-heading">개인정보는?</h2>
        <p>
          로그인 없이 동작합니다. 마이팀 설정은 브라우저 localStorage에만 저장되며
          서버에 어떤 사용자 데이터도 저장하지 않습니다.
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
