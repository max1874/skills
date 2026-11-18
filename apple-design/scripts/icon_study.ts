#!/usr/bin/env node
/*
Rebuild the app-icon study: two top-250 lists, their icons, per-icon stats, contact sheets.

Lists (method recorded in references/app-icon-study.md):
  appstore  iOS top 250 from Apple's free legacy chart feeds, CN + US:
            itunes.apple.com/<cc>/rss/{topfreeapplications,topgrossingapplications,
            toppaidapplications}/limit=200/json (each answers 100 entries). Six charts are
            merged round-robin by rank (cn-free, us-free, cn-grossing, us-grossing, cn-paid,
            us-paid), games dropped (the free/paid app charts exclude them; grossing does
            not), deduped by app id, first 250 kept. A batched iTunes lookup adds the 512 px
            artwork and `supportedDevices`; one iTunes search per app (entity=macSoftware)
            finds a separate Mac App Store app.
  outside   Mac apps distributed directly: Homebrew cask installs over 365 days
            (formulae.brew.sh/api/analytics/cask-install/365d.json, tap variants summed per
            token) joined with formulae.brew.sh/api/cask.json; kept when the cask installs an
            .app (or is a GUI app shipped as .pkg, allowlisted below); fonts, drivers, CLI
            tools, SDKs, runtimes and @-variants dropped; first 250 kept.
Icon source per outside app, first hit wins: Mac App Store record by bundle id (batched
lookup) -> Mac App Store search by exact name -> the icon macOS draws for a copy installed
in /Applications (NSWorkspace) -> an app-icon PNG in the app's GitHub repo (found from the
homepage, the cask download URL, or a GitHub link on the homepage; read with `gh api`) ->
the homepage's largest declared PNG icon (apple-touch-icon, web manifest, icon <img>).
Misses are recorded with the reason; nothing is substituted.

Everything lands in ~/.cache/apple-design/icons/ (other companies' artwork is not ours to
redistribute; never commit it). HTTP responses are cached there, so a rerun resumes.
iTunes search/lookup are paced at one request per 3.3 s (they answer 429 above ~20/min).

Usage (Node.js 22.18+ built-ins only; sips and headless Chrome from macOS):
  node icon_study.ts lists      # feeds + Homebrew -> appstore.json, outside.json
  node icon_study.ts adjacent   # ADJACENT apps (named below) -> adjacent.json + adjacent/<key>.png
  node icon_study.ts fetch      # icons -> appstore/<id>.png, outside/<token>.png
  node icon_study.ts stats      # stats.json (hue, lightness, colors, gradient)
  node icon_study.ts sheets     # sheets/*.html + *.png (50 per sheet), index.html
  node icon_study.ts index      # index.html only (best picks from icon_tags.tsv)
  node icon_study.ts report     # aggregate tables (stats + tags) as Markdown on stdout
  node icon_study.ts all        # lists adjacent fetch stats sheets
Options: --out DIR (default ~/.cache/apple-design/icons), --refresh (refetch feeds),
--refetch-web (retry icons that came from a homepage), --no-png (skip sheet rendering).
Visual tags (judged by eye from the sheets) live next to this script in icon_tags.tsv.

Ported from a Python original with byte-identical output, so a few helpers below reproduce
Python's semantics (round half to even, float repr, json.dumps spacing, urljoin, sum).
*/
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync, writeSync } from "node:fs";
import { STATUS_CODES } from "node:http";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, extname, join } from "node:path";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) icon-study";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TAGS = join(import.meta.dirname, "icon_tags.tsv");
const N = 250;
const ITUNES_GAP = 3.3;

const CHARTS = [["cn", "topfreeapplications"], ["us", "topfreeapplications"],
  ["cn", "topgrossingapplications"], ["us", "topgrossingapplications"],
  ["cn", "toppaidapplications"], ["us", "toppaidapplications"]];
const GAME_GENRE = "6014";

// GUI apps Homebrew installs through a .pkg (no `app` artifact).
const PKG_GUI = new Set([
  "zoom", "tailscale-app", "karabiner-elements", "adobe-acrobat-reader", "microsoft-teams",
  "google-drive", "logi-options+", "windows-app", "cloudflare-warp", "microsoft-excel",
  "microsoft-word", "microsoft-powerpoint", "microsoft-outlook", "onedrive",
  "openvpn-connect", "teamviewer", "nordvpn", "nextcloud", "virtualbox",
]);
// Casks with an .app that are runtimes, compatibility layers, or CLI wrappers.
const NOT_GUI = new Set(["wine-stable", "wine@staging", "wine@devel", "kiro-cli", "orca", "r-app",
  "anaconda", "miniconda", "miniforge"]);

// Apps adjacent to small personal utilities (messaging, 2FA, passwords, clipboard, device-to-device),
// looked up whether or not they chart: (label, search term, artist substring, entity, country).
const ADJACENT = [
  ["1Password", "1Password", "AgileBits", "software", "us"],
  ["Authy", "Twilio Authy", "Twilio", "software", "us"],
  ["Google Authenticator", "Google Authenticator", "Google", "software", "us"],
  ["Microsoft Authenticator", "Microsoft Authenticator", "Microsoft", "software", "us"],
  ["Duo Mobile", "Duo Mobile", "Cisco", "software", "us"],
  ["2FAS", "2FAS Auth", "2FAS", "software", "us"],
  ["Ente Auth", "Ente Auth", "ente", "software", "us"],
  ["Bitwarden", "Bitwarden Password Manager", "Bitwarden", "software", "us"],
  ["Proton Pass", "Proton Pass", "Proton", "software", "us"],
  ["Signal", "Signal Private Messenger", "Signal", "software", "us"],
  ["Telegram", "Telegram Messenger", "Telegram", "software", "us"],
  ["WhatsApp", "WhatsApp Messenger", "WhatsApp", "software", "us"],
  ["LINE", "LINE", "LINE", "software", "us"],
  ["Threema", "Threema", "Threema", "software", "us"],
  ["LocalSend", "LocalSend", "Tien Do Nam", "software", "us"],
  ["AirDroid", "AirDroid", "SAND STUDIO", "software", "us"],
  ["KDE Connect", "KDE Connect", "KDE", "software", "us"],
  ["Link to Windows", "Link to Windows", "Microsoft", "software", "us"],
  ["Pushover", "Pushover Notifications", "Superblock", "software", "us"],
  ["Bark", "Bark - Customed Notifications", "", "software", "us"],
  ["ntfy", "ntfy", "Philipp", "software", "us"],
  ["Tailscale", "Tailscale", "Tailscale", "software", "us"],
  ["Paste", "Paste - Limitless Clipboard", "", "software", "us"],
  ["Things 3", "Things 3", "Cultured Code", "software", "us"],
  ["Bear", "Bear Markdown Notes", "Shiny Frog", "software", "us"],
  ["Craft", "Craft Docs and Notes", "Craft", "software", "us"],
  ["Linear", "Linear Mobile", "Linear", "software", "us"],
  ["Arc Search", "Arc Search", "Browser Company", "software", "us"],
  ["Pushbullet", "Pushbullet", "Pushbullet", "software", "us"],
  ["Raycast", "Raycast", "Raycast", "software", "us"],
  ["Day One", "Day One Journal", "Bloom", "software", "us"],
  ["Halide", "Halide Mark II", "Lux", "software", "us"],
  ["Overcast", "Overcast", "Overcast", "software", "us"],
  ["Flighty", "Flighty", "Flighty", "software", "us"],
  ["Mona", "Mona for Mastodon", "", "software", "us"],
];

const expanduser = (p: string) => p.replace(/^~(?=\/|$)/, () => (process.env.HOME ?? homedir()).replace(/\/+$/, ""));
let OUT = expanduser("~/.cache/apple-design/icons");
let lastItunes = 0;

const log = (...a: unknown[]) => writeSync(2, a.join(" ") + "\n");
const print = (s = "") => writeSync(1, s + "\n");
const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

// ---------------------------------------------------------------- Python semantics

