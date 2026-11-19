#!/usr/bin/env node
//
//  Claim an App Store app name in every locale.
//
//  App Store name uniqueness is PER LOCALE and is decided the moment someone
//  claims it. Creating an app record claims the name in one locale only — the
//  primary one. Every other locale stays open to whoever asks first.
//
//    node appname.mjs locales
//    node appname.mjs screen  "<name>"... [--countries=us,cn]  # App Store search, read-only
//    node appname.mjs status  <appId>
//    node appname.mjs check   <appId> "<name>"           # non-destructive
//    node appname.mjs claim   <appId> "<name>" --yes     # writes
//    node appname.mjs release <appId> <locale...> --yes  # deletes localizations
//

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { asc } from './asc.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const LOCALES = readFileSync(join(HERE, '..', 'reference', 'locales.txt'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

/// The one error code that means "another developer owns this name here".
const TAKEN = 'ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE.DIFFERENT_ACCOUNT';

// ── plumbing ────────────────────────────────────────────────────────────────

async function pool(items, limit, worker) {
  const out = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return out;
}

/// States in which an appInfo's names can be written. Picked by allowlist: a
/// denylist of `READY_FOR_SALE` alone let the live record through once Apple
/// started reporting it as `state: READY_FOR_DISTRIBUTION` (2026-10-11), and a
/// probe would have renamed the published names.
const EDITABLE_STATES = new Set(['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED']);

/// The editable appInfo. A live app carries two: the published one and the
/// draft you are allowed to change. Never hand back the published one: with no
/// draft (a live app with no version being prepared), writes stop here, and
/// `status` alone reads the published record.
async function editableAppInfo(appId, { readOnly = false } = {}) {
  const r = await asc('GET', `/v1/apps/${appId}/appInfos`);
  if (!r.ok) die(`Cannot read app ${appId}: HTTP ${r.status} ${r.detail ?? ''}`);
  const infos = r.body.data ?? [];
  if (!infos.length) die(`App ${appId} has no appInfo.`);
  const editable = infos.find((i) => EDITABLE_STATES.has(i.attributes.state ?? i.attributes.appStoreState));
  if (editable) return editable.id;
  if (readOnly) return infos[0].id;
  die(`App ${appId} has no editable appInfo (states: ${infos.map((i) => i.attributes.state ?? i.attributes.appStoreState).join(', ')}). ` +
      'Create the next version record first; the published names cannot be probed or renamed.');
}

async function localizations(appInfoId) {
  const r = await asc('GET', `/v1/appInfos/${appInfoId}/appInfoLocalizations?limit=200`);
  if (!r.ok) die(`Cannot read localizations: HTTP ${r.status} ${r.detail ?? ''}`);
  const map = new Map();
  for (const l of r.body.data ?? []) {
    map.set(l.attributes.locale, { id: l.id, name: l.attributes.name });
  }
  return map;
}

const createLocalization = (appInfoId, locale, name) =>
  asc('POST', '/v1/appInfoLocalizations', {
    data: {
      type: 'appInfoLocalizations',
      attributes: { locale, name },
      relationships: { appInfo: { data: { type: 'appInfos', id: appInfoId } } },
    },
  });

const renameLocalization = (id, name) =>
  asc('PATCH', `/v1/appInfoLocalizations/${id}`, {
    data: { type: 'appInfoLocalizations', id, attributes: { name } },
  });

const deleteLocalization = (id) => asc('DELETE', `/v1/appInfoLocalizations/${id}`);

/// Whether the record has ever received a build. A record with none is a bare
/// name reservation: nothing is documented about how long Apple leaves one
/// alone, so it is a standing decision, not a settled state — say so plainly
/// rather than let it read as fine.
async function buildSummary(appId) {
  const r = await asc(
    'GET',
    `/v1/builds?filter[app]=${appId}&fields[builds]=version,uploadedDate&sort=-uploadedDate&limit=1`
  );
  if (!r.ok) return `builds: unknown (HTTP ${r.status})`;
  const total = r.body.meta?.paging?.total ?? (r.body.data ?? []).length;
  if (!total) return 'builds: none — name reservation only, never built';
  const latest = r.body.data?.[0]?.attributes;
  const when = latest?.uploadedDate ? latest.uploadedDate.slice(0, 10) : 'unknown date';
  return `builds: ${total}, latest build ${latest?.version ?? '?'} on ${when}`;
}

