# App icon study (2026-10-21)

Why this exists: on 2026-10-21 every icon candidate for one app (a white bubble with a cut-out
lightning bolt on a blue→purple gradient, three recolours of it, six generated bubble icons)
was rejected as ugly. All of them were built from the most crowded motifs and hues in the
data below. Read this before designing or reviewing any app icon; the HIG rules themselves
are in [foundations.md › App icons](foundations.md) and the mirror's `app-icons.md`.

Everything in this file except quoted HIG rules is our own measurement or judgment **(ours)**.

## Method and sources

Rebuild with `node scripts/icon_study.ts all` (Node.js built-ins, `sips`, `swiftc`, headless Chrome;
≈ 35 min on 2026-10-21, almost all of it paced iTunes calls). Icons, HTTP cache, stats and contact
sheets go to `~/.cache/apple-design/icons/` and never into this repository: the artwork
belongs to other companies. Visual tags are ours and live in
[`scripts/icon_tags.tsv`](../scripts/icon_tags.tsv); re-tag after a rebuild, because ranks move.

| List | Source (fetched 2026-10-21) | Rule | Result |
| --- | --- | --- | --- |
| App Store top 250 | `itunes.apple.com/{cn,us}/rss/{topfreeapplications,topgrossingapplications,toppaidapplications}/limit=200/json`, feeds dated 2026-10-20 19:56–20:00 PDT | Each feed answers 100 entries even with `limit=200`. Six charts merged round-robin by rank (cn-free, us-free, cn-grossing, us-grossing, cn-paid, us-paid); games dropped (genre 6014; the free/paid app charts already exclude them, grossing does not); deduped by app id; first 250 | 250 apps (119 first seen on a CN chart, 131 on a US chart); 250 icons, 512 px `artworkUrl512` from a batched `lookup` |
| Mac availability of those 250 | `lookup` `supportedDevices`; one `search?entity=macSoftware` per app, matched by bundle id, or same developer plus a name match | — | 32 have a separate Mac App Store app; 17 list `MacDesktop-MacDesktop`; 33 have one or the other |
| Outside the App Store top 250 | Homebrew `cask-install/365d.json` (window 2025-10-21 → 2026-10-21, tap variants summed) joined with `api/cask.json` | Kept: casks that install an `.app`, plus 19 allowlisted GUI apps shipped as `.pkg` (Zoom, Office, Tailscale…). Dropped above the cut: 41 CLI/driver/SDK/runtime casks without an app, 33 tokens with no cask metadata, 21 fonts, 19 `@` variants, 7 runtimes with an app wrapper (Wine…) | 250 apps |
| Icons for the outside list | First hit wins: Mac App Store by bundle id (19) → MAS search by exact name (13) → icon macOS draws for a copy in `/Applications` (17) → app-icon PNG in the app's GitHub repo via `gh api` (68) → homepage's largest declared PNG icon (81) | Nothing substituted | 198 images fetched, 52 missing (47: no candidate ≥ 120 px; 5: homepage refused the request). On sight, 54 of the 198 were not the app icon (web logos: Firefox, Brave, JetBrains…; wrong images: GitHub's own logo, Microsoft's corporate logo, a Tor Browser clone) and were excluded. **144 icons measured.** |
| Adjacent apps | `search` by name and developer for 35 named apps (messaging, 2FA, passwords, device-to-device, indie craft) | — | 31 icons; Duo Mobile, 2FAS, Pushover, Pushbullet not found in the US store |

Measurements: each icon downsampled to 64×64 by `sips`; shape = alpha (Mac) or a 22.37 %
rounded-rect mask (iOS artwork is a full-bleed square). Background = pixels within 4 px of the
shape's edge. Hue = 30° bins centred on 0°, 30°…; "emerald" (≈150°) is where WeChat, WhatsApp
and Spotify green fall. The measured gradient/flat split counts any top-to-bottom shift as a
gradient, including the edge shading on Mac icons, so background kind below comes from the
visual tags instead.

The contact sheets (50 per sheet, each icon at 84 px and at 29 px on a light and a dark
plate) were all viewed for tagging: `~/.cache/apple-design/icons/index.html` (best picks
on top) and `sheets/*.html`.

## What the numbers say