// round() rounds the exact binary value half to even; toFixed(100) spells that value out.
function pyRound(x: number, nd = 0) {
  const [int, frac] = Math.abs(x).toFixed(100).split(".");
  const keep = int + frac.slice(0, nd), rest = frac.slice(nd);
  const up = rest[0] > "5" || (rest[0] === "5" && (/[1-9]/.test(rest.slice(1)) || Number(keep.at(-1)) % 2 === 1));
  const s = (BigInt(keep) + (up ? 1n : 0n)).toString().padStart(nd + 1, "0");
  return Math.sign(x) * Number(nd ? `${s.slice(0, -nd)}.${s.slice(-nd)}` : s);
}
// A float in JSON as Python writes it ("50.0", not "50").
const float = (x: number, nd: number) => {
  const v = pyRound(x, nd);
  return JSON.rawJSON(Number.isInteger(v) ? v.toFixed(1) : String(v));
};
// sum() of floats (Neumaier compensation, Python 3.12+).
function fsum(xs: number[]) {
  let s = 0, c = 0;
  for (const x of xs) {
    const t = s + x;
    c += Math.abs(s) >= Math.abs(x) ? (s - t) + x : (x - t) + s;
    s = t;
  }
  return c && Number.isFinite(c) ? s + c : s;
}
// a // b for positive floats.
function floordiv(a: number, b: number) {
  const d = (a - (a % b)) / b, f = Math.floor(d);
  return d - f > 0.5 ? f + 1 : f;
}
// math.dist: the correctly rounded root of the exact sum of squares (integers stay exact in doubles).
function dist(p: number[], q: number[]) {
  const d = p.map((v, i) => Math.abs(v - q[i]));
  if (d.every(Number.isInteger)) return Math.sqrt(d.reduce((s, x) => s + x * x, 0));
  const parts = d.map((x) => {
    let e = 0;
    for (; !Number.isInteger(x); e++) x *= 2;
    return [BigInt(x), e] as const;
  });
  const E = Math.max(...parts.map(([, e]) => e));
  const S = parts.reduce((s, [m, e]) => s + (m << BigInt(E - e)) ** 2n, 0n) << 128n;
  let r = 1n << BigInt((S.toString(2).length + 1) >> 1);
  for (let y = (r + S / r) >> 1n; y < r; y = (r + S / r) >> 1n) r = y;
  let v = Number(r * 2n + (r * r === S ? 0n : 1n)); // a sticky bit, so Number() rounds ties correctly
  for (let k = E + 65; k > 0; k -= 512) v /= 2 ** Math.min(k, 512);
  return v;
}
// Python's str.strip() whitespace set.
const strip = (s: string) => s.replace(/^[\t-\r\x1c-\x20\x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+|[\t-\r\x1c-\x20\x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/g, "");
// json.dumps() defaults: ", " and ": " separators, non-ASCII escaped.
const pyjson = (v: any): string => Array.isArray(v) ? `[${v.map(pyjson).join(", ")}]`
  : v && typeof v === "object" ? `{${Object.entries(v).map(([k, x]) => `${pyjson(k)}: ${pyjson(x)}`).join(", ")}}`
  : JSON.stringify(v).replace(/[\x7f-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
// urllib.parse.quote(s), safe "/".
const quote = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()).replaceAll("%2F", "/");
const htmlEscape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
// html.unescape for what icon links carry: numeric references and the common named ones
// (Python also decodes the other HTML5 names; they did not occur in the study's pages).
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\xa0" };
const htmlUnescape = (s: string) => s.replace(/&(#\d+|#[xX][0-9a-fA-F]+|amp|lt|gt|quot|apos|nbsp);?/g, (m, e: string) => {
  if (e[0] !== "#") return ENTITIES[e];
  const n = Number(/^#[xX]/.test(e) ? "0x" + e.slice(2) : e.slice(1));
  return n === 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff) ? "\ufffd" : String.fromCodePoint(n);
});

const USES_RELATIVE = ["", "ftp", "http", "gopher", "nntp", "imap", "wais", "file", "https", "shttp", "mms",
  "prospero", "rtsp", "rtsps", "rtspu", "sftp", "svn", "svn+ssh", "ws", "wss"];
const USES_NETLOC = ["", "ftp", "http", "gopher", "nntp", "telnet", "imap", "wais", "file", "mms", "https", "shttp",
  "snews", "prospero", "rtsp", "rtsps", "rtspu", "rsync", "svn", "svn+ssh", "sftp", "nfs", "git", "git+ssh", "ws", "wss", "itms-services"];
type Parts = { scheme?: string; netloc?: string; path: string; query?: string; fragment?: string };
// urllib.parse._urlsplit (Python 3.15): undefined is a missing component, "" an empty one ("x?" keeps its "?").
function urlsplit(url: string): Parts {
  url = url.replace(/^[\x00-\x20]+/, "").replace(/[\t\r\n]/g, "");
  const p: Parts = { path: "" };
  const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(url);
  if (m) [p.scheme, url] = [m[1].toLowerCase(), url.slice(m[0].length)];
  if (url.startsWith("//")) {
    const end = url.slice(2).search(/[/?#]/) + 2;
    [p.netloc, url] = end < 2 ? [url.slice(2), ""] : [url.slice(2, end), url.slice(end)];
  }
  const hash = url.indexOf("#");
  if (hash >= 0) [url, p.fragment] = [url.slice(0, hash), url.slice(hash + 1)];
  const q = url.indexOf("?");
  if (q >= 0) [url, p.query] = [url.slice(0, q), url.slice(q + 1)];
  p.path = url;
  return p;
}
function urlunsplit({ scheme, netloc, path, query, fragment }: Parts) {
  if (netloc !== undefined) path = "//" + netloc + (path && !path.startsWith("/") ? "/" + path : path);
  else if (path.startsWith("//")) path = "//" + path;
  return (scheme ? scheme + ":" : "") + path + (query === undefined ? "" : "?" + query) + (fragment === undefined ? "" : "#" + fragment);
}
// urllib.parse.urljoin (Python 3.15): RFC 3986 dot-segment removal, no normalization.
function urljoin(base: string, url: string) {
  if (!base) return url;
  if (!url) return base;
  const b = urlsplit(base), u = urlsplit(url);
  u.scheme ??= b.scheme;
  if (u.scheme !== b.scheme || (u.scheme && !USES_RELATIVE.includes(u.scheme))) return url;
  if (!u.scheme || USES_NETLOC.includes(u.scheme)) {
    if (u.netloc) return urlunsplit(u);
    u.netloc = b.netloc;
  }
  if (!u.path) {
    if (u.query === undefined) [u.query, u.fragment] = [b.query, u.fragment ?? b.fragment];
    return urlunsplit({ ...u, path: b.path });
  }
  const baseParts = b.path.split("/");
  if (baseParts.at(-1) !== "") baseParts.pop();
  let segments = u.path.split("/");
  if (!u.path.startsWith("/")) {
    segments = [...baseParts, ...segments];
    segments = [segments[0], ...segments.slice(1, -1).filter(Boolean), segments.at(-1)!];
  }
  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === "..") resolved.pop();
    else if (seg !== ".") resolved.push(seg);
  }
  if ([".", ".."].includes(segments.at(-1)!)) resolved.push("");
  return urlunsplit({ ...u, path: resolved.join("/") || "/" });
}
const hostname = (url: string) => {
  const host = (urlsplit(url).netloc ?? "").split("@").at(-1)!;
  return (host.startsWith("[") ? host.slice(1).split("]")[0] : host.split(":")[0]).toLowerCase();
};

class HTTPError extends Error {
  code: number;
  constructor(code: number, reason: string) {
    super(`HTTP Error ${code}: ${reason}`);
    this.name = "HTTPError";
    this.code = code;
  }
}
// The Python exception class a failed request would have raised.
const errorName = (e: any) => (e.name === "HTTPError" || e.name === "TimeoutError" ? e.name : "URLError");

function run(cmd: string, args: string[], options: object = {}) {
  const r = spawnSync(cmd, args, { maxBuffer: 1 << 30, ...options });
  if (r.error) throw r.error;
  return r;
}

const cachePath = (url: string, ext: string) => join(OUT, "http", createHash("sha1").update(url).digest("hex") + ext);

/** GET with an on-disk cache; paces and retries itunes.apple.com. */
async function get(url: string, binary: true, refresh?: boolean, timeout?: number): Promise<Buffer>;
async function get(url: string, binary?: false, refresh?: boolean, timeout?: number): Promise<string>;
async function get(url: string, binary = false, refresh = false, timeout = 25) {
  const path = cachePath(url, binary ? ".bin" : ".txt");
  const decode = (data: Buffer) => (binary ? data : data.toString("utf8"));
  if (!refresh && existsSync(path)) return decode(readFileSync(path));
  const paced = url.includes("itunes.apple.com/search") || url.includes("itunes.apple.com/lookup");
  let data: Buffer;
  for (let attempt = 0; ; attempt++) {
    if (attempt === 6) throw new Error(`gave up on ${url}`);
    if (paced) {
      const wait = lastItunes + ITUNES_GAP - Date.now() / 1000;
      if (wait > 0) await sleep(wait);
      lastItunes = Date.now() / 1000;
    }
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" }, signal: AbortSignal.timeout(timeout * 1000) });
      // HTTP/2 responses carry no reason phrase; Python (always HTTP/1.1) reports the standard one.
      if (!r.ok) throw new HTTPError(r.status, r.statusText || STATUS_CODES[r.status] || "");
      data = Buffer.from(await r.arrayBuffer());
      break;
    } catch (e) {
      if (e instanceof HTTPError) {
        if ((e.code === 429 || e.code === 403) && paced) {
          log(`  ${e.code} from iTunes, sleeping 65 s`);
          await sleep(65);
          continue;
        }
        if (e.code >= 500 && attempt < 2) {
          await sleep(3);
          continue;
        }
        throw e;
      }
      if (attempt >= 2) throw e;
      await sleep(3);
    }
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  return decode(data);
}

const getJson = async (url: string, refresh = false) => JSON.parse(await get(url, false, refresh));

const save = (name: string, obj: unknown) => writeFileSync(join(OUT, name), JSON.stringify(obj, null, 1));

function load(name: string, fallback: any = null) {
  const p = join(OUT, name);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback;
}

const norm = (name: string) => name.split(/\s[-–—|:]\s|[\uff1a:|\uff08(]|\s-\s/)[0].toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const len = (s: string) => [...s].length;
const keyOf = (lst: string, a: any) => `${lst}:${a.key || a.id || a.token}`;

// ---------------------------------------------------------------- lists

async function buildAppstore(refresh: boolean) {
  const charts: [string, string, string | null, any[]][] = [];
  for (const [cc, feed] of CHARTS) {
    const d = await getJson(`https://itunes.apple.com/${cc}/rss/${feed}/limit=200/json`, refresh);
    charts.push([cc, feed, d.feed.updated?.label ?? null, d.feed.entry ?? []]);
    log(`${cc} ${feed}: ${charts.at(-1)![3].length} entries, updated ${charts.at(-1)![2] ?? "None"}`);
  }
  const apps = new Map<string, any>();
  let order: string[] = [];
  for (const [cc, feed, , entries] of charts) {
    entries.forEach((e, i) => {
      const aid = e.id.attributes["im:id"];
      const cat = e.category.attributes;
      if (!apps.has(aid)) apps.set(aid, {
        id: aid, name: e["im:name"].label, bundle: e.id.attributes["im:bundleId"] ?? null,
        artist: e["im:artist"]?.label ?? null, genre: cat.label ?? null,
        genre_id: cat["im:id"] ?? null, cc, charts: {},
        art100: e["im:image"].at(-1).label });
      apps.get(aid).charts[`${cc}-${feed.replaceAll("top", "").replaceAll("applications", "")}`] = i + 1;
    });
  }
  const depth = Math.max(...charts.map((c) => c[3].length));
  for (let rank = 0; rank < depth; rank++) {
    for (const [, , , entries] of charts) {
      if (rank >= entries.length) continue;
      const aid = entries[rank].id.attributes["im:id"];
      if (apps.get(aid).genre_id === GAME_GENRE || order.includes(aid)) continue;
      order.push(aid);
    }
  }
  order = order.slice(0, N);
  log(`appstore: ${order.length} apps after merge`);
  // Batched lookup for 512 px artwork, seller, supportedDevices.
  for (const cc of ["cn", "us"]) {
    const ids = order.filter((i) => apps.get(i).cc === cc);
    for (let k = 0; k < ids.length; k += 100) {
      const d = await getJson(`https://itunes.apple.com/lookup?id=${ids.slice(k, k + 100).join(",")}&country=${cc}`);
      for (const r of d.results ?? []) {
        const a = apps.get(String(r.trackId));
        if (!a) continue;
        a.art512 = r.artworkUrl512 ?? null;
        a.seller = r.sellerName ?? null;
        a.artist_id = r.artistId ?? null;
        a.ios_on_mac = (r.supportedDevices ?? []).includes("MacDesktop-MacDesktop");
        a.genre_en = r.primaryGenreName ?? null;
      }
    }
  }
  // Separate Mac App Store app: one search per app.
  for (const [i, aid] of order.entries()) {
    const a = apps.get(aid);
    const term = quote(strip(a.name.split(/\s[-–—|]\s|[\uff1a:|\uff08(]/)[0]));
    let d;
    try {
      d = await getJson(`https://itunes.apple.com/search?term=${term}&entity=macSoftware&country=${a.cc}&limit=10`);
    } catch (e) {
      log(`  mac search failed for ${a.name}: ${(e as Error).message}`);
      continue;
    }
    a.mac_app = null;
    const b = (a.bundle || "").toLowerCase();
    const na = norm(a.name);
    for (const r of d.results ?? []) {
      const rb = (r.bundleId || "").toLowerCase();
      const nr = norm(r.trackName ?? "");
      const sameDev = (r.artistId ?? null) === (a.artist_id ?? null) || (r.sellerName && r.sellerName === a.seller);
      const samePrefix = b && rb && b.split(".").slice(0, 2).join(".") === rb.split(".").slice(0, 2).join(".");
      // Same developer alone is not enough (Amazon Shopping is not Prime Video).
      const similar = na && nr && (nr.includes(na) || na.includes(nr)) && Math.min(len(na), len(nr)) / Math.max(len(na), len(nr)) > 0.5;
      if (rb === b || ((sameDev || samePrefix) && similar)) {
        a.mac_app = { id: r.trackId ?? null, name: r.trackName ?? null, bundle: r.bundleId ?? null, art512: r.artworkUrl512 ?? null };
        break;
      }
    }
    if ((i + 1) % 25 === 0) log(`  mac search ${i + 1}/${order.length}`);
  }
  const out = order.map((id, i) => ({ ...apps.get(id), rank: i + 1 }));
  const meta = Object.fromEntries(charts.map(([cc, feed, updated]) => [`${cc}-${feed}`, updated]));
  save("appstore.json", { built: today(), feeds_updated: meta, apps: out });
}

async function buildAdjacent() {
  const out: any[] = [];
  for (const [label, term, artist, entity, cc] of ADJACENT) {
    const d = await getJson(`https://itunes.apple.com/search?term=${quote(term)}&entity=${entity}&country=${cc}&limit=8`);
    const hit = (d.results ?? []).find((r: any) => (r.artistName || "").toLowerCase().includes(artist.toLowerCase()) &&
      (norm(r.trackName ?? "").includes(norm(label).slice(0, 4)) || artist));
    if (!hit) {
      out.push({ key: norm(label), name: label, miss: "not found in iTunes search", rank: out.length + 1 });
      continue;
    }
    out.push({ key: norm(label), name: label, track: hit.trackName, id: hit.trackId,
      artist: hit.artistName, art512: hit.artworkUrl512, rank: out.length + 1,
      ios_on_mac: (hit.supportedDevices ?? []).includes("MacDesktop-MacDesktop") });
  }
  save("adjacent.json", { built: today(), apps: out });
  mkdirSync(join(OUT, "adjacent"), { recursive: true });
  for (const a of out) {
    if (!a.art512) continue;
    const dst = join(OUT, "adjacent", `${a.key}.png`);
    if (existsSync(dst) || await downloadPng(art(a.art512)!, dst)) [a.icon, a.src] = [`adjacent/${a.key}.png`, "App Store artwork"];
  }
  save("adjacent.json", { built: today(), apps: out });
  log(`adjacent: ${out.filter((a) => a.icon).length}/${out.length} icons`);
}

function bundleCandidates(cask: any) {
  const s = pyjson(cask.artifacts ?? []);
  const ids = [...s.matchAll(/"quit": \[?"([^"]+)"/g), ...s.matchAll(/Preferences\/([A-Za-z0-9.\-]+)\.plist/g),
    ...s.matchAll(/Containers\/([A-Za-z0-9.\-]+)"/g)].map((m) => m[1]);
  return [...new Set(ids.filter((i) => !i.includes("*") && i.split(".").length > 2))].slice(0, 4);
}

function appName(cask: any) {
  for (const art of cask.artifacts ?? []) {
    if ("app" in art) {
      const v = art.app[0];
      return typeof v === "string" ? v : (v.target ?? "");
    }
  }
  return /\/Applications\/([^"/]+?\.app)/.exec(pyjson(cask.artifacts ?? []))?.[1] ?? null;
}

async function buildOutside(refresh: boolean) {
  const an = await getJson("https://formulae.brew.sh/api/analytics/cask-install/365d.json", refresh);
  const casks = new Map((await getJson("https://formulae.brew.sh/api/cask.json", refresh)).map((c: any) => [c.token, c]));
  const tot = new Map<string, number>();
  for (const it of an.items) {
    const t = it.cask.split("/").at(-1);
    tot.set(t, (tot.get(t) ?? 0) + parseInt(it.count.replaceAll(",", ""), 10));
  }
  const out: any[] = [], dropped = new Map<string, number>();
  for (const [t, cnt] of [...tot].sort((x, y) => y[1] - x[1])) {
    const c: any = casks.get(t);
    const kinds = new Set(c ? c.artifacts.map((a: object) => Object.keys(a)[0]) : []);
    let reason = null;
    if (!c) reason = "no cask metadata";
    else if (t.includes("@")) reason = "variant";
    else if (t.startsWith("font-") || kinds.has("font")) reason = "font";
    else if (NOT_GUI.has(t)) reason = "runtime/CLI";
    else if (!kinds.has("app") && !PKG_GUI.has(t)) reason = "no .app (CLI/driver/SDK/runtime)";
    if (reason) {
      dropped.set(reason, (dropped.get(reason) ?? 0) + 1);
      continue;
    }
    out.push({ token: t, name: c.name[0], homepage: c.homepage ?? null, url: c.url ?? null, desc: c.desc ?? null,
      installs_365d: cnt, app: appName(c), bundles: bundleCandidates(c), rank: out.length + 1 });
    if (out.length === N) break;
  }
  log(`outside: ${out.length} apps; dropped above the cut: {${[...dropped].map(([k, v]) => `'${k}': ${v}`).join(", ")}}`);
  save("outside.json", { built: today(), window: [an.start_date, an.end_date],
    dropped_above_cut: Object.fromEntries(dropped), apps: out });
}

// ---------------------------------------------------------------- fetch

function toPng(src: string, dst: string, size = 512) {
  return run("sips", ["-s", "format", "png", "-Z", String(size), src, "--out", dst]).status === 0 && existsSync(dst);
}

function pngSize(path: string) {
  const head = readFileSync(path).subarray(0, 24);
  if (!head.subarray(0, 8).equals(Buffer.from("\x89PNG\r\n\x1a\n", "latin1"))) return null;
  return [head.readUInt32BE(16), head.readUInt32BE(20)];
}

async function downloadPng(url: string, dst: string) {
  let data: Buffer;
  try {
    data = await get(url, true);
  } catch (e) {
    log(`  download failed ${url}: ${(e as Error).message}`);
    return false;
  }
  if (!data.length) return false;
  const dir = mkdtempSync(join(tmpdir(), "icon-"));
  const tmp = join(dir, "download" + (extname(urlsplit(url).path.replace(/;[^/]*$/, "")) || ".img"));
  writeFileSync(tmp, data);
  const ok = toPng(tmp, dst);
  rmSync(dir, { recursive: true });
  return ok;
}

// mzstatic serves any size/format from the same path.
const art = (url: string | null, size = 512) => (url ? url.replace(/\/[^/]+$/, `/${size}x${size}bb.png`) : null);

const WS_SWIFT = `
import AppKit
let a = CommandLine.arguments
let img = NSWorkspace.shared.icon(forFile: a[1])
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 512, pixelsHigh: 512, bitsPerSample: 8,
  samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
img.draw(in: NSRect(x: 0, y: 0, width: 512, height: 512))
NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[2]))
`;

/** The icon macOS itself draws for an installed copy (Assets.car / Icon Composer icon on
    macOS 26+, else the .icns). The bundle's .icns alone can be the pre-26 fallback art. */
function installedIcon(app: string | null, dst: string) {
  if (!app) return false;
  const path = join("/Applications", basename(app));
  if (!existsSync(join(path, "Contents", "Info.plist"))) return false;
  const tool = join(OUT, ".bin", "wsicon");
  if (!existsSync(tool)) {
    mkdirSync(dirname(tool), { recursive: true });
    writeFileSync(tool + ".swift", WS_SWIFT);
    run("swiftc", ["-O", tool + ".swift", "-o", tool]);
  }
  return run(tool, [path, dst]).status === 0 && existsSync(dst);
}

/** Largest PNG icon a homepage declares: <link rel=apple-touch-icon|icon>, the web
    manifest's icons, or an <img> whose file name says app icon. These can be a web logo
    rather than the app icon; the sheets show the source so a reviewer can reject them. */
async function homepageIcon(home: string): Promise<[string[], string | null]> {
  let page: string;
  try {
    page = await get(home, false, false, 15);
  } catch (e) {
    return [[], `homepage fetch failed (${errorName(e)})`];
  }
  const cands: [number, string][] = [];
  const isImage = (src: string) => /\.(png|webp)$/.test(src.toLowerCase().split("?")[0]);
  for (const [tag] of page.matchAll(/<link\b[^>]*>/gi)) {
    const relMatch = /rel=["']([^"']+)/i.exec(tag), hrefMatch = /href=["']([^"']+)/i.exec(tag);
    if (!relMatch || !hrefMatch) continue;
    const rel = relMatch[1].toLowerCase(), href = htmlUnescape(hrefMatch[1]);
    if (rel.includes("manifest")) {
      try {
        const man = JSON.parse(await get(urljoin(home, href), false, false, 10));
        for (const ic of man.icons ?? []) {
          const m = /^(\d+)x/.exec(ic.sizes ?? "");
          if (isImage(ic.src ?? "") && m) cands.push([Number(m[1]), urljoin(urljoin(home, href), ic.src)]);
        }
      } catch {}
      continue;
    }
    if (!rel.includes("apple-touch-icon") && !rel.split(/\s+/).includes("icon")) continue;
    if (!isImage(href)) continue;
    const sz = /sizes=["'](\d+)x/i.exec(tag);
    cands.push([sz ? Number(sz[1]) : rel.includes("apple-touch") ? 180 : 64, urljoin(home, href)]);
  }
  for (const [, src] of page.matchAll(/<img\b[^>]*src=["']([^"']+)/gi))
    if (/app[-_]?icon|(^|\/)icon[-_@\d]*\.(png|webp)/i.test(src)) cands.push([150, urljoin(home, htmlUnescape(src))]);
  cands.push([180, urljoin(home, "/apple-touch-icon.png")]);
  const urls = cands.sort((x, y) => y[0] - x[0]).filter(([size]) => size >= 120).map(([, u]) => u);
  return [urls, urls.length ? null : "homepage declares no icon >= 120 px"];
}

/** GitHub REST via the logged-in gh CLI when present (5000 req/h), else anonymous (60/h). */
async function ghApi(path: string) {
  const cp = cachePath("gh:" + path, ".txt");
  if (existsSync(cp)) return JSON.parse(readFileSync(cp, "utf8"));
  let data: string;
  try {
    const r = run("gh", ["api", path], { encoding: "utf8", timeout: 60_000 });
    if (r.status !== 0) return null;
    data = r.stdout as string;
  } catch (e: any) {
    if (e.code !== "ENOENT") throw e;
    try {
      data = await get("https://api.github.com/" + path);
    } catch {
      return null;
    }
  }
  mkdirSync(dirname(cp), { recursive: true });
  writeFileSync(cp, data);
  return JSON.parse(data);
}

/** owner/repo from the homepage, the cask download URL, or a GitHub link on the homepage. */
async function githubRepo(a: any) {
  const pat = /github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/g;
  for (const u of [a.homepage || "", a.url || ""]) {
    const m = new RegExp(pat.source).exec(u);
    if (m && !["sponsors", "orgs"].includes(m[1])) return [m[1], m[2].replace(/\.git$/, "")];
  }
  let page: string;
  try {
    page = await get(a.homepage, false, false, 15);
  } catch {
    return null;
  }
  const key = norm(a.name).slice(0, 5);
  for (const [, o, r] of page.matchAll(pat)) {
    if (["sponsors", "orgs", "features", "topics"].includes(o)) continue;
    if (key && (norm(r).includes(key) || norm(a.name).includes(norm(r).slice(0, 5)))) return [o, r.replace(/\.git$/, "")];
  }
  return null;
}

async function githubIcon(a: any) {
  const rr = await githubRepo(a);
  if (!rr) return [];
  const [owner, repo] = rr;
  const tree = await ghApi(`repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);
  if (!tree) return [];
  const cands: [number, number, string][] = [];
  for (const node of tree.tree ?? []) {
    const p: string = node.path;
    const lp = p.toLowerCase();
    if (!lp.endsWith(".png") || /test|screenshot|docs?\/|banner|social|preview|dmg/.test(lp)) continue;
    let score = 0;
    if (lp.includes(".appiconset/") || lp.includes("appicon") || /(^|\/)(app[-_]?)?icon[^/]*\.png$/.test(lp) || /(^|\/)logo[^/]*\.png$/.test(lp)) score += 10;
    const size = ([["1024", 5], ["512@2x", 5], ["512", 4], ["256@2x", 3], ["256", 2]] as const).find(([sz]) => lp.includes(sz));
    if (size) score += size[1];
    if (lp.includes("mac") || lp.includes("darwin")) score += 1;
    if (lp.includes("logo")) score -= 2;
    if (score >= 10) cands.push([score, -len(p), p]);
  }
  cands.sort((x, y) => y[0] - x[0] || y[1] - x[1] || (y[2] > x[2] ? 1 : y[2] < x[2] ? -1 : 0));
  return cands.slice(0, 4).map(([, , p]) => `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${quote(p)}`);
}

const REFETCH = new Set<string>(); // sources to retry on this run, e.g. {"homepage icon link"}

async function fetchIcons() {
  const st = load("appstore.json");
  mkdirSync(join(OUT, "appstore"), { recursive: true });
  for (const a of st.apps) {
    const dst = join(OUT, "appstore", `${a.id}.png`);
    a.icon = `appstore/${a.id}.png`;
    if (!existsSync(dst) && !await downloadPng(art(a.art512 || a.art100)!, dst)) [a.icon, a.miss] = [null, "artwork download failed"];
    a.src = "App Store artwork";
    if (a.mac_app?.art512) {
      const mdst = join(OUT, "appstore", `${a.id}-mac.png`);
      if (!existsSync(mdst)) await downloadPng(art(a.mac_app.art512)!, mdst);
      a.mac_icon = existsSync(mdst) ? `appstore/${a.id}-mac.png` : null;
    }
  }
  save("appstore.json", st);
  log("appstore icons done");

  const ot = load("outside.json");
  mkdirSync(join(OUT, "outside"), { recursive: true });
  const allb = [...new Set<string>(ot.apps.flatMap((a: any) => a.bundles))].sort();
  const mas = new Map<string, any>();
  for (let k = 0; k < allb.length; k += 40) {
    const d = await getJson(`https://itunes.apple.com/lookup?bundleId=${allb.slice(k, k + 40).join(",")}&country=us`);
    for (const r of d.results ?? []) if (r.kind === "mac-software") mas.set(r.bundleId.toLowerCase(), r);
  }
  for (const [i, a] of ot.apps.entries()) {
    const dst = join(OUT, "outside", `${a.token}.png`);
    delete a.miss;
    if (existsSync(dst) && a.src && !REFETCH.has(a.src)) continue;
    if (existsSync(dst)) unlinkSync(dst);
    let src = null, url = null;
    const b = a.bundles.find((b: string) => mas.has(b.toLowerCase()));
    if (b) {
      [url, src] = [art(mas.get(b.toLowerCase()).artworkUrl512), "Mac App Store (bundle id)"];
      a.mas_id = mas.get(b.toLowerCase()).trackId;
    }
    if (!url) {
      let d;
      try {
        d = await getJson(`https://itunes.apple.com/search?term=${quote(a.name)}&entity=macSoftware&country=us&limit=5`);
      } catch {
        d = { results: [] };
      }
      const host = hostname(a.homepage || "").replace(/^www\./, "");
      for (const r of d.results ?? []) {
        const shost = hostname(r.sellerUrl || "").replace(/^www\./, "");
        if (norm(r.trackName ?? "") === norm(a.name) && (!shost || !host ||
            shost.split(".").slice(-2).join(".") === host.split(".").slice(-2).join("."))) {
          [url, src] = [art(r.artworkUrl512), "Mac App Store (search)"];
          a.mas_id = r.trackId;
          break;
        }
      }
    }
    let ok = false;
    if (url) ok = await downloadPng(url, dst);
    if (!ok && installedIcon(a.app, dst)) [ok, src] = [true, "installed app (system-drawn)"];
    if (!ok) {
      for (const gurl of await githubIcon(a)) {
        if (await downloadPng(gurl, dst) && (pngSize(dst) ?? [0])[0] >= 128) {
          [ok, src] = [true, "GitHub repo asset"];
          break;
        }
      }
    }
    if (!ok && a.homepage) {
      const [hurls, why] = await homepageIcon(a.homepage);
      for (const hurl of hurls) {
        if (await downloadPng(hurl, dst) && (pngSize(dst) ?? [0])[0] >= 120) {
          [ok, src] = [true, "homepage icon link"];
          break;
        }
      }
      if (!ok) a.miss = why || "no candidate downloaded at >= 120 px";
    }
    if (!ok && existsSync(dst)) unlinkSync(dst);
    a.src = ok ? src : null;
    a.icon = ok ? `outside/${a.token}.png` : null;
    if (ok) a.icon_px = pngSize(dst)?.[0] ?? null;
    if ((i + 1) % 25 === 0) {
      log(`  outside ${i + 1}/${ot.apps.length}`);
      save("outside.json", ot);
    }
  }
  save("outside.json", ot);
  const miss = ot.apps.filter((a: any) => !a.icon);
  log(`outside icons: ${ot.apps.length - miss.length} got, ${miss.length} missing`);
}

// ---------------------------------------------------------------- stats

type Pixel = [number, number, number, number];

function readBmp(path: string): [number, number, Pixel[]] {
  const d = readFileSync(path);
  const off = d.readUInt32LE(10);
  const w = d.readInt32LE(18);
  let h = d.readInt32LE(22);
  const bpp = d.readUInt16LE(28);
  const comp = d.readUInt32LE(30);
  let masks = comp === 3 ? [0, 1, 2, 3].map((i) => d.readUInt32LE(54 + 4 * i)) : [0xff0000, 0xff00, 0xff, 0xff000000];
  if (bpp !== 32) masks = [0xff0000, 0xff00, 0xff, 0];
  const sh = masks.map((m) => (m ? 31 - Math.clz32(m & -m) : 0));
  const step = Math.floor(bpp / 8);
  const row = Math.floor((w * bpp + 31) / 32) * 4;
  const px: Pixel[] = [];
  const topDown = h < 0;
  h = Math.abs(h);
  for (let y = 0; y < h; y++) {
    const base = off + (topDown ? y : h - 1 - y) * row;
    for (let x = 0; x < w; x++) {
      if (step === 4) {
        const v = d.readUInt32LE(base + 4 * x);
        const a = masks[3] ? (v & masks[3]) >>> sh[3] : 255;
        px.push([(v & masks[0]) >>> sh[0], (v & masks[1]) >>> sh[1], (v & masks[2]) >>> sh[2], a]);
      } else px.push([d[base + 3 * x + 2], d[base + 3 * x + 1], d[base + 3 * x], 255]);
    }
  }
  return [w, h, px];
}

function lstar(r: number, g: number, b: number) {
  const lin = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return y > 0.008856 ? 116 * y ** (1 / 3) - 16 : 903.3 * y;
}

// 30-degree bins centred on 0, 30, 60 ... ("emerald" ~150 deg holds WeChat, WhatsApp and Spotify green).
const HUES = ["red", "orange", "yellow", "yellow-green", "green", "emerald", "cyan", "azure", "blue", "violet", "magenta", "pink"];

function hsv(r: number, g: number, b: number) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const s = mx === 0 ? 0 : (mx - mn) / mx;
  let h;
  if (mx === mn) h = 0;
  else if (mx === r) h = (60 * ((g - b) / (mx - mn)) + 360) % 360;
  else if (mx === g) h = 60 * ((b - r) / (mx - mn)) + 120;
  else h = 60 * ((r - g) / (mx - mn)) + 240;
  return [h, s, mx / 255];
}

const hueBin = (h: number) => floordiv((h + 15) % 360, 30);

function bmpOf(png: string, size: number) {
  const dir = mkdtempSync(join(tmpdir(), "icon-"));
  const bmp = join(dir, "i.bmp");
  const r = run("sips", ["-s", "format", "bmp", "-z", String(size), String(size), png, "--out", bmp]);
  let result: [number, number, Pixel[]] | null = null;
  try {
    if (r.status === 0) result = readBmp(bmp);
  } finally {
    rmSync(dir, { recursive: true });
  }
  return result;
}

function iconStats(png: string, fullBleed: boolean) {
  const bmp = bmpOf(png, 64);
  if (!bmp) return null;
  const [w, h, px] = bmp;
  const R = 64 * 0.2237;
  const inside = (x: number, y: number) => {
    // Shaped icons (Mac): the alpha channel is the shape. Full-bleed squares (iOS
    // artwork): approximate the system mask with a rounded rect, radius 22.37 %.
    if (!fullBleed) return px[y * w + x][3] > 200;
    if ((x + 0.5 < R || x + 0.5 > w - R) && (y + 0.5 < R || y + 0.5 > h - R)) {
      const ccx = x + 0.5 < R ? R : w - R;
      const ccy = y + 0.5 < R ? R : h - R;
      return (x + 0.5 - ccx) ** 2 + (y + 0.5 - ccy) ** 2 <= R * R;
    }
    return true;
  };
  const mask = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => inside(x, y)));
  const opaque: [number, number][] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y][x]) opaque.push([x, y]);
  if (opaque.length < 200) return null;
  // Background ring: inside pixels within 4 px of the shape edge.
  const ring: Pixel[] = [];
  for (const [x, y] of opaque) {
    const edge = [[-4, 0], [4, 0], [0, -4], [0, 4]].some(([dx, dy]) => {
      const xx = x + dx, yy = y + dy;
      return !(xx >= 0 && xx < w && yy >= 0 && yy < h) || !mask[yy][xx];
    });
    if (edge) ring.push(px[y * w + x]);
  }
  const inRing = new Set(ring.map((c) => c.join()));
  const ys = opaque.map(([, y]) => y);
  const topY = Math.min(...ys), botY = Math.max(...ys);
  const span = Math.max(1, botY - topY);
  const top = opaque.filter(([x, y]) => y - topY < span * 0.15 && inRing.has(px[y * w + x].join())).map(([x, y]) => px[y * w + x]);
  const bot = opaque.filter(([x, y]) => botY - y < span * 0.15 && inRing.has(px[y * w + x].join())).map(([x, y]) => px[y * w + x]);

  const mean = (cs: Pixel[]) => [0, 1, 2].map((i) => cs.reduce((s, c) => s + c[i], 0) / Math.max(1, cs.length));
  const ringL = ring.map((c) => lstar(c[0], c[1], c[2]));
  const bg = mean(ring);
  const bgL = lstar(bg[0], bg[1], bg[2]);
  const ringMean = fsum(ringL) / ringL.length;
  const sd = Math.sqrt(fsum(ringL.map((v) => (v - ringMean) ** 2)) / ringL.length);
  const tb = top.length && bot.length ? dist(mean(top), mean(bot)) : null;
  // Roughness: mean neighbour difference along the ring order is noisy; use local 2x2 deltas.
  let rough = 0, cnt = 0;
  for (let i = 0; i < opaque.length; i += 3) {
    const [x, y] = opaque[i];
    if (x + 1 < w && y + 1 < h && mask[y][x + 1] && mask[y + 1][x]) {
      const a = px[y * w + x], b = px[y * w + x + 1], c = px[(y + 1) * w + x];
      rough += dist(a.slice(0, 3), b.slice(0, 3)) + dist(a.slice(0, 3), c.slice(0, 3));
      cnt += 2;
    }
  }
  rough /= Math.max(1, cnt);
  const [bh, bs] = hsv(bg[0], bg[1], bg[2]);
  const tbv = tb ?? 0;
  const kind = sd < 4 && tbv < 18 ? "flat" : tbv >= 18 && sd < 25 ? "gradient" : "varied";
  const tone = bs < 0.12 && bgL > 88 ? "white" : bgL < 18 ? "black" : bs < 0.12 ? "gray" : HUES[hueBin(bh)];
  const bins = new Map<number, number>();
  const hues = Array(12).fill(0);
  let chroma = 0;
  for (const [x, y] of opaque) {
    const [r, g, b] = px[y * w + x];
    const k = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    bins.set(k, (bins.get(k) ?? 0) + 1);
    const [hh, ss, vv] = hsv(r, g, b);
    if (ss > 0.25 && vv > 0.2) {
      hues[hueBin(hh)] += 1;
      chroma += 1;
    }
  }
  const n = opaque.length;
  const colors = [...bins.values()].filter((v) => v / n >= 0.02).length;
  const topH = [...Array(12).keys()].sort((i, j) => hues[j] - hues[i]);
  const dom = topH.slice(0, 2).filter((i) => hues[i] / n >= 0.08).map((i) => HUES[i]);
  return { bg_L: float(bgL, 1), bg_tone: tone, bg_kind: kind, bg_rgb: bg.map((c) => pyRound(c)),
    ring_sd: float(sd, 1), top_bottom_delta: tb === null ? 0 : float(tb, 1), colors,
    chromatic_share: float(chroma / n, 2), dominant_hues: dom, roughness: float(rough, 1) } as Record<string, unknown>;
}

function cornerOpaque(png: string) {
  let bmp;
  try {
    bmp = bmpOf(png, 16);
  } catch {
    return false;
  }
  if (!bmp) return false;
  const px = bmp[2];
  return px[0][3] > 200 && px.at(-1)![3] > 200;
}

function stats() {
  const out: Record<string, unknown> = {};
  for (const [lst, full] of [["appstore", true], ["outside", false], ["adjacent", true]] as const) {
    const data = load(`${lst}.json`);
    if (!data) continue;
    for (const a of data.apps) {
      if (!a.icon) continue;
      // Homepage/GitHub PNGs may be unmasked squares: treat an opaque corner as full bleed.
      const fb = full || (/^(homepage|GitHub)/.test(a.src ?? "") && cornerOpaque(join(OUT, a.icon)));
      const s = iconStats(join(OUT, a.icon), fb);
      if (s) {
        s.full_bleed = fb;
        out[keyOf(lst, a)] = s;
      }
    }
    log(`stats ${lst} done`);
  }
  save("stats.json", out);
}

// ---------------------------------------------------------------- sheets

const CSS = `
body{margin:0;padding:16px;background:#ECECEA;font:11px -apple-system,Helvetica,sans-serif;color:#222}
h1{font-size:15px;margin:0 0 10px}
.grid{display:grid;grid-template-columns:repeat(10,128px);gap:8px}
.t{background:#F6F5F2;border-radius:8px;padding:6px;height:170px;position:relative}
.t b{position:absolute;top:4px;left:6px;font-size:12px;color:#000}
.big{display:block;margin:14px auto 4px;width:84px;height:84px}
.sm{display:flex;justify-content:center;gap:6px}
.sm span{display:inline-flex;padding:4px;border-radius:5px}
.sm .l{background:#E5E5EA}.sm .d{background:#1C1C1E}
.sm img{width:29px;height:29px}
.mask{border-radius:22.37%}
.n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px;text-align:center}
.miss{display:flex;align-items:center;justify-content:center;width:84px;height:84px;margin:14px auto 4px;
 border:1px dashed #999;border-radius:18px;color:#999}
a{color:#0645ad}
`;

const masked = (lst: string, a: any) => lst === "appstore" || lst === "adjacent" || /^(homepage|GitHub)/.test(a.src || "");

function tile(i: number, name: string, icon: string | null, mask: boolean, sub = "") {
  const m = mask ? ' class="mask"' : "";
  const [big, sm] = icon
    ? [`<img class="big${mask ? " mask" : ""}" src="../${icon}">`,
      `<div class="sm"><span class="l"><img${m} src="../${icon}"></span><span class="d"><img${m} src="../${icon}"></span></div>`]
    : ['<div class="miss">missing</div>', '<div class="sm"></div>'];
  return `<div class="t"><b>${i}</b>${big}${sm}<div class="n" title="${htmlEscape(name)}">${htmlEscape(name)}</div><div class="n" style="color:#888">${htmlEscape(sub)}</div></div>`;
}

function render(htmlpath: string, pngpath: string, height: number) {
  const prof = join(OUT, ".chrome-profile");
  run(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${prof}`,
    `--window-size=1410,${height}`, `--screenshot=${pngpath}`, "file://" + htmlpath], { timeout: 120_000 });
}

function sheets(renderPng = true) {
  mkdirSync(join(OUT, "sheets"), { recursive: true });
  for (const [lst, label] of [["appstore", "App Store (iOS, CN+US)"], ["outside", "Outside the App Store (Homebrew casks)"],
    ["adjacent", "Adjacent apps (messaging, 2FA, passwords, transfer, indie craft)"]]) {
    if (!load(`${lst}.json`)) continue;
    const apps = load(`${lst}.json`).apps;
    for (let k = 0; k < apps.length; k += 50) {
      const chunk = apps.slice(k, k + 50);
      const name = `${lst}-${String(k / 50 + 1).padStart(2, "0")}`;
      const tiles = chunk.map((a: any) => {
        let sub = lst === "appstore" ? a.genre_en || a.genre || "" : a.src || a.miss || "";
        if (lst === "appstore" && (a.mac_app || a.ios_on_mac)) sub = (a.mac_app ? "Mac app · " : "runs on Mac · ") + sub;
        return tile(a.rank, a.name, a.icon, masked(lst, a), sub);
      });
      const body = `<h1>${label} — ranks ${chunk[0].rank}–${chunk.at(-1).rank}</h1><div class="grid">${tiles.join("")}</div>`;
      const p = join(OUT, "sheets", name + ".html");
      writeFileSync(p, `<!doctype html><meta charset=utf-8><title>${name}</title><style>${CSS}</style>${body}`);
      if (renderPng) render(p, p.slice(0, -5) + ".png", 1010);
    }
  }
  index();
}

function index() {
  const allapps = new Map<string, [string, any]>();
  for (const lst of ["appstore", "outside", "adjacent"])
    for (const a of load(`${lst}.json`, { apps: [] }).apps) allapps.set(keyOf(lst, a), [lst, a]);
  const best: string[] = [];
  for (const [key, why] of loadTagsPicks()) {
    if (!allapps.has(key)) continue;
    const [lst, a] = allapps.get(key)!;
    const mask = masked(lst, a);
    const m = mask ? ' class="mask"' : "";
    const ic = a.icon;
    best.push(`<div class="p"><img class="b${mask ? " mask" : ""}" src="${ic}"><div class="s"><span class="l"><img${m} src="${ic}"></span><span class="d"><img${m} src="${ic}"></span></div>` +
      `<div><b>${htmlEscape(a.name)}</b><br><span>${htmlEscape(why)}</span></div></div>`);
  }
  const css = CSS + `.picks{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
.p{display:grid;grid-template-columns:96px 46px 1fr;gap:10px;align-items:center;background:#F6F5F2;border-radius:10px;padding:10px}
.p .b{width:96px;height:96px}.p .s{display:flex;flex-direction:column;gap:4px}
.p .s span{display:inline-flex;padding:4px;border-radius:6px}.p .s .l{background:#E5E5EA}.p .s .d{background:#1C1C1E}
.p .s img{width:32px;height:32px}.p span{color:#555}`;
  const names = readdirSync(join(OUT, "sheets")).filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -5)).sort();
  const lis = names.map((n) => `<li><a href="sheets/${n}.html">${n}</a> · <a href="sheets/${n}.png">png</a></li>`).join("");
  const doc = `<!doctype html><meta charset=utf-8><title>App icon study</title><style>${css}</style>` +
    `<h1>App icon study — best picks (each at 96 px, 32 px on light and dark)</h1><div class=picks>${best.join("")}</div>` +
    `<h1 style='margin-top:20px'>All contact sheets</h1><ul>${lis}</ul>`;
  const p = join(OUT, "index.html");
  writeFileSync(p, doc);
  render(p, join(OUT, "index.png"), 260 + 126 * Math.ceil(best.length / 4) + 20 * names.length);
}

function loadTags() {
  const tags = new Map<string, Record<string, string>>();
  if (!existsSync(TAGS)) return tags;
  let header: string[] | null = null;
  for (const line of readFileSync(TAGS, "utf8").split(/\r\n?|\n/)) {
    if (line.startsWith("#") || !strip(line)) continue;
    const cols = line.split("\t");
    if (!header) {
      header = cols;
      continue;
    }
    const row = Object.fromEntries(header.slice(0, cols.length).map((h, i) => [h, cols[i]]));
    tags.set(row.key, row);
  }
  return tags;
}

const loadTagsPicks = () => [...loadTags()].filter(([, r]) => r.pick).map(([k, r]) => [k, r.pick]);

// ---------------------------------------------------------------- report

function report() {
  const st = load("stats.json");
  const tags = loadTags();
  const motifAll = new Map<string, Record<string, number>>();
  const table = (title: string, counter: Map<string, number>, total: number) => {
    print(`| ${title} | icons |\n| --- | --- |`);
    for (const [k, v] of [...counter].sort((x, y) => y[1] - x[1])) print(`| ${k} | ${v} (${pyRound(100 * v / Math.max(1, total))}%) |`);
    print();
  };
  const tally = (values: string[]) => {
    const c = new Map<string, number>();
    for (const v of values) c.set(v, (c.get(v) ?? 0) + 1);
    return c;
  };
  for (const [lst, label] of [["appstore", "App Store top 250"], ["outside", "Outside the App Store top 250"],
    ["adjacent", "Adjacent apps"]]) {
    const apps = load(`${lst}.json`, { apps: [] }).apps;
    const keys: string[] = apps.map((a: any) => keyOf(lst, a));
    const bad = new Set(keys.filter((k) => tags.has(k) && tags.get(k)!.valid !== "icon"));
    const s = keys.filter((k) => k in st && !bad.has(k)).map((k) => st[k]);
    const n = s.length;
    const got = apps.filter((a: any) => a.icon).length;
    print(`\n### ${label}: ${apps.length} apps, ${got} images fetched, ${bad.size} rejected on sight ` +
      `(web logo or wrong image), ${n} icons measured\n`);
    const count = (f: (x: any) => string[]) => tally(s.flatMap(f));
    table("Background tone (measured)", count((x) => [x.bg_tone]), n);
    table("Background kind (measured)", count((x) => [x.bg_kind]), n);
    table("Dominant hue (>= 8% of pixels; an icon can count twice)",
      count((x) => (x.dominant_hues.length ? x.dominant_hues : ["neutral only"])), n);
    table("Distinct colours (3-bit RGB bins >= 2%)", count((x) => [
      x.colors <= 3 ? "1-3" : x.colors <= 6 ? "4-6" : x.colors <= 10 ? "7-10" : "11+"]), n);
    const t = keys.filter((k) => tags.get(k)?.valid === "icon").map((k) => tags.get(k)!);
    if (t.length) {
      print(`Visual tags (by eye, ${t.length} icons):\n`);
      for (const col of ["shape", "bg", "glyph", "elements", "depth", "text"]) table(col, tally(t.map((r) => r[col] || "-")), t.length);
      const motifs = t.flatMap((r) => [...new Set((r.motif || "").split(","))].filter(Boolean));
      for (const m of motifs) {
        const d = motifAll.get(m) ?? {};
        d[lst] = (d[lst] ?? 0) + 1;
        motifAll.set(m, d);
      }
      table("motif (top 20)", new Map([...tally(motifs)].sort((x, y) => y[1] - x[1]).slice(0, 20)), t.length);
    }
    if (lst === "appstore") {
      const mac = apps.filter((a: any) => a.mac_app).length;
      const ion = apps.filter((a: any) => a.ios_on_mac).length;
      const either = apps.filter((a: any) => a.mac_app || a.ios_on_mac).length;
      print(`Mac: ${mac} have a separate Mac App Store app (matched by search); ${ion} iOS apps list ` +
        `MacDesktop in supportedDevices; ${either} have one or the other.\n`);
    }
    if (lst === "outside") table("Icon source", tally(apps.map((a: any) => a.src || `missing: ${a.miss ?? "None"}`)), apps.length);
  }
  print("### Motifs across all three lists\n\n| motif | App Store | outside | adjacent |\n| --- | --- | --- | --- |");
  for (const m of ["bubble", "lock", "shield", "key", "keyhole", "bolt", "arrow", "plane", "check", "letter", "wordmark", "face"]) {
    const d = motifAll.get(m) ?? {};
    print(`| ${m} | ${d.appstore ?? 0} | ${d.outside ?? 0} | ${d.adjacent ?? 0} |`);
  }
}

// ---------------------------------------------------------------- command line

const CMDS = ["lists", "adjacent", "fetch", "stats", "sheets", "report", "all", "index"];
const OPTIONS = ["--help", "--out", "--refresh", "--no-png", "--refetch-web"];
// How argparse reads one argument: null for a value, else the options it can name and its "=value".
function optionOf(a: string, options: string[]) {
  if (!/^-./.test(a)) return null;
  const long = a.startsWith("--");
  const eq = long ? a.indexOf("=") : a[2] === "=" ? 2 : -1;
  const name = eq < 0 ? a : a.slice(0, eq), value = eq < 0 ? null : a.slice(eq + 1);
  const found = !long ? (a.startsWith("-h") ? ["--help"] : []) : options.includes(name) ? [name] : options.filter((o) => o.startsWith(name));
  // Unmatched "-1" and strings with spaces are values.
  if (!found.length && (/^-(\d+|\d*\.\d+)$/.test(a) || a.includes(" "))) return null;
  return { found, value };
}
const repr = (s: string) => {
  s = s.replaceAll("\\", "\\\\");
  return s.includes("'") && !s.includes('"') ? `"${s}"` : `'${s.replaceAll("'", "\\'")}'`;
};

// difflib's matching characters: the longest common block, then the same on each side of it.
function matches(a: string, b: string): number {
  let [bi, bj, bk] = [0, 0, 0];
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++) {
      let k = 0;
      while (i + k < a.length && a[i + k] === b[j + k]) k++;
      if (k > bk) [bi, bj, bk] = [i, j, k];
    }
  return bk && bk + matches(a.slice(0, bi), b.slice(0, bj)) + matches(a.slice(bi + bk), b.slice(bj + bk));
}

// The command line of the original argparse version, with its messages.
function parseArgs(argv: string[]) {
  const prog = basename(process.argv[1]);
  const usage = `usage: ${prog} [-h] [--out OUT] [--refresh] [--no-png] [--refetch-web]\n${" ".repeat(prog.length + 8)}{${CMDS}}\n`;
  const fail = (msg: string): never => {
    writeSync(2, `${usage}${prog}: error: ${msg}\n`);
    process.exit(2);
  };
  const o = { cmd: "", out: OUT, refresh: false, noPng: false, refetchWeb: false };
  const extras: string[] = [];
  const positional = (a: string) => {
    if (o.cmd) return extras.push(a);
    if (!CMDS.includes(a)) {
      const choices = CMDS.map(repr).join(", ");
      const [score, closest] = CMDS.map((c) => [2 * matches(c, a) / (c.length + a.length), c] as const)
        .sort((x, y) => y[0] - x[0] || (y[1] > x[1] ? 1 : -1))[0];
      fail(`argument cmd: invalid choice: ${repr(a)}${score >= 0.6 ? `, maybe you meant ${repr(closest)}?` : ""} (choose from ${choices})`);
    }
    o.cmd = a;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      argv.slice(i + 1).forEach(positional);
      break;
    }
    const opt = optionOf(a, OPTIONS);
    if (!opt) {
      positional(a);
      continue;
    }
    const { found, value } = opt;
    if (found.length > 1) fail(`ambiguous option: ${a} could match ${found.join(", ")}`);
    const option = found[0];
    if (!option) extras.push(a);
    else if (option === "--out") {
      if (value !== null) o.out = value;
      else if (i + 1 < argv.length && !optionOf(argv[i + 1], OPTIONS)) o.out = argv[++i];
      else fail("argument --out: expected one argument");
    } else if (value !== null) fail(`argument ${option === "--help" ? "-h/--help" : option}: ignored explicit argument ${repr(value)}`);
    else if (option === "--help") {
      writeSync(1, `${usage}\npositional arguments:\n  {${CMDS}}\n\noptions:\n  -h, --help            show this help message and exit\n` +
        "  --out OUT\n  --refresh\n  --no-png\n  --refetch-web         retry icons that came from a homepage\n");
      process.exit(0);
    } else if (option === "--refresh") o.refresh = true;
    else if (option === "--no-png") o.noPng = true;
    else o.refetchWeb = true;
  }
  if (!o.cmd) fail("the following arguments are required: cmd");
  if (extras.length) fail(`unrecognized arguments: ${extras.join(" ")}`);
  return o;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  OUT = expanduser(a.out);
  mkdirSync(OUT, { recursive: true });
  if (a.cmd === "lists" || a.cmd === "all") {
    await buildOutside(a.refresh);
    await buildAppstore(a.refresh);
  }
  if (a.refetchWeb) REFETCH.add("homepage icon link");
  if (a.cmd === "adjacent" || a.cmd === "all") await buildAdjacent();
  if (a.cmd === "fetch" || a.cmd === "all") await fetchIcons();
  if (a.cmd === "stats" || a.cmd === "all") stats();
  if (a.cmd === "sheets" || a.cmd === "all") sheets(!a.noPng);
  if (a.cmd === "index") index();
  if (a.cmd === "report") report();
}

await main();