function die(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

// ── verdict for one locale ──────────────────────────────────────────────────

/// Probe without keeping anything. A locale the app does not have yet is
/// probed by creating and deleting; a locale it already has is probed by
/// renaming and renaming back, which is why the revert lives in a finally.
async function probe(appInfoId, locale, name, existing) {
  const held = existing.get(locale);

  if (held?.name === name) return { locale, verdict: 'yours', note: 'already claimed with this name' };

  if (!held) {
    let r;
    try {
      r = await createLocalization(appInfoId, locale, name);
    } catch (err) {
      return { locale, verdict: 'error', note: `probe failed: ${err.message}` };
    }
    if (r.status === 201) {
      const created = r.body.data.id;
      const gone = await deleteLocalization(created);
      return {
        locale,
        verdict: 'free',
        note: gone.ok ? '' : `WARNING: could not clean up probe localization ${created}`,
      };
    }
    if (r.code === TAKEN) return { locale, verdict: 'taken', note: '' };
    return { locale, verdict: 'error', note: `HTTP ${r.status} ${r.code ?? ''} ${r.detail ?? ''}` };
  }

  // Renaming a locale we hold is the only way to ask about it. Put it back.
  // A throw here must still produce a row: the caller tabulates by index, and
  // one undefined would take the whole report down with it.
  let result = { locale, verdict: 'error', note: 'probe did not complete' };
  try {
    const r = await renameLocalization(held.id, name);
    if (r.ok) result = { locale, verdict: 'free', note: `currently "${held.name}"` };
    else if (r.code === TAKEN) result = { locale, verdict: 'taken', note: `currently "${held.name}"` };
    else result = { locale, verdict: 'error', note: `HTTP ${r.status} ${r.code ?? ''} ${r.detail ?? ''}` };
  } catch (err) {
    result = { locale, verdict: 'error', note: `probe failed: ${err.message}` };
  } finally {
    if (result.verdict === 'free') {
      try {
        const back = await renameLocalization(held.id, held.name);
        if (!back.ok) result.note = `WARNING: left renamed to "${name}" — restore "${held.name}" by hand`;
      } catch (err) {
        result.note = `WARNING: left renamed to "${name}" — restore "${held.name}" by hand (${err.message})`;
      }
    }
  }
  return result;
}

async function claimOne(appInfoId, locale, name, existing) {
  const held = existing.get(locale);
  if (held?.name === name) return { locale, verdict: 'yours', note: '' };

  try {
    const r = held ? await renameLocalization(held.id, name) : await createLocalization(appInfoId, locale, name);
    if (r.ok) return { locale, verdict: 'claimed', note: held ? `was "${held.name}"` : '' };
    if (r.code === TAKEN) return { locale, verdict: 'taken', note: held ? `left as "${held.name}"` : '' };
    return { locale, verdict: 'error', note: `HTTP ${r.status} ${r.code ?? ''} ${r.detail ?? ''}` };
  } catch (err) {
    return { locale, verdict: 'error', note: `claim failed: ${err.message}` };
  }
}

// ── reporting ───────────────────────────────────────────────────────────────

const MARK = { free: '·', yours: '=', claimed: '+', taken: 'X', error: '!' };

function report(name, rows) {
  const width = Math.max(...rows.map((r) => r.locale.length));
  for (const row of rows) {
    const note = row.note ? `  ${row.note}` : '';
    console.log(`  ${MARK[row.verdict] ?? '?'} ${row.locale.padEnd(width)}  ${row.verdict}${note}`);
  }

  const count = (v) => rows.filter((r) => r.verdict === v).length;
  const taken = rows.filter((r) => r.verdict === 'taken').map((r) => r.locale);
  const failed = rows.filter((r) => r.verdict === 'error');

  console.log('');
  console.log(`  "${name}": ${count('free') + count('yours') + count('claimed')}/${rows.length} locales available or held`);
  if (taken.length) console.log(`  taken by another account in: ${taken.join(', ')}`);
  if (failed.length) {
    console.log(`  ${failed.length} locale(s) errored — rerun before trusting this result:`);
    for (const f of failed) console.log(`    ${f.locale}: ${f.note}`);
  }
  return { clean: taken.length === 0 && failed.length === 0, taken, failed };
}

// ── App Store search screen ─────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const squash = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/// One iTunes Search API query. The API throttles at roughly 20 requests a
/// minute and answers 403 once over it, for a minute or more; a query that
/// never gets through returns null, which the caller must print as unknown —
/// never as "no such app".
async function storeSearch(term, country) {
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term, country, entity: 'software', limit: '50' })}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const r = await fetch(url);
      if (r.ok) return (await r.json()).results ?? [];
      if (r.status !== 403 && r.status !== 429) return null;
    } catch { /* network blip: retry */ }
    await sleep(60_000);
  }
  return null;
}

