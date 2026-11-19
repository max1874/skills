#!/usr/bin/env node
//
//  Minimal App Store Connect API client, Node 22+.
//
//  Signs with an App Store Connect API key from the environment: ASC_KEY_ID,
//  ASC_ISSUER_ID, and the .p8 private key as ASC_KEY_PATH (a file) or ASC_P8
//  (the file's contents, base64).
//
//  As a library:  import { asc } from './asc.mjs'; const r = await asc('GET', '/v1/apps');
//  As a CLI:      node asc.mjs GET /v1/apps/123
//                 node asc.mjs PATCH /v1/appInfoLocalizations/ID '{"data":{...}}'
//

import { sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

let key;
/// ES256 JWT, valid ten minutes, signed fresh per request so long sweeps never expire.
function makeToken() {
  const { ASC_KEY_ID: kid, ASC_ISSUER_ID: iss, ASC_KEY_PATH: file, ASC_P8: p8 } = process.env;
  if (!kid || !iss || !(file || p8)) throw new Error('set ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_PATH (or ASC_P8)');
  key ??= file ? readFileSync(file, 'utf8') : Buffer.from(p8, 'base64').toString();
  const now = Math.floor(Date.now() / 1000);
  const part = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const input = `${part({ alg: 'ES256', kid, typ: 'JWT' })}.${part({ iss, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' })}`;
  return `${input}.${sign('sha256', Buffer.from(input), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`;
}

/// One request. Never throws on an HTTP error — the caller reads `status` and
/// `errors`, because "this name is taken" arrives as a 409 and is a normal
/// answer here, not a failure. Only network faults retry.
export async function asc(method, path, body) {
  const token = makeToken(); // outside the retry loop: missing credentials are not a network fault
  let res;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
        method: method.toUpperCase(),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      });
    } catch (err) {
      if (attempt >= 5) throw err;
      await new Promise((r) => setTimeout(r, 800 * attempt));
      continue;
    }
    // 429 is throttling, not an answer. Sweeping 39 locales trips it, and a
    // throttled probe reported as an error reads exactly like a name that could
    // not be checked — so back off and ask again rather than hand back a gap.
    if (res.status !== 429 || attempt >= 6) break;
    const retryAfter = Number(res.headers.get('retry-after'));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * attempt;
    await new Promise((r) => setTimeout(r, waitMs));
  }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
  return {
    ok: res.ok,
    status: res.status,
    body: json,
    text,
    errors: json?.errors ?? [],
    code: json?.errors?.[0]?.code ?? null,
    detail: json?.errors?.[0]?.detail ?? null,
  };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [method, path, body] = process.argv.slice(2);
  if (!method || !path) {
    console.error('usage: asc.mjs <METHOD> <path> [jsonBody]');
    process.exit(2);
  }
  const r = await asc(method, path, body);
  console.error(`HTTP ${r.status}`);
  console.log(r.body ? JSON.stringify(r.body, null, 2) : r.text);
  process.exit(r.ok ? 0 : 1);
}