| | App Store (250) | Outside (144) | Adjacent (31) |
| --- | --- | --- | --- |
| One element in the mark | 76 % | 88 % | 77 % |
| Words or several letters in the icon | 27 % (CN 46/119, US 22/131) | 3 % | 3 % |
| Mascot or face | 12 % (CN 22, US 9) | 10 % | 3 % |
| Seasonal/campaign overlay (11.11, Halloween, a show title) | 13 | 0 | 0 |
| Flat (no shading) | 73 % | 42 % | 45 % |
| Rendered 3D material | 10 % | 16 % | 16 % |
| Background: solid colour / white / black / gradient / illustration or none | 34 / 30 / 15 / 16 / 5 % | 25 / 26 / 25 / 9 / 15 % (none = freeform) | 39 / 26 / 16 / 19 / 0 % |
| Most common dominant hue (≥ 8 % of pixels) | azure 28 %, red 25 %, orange 17 % | azure 40 %, red 14 %, orange 13 % | azure 29 % |
| Monochrome (< 5 % chromatic pixels) | 20 (8 %) | 25 (17 %) | 6 |
| Warm off-white background (L* > 85, red > blue, mostly neutral) | 3 | 1 | 0 |
| Shape not the squircle (freeform or circle) | 0 (system mask) | 30 (21 %) | 0 |

Readings (ours):

- **One idea is the norm, not a virtue.** Three quarters of the top charts already use one
  element. A single shape is the entry ticket; what separates the good ones is which shape
  and which colour.
- **Azure is the most crowded colour** in both worlds (28 % and 40 % of icons have it as a
  dominant hue). A blue or blue→purple gradient icon starts invisible.
- **Black-and-white is crowded only in one corner:** the monochrome icons are almost all AI
  and developer tools (ChatGPT, Grok, Perplexity, Threads, X, Cursor, Zed, Warp, Notion,
  Tailscale). **A warm off-white background is nearly unused** (3 + 1 + 0 icons).
- **Text and campaigns are a China App Store habit** (46 of 119 CN apps show words; 11 of the
  13 campaign overlays are CN). Directly distributed Mac apps almost never use words (3 %).
- **Mac apps carry more material**: 58 % shaded or 3D outside the store versus 27 % in the
  iOS charts, and 21 % still freeform or circular (HandBrake, Transmission, Cyberduck,
  Thunderbird, Godot). Those freeform icons came from GitHub/MAS art; how macOS 26 draws them
  is not measured here.

## Clichés, with counts

Counted by eye over all 425 valid icons; "category" counts are over the apps of that kind
that appear anywhere in the three lists.

| Motif | Where it appears | Count |
| --- | --- | --- |
| Speech bubble | Messengers: WeChat, WhatsApp, WeCom, Signal, LINE, Threema, imo, Duoshan, BlueBubbles, Discord (bubble-shaped face); the exceptions are Telegram (plane), QQ (penguin), Snapchat (ghost) | 10 of 13 messengers; 18 tagged icons (some apps appear in two lists) |
| Shield / lock / key / keyhole | Microsoft Authenticator, Bitwarden, Ente Auth, 1Password, KeePassXC, LuLu, Threema's lock; exceptions: Google Authenticator (asterisk), Okta Verify (check), Authy and Proton Pass (abstract), Tailscale (dots) | 6 of 11 security/2FA/VPN apps |
| Lightning bolt | The Zeus Network, Leisu Sports, Burp Suite, Zed Attack Proxy: entertainment hype and attack/proxy tools | 4 icons, none of them messaging or trust |
| Paper plane | Telegram, AirDroid, Flighty (as a real plane) | the "send" metaphor is owned by Telegram |
| Letterform | the most common glyph type (48 App Store, 17 outside) | works only when the letter is custom-drawn (Threads, Zed, Notion) |
| Device replica (phone, monitor) | Link to Windows, atvTools, MonitorControl | weak at 29 px; HIG: don't replicate Apple hardware |

## Exemplars and why they work

The picks page shows each at 96 px and at 32 px on light and dark: `~/.cache/apple-design/icons/index.html`.
Reasons are ours; the 29 px reading was checked on the contact sheets.

**Messaging, security, transfer**

- **WeChat**: two overlapping bubbles, white on one owned green. The silhouette alone survives
  29 px and tinted mode. Proof that a bubble only works when the brand owns the colour first.
- **Threema**: bubble + lock, white on black, three green dots as the one signature detail.
  The security message is said once, inside the messaging shape, not added as a badge.
- **Telegram**: one glyph in a disc; the plane says *send*, not *chat*.
- **Signal**: a generic bubble made Signal's by one detail, the dashed outline.
- **1Password**: keyhole and numeral fused into one round mark; depth used once, centred.
- **Tailscale**: a 3×3 dot grid, white on black. No metaphor, entirely ownable, identical in
  every appearance.
