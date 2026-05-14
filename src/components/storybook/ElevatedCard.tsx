// M3 Elevated Card with overline + headline pattern.
// Design Ref: m3-comp/screens.jsx Screen3 ElevatedCard.

interface Props {
  overline: string;
  headline: string;
  accent?: boolean;
  mono?: boolean;
  children: React.ReactNode;
}

export function ElevatedCard({ overline, headline, accent, mono, children }: Props) {
  const background = accent
    ? 'color-mix(in oklab, var(--md-sys-color-tertiary-container) 24%, var(--md-sys-color-surface-container-low))'
    : 'var(--md-sys-color-surface-container-low)';
  return (
    <section
      className="m3-card"
      style={{
        padding: 16,
        background,
        borderRadius: 'var(--md-sys-shape-corner-large)',
      }}
    >
      <div
        style={{
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 4,
          fontSize: 12,
          lineHeight: '16px',
          fontWeight: 500,
          color: accent ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        {overline}
      </div>
      <h2
        style={{
          margin: 0,
          marginBottom: 12,
          fontFamily: mono ? 'var(--md-ref-typeface-mono)' : 'var(--md-ref-typeface-brand)',
          fontSize: mono ? 18 : 22,
          lineHeight: '26px',
          fontWeight: 600,
          color: 'var(--md-sys-color-on-surface)',
        }}
      >
        {headline}
      </h2>
      {children}
    </section>
  );
}
