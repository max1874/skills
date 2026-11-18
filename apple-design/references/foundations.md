# Foundations

Distilled from the HIG mirror on 2026-10-20; our wording. Base URL:
`https://developer.apple.com/design/human-interface-guidelines/`. Liquid Glass specifics
(materials, color on glass) are in [liquid-glass.md](liquid-glass.md).

## Accessibility ([accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [voiceover](https://developer.apple.com/design/human-interface-guidelines/voiceover))

- Goals: intuitive, perceivable (never one channel only), adaptable. Audit with
  Accessibility Inspector; App Store Connect has Accessibility Nutrition Labels.
- Ideally let text enlarge to at least 200% (watchOS 140%), through Dynamic Type or custom UI.
- Contrast (WCAG AA): text ≤ 17 pt → 4.5:1; ≥ 18 pt or bold → 3:1. Check light and dark;
  at minimum honor Increase Contrast. Aim for 7:1 for small custom-colored text.
- Don't rely on color alone: add shape, symbol, or text (charts, status, toggles).
- Controls 44×44 pt (minimum 28×28) on iOS; ~12 pt spacing around bezelled controls,
  ~24 pt around borderless ones.
- Core functionality works through more than one kind of interaction (swipe-to-delete also
  has an Edit-mode delete button).
- VoiceOver: label every meaningful element, more descriptive than defaults; describe
  meaningful images, hide decorative ones; unique screen titles and headings; group image +
  caption; post notifications when content changes; support the rotor.
- Voice Control, Switch Control, Full Keyboard Access need correct labels and focus order.
- Avoid auto-dismissing UI; let people control autoplay; honor Dim Flashing Lights.
- Reduce Motion: tighter springs, fades instead of x/y/z movement, no animated blur or depth.
- Assistive Access: focus on core tasks, one step per screen, double confirmation for
  destructive actions.
- Captions/subtitles/audio descriptions/transcripts for media; haptics alongside audio cues.

## Typography ([typography](https://developer.apple.com/design/human-interface-guidelines/typography))

- Consider the built-in text styles (they scale with Dynamic Type). iOS defaults at the Large
  size: Large Title 34, Title 1 28, Title 2 22, Title 3 20, Headline 17 semibold, Body 17,
  Callout 16, Subheadline 15, Footnote 13, Caption 1 12, Caption 2 11 (pt). Emphasis via
  `.bold()` (each style has a defined emphasized weight).
- Default 17 pt, minimum 11 pt on iOS; macOS 13/10.
- **In general, avoid Ultralight, Thin, and Light weights**; prefer Regular, Medium,
  Semibold, Bold.
  A thin custom font needs larger sizes.
- Few typefaces. System families: SF (Pro, Compact, Rounded, Mono) and New York; reach them
  with `Font.Design` (`.rounded`, `.serif`, `.monospaced`); never bundle system fonts.
- Custom fonts must support Dynamic Type and Bold Text; a common split is custom headlines
  with system body text.