/// Apps already trading on the name: their title starts with it once spaces and
/// punctuation are gone ("Flip Photo" for FlipPhoto), or carries it as a word.
function sameName(name, results) {
  const n = squash(name);
  const word = new RegExp(`(^|[^\\p{L}])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu');
  return results.filter((a) => squash(a.trackName).startsWith(n) || word.test(a.trackName));
}

// ── commands ────────────────────────────────────────────────────────────────

const [command, ...rest] = process.argv.slice(2);
const args = rest.filter((a) => !a.startsWith('--'));
const flags = new Set(rest.filter((a) => a.startsWith('--')));

/// `--except=zh-Hans,ja` holds a locale back. Needed when a locale's name is
/// pinned by something outside the App Store — a mainland China listing is
/// expected to match its ICP filing (App Store Connect accepted a zh-Hans name
/// that did not, 2026-10-11, so nothing here will stop you). Renaming such a
/// locale would release a name you are not free to give up.
const except = new Set(
  [...flags]
    .filter((f) => f.startsWith('--except='))
    .flatMap((f) => f.slice('--except='.length).split(',').map((l) => l.trim()))
    .filter(Boolean)
);
/// `--only=en-US,zh-Hans` probes or claims just those: the locales the app
/// actually ships, rather than listing the other 37 under `--except`.
const only = new Set(
  [...flags]
    .filter((f) => f.startsWith('--only='))
    .flatMap((f) => f.slice('--only='.length).split(',').map((l) => l.trim()))
    .filter(Boolean)
);
for (const l of only) if (!LOCALES.includes(l)) die(`--only: unknown locale ${l}`);
const targetLocales = LOCALES.filter((l) => !except.has(l) && (!only.size || only.has(l)));

switch (command) {
  case 'locales': {
    console.log(LOCALES.join('\n'));
    console.log(`\n${LOCALES.length} locales`);
    break;
  }

  case 'screen': {
    if (!args.length) die('usage: appname.mjs screen "<name>"... [--countries=us,cn]');
    const countries = ([...flags].find((f) => f.startsWith('--countries='))?.slice('--countries='.length) ?? 'us,cn')
      .split(',').map((c) => c.trim()).filter(Boolean);
    for (const name of args) {
      console.log(name);
      for (const country of countries) {
        const results = await storeSearch(name, country);
        await sleep(3_000);
        if (!results) { console.log(`  ${country}: UNKNOWN — search throttled or failed; rerun before trusting`); continue; }
        const hits = sameName(name, results);
        const top = results.slice(0, 5).map((a) => `${a.trackName.slice(0, 32)} (${a.userRatingCount ?? 0})`);
        console.log(`  ${country}: ${hits.length ? `${hits.length} same-name: ${hits.slice(0, 4).map((a) => `${a.trackName.slice(0, 32)} (${a.userRatingCount ?? 0})`).join('; ')}` : 'no same-name app'}`);
        // What people searching this word get today. A free name can still be
        // a phrase that already means something else in the store.
        if (top.length) console.log(`      top: ${top.join('; ')}`);
      }
    }
    break;
  }

  case 'status': {
    const [appId] = args;
    if (!appId) die('usage: appname.mjs status <appId>');
    const app = await asc('GET', `/v1/apps/${appId}?fields[apps]=name,bundleId,primaryLocale,sku`);
    if (!app.ok) die(`HTTP ${app.status} ${app.detail ?? ''}`);
    const a = app.body.data.attributes;
    console.log(`${a.name}  (${a.bundleId})`);
    console.log(`  primary locale: ${a.primaryLocale}    sku: ${a.sku}`);

    console.log(`  ${await buildSummary(appId)}`);

    const appInfoId = await editableAppInfo(appId, { readOnly: true });
    const existing = await localizations(appInfoId);
    console.log(`  appInfo: ${appInfoId}`);
    console.log(`  claimed in ${existing.size}/${LOCALES.length} locales:`);
    for (const [locale, v] of [...existing].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`    ${locale.padEnd(8)} ${v.name}`);

    const missing = LOCALES.filter((l) => !existing.has(l));
    if (missing.length) console.log(`\n  unclaimed (${missing.length}): ${missing.join(', ')}`);
    break;
  }

  case 'check': {
    const [appId, name] = args;
    if (!appId || !name) die('usage: appname.mjs check <appId> "<name>"');
    const appInfoId = await editableAppInfo(appId);
    const existing = await localizations(appInfoId);
    console.log(`Probing "${name}" across ${targetLocales.length} locales (nothing is kept)…`);
    if (except.size) console.log(`Holding back: ${[...except].join(', ')}`);
    console.log('');
    const rows = await pool(targetLocales, 3, (locale) => probe(appInfoId, locale, name, existing));
    const { clean } = report(name, rows);
    process.exit(clean ? 0 : 1);
  }

  case 'claim': {
    const [appId, name] = args;
    if (!appId || !name) die('usage: appname.mjs claim <appId> "<name>" --yes');
    if (!flags.has('--yes')) die('claim writes to App Store Connect — pass --yes to confirm');
    const appInfoId = await editableAppInfo(appId);
    const existing = await localizations(appInfoId);
    console.log(`Claiming "${name}" across ${targetLocales.length} locales…`);
    if (except.size) console.log(`Holding back: ${[...except].join(', ')}`);
    console.log('');
    const rows = await pool(targetLocales, 3, (locale) => claimOne(appInfoId, locale, name, existing));
    const { clean } = report(name, rows);
    process.exit(clean ? 0 : 1);
  }

  case 'release': {
    const [appId, ...locales] = args;
    if (!appId || !locales.length) die('usage: appname.mjs release <appId> <locale...> --yes');
    if (!flags.has('--yes')) die('release deletes localizations — pass --yes to confirm');

    // The primary locale carries the app's own name. Dropping it is not an undo,
    // it is deleting the identity of the record, so refuse rather than find out
    // whether Apple happens to stop us.
    const app = await asc('GET', `/v1/apps/${appId}?fields[apps]=primaryLocale`);
    if (!app.ok) die(`HTTP ${app.status} ${app.detail ?? ''}`);
    const primary = app.body.data.attributes.primaryLocale;
    if (locales.includes(primary)) {
      die(`${primary} is this app's primary locale — its name cannot be released. ` +
          `Rename it with \`claim\` instead.`);
    }

    const appInfoId = await editableAppInfo(appId);
    const existing = await localizations(appInfoId);
    for (const locale of locales) {
      const held = existing.get(locale);
      if (!held) { console.log(`  - ${locale}: not present`); continue; }
      const r = await deleteLocalization(held.id);
      console.log(`  ${r.ok ? '-' : '!'} ${locale}: ${r.ok ? `deleted ("${held.name}")` : `HTTP ${r.status} ${r.detail ?? ''}`}`);
    }
    break;
  }

  default:
    console.error(`App Store app-name claiming — names are reserved per locale.

  appname.mjs locales
  appname.mjs screen  "<name>"... [--countries=us,cn]   App Store search for same-name apps (read-only)
  appname.mjs status  <appId>
  appname.mjs check   <appId> "<name>"           probe all locales, keep nothing
  appname.mjs claim   <appId> "<name>" --yes     claim the name everywhere
  appname.mjs release <appId> <locale...> --yes  delete those localizations

check/claim take --only=<locales> or --except=<locales>.
<appId> is the number in the App Store Connect URL (/apps/<appId>/...).
Credentials: ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_PATH (or ASC_P8, the .p8 in base64).`);
    process.exit(2);
}
