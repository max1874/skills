---
name: ios-app-name
description: Choose, screen, inspect or reserve App Store names for an identified app and selected locales. Use for renaming an app, proposing name candidates, or an App Store name availability or reservation request; the bundled availability probe performs temporary remote writes.
---

# Claiming an App Store name

## Scope and authorization

Identify the app record, requested name, and target locales. `status` reads state; `check`, `claim`, and `release` mutate App Store Connect. A generic app-development or naming brainstorm request does not authorize these writes. Explain the exact app/locales and temporary rename/delete behavior before requesting missing authorization. Carry existing authorization forward. Preserve locales pinned by filing, trademark, or contract.

Run commands from this skill directory or resolve the bundled scripts relative to it. Do not invoke a real account operation just to validate the skill.

The scripts default to every locale in `reference/locales.txt`. For a selected subset, pass `--except` with all locales outside the approved set; do not omit it and accidentally expand the operation to every locale.

## Why locale scope matters

App Store name uniqueness is decided **per locale**, at the moment someone claims
it. Creating an app record claims the name in exactly one locale — the primary
one. All 38 others stay open to whoever asks first.

Nothing warns you. The record looks complete, the name looks yours, and the
question only gets asked again months later when you add store metadata for
submission. By then the name you designed the icon around, bought the domain
for, and told people about can be gone in your biggest market. The only remedy
Apple offers is a trademark claim against the current holder.

Offer the relevant locale coverage when reservation is requested; do not make name reservation a prerequisite for unrelated app development.

## How long a claim lasts, and what does not extend it

Checked against Apple's current documentation on 2026-08-18:

- **No expiry is documented.** The "Remove an app" help page describes losing a
  name as something that happens when *you* remove the record — "If you remove an
  app, you'll lose ownership of the app name" — and describes removal as a manual
  action by an Account Holder or Admin. Neither that page nor "Add a new app"
  mentions automatic cleanup of records that never receive a build.
- **The "180 days" rule is folklore.** It comes from old iTunes Connect-era forum
  posts. A developer asked Apple directly in 2022 (forum thread 706597); an App
  Store Connect engineer replied about trademark disputes and never answered the
  question. Treat any specific number you read as unsourced.
- **Do not upload a stub build to "lock" a name.** It defends against a rule
  nobody can point to, and it costs something Apple *does* document: once a build
  is uploaded, the bundle ID is permanently bound to that app record and cannot
  be reused. Early in a project is exactly when you are most likely to want to
  rebuild the record.

When an authorized reservation is sufficient, a stub build is not part of the
name-reservation task. The historical evidence above is dated; verify current
Apple documentation before relying on it for a new account decision. `status`
reports whether a build exists.

## Prerequisites

