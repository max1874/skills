---
name: apple-design
description: Design, redesign, or review the UI of an Apple-platform app (iOS/iPadOS and macOS first; watchOS, tvOS, visionOS too) against Apple's Human Interface Guidelines as of iOS 27 / macOS 27 and Liquid Glass. Use before changing any screen, navigation structure, control placement, color, typography, icon, copy, or interaction in an Apple app; when someone says an app looks dated or non-native; and when reviewing screenshots of an Apple app.
---

# Apple design

This skill exists because a redesign was once done from memory: an action button
floated above the tab bar, a 76 pt Thin numeral headlined the screen, and the work
was reported finished before a single screenshot was looked at. Memory of "how Apple
apps look" is not a source; the HIG pages and Apple's own apps are.

This skill makes an app correct for its platform. Correct alone is not the goal:
use `/taste` alongside it for the product's own character.

## Sources, in order of authority

1. **The local HIG mirror** — `~/.cache/apple-design/hig/` (173 Markdown pages
   converted from Apple's DocC JSON, one file per page, each with its `Source:` URL;
   `INDEX.md` lists every page with its one-line abstract; the HIG landing page is
   `human-interface-guidelines.md`). Pages with a change log list it at the end; the
   newest entries show what changed for Liquid Glass.
2. **This skill's references** — distilled rules in our own words with links, for
   fast recall. When a reference and the mirror disagree, the mirror wins; fix the
   reference.
3. **Apple's first-party apps on the current OS** — the closest analog screen
   (Weather for a weather header, Photos for a grid, Music for a mini player,
   Notes/Mail for list → detail, Settings for forms). Name the analog in the design
   note and say what it does.

Apple's text and artwork are not redistributable, so the mirror lives outside the
repository. Rebuild or refresh it with (paths relative to this skill's folder; Node.js 22.18+,
no packages):

```bash
node scripts/hig_sync.ts   # writes ~/.cache/apple-design/hig (≈2 MB; 13 min on 2026-10-20)
node scripts/hig_sync.ts --out DIR
```

Refresh when `INDEX.md`'s date is more than a month old, after a WWDC (June) or a
September OS release, or when a page you need looks out of date. Search it with
grep, e.g. `grep -il "tab bar" ~/.cache/apple-design/hig/*.md`, then read the whole
page, not only the matching lines.

## Rule strength

The references keep the HIG's own strength, because a design note has to cite it
honestly:

- **Don't / never / must** — the HIG states it flatly. Breaking it needs a strong,
  written reason.
- **Avoid / prefer / in general** — the default; a deviation is allowed with a reason
  in the design note.
- **Consider** — an option the HIG suggests.
- **(ours)** — our own inference or workflow, not an HIG statement. Never cite it as
  Apple's rule.

## Workflow

Follow these steps for any change that alters what a person sees or does.

1. **Inventory.** List every screen, sheet, and flow that will change, and for each
   one its job: the one or two things a person comes to it for.
2. **Research before drawing.** For each screen, name the system containers and
   components involved (tab view, navigation stack, split view, toolbar, sheet,
   list, collection, search, menu, button style…). Read the corresponding mirror
   pages in full, plus [references/liquid-glass.md](references/liquid-glass.md).
   Find the first-party analog and note how it places content and controls.
3. **Write a design note** (in the app repository's task notes or the PR body, not
   in this repository). Per screen: purpose; structure (container, what sits in the
   top toolbar, bottom toolbar, tab bar, content); where every action lives and the
   HIG rule that puts it there (page + section link, with its strength); typography
   (text styles, not point sizes); color (which elements get accent or tint, and why
   only those); states (empty, loading, error, offline, long content, accessibility
   text sizes); motion and haptics; accessibility labels. A placement or styling
   choice with neither a citation nor an analog is a guess — resolve it before coding.
4. **Confirm direction** with the product owner when the note introduces a new
   visual direction or navigation structure. Small fixes inside an agreed direction
   proceed without a pause.
5. **Implement with system components first.** Standard containers, bars, button
   styles, materials, text styles, semantic colors, and SF Symbols adopt Liquid
   Glass, Dynamic Type, Dark Mode, accessibility, and new devices (iPhone Duo's
   side bars, iPad windows) for free. Custom drawing must justify itself in the note.
6. **Screenshot gate.** Run the app with this task's code and capture every changed
   screen on a real device or simulator: light and dark; resting state and scrolled
   state (content under bars); at least one large accessibility text size for
   text-heavy screens; empty and error states that changed. Look at each image and
   walk [checklist.md](checklist.md) against it, writing down any failed item. Fix,
   recapture, repeat. Only after a clean pass is the screen done; until then report
   it as "changed, unverified" with the screenshots taken so far. When someone is
   working on the machine or the device being captured: no window brought to the front,
   no app switched in, no focus taken.
