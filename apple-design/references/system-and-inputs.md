# System experiences and inputs

Distilled from the HIG mirror on 2026-10-20; our wording. Base URL:
`https://developer.apple.com/design/human-interface-guidelines/`.

## Widgets ([widgets](https://developer.apple.com/design/human-interface-guidelines/widgets), updated 2026-10-13)

- One focused idea tied to the app's purpose (Weather: current temperature, condition,
  high/low); dynamic, glanceable content; don't stretch a small layout into larger sizes.
- 16 pt margins (11 pt for tight groupings); text ≥ 11 pt; system font and SF Symbols;
  `ContainerRelativeShape` for nested corners.
- Tinted, clear, and accented modes desaturate: color can't carry meaning alone; mark the
  accent group with `widgetAccentable(_:)`.
- Placeholders: static UI with semi-opaque shapes for data. Tapping deep-links to the exact
  place. Description starts with a verb; no "This widget shows…".
- StandBy: removable background, larger text. Data-update animations ≤ 2 s.
- Don't reproduce the widget's look inside the app.

## Live Activities ([live-activities](https://developer.apple.com/design/human-interface-guidelines/live-activities), updated 2026-10-13)

- For tasks with a clear start and end, ≤ 8 hours. Support compact, minimal, expanded, and
  Lock Screen presentations; also Mac menu bar, Watch Smart Stack, CarPlay.
- Only the key glanceable info; tap deep-links. No ads; no sensitive data (redact or opt in).
- Compact: hug the camera, leading + trailing read as one unit, balanced widths. Minimal:
  live data, not just a logo. Limited-width contexts: fit a 28 pt circle.
- Lock Screen margin 14 pt; don't copy notification layouts; check Dark Mode and Always-On.
- Logo mark without its container, never the full app icon; large, medium-or-heavier text.
- Animations ≤ 2 s; update only when content changes; alert only for essential updates and
  don't also push a notification for them; end promptly (custom dismissal 15–30 min typical).
- Few controls (one ideally), directly related (pause, playback).

## Controls ([controls](https://developer.apple.com/design/human-interface-guidelines/controls))

- Buttons or toggles in Control Center, Lock Screen, Action button. Symbol must stand alone;
  toggles need distinct on/off symbols that animate between states. Consider redacting when locked;
  authenticate security actions. Action-button hint starts with a verb ("Hold for Silent").

## App Shortcuts, Siri, snippets ([app-shortcuts](https://developer.apple.com/design/human-interface-guidelines/app-shortcuts), [siri](https://developer.apple.com/design/human-interface-guidelines/siri), [snippets](https://developer.apple.com/design/human-interface-guidelines/snippets))

- Adopt app schemas for common domains first (Siri AI, 2026-06-08); App Shortcuts (≤ 10) for
  unique tasks. Phrases short, include the app name, ≤ 1 optional parameter with predictable
  values.
- Expose actions and content as App Intents and entities; annotate on-screen entities so
  Siri understands "this"; donate actions.
- Siri responses: short, specific follow-ups ("Which soup?"), work spoken and shown, no app
  name, no ads, call it "Siri" (never he/she).
- Snippets: confirmation or result views ≤ 400 pt tall; specific primary button ("Order",
  not "OK"); don't duplicate the dialogue text.

## Notifications, status bar, Always On

- Notifications: see patterns.md.
- Status bar ([status-bars](https://developer.apple.com/design/human-interface-guidelines/status-bars)): transparent; scroll edge effect for legibility; hide temporarily for
  full-screen media with an easy way back; avoid hiding it permanently.
- Always On ([always-on](https://developer.apple.com/design/human-interface-guidelines/always-on)): hide sensitive data, dim secondary content, keep layout stable.

## watchOS surfaces ([complications](https://developer.apple.com/design/human-interface-guidelines/complications), [watch-faces](https://developer.apple.com/design/human-interface-guidelines/watch-faces))

- Complications: dynamic, all families when possible, a deep link each, tinted mode safe (no color-only
  meaning), placeholders.

## Inputs

- **Gestures** ([gestures](https://developer.apple.com/design/human-interface-guidelines/gestures)): standard meanings (tap activates, swipe reveals/dismisses/scrolls,
  touch-and-hold reveals more); don't repurpose them; immediate feedback; custom gestures
  only when necessary, discoverable, never the only path; keep the Back button alongside
  edge swipe; don't fight system edge gestures.
- **Pointer** ([pointing-devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices)): iPad highlight/lift/hover effects; ~12 pt / ~24 pt hit padding;
  no instructional text on the pointer.
- **Keyboards** ([keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards)): support Full Keyboard Access; keep standard shortcuts (⌘C, ⌘Z,
  ⌘,…); custom shortcuts only for frequent unique commands; Command first, Shift as a
  complement, Option sparingly, avoid Control; display order ⌃⌥⇧⌘. iPad: keyboard
  navigation for content (lists, fields), not controls.
- **Focus** ([focus-and-selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)): system focus effects; avoid moving focus without input
  (except when the focused item disappears under directional input); iPad
  focus groups follow reading order.
- **Apple Pencil** ([apple-pencil-and-scribble](https://developer.apple.com/design/human-interface-guidelines/apple-pencil-and-scribble)): mark on contact; every control responds to
  Pencil; hover previews and avoids starting actions; respect the double-tap setting; squeeze = one quick
  nondestructive action; Scribble works in standard text components except password fields.
- **Camera Control** ([camera-control](https://developer.apple.com/design/human-interface-guidelines/camera-control)): SF Symbols only, short names, units on slider values,
  UI clear of the overlay; provide a locked-camera capture extension.
- **Action button** ([action-button](https://developer.apple.com/design/human-interface-guidelines/action-button)): a few essential functions, labels ≤ 3 words starting with a
  verb, keep people in context (Live Activity or snippet instead of opening the app).
- **Motion sensors** ([gyro-and-accelerometer](https://developer.apple.com/design/human-interface-guidelines/gyro-and-accelerometer)): only with clear benefit; not for UI manipulation
  outside games.
- **Nearby interactions** ([nearby-interactions](https://developer.apple.com/design/human-interface-guidelines/nearby-interactions)): continuous feedback that sharpens with
  proximity; never the only way.
- **Game controls**, **remotes**, **Digital Crown**, **eyes**: see principles-and-platforms.md
  and the mirror pages.
