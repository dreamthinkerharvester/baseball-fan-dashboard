import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#0F1320',
          card: '#1a1a2e',
          cardEnd: '#16213e',
          panel: '#161a2c',
        },
        text: {
          primary: '#F7F8FA',
          muted: 'rgba(247,248,250,0.6)',
          dim: 'rgba(247,248,250,0.4)',
        },
        grade: {
          elite: '#7B2FBE',
          rare: '#E63946',
          special: '#F4A261',
          normal: '#457B9D',
        },
        team: {
          // 팀 컬러는 lib/constants의 TEAMS에서 관리 (CSS 변수로 동적 주입)
        },
      },
      boxShadow: {
        'glow-elite': '0 0 14px rgba(123,47,190,0.5), inset 0 0 4px rgba(123,47,190,0.3)',
        'glow-rare': '0 0 12px rgba(230,57,70,0.4)',
        'glow-special': '0 0 10px rgba(244,162,97,0.4)',
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          'Roboto Flex',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        brand: [
          'Roboto Flex',
          'Pretendard Variable',
          'Pretendard',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'Roboto Mono',
          'ui-monospace',
          'SF Mono',
          'Menlo',
          'monospace',
        ],
      },
      fontSize: {
        caption: ['11px', { lineHeight: '14px' }],
        body: ['13px', { lineHeight: '18px' }],
        heading: ['16px', { lineHeight: '22px', fontWeight: '600' }],
        display: ['22px', { lineHeight: '28px', fontWeight: '700' }],
      },
      spacing: {
        // 4px grid (Tailwind 기본 4px와 일치)
      },
      borderRadius: {
        card: '8px',
        badge: '4px',
        button: '6px',
        modal: '16px',
      },
      gridTemplateColumns: {
        'lineup-mobile': 'repeat(3, minmax(0, 1fr))',
        'lineup-desktop': 'repeat(5, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
};

export default config;