1. **An App Store Connect API key** with the App Manager role or above, in the
   environment: `ASC_KEY_ID`, `ASC_ISSUER_ID`, and the `.p8` private key as
   `ASC_KEY_PATH` (a file path) or `ASC_P8` (the file's contents in base64).
   Inject them with the user's secret tool rather than pasting the key.

2. **An app record already created.** The API cannot create one — verified:
   `POST /v1/apps` answers `The resource 'apps' does not allow 'CREATE'`. Create
   it by hand in App Store Connect (My Apps → +), which needs a registered bundle
   ID. Give it any name that is free; this skill renames it afterwards.

Then take the app's numeric ID from the App Store Connect URL
(`/apps/<appId>/…`) — every command below takes it as `<appId>`.

## Proposing a new name: screen first, recommend after

A candidate reaches the person only after it has passed every gate below, and
the recommendation says which gates ran and which could not. Recommending first
and checking after puts the decision on a name nobody knows can be used
(once the person had to ask why the proposed names had not been checked first).

1. **Meaning.** The name says what the app does, in the product's own terms
   (read the app's product doc), and is not a common store phrase that already
   means something else. "FlipPhoto" was free as a name, but people searching
   "flip photo" want mirror-image editors with thousands of ratings, so the
   brand would drown in them.
2. **App Store search.** `node scripts/appname.mjs screen "<name>"...
   --countries=us,cn` (plus the app's other big storefronts) lists same-name
   apps and the top results for the term. Read-only. An `UNKNOWN` row is a
   throttled query, not a free name: rerun it.
3. **Name ownership in the app's store locales.** `check <appId> "<name>"
   --only=<the app's store locales>`. This also finds names held by unreleased
   apps, which search cannot see (Sortful: no app in search, held in de-DE).
   It needs an editable appInfo; a live app has one only while a version is
   being prepared, so create the next version record first (see Gotchas).
4. **Trademarks**, in the markets the app sells in:
   - USA: in a browser tab on `tmsearch.uspto.gov`, the page's own endpoint
     answers a POST from page context:
     `fetch('/prod-stage-v1-0-0/tmsearch', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({query: {bool: {should: [{match_phrase: {WM: {query: name}}}]}}, size: 10, track_total_hits: true})})`
     → `hits.totalValue`, and each hit's `source.wordmark` / `alive` /
     `internationalClass`. Query the joined and the split form ("flipfile",
     "flip file"). A direct `curl` gets 405.
   - Most other national offices, EUIPO and the USPTO again: WIPO Global Brand
     Database (`branddb.wipo.int/en/similarname`), brand-name field, search
     strategies "Match exact expression" and "Fuzzy" (2026-11-01 the select
     offers Embedded, Match exact, Fuzzy, Phonetic, Stemming; no "Simple").
     **It has no CNIPA data** (coverage page, 2026-10-11).
   - Mainland China (CNIPA) has no search that works from a script; ask the
     user whether it matters for this app before listing it as an open gate.
   A dead or expired mark is not a conflict; a live one in Nice class 9 or 42
   (software) is. Trademark search is screening, not legal clearance; say so.
5. **Then recommend**, from the candidates that passed, with one choice and
   the reason, and a table of what each gate found.

## Renaming a live app

The name is part of the next version, so plan it as a version:

- **Timing.** A version in review locks the editable appInfo, and only one
  version can be in flight. Let the one in review finish, then create the next
  version record; that gives the draft appInfo the new names go into. The live
  appInfo keeps the old names until the new version is released.
- **Writing the names is the final availability check.** PATCH each
  `appInfoLocalizations` name: a taken name answers 409, a free one is written
  and held by the draft. No need to probe the bare word again first.
- **Store side**, every store locale: name; description (replace the brand,
  not the verb: an app named Swipe still says "Swipe up"); keywords (add the old
  name, since the name field no longer carries it, and drop the weakest word
  to stay within 100); whatsNew saying the name changed; review notes opening
  with a short "name change only" paragraph that says the bundle ID and IAP
  product IDs keep the old name; every screenshot that shows the old name.
  Check the IAPs' customer-facing names (`inAppPurchaseLocalizations`); the
  reference name is internal and can stay.
- **App side**: `CFBundleDisplayName`/`CFBundleName`, the permission prompts in
  `InfoPlist.xcstrings`, every string that names the app in every language
  (grep the translations too: in Japanese and Korean the brand sits against
  other letters, so `\bSwipe\b` misses it), and grammar that depends on the
  word: Korean particles follow the last sound (a name ending in ㄹ, like
  Flipfile, takes 이/은/을, not 가/는/를). Keep the bundle ID, URL schemes, IAP product IDs and log
  subsystems.
- **After release**: the ICP filing's app name (China; ASC accepted a zh-Hans
  name that differs from the filing at write time, whether review objects is
  unknown), the support and privacy pages, and a store search for the new name.

## Workflow

**1. See where the app stands.**
```bash
node scripts/appname.mjs status <appId>
```
Prints the primary locale, whether the record has ever received a build, which
locales already hold a name, and which are unclaimed.

**2. Probe an authorized candidate name with temporary remote writes.**
```bash
node scripts/appname.mjs check <appId> "Photo Deck"
```
Every locale reports `free`, `taken`, or `yours`. A locale the app does not hold
is probed by creating the localization and deleting it again; a locale it does
hold is probed by renaming and renaming straight back. Exit code is 0 only when
the name is clean across all 39.

Run this for each candidate before falling in love with one. A name that is free
in en-US and taken in ja is a name that will split your brand later.

**3. Claim the approved name across the approved locales.**
```bash
node scripts/appname.mjs claim <appId> "Photo Deck" --yes
```
Creates or renames the localization in all 39 locales. Report the per-locale
result to the user; if any locale comes back `taken`, say which, and ask whether
to accept a split brand or pick another name — never decide that silently.

**Holding a locale back.** `check` and `claim` both take `--except=zh-Hans,ja`.
Use it when a locale's name is pinned from outside the App Store, because
renaming such a locale releases a name you may not be free to give up:

- **Mainland China.** The China listing's name is expected to match the app's
  MIIT (ICP) filing. App Store Connect does not enforce it at write time:  on
  2026-10-11 a probe wrote a different name over an app's zh-Hans name, which
  its filing fixes, and got 201. The constraint is the filing's, not
  Apple's: renaming zh-Hans ahead of a filing amendment leaves the listing and
  the filing disagreeing, and hands the filed name to whoever asks for it next.
  Amend the filing through the hosting provider first, then claim, unless the
  person decides otherwise.
- Any locale whose name is fixed by a trademark registration or a contract.

**4. Undo, if a locale was claimed by mistake.**
```bash
node scripts/appname.mjs release <appId> ja ko --yes
```
Deletes those localizations. The script refuses to delete the primary locale —
that name is the record's identity, not a claim you can drop. Rename it with
`claim` instead.

## What the API answers mean

Verified against the live API on 2026-08-18:

| Result | Meaning |
| --- | --- |
| `201` | The name was free in that locale and is now claimed |
| `409 ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE.DIFFERENT_ACCOUNT` | Another developer account holds the name in that locale. Unreachable without a trademark claim |
| `409 ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE` | This app already has a localization for that locale — rename it instead of creating one |

Only the `DIFFERENT_ACCOUNT` suffix means "taken". Reading the bare `DUPLICATE`
as a collision is the easy mistake, and it turns "you already own this" into
"you cannot have this".

## Gotchas

- **A live app with no version being prepared has no editable appInfo.** Its
  only appInfo is the published one (`state: READY_FOR_DISTRIBUTION`), and
  `check`/`claim`/`release` stop with an error rather than touch it. Create the
  next version record (in App Store Connect, or `POST /v1/appStoreVersions`) to get a draft. Until
  2026-10-11 the script picked the editable record by excluding
  `READY_FOR_SALE` alone, which let the published one through once Apple began
  reporting `READY_FOR_DISTRIBUTION`; it now allows only editable states.

- **A live app has two `appInfo` records** — the published one and the editable
  draft. The scripts always pick the editable one; renaming the published record
  is not possible and should not be attempted.
- **Probing a locale you hold temporarily renames it.** The rename is reverted in
  a `finally`, and any failure to revert is printed as a `WARNING` naming the
  locale and the original name. If you see one, fix it before doing anything
  else.
- **The locale list is data, not code.** `reference/locales.txt` holds the 39
  locales, each verified to accept a name write. Add a line if Apple adds a
  locale; nothing else needs changing.
- **The name is not the only per-locale field.** Subtitle lives beside it and has
  no uniqueness rule, so it is not claimed here.
- **Sweeping 39 locales trips Apple's rate limiter.** The client backs off on
  `429` (honouring `Retry-After`) and the sweep runs three wide. A throttled
  probe that surfaced as an error would read exactly like a name that could not
  be checked, which is the one wrong answer this tool must not give.
- **Bundle ID and SKU are permanent.** If a candidate name fails and you want a
  different bundle ID, the app record has to be deleted and rebuilt, which is
  only possible before the first submission.

## Files

```
scripts/appname.mjs      locales | screen | status | check | claim | release
scripts/asc.mjs          App Store Connect API client (JWT ES256, no deps)
reference/locales.txt    the 39 name locales
```