7. **Show comparisons in one image.** When the product owner is to compare a before
   and after, or several candidates, put them side by side in a single labelled image:
   same device, same state, one column per version, one row per appearance. Never
   hand over separate files to flip between (ours; separate files can't actually be
   compared). Build it with
   `swift scripts/compare.swift out.png --cols "Now,Option A" --rows "Light,Dark" <images, row by row>`.

## Rules that are easiest to get wrong

Each links to its source; details live in the references.

- **Tab bars navigate; they don't act.** The HIG: use a tab bar for navigation, not
  to provide actions; controls that act on the current view belong in a toolbar. So a
  screen's action goes in its toolbar (top or bottom), inline in the content, or in a
  menu — not in or on the tab bar. The HIG's one example of something attached to the
  tab bar is Music's MiniPlayer accessory.
  ([Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars))
- **Don't use Liquid Glass in the content layer.** Glass is for controls and
  navigation; content uses standard materials. Instead of solid or semi-opaque
  backgrounds under controls, use a scroll edge effect, and extend full-screen
  backgrounds under the bars.
  ([Materials](https://developer.apple.com/design/human-interface-guidelines/materials),
  [Layout](https://developer.apple.com/design/human-interface-guidelines/layout))
- **Tint sparingly.** Keep prominent (tinted) buttons to one or two per view; to
  emphasize a primary action tint its background, not its label; don't tint the
  backgrounds of several controls. Brand color can live in the content layer.
  ([Color](https://developer.apple.com/design/human-interface-guidelines/color),
  [Branding](https://developer.apple.com/design/human-interface-guidelines/branding))
- **Built-in text styles; in general avoid Ultralight, Thin, and Light weights.**
  Support Dynamic Type through the accessibility sizes.
  ([Typography](https://developer.apple.com/design/human-interface-guidelines/typography))
- **Semantic system colors**, light + dark + increased-contrast variants for custom
  colors, contrast ≥ 4.5:1 for text up to 17 pt; don't rely on color alone.
  ([Color](https://developer.apple.com/design/human-interface-guidelines/color),
  [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility))
- **Controls default to 44×44 pt on iOS** (28×28 pt minimum), with ~12 pt padding
  around bezelled and ~24 pt around borderless controls. Core functionality is reachable
  by more than one kind of interaction (a swipe action also has a button).
  ([Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility))
- **Launch screen nearly identical to the first screen**: avoid text; no logos unless
  they're a fixed part of the first screen. Onboarding, if needed, is brief; avoid
  permission requests at launch unless the app can't work without them.
  ([Launching](https://developer.apple.com/design/human-interface-guidelines/launching),
  [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding),
  [Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy))
- **Lay out by size class**, not by device model or orientation; respect safe areas;
  keep the same functionality at every size.
  ([Layout](https://developer.apple.com/design/human-interface-guidelines/layout))
- **App icons: one shape, one owned colour, no category cliché.** Before drawing or
  reviewing an icon, walk the checklist in
  [references/app-icon-study.md](references/app-icon-study.md) and show the candidate in a
  row of real neighbouring icons, never alone (ours; from a 425-icon study after every
  icon candidate for one app was rejected).

## References

| File | Covers |
| --- | --- |
| [references/liquid-glass.md](references/liquid-glass.md) | The iOS 26/27 design system: materials, bars, buttons, sheets, search, icons, and the SwiftUI APIs the HIG names for them |
| [references/principles-and-platforms.md](references/principles-and-platforms.md) | Design principles; designing for iPhone, iPhone Duo, iPad, Mac, Watch, TV, Vision Pro, games |
| [references/foundations.md](references/foundations.md) | Accessibility, color, Dark Mode, typography, layout, icons, SF Symbols, images, app icons, branding, motion, writing, privacy, RTL |
| [references/app-icon-study.md](references/app-icon-study.md) | App Store top 250 (CN+US) and top 250 Mac apps outside the store: icon statistics, clichés with counts, exemplars, Mac vs iOS under Liquid Glass, the icon design/review checklist. Rebuild with `scripts/icon_study.ts` |
| [references/patterns.md](references/patterns.md) | Launching, onboarding, loading, feedback, modality, searching, entering data, settings, notifications, accounts, sharing, help, ratings, undo, multitasking, files, drag and drop, charts, media |
| [references/components.md](references/components.md) | Which component for which job, then every component page: content, layout, menus and actions, presentation, selection and input, status |
| [references/system-and-inputs.md](references/system-and-inputs.md) | Widgets, Live Activities, controls, App Shortcuts, Siri, snippets, status bar; gestures, pointer, keyboards, focus, Pencil, Camera Control, Action button |
| [references/technologies.md](references/technologies.md) | Generative AI, machine learning, In-App Purchase, Apple Pay, Wallet, Sign in with Apple, iCloud, HealthKit, Maps and the rest; Apple Design Awards 2026 |
| [checklist.md](checklist.md) | The per-screen review used at the screenshot gate |