- Dynamic Type: test up to AX5; scale meaningful icons (SF Symbols do); avoid truncation —
  allow multiple lines; at accessibility sizes stack horizontally adjacent items and reduce
  columns; keep the hierarchy (primary content stays on top). Not everything needs to grow
  (tab titles don't).
- Tight leading only for one or two lines; loose leading for long wide text.
- macOS has no Dynamic Type; use its fixed styles (Body 13).

## Color and Dark Mode ([color](https://developer.apple.com/design/human-interface-guidelines/color), [dark-mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode))

- One color, one meaning, everywhere. Don't make noninteractive text look like a tinted
  button.
- Semantic system colors: backgrounds `systemBackground` / `secondary…` / `tertiary…`, or the
  grouped set for grouped lists; text `label` → `quaternaryLabel`, `placeholderText`,
  `separator`, `link`. Avoid redefining their meaning (no separator-colored text).
- Don't hard-code system color values; they change between releases.
- Every custom color: light, dark, and increased-contrast variants (asset catalog Color Set).
- Culture: red means "up" in Chinese stock charts; check color meanings per locale.
- Use the system `ColorPicker` when people choose colors.
- Dark Mode: no in-app appearance switch; support Auto switching while running; soften
  white-background images; system backgrounds so sheets and popovers get the elevated
  variant; in rare cases consider dark-only, e.g. immersive media viewing.
- macOS: accent color applies only when the person chose "multicolor"; sidebar icons follow
  their accent unless the color carries meaning.

## Layout ([layout](https://developer.apple.com/design/human-interface-guidelines/layout), updated 2026-09-09)

- Order by importance: top and leading first. Align; indent to show hierarchy; group with
  space, containers, or separators; reveal secondary detail progressively.
- Controls on glass, content edge to edge beneath (see liquid-glass.md).
- Lay out by size class, not device or orientation; keep the same functionality at every
  size; a tab bar may become a sidebar at regular width.
- Respect safe areas, layout margins, readable width; keep clear of the Dynamic Island and
  iPhone Duo reserved regions.
- Dynamic Type changes layout: rows grow, horizontal arrangements stack.

## Icons and SF Symbols ([icons](https://developer.apple.com/design/human-interface-guidelines/icons), [sf-symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols))

- Prefer SF Symbols; custom glyphs are black-on-clear templates, vector (PDF/SVG), matching
  symbol weight, size, and perspective, optically centered, with an accessibility label.
- Standard action symbols: Done `checkmark`, Cancel/Close `xmark`, Delete `trash`, Add
  `plus`, More `ellipsis`, Share `square.and.arrow.up`, Search `magnifyingglass`, Filter
  `line.3.horizontal.decrease`, Compose `square.and.pencil`, Rename `pencil`, Undo
  `arrow.uturn.backward`, Redo `arrow.uturn.forward`, Select `checkmark.circle`, Copy
  `document.on.document`, Paste `document.on.clipboard`, Duplicate `plus.square.on.square`,
  Account `person.crop.circle`, Archive `archivebox`, Calendar `calendar`.
- Don't make selected variants for bar icons; the system draws selection.
- Rendering modes: monochrome, hierarchical (depth), palette, multicolor (intrinsic meaning);
  variable color for changing values; gradients (SF Symbols 7+) at larger sizes.
- Variants: outline beside text and in toolbars; fill in tab bars and swipe actions; slash
  for unavailable; enclosed for small sizes. Scales small/medium/large keep weight matched
  to text.
- Animations carry meaning: bounce = something happened, pulse/breathe = ongoing, replace =
  state change, wiggle = attention, draw on/off = progress. Use sparingly.
- Symbols may not be used in app icons or logos.

## Images ([images](https://developer.apple.com/design/human-interface-guidelines/images))

- Provide @2x and @3x (iOS); embed color profiles; PNG for UI raster, JPEG/HEIC for photos,
  PDF/SVG for flat icons. Text over images: ensure contrast, e.g. a text shadow or background
  layer ([image-views](https://developer.apple.com/design/human-interface-guidelines/image-views)).

## App icons ([app-icons](https://developer.apple.com/design/human-interface-guidelines/app-icons), refined 2026-06-08)

- Layered Liquid Glass icon built in Icon Composer: background (solid or gradient) plus
  foreground layers with crisp edges and varied opacity; vector layers; square, unmasked;
  content centered.
- One simple concept with few shapes; filled overlapping shapes for depth; no text unless
  essential; illustrations, not photos or UI screenshots; no Apple hardware.
- Let the system handle highlights, shadows, and blur; custom effects only intentionally and
  tested in Icon Composer or on device.
- Default, dark, clear, and tinted appearances keep the same features; 1024×1024 px.
- (ours) Before designing or reviewing an icon, read [app-icon-study.md](app-icon-study.md):
  crowded motifs and hues with counts, exemplars, and the icon checklist.

## Branding ([branding](https://developer.apple.com/design/human-interface-guidelines/branding), 2026-09-09)

- Brand voice in copy; accent color sparingly (primary actions, status, selected tab);
  brand color in the content layer rather than on controls.
- Familiar components, expected placement, standard symbols; branding defers to content;
  no logo on every screen; no branded launch screen.

## Motion and haptics ([motion](https://developer.apple.com/design/human-interface-guidelines/motion), [playing-haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics))

- Motion only with purpose, brief, interruptible, following the gesture; never the only
  carrier of information; honor Reduce Motion. Avoid custom motion on frequent interactions.
- Standard controls already play haptics. Use system haptic patterns only for their meaning
  (success ≠ failure); keep them short and optional; harmonize with sound and animation.
  iOS categories: notification (outcome), impact (physical), selection (value change).

## Writing ([writing](https://developer.apple.com/design/human-interface-guidelines/writing), [inclusion](https://developer.apple.com/design/human-interface-guidelines/inclusion))

- Clear, concise, plain; most important information first; consider splitting
  several ideas across screens.
- Action labels: consider starting with a verb ("Send", "Add to Cart"); descriptive links, not
  "Click here"; device-appropriate verbs ("tap").
- Consistent capitalization per element type; menus and buttons use title case in English.
- Possessives sparingly ("Favorites", not "Your Favorites"); avoid "we" altogether — "Unable to load
  content", not "We're having trouble…". Address people as "you".
- Flows: "Get Started" → "Continue"/"Next" → "Done".
- Empty states: welcoming, say what to do next, offer the action.
- Errors: prevent first; show beside the problem; say how to fix it; no blame, no "oops".
- Settings labels describe the ON state; link straight to settings instead of describing paths.
- Text fields: labels plus format hints ("name@example.com").
- Inclusive: no unnecessary gender, jargon, idioms, or humor that won't translate.

## Privacy ([privacy](https://developer.apple.com/design/human-interface-guidelines/privacy))

- Ask only for what a feature needs, when people start using it; not at launch unless the app
  can't work without it and the reason is obvious.
- Purpose strings: one complete, specific sentence, sentence case, active voice, period.
- A pre-permission screen is optional; if used it has only one button, titled like "Continue"
  or "Next" (not "Allow"), which opens the system alert; no other actions unless needed for
  legal consent. For tracking, App Review rejects incentives, imitation alerts, pictures of the
  alert, and arrows pointing at Allow.
- Prefer the location button for one-off location; passkeys or Sign in with Apple over
  passwords; secrets in Keychain; process on device when possible.

## Right to left ([right-to-left](https://developer.apple.com/design/human-interface-guidelines/right-to-left))

- System components flip automatically; flip custom navigation and progress controls; in general
  avoid flipping logos, universal marks like checkmarks, real-world objects like clocks, and
  photos; never reverse the digits within a number.