- **LocalSend**: a dotted ring around a solid disc. Nearby transfer without an arrow, one colour.

**One mark, owned colour**

- **ChatGPT**: monochrome knot on white; no colour at all and still the most recognised AI icon.
- **Claude**: one asterisk in one terracotta. A warm colour owns a category of blues and gradients.
- **Snapchat**: owned yellow plus a ghost outline; colour alone finds it on a full page.
- **Spotify**, **Cash App**, **NetEase Cloud Music**, **Tinder**: one glyph on one colour each (green arcs on
  black; a dollar sign on green; a red note-disc; a flame).
- **AutoSleep**: a moon and nothing else on near-black.
- **Duolingo**: the mascot reduced to a face, two eyes and a beak.

**Craft and material (indie and Mac)**

- **Notion**: an N block, ink on paper-white: the closest exemplar to an ink-on-paper palette.
- **Threads**, **Zed**: a single letterform on black, zero decoration.
- **Things 3**: one checked box, crisp edges; the app's single job is the icon.
- **Bear**: an animal silhouette cut into a red field; personality without a full mascot.
- **Halide**: an aperture in tool-like metal, category through material.
- **Ghostty**: a terminal window with a ghost inside; object and character as one silhouette.
- **Obsidian** (gem), **OrbStack** (glass orb), **Flighty** (plane on black), **Overcast**
  (broadcast mark on orange), **Arc** (one arc on white): depth or colour used once.

## Mac vs iOS, and what Liquid Glass changed

- HIG (refined 2026-06-08): iOS, iPadOS, macOS and watchOS icons are layered (a background plus
  one or more foreground layers) and take Liquid Glass highlights, refraction and translucency;
  build them in Icon Composer; provide **square, unmasked** layers; prefer crisp edges and
  vector layers; the system supplies highlights, shadows and blur, so don't paint them in.
  iOS/iPadOS/macOS appearances: default, dark, clear light/dark, tinted light/dark; keep the
  same features in every appearance. One design across platforms.
- Observed 2026-10-21 on macOS 26.7 (one Mac, `NSWorkspace.icon(forFile:)` versus the bundle's
  `.icns`): 33 of the 45 apps in `/Applications` declare `CFBundleIconName` (asset-catalog icon).
  Steam's `.icns` is a circle, but macOS draws its asset-catalog squircle; Blender's catalog icon
  is named `blender_liquid_glass`. The bundle-`.icns`-only apps on it (Obsidian, Slack, Linear,
  Lark, Termius) already ship squircle art, and macOS draws them nearly unchanged with an edge
  highlight added. Directly distributed apps are moving to the same squircle template as iOS.
- Consequence (ours): a Mac icon is now the iOS icon with the system's Mac treatment, not a
  separate freeform drawing. Design once in Icon Composer; the 21 % freeform Mac icons in the
  outside list are the old style, not a model.
- Consequence (ours): tinted and clear appearances reduce an icon to its silhouette and
  luminance. Icons whose identity is a colour gradient (the rejected blue→purple candidates) lose
  it; icons whose identity is a shape (WeChat, Tailscale, Threads) keep it.

## Checklist for designing or reviewing an icon (ours)

1. **Name the one idea** in five words. If it needs "and", cut one half.
2. **Category scan**: put the candidate beside the 10 nearest apps in the contact sheets (or
   `icon_study.ts sheets`). Reject it if it shares both motif and dominant hue with two of them.
3. **Cliché check** against the table above: bubble (messaging), shield/lock/key (security),
   bolt, paper plane, device replica. Each needs a written reason.
4. **Colour**: one owned hue, checked against the hue table; azure needs a reason.
5. **29 px and 16 px** on a light and a dark plate: the silhouette is still the idea.
6. **Appearances**: preview default, dark, clear and tinted in Icon Composer; the tinted
   version must still be recognisable (shape carries identity, not colour).
7. **No words** unless one letter is the brand; no campaign overlays; no UI replicas, no
   Apple hardware (HIG).
8. **Layers**: background solid or simple gradient; foreground shapes with crisp edges; at
   most one translucent overlapping layer for depth; no painted shadows or glows.
9. **Mac**: the same icon file; check it in the Dock beside Finder, Safari and three
   neighbours from the outside list.
10. **Show the candidate among real icons** (a contact-sheet row) when presenting it, never
    alone on a white artboard.
