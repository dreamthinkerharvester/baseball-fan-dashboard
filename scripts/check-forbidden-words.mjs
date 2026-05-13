#!/usr/bin/env node
// Plan FR-22 + Design §7 — IP-protected term scanner.
//
// Allowlist marker: line containing "forbidden-words-allow:disclaimer".
// 마커가 같은 줄 OR 위 5줄 안에 있으면 통과. 이 스크립트 자신은 스캔에서 제외.
//
// Default scan: src/, scripts/, public/, README.md (excluding docs/ which is human prose).

import { readdirSync, readFileSync, statSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SELF = realpathSync(fileURLToPath(import.meta.url));
const TARGETS = ['src', 'scripts', 'public', 'README.md'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.md']);
// 정규식. 한글 + 영문 음역 모두 포함. 대소문자 무시.
const FORBIDDEN = /(마구마구|Magumagu|네오위즈|넷마블|Neowiz|Netmarble)/i;
const ALLOW_MARKER = /forbidden-words-allow:disclaimer/;
const ALLOW_LOOKBACK = 5; // 마커가 위 5줄 안에 있으면 허용

const findings = [];

function walk(p) {
  const stat = statSync(p);
  if (stat.isDirectory()) {
    for (const child of readdirSync(p)) walk(join(p, child));
    return;
  }
  if (!stat.isFile()) return;
  // Skip self (the scanner contains the regex literal)
  try {
    if (realpathSync(p) === SELF) return;
  } catch {
    // ignore
  }
  if (!EXTENSIONS.has(p.slice(p.lastIndexOf('.')))) return;
  const text = readFileSync(p, 'utf8');
  const lines = text.split(/\r?\n/);
  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    if (!FORBIDDEN.test(line)) continue;
    if (ALLOW_MARKER.test(line)) continue;
    // lookback: 마커가 위 N줄 안에 있는지
    const start = Math.max(0, idx - ALLOW_LOOKBACK);
    let allowed = false;
    for (let j = start; j < idx; j += 1) {
      if (ALLOW_MARKER.test(lines[j])) {
        allowed = true;
        break;
      }
    }
    if (!allowed) {
      findings.push({ file: relative(ROOT, p), line: idx + 1, text: line.trim() });
    }
  }
}

for (const target of TARGETS) {
  const p = join(ROOT, target);
  try {
    walk(p);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

if (findings.length > 0) {
  console.error('❌ Forbidden IP-protected term(s) detected:\n');
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  ${f.text}`);
  }
  console.error(
    '\nIf this is the legal disclaimer, add the marker comment within 5 lines above the violation:\n  // forbidden-words-allow:disclaimer  (or HTML comment / block comment)',
  );
  process.exit(1);
}

console.log('✅ No forbidden IP-protected terms found.');
