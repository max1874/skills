# Technologies

Distilled from the HIG mirror on 2026-10-20; our wording. Brand-name spelling and official
buttons matter for App Review here. Base URL:
`https://developer.apple.com/design/human-interface-guidelines/`.

## Generative AI ([generative-ai](https://developer.apple.com/design/human-interface-guidelines/generative-ai), updated 2026-06-08)

- Add AI only where it brings clear, specific value; design for when AI is unavailable or
  declined — when possible, consider a non-AI fallback (some features have no substitute).
- Always disclose where AI is involved; never let output pass as human.
- Choose the model for the need and for privacy: on-device is private, fast, offline;
  server models need minimizing what's sent, saying data leaves the device, showing what's
  shared and whether it's stored or used for training.
- Guide inputs with varied example prompts; warn that output can be wrong; don't ask the
  model for facts it can't verify; avoid AI output where a hallucination could misinform and
  harm.
- Don't automate destructive or hard-to-undo actions (deleting, purchasing); confirm
  significant actions taken on someone's behalf.
- Put Edit, Undo, Retry, Adjust next to generated content; show that an adjustment took
  effect.
- While generating, describe the actual work ("Summarizing key themes from your notes"),
  not "Processing…"; on failure, plain explanation plus a next step. Generate in the
  background where possible. Offering several distinct results can help.
- When a request is blocked or poor, coach toward one that works.
- Feedback (thumbs up/down) is optional and never interrupts; red-team out-of-scope,
  sensitive, and harmful prompts; keep the model swappable behind the UX.

## Machine learning ([machine-learning](https://developer.apple.com/design/human-interface-guidelines/machine-learning))

- The more critical, private, or proactive a feature, the higher the accuracy bar.
- Prefer implicit feedback; explicit feedback is optional and states its consequence
  ("Suggest less pop music"); act on it immediately.
- Corrections use familiar tools and apply instantly; if correcting costs more than doing it
  by hand, the feature fails.
- Multiple options: few, diverse, most likely first.
- Confidence: only show it if it tracks quality; prefer attributions ("Because you read
  mysteries") over percentages, except in naturally statistical domains (weather).
- Attributions are factual, not emotional; explain limitations and how to get better results.

## Purchases and payments

- **In-App Purchase** ([apple-in-app-purchase](https://developer.apple.com/design/human-interface-guidelines/apple-in-app-purchase), rebranded 2026-09-17): digital goods only. Let people
  experience the app first; integrated store look; total billing price on every item; consider
  hiding the store, or explaining why, when payments aren't allowed; never imitate the system confirmation sheet.
  Subscription sign-up shows name, duration, contents, localized price, how a trial converts
  to paid, restore/sign-in, Terms and Privacy links. Encourage a new subscription only for non-subscribers; show the
  renewal date; always make cancelling easy (consider the system manage-subscriptions UI); a "Refund" /
  "Request a Refund" path.
- **Apple Pay** ([apple-pay](https://developer.apple.com/design/human-interface-guidelines/apple-pay)): physical goods, services, donations. Apple Pay buttons come from Apple's API (Buy, Pay,
  Check Out, Book, Donate, Subscribe, Order, Tip, plain…); a custom payment button must not
  show "Apple Pay" or its logo; at least as large as other payment
  buttons, never hidden or disabled, ≥ 140×30 pt (plain 100×30); black on light, white on
  dark. Apple Pay first in checkout; collect required options before the button; the total
  line reads "Pay [business]". "Apple Pay": two words, never plural or possessive.
- **Wallet** ([wallet](https://developer.apple.com/design/human-interface-guidelines/wallet)): consider an "Add to Apple Wallet" button where a pass that
  isn't in Wallet yet appears; passes made in Pass
  Designer; no marketing in change messages.
- **Tap to Pay on iPhone** ([tap-to-pay-on-iphone](https://developer.apple.com/design/human-interface-guidelines/tap-to-pay-on-iphone)): label "Tap to Pay on iPhone" (or "Tap to Pay"),
  symbol `wave.3.right.circle`, never the Apple logo; always show the option.

## Identity

- **Sign in with Apple** ([sign-in-with-apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)): delay sign-in; the button is no smaller than other
  sign-in buttons and needs no scrolling; titles "Sign in with Apple" / "Sign up with Apple"
  / "Continue with Apple"; white, white-outline, or black; ≥ 140×30 pt, margin ≥ 1/10 of the
  height; custom buttons only with Apple's logo files and the system's proportions (title
  ≈ 43% of button height). Don't ask for a password or a personal email afterwards; show the
  relay address you received.
- **ID Verifier** (in-person checks): request the minimum (an age threshold, not a birth
  date); "Verify Age" / "Verify Identity" buttons. **Verify with Wallet** (in-app): system
  buttons such as "Verify Age with Apple Wallet".

## Data and services

- **iCloud** ([icloud](https://developer.apple.com/design/human-interface-guidelines/icloud)): works automatically; don't ask which items to sync; store only
  people's own content, not regenerable data; no alert needed when iCloud is off — consider a quiet note
  that changes won't sync;
  warn that deleting removes it everywhere; resolve conflicts automatically and early.
- **HealthKit** ([healthkit](https://developer.apple.com/design/human-interface-guidelines/healthkit)): request at the moment of need with the system sheet; say "Apple
  Health" to people, never "HealthKit"; Activity rings rules apply.
- **Maps** ([maps](https://developer.apple.com/design/human-interface-guidelines/maps)): keep the map interactive; Apple logo and legal link visible (≈7 pt side,
  10 pt top/bottom padding); cluster dense pins; place cards don't duplicate your info.
- **HomeKit**, **CareKit**, **ResearchKit**, **ShazamKit**, **NFC** ("hold near", not "tap";
  no "NFC" in copy), **Live Photos** (edit all frames; identify them with a hint of motion, or the Live badge
  when motion isn't possible; never a play button),
  **Photo editing** extensions, **iMessage apps and stickers**, **App Clips** (finish the task
  inside the clip, no tab bars or sign-up first, card title ≤ 30 and subtitle ≤ 56
  characters), **AirPlay** (system player, icon from Apple, "AirPlay" as a noun),
  **CarPlay** (templates only, no phone interaction while driving), **Mac Catalyst**
  (sidebar instead of tab bar, every command in the menu bar), **Augmented reality**
  (system coaching view, no jargon like "plane" or "tracking" in copy), **Game Center**,
  **SharePlay**: see the mirror page before designing for any of them.

## Apple Design Awards 2026 ([awards](https://developer.apple.com/design/awards/), not part of the HIG)

What the winners were praised for, as a reference for "excellent":

- Thorough Liquid Glass adoption in service of content (Moonlitt, Tide Guide).
- On-device Foundation Models delivering concrete, private value (live captions, task
  prefill, script drafts, health guidance).
- The full accessibility stack surfaced up front (VoiceOver, Dynamic Type, Increase
  Contrast, Differentiate Without Color).
- Restraint: one idea done well, no needless login or sync, UI that steps aside.
- A distinctive visual identity backed by real functional quality, tactile haptics, sound.
- Charts that turn metrics into actionable guidance.
