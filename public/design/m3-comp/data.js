/* ============================================================
   KBO MyTeam Dashboard — Dummy Data
   ============================================================ */
window.DATA = (() => {

  // ---- 10 KBO teams (4-letter codes, no real logos used) ----
  const teams = [
    { code: "LG",  name: "LG",      shortKo: "LG",   color: "#C30452", rank: 1, w: 30, d: 1, l: 14, pct: ".682" },
    { code: "삼성", name: "삼성",     shortKo: "삼성",  color: "#1E4196", rank: 2, w: 28, d: 0, l: 17, pct: ".622" },
    { code: "한화", name: "한화",     shortKo: "한화",  color: "#F47820", rank: 3, w: 25, d: 1, l: 18, pct: ".581" },
    { code: "KIA", name: "KIA",     shortKo: "KIA",  color: "#EA0029", rank: 4, w: 23, d: 1, l: 20, pct: ".535", myteam: true },
    { code: "KT",  name: "KT",      shortKo: "KT",   color: "#1A1A1A", rank: 5, w: 22, d: 0, l: 22, pct: ".500" },
    { code: "SSG", name: "SSG",     shortKo: "SSG",  color: "#CE0E2D", rank: 6, w: 21, d: 1, l: 22, pct: ".488" },
    { code: "두산", name: "두산",     shortKo: "두산",  color: "#13294B", rank: 7, w: 20, d: 0, l: 24, pct: ".448" },
    { code: "롯데", name: "롯데",     shortKo: "롯데",  color: "#041E42", rank: 8, w: 19, d: 1, l: 24, pct: ".443" },
    { code: "NC",  name: "NC",      shortKo: "NC",   color: "#315288", rank: 9, w: 17, d: 0, l: 26, pct: ".395" },
    { code: "키움", name: "키움",     shortKo: "키움",  color: "#820024", rank: 10, w: 14, d: 0, l: 30, pct: ".318" },
  ];

  // ---- KIA recent form: most recent → oldest, last 5 ----
  // current streak W2
  const kiaForm = ["W", "W", "L", "W", "L"];
  const dusanForm = ["L", "W", "L", "L", "W"];

  // ---- KIA KPI tiles ----
  const kiaKpi = [
    { label: "순위",   value: "4위",     sub: "10팀 중" },
    { label: "승률",   value: ".535",   sub: "League .500" },
    { label: "W-D-L", value: "23-1-20", sub: "44경기" },
    { label: "게임차", value: "4.0",    sub: "1위 LG" },
    { label: "연속",   value: "W2",     sub: "최근 흐름" },
    { label: "잔여",   value: "100",    sub: "144 경기제" },
  ];

  // ---- Today's matchup ----
  const matchup = {
    date: "5/14 (수)",
    time: "18:30",
    away: { code: "두산", color: "#13294B", pct: ".448", rank: 7 },
    home: { code: "KIA",  color: "#EA0029", pct: ".535", rank: 4, myteam: true },
    venue: "광주-기아 챔피언스 필드",
    homeAway: "HOME",
    forecast: "맑음 · 19°C",
  };

  // ---- KIA Lineup 5/14 (9 batters + 1 starting pitcher) ----
  // 등급 = elite | rare | special | normal
  // Player 4 (Aderling) is photo-less for fallback demo.
  const lineup = [
    { order: "P", num: 41, name: "황동하", pos: "P",  tier: "special", pct: 63, photo: "https://picsum.photos/seed/kbo-hwang/400/520",   isPitcher: true },
    { order: 1,   num: 15, name: "박재현", pos: "RF", tier: "elite",   pct: 89, photo: "https://picsum.photos/seed/kbo-park15/400/520" },
    { order: 2,   num: 3,  name: "김선빈", pos: "DH", tier: "special", pct: 61, photo: "https://picsum.photos/seed/kbo-kim3/400/520" },
    { order: 3,   num: 5,  name: "김도영", pos: "3B", tier: "normal",  pct: 38, photo: "https://picsum.photos/seed/kbo-kim5/400/520", hero: true },
    { order: 4,   num: 24, name: "아데를린",pos: "1B", tier: "special", pct: 49, photo: null }, // fallback
    { order: 5,   num: 27, name: "김호령", pos: "CF", tier: "rare",    pct: 74, photo: "https://picsum.photos/seed/kbo-kim27/400/520" },
    { order: 6,   num: 16, name: "윤도현", pos: "2B", tier: "rare",    pct: 80, photo: "https://picsum.photos/seed/kbo-yoon16/400/520" },
    { order: 7,   num: 31, name: "한승연", pos: "LF", tier: "rare",    pct: 72, photo: "https://picsum.photos/seed/kbo-han31/400/520" },
    { order: 8,   num: 42, name: "김태군", pos: "C",  tier: "normal",  pct: 32, photo: "https://picsum.photos/seed/kbo-kim42/400/520" },
    { order: 9,   num: 2,  name: "박민",   pos: "SS", tier: "normal",  pct: 40, photo: "https://picsum.photos/seed/kbo-park2/400/520" },
  ];

  // ---- Upcoming schedule ----
  const schedule = [
    { d: "5/14", w: "수", time: "18:30", home: "KIA",  away: "두산", venue: "광주", myteam: true, live: true },
    { d: "5/15", w: "목", time: "18:30", home: "KIA",  away: "두산", venue: "광주", myteam: true },
    { d: "5/16", w: "금", time: "18:30", home: "KIA",  away: "한화", venue: "광주", myteam: true },
    { d: "5/17", w: "토", time: "17:00", home: "KIA",  away: "한화", venue: "광주", myteam: true },
    { d: "5/18", w: "일", time: "14:00", home: "삼성", away: "KIA",  venue: "대구", myteam: true },
    { d: "5/20", w: "화", time: "18:30", home: "LG",   away: "키움",  venue: "잠실", myteam: false },
  ];

  // ---- Player profile (김도영) for the bottom sheet ----
  const playerProfile = {
    name: "김도영",
    nameEn: "Kim Do-young",
    num: 5,
    pos: "3B",
    tier: "normal",
    pct: 38,
    photo: "https://picsum.photos/seed/kbo-kim5-hero/720/540",
    born: "2003.10.02",
    bats: "우투좌타",
    height: "183cm / 84kg",
    season2025: [
      { lbl: "AVG",  val: ".271" },
      { lbl: "OPS",  val: ".812" },
      { lbl: "HR",   val: "9" },
      { lbl: "RBI",  val: "26" },
      { lbl: "SB",   val: "8" },
      { lbl: "WAR",  val: "1.4" },
    ],
    career: [
      { lbl: "통산 AVG",  val: ".294" },
      { lbl: "통산 OPS",  val: ".885" },
      { lbl: "통산 HR",   val: "47" },
      { lbl: "통산 RBI",  val: "162" },
      { lbl: "통산 SB",   val: "76" },
      { lbl: "통산 WAR",  val: "11.2" },
    ],
    last10: [
      { lbl: "타율",     val: ".240" },
      { lbl: "출루율",   val: ".321" },
      { lbl: "장타율",   val: ".416" },
      { lbl: "홈런",     val: "1" },
      { lbl: "타점",     val: "5" },
      { lbl: "삼진/볼넷",val: "9/4" },
    ],
    // Spark: 10 game OPS-like values for sparkline (last 10 games L→R = old→new)
    last10Spark: [0.92, 0.40, 0.61, 0.55, 0.18, 0.78, 0.30, 0.84, 0.50, 0.72],
  };

  // ---- Storybook page ----
  const storybook = {
    today: {
      title: "오늘의 경기 — 5/14",
      lines: [
        "1회말 1타석: 우중간 안타 (1B)",
        "3회말 2타석: 삼진 (좌측 변화구)",
        "5회말 3타석: 좌익선상 2루타 (1타점)",
        "7회말 4타석: 사구",
      ],
      stat: "AB 3 · H 2 · 2B 1 · BB 0 · HBP 1 · RBI 1 · R 1",
    },
    prime2024: {
      title: "전성기 시즌 — 2024",
      chips: ["WAR 8.2", "OPS 1.067", "AVG .347", "HR 38", "SB 40", "30-30 클럽", "MVP"],
      summary: "데뷔 4년차에 KBO 최초 만 20세 30-30을 달성하며 정규시즌 MVP를 차지한 시즌.",
    },
    pastNews: [
      { date: "2024.09.18", src: "스포츠경향", title: "김도영, 한국 프로야구 사상 첫 만 20세 30-30 클럽 가입" },
      { date: "2024.07.12", src: "MK스포츠",   title: "월간 MVP 4회 수상, 김도영 신드롬" },
      { date: "2024.05.07", src: "엠스플뉴스", title: "타격감 절정 — 4월 OPS 1.190" },
      { date: "2023.10.30", src: "OSEN",       title: "KS 우승의 주역, 김도영 골든글러브" },
      { date: "2022.04.02", src: "스포츠조선", title: "데뷔전 안타, KIA의 차세대 간판" },
    ],
    timeline: [
      { y: "2022", text: "신인 드래프트 1차 지명, 데뷔 시즌 103경기 출장" },
      { y: "2023", text: "주전 3루수 정착, 첫 골든글러브 (KS 우승)" },
      { y: "2024", text: "MVP · 30-30 · 골든글러브 (WAR 8.2, OPS 1.067)" },
      { y: "2025.04", text: "시즌 초 부진, 4월 OPS .640 (커브 컨택 이슈)" },
      { y: "2025.05", text: "조정기 진입 — 2주차 타격감 회복 (현재 OPS .812)" },
      { y: "2025.06", text: "팀 6연승 견인, 클러치 타율 .342" },
      { y: "2025.07", text: "올스타전 팬투표 1위 (3루 부문)" },
      { y: "예측",    text: "AI: 시즌 OPS .870 / WAR 5.1 회복 예상" },
    ],
    images: 26, // # of placeholder thumbnails
    slotsUsed: [3, 11, 19], // which thumbnail indexes are slotted
  };

  return { teams, kiaForm, dusanForm, kiaKpi, matchup, lineup, schedule, playerProfile, storybook };
})();
