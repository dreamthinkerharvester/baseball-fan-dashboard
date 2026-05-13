// Design Ref: §6.4 — Discord webhook alerting.
// DISCORD_WEBHOOK_URL 미설정 시 silent skip (개발 환경 안전).

import axios from 'axios';

export interface DiscordPayload {
  severity: 'info' | 'warn' | 'critical';
  text: string;
}

export async function sendDiscord(payload: DiscordPayload): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[discord:skip] ${payload.severity}: ${payload.text}`);
    }
    return;
  }

  const emoji =
    payload.severity === 'critical' ? '🚨' : payload.severity === 'warn' ? '⚠️' : 'ℹ️';

  try {
    await axios.post(
      webhook,
      { content: `${emoji} ${payload.text}` },
      { timeout: 10_000 },
    );
  } catch (e: unknown) {
    // Discord 실패는 silent (alerting 자체가 시스템 안정에 영향 주면 안 됨).
    console.error(`[discord:fail] ${(e as Error).message}`);
  }
}
