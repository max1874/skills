# Patterns

Distilled from the HIG mirror on 2026-10-20; our wording. Base URL:
`https://developer.apple.com/design/human-interface-guidelines/`.

## Launching, onboarding, loading

- **Launching** ([launching](https://developer.apple.com/design/human-interface-guidelines/launching)): launch fast. The launch screen is nearly identical to the
  first screen; avoid text on it; don't advertise, and no logos unless they're a fixed part
  of the first screen. A splash belongs at the start of onboarding, not the launch screen.
  Restore the previous state (e.g. scroll position, window state).
- **Onboarding** ([onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)): if a prerequisite flow is needed, keep it brief and
  interactive; consider making tutorials optional and findable later; consider contextual
  tips (TipKit); avoid licensing details (if required, integrate them in a balanced way);
  postpone setup; request permissions in onboarding only when the app needs them to
  function, otherwise at first use; ask for ratings or purchases after people get value.
- **Loading** ([loading](https://developer.apple.com/design/human-interface-guidelines/loading)): show something immediately (placeholders, cached content); let
  people do other things; determinate progress when length is known; large assets download
  in the background.
- **Progress indicators** ([progress-indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators)): determinate when possible; honest and steady;
  never frozen; specific labels, not "Loading…"; don't morph a spinner into a bar; Cancel
  (and Pause if cancelling loses work). Pull-to-refresh supplements automatic refresh, never
  replaces it.

## Feedback and modality

- **Feedback** ([feedback](https://developer.apple.com/design/human-interface-guidelines/feedback)): match intrusiveness to importance. Status sits near the item
  it describes. Alerts only for critical, actionable information. Confirm only significant
  completions; otherwise report failures only. Warn before unexpected irreversible loss,
  not before expected deletion. When something can't be done, say why.
- **Modality** ([modality](https://developer.apple.com/design/human-interface-guidelines/modality)): modal only for a clear benefit — critical info, confirming an
  action, a short scoped task, or an immersive task. Keep it short; no app-within-an-app.
  Obvious dismissal (iOS: top toolbar button or swipe down). Confirm if dismissal loses
  edits. Title it with the task. Avoid a modal over a modal (an alert may
  appear over anything); one alert at a time.
- **Alerts** ([alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)): not for information alone, not for common undoable deletions, not at
  launch. Title says what happened (never just "Error"); ≤ 3 buttons with one- or two-word
  result verbs; "OK" only when purely informational; Cancel is always "Cancel", never the
  default; destructive style only when the destructive result isn't what the person chose.
- **Action sheets** ([action-sheets](https://developer.apple.com/design/human-interface-guidelines/action-sheets)): choices about an action the person just started
  (Delete Draft / Save Draft); destructive at top, Cancel at bottom; no scrolling.
- **Popovers** ([popovers](https://developer.apple.com/design/human-interface-guidelines/popovers)): avoid them in compact size classes; use a sheet there.

## Searching ([searching](https://developer.apple.com/design/human-interface-guidelines/searching), iOS placements in [liquid-glass.md](liquid-glass.md))

- If search matters, give it a primary position: a bottom-toolbar field (Notes) or a
  dedicated tab (Photos, TV).
- One place that searches everything; local filters only for clearly separate sections.
- Clearly display the current scope (placeholder, scope bar, or title).
- Recents before typing, suggestions while typing; let people clear history.
- Index content in Spotlight; offer App Intents entities so Siri and Spotlight see it.

## Entering data ([entering-data](https://developer.apple.com/design/human-interface-guidelines/entering-data), [text-fields](https://developer.apple.com/design/human-interface-guidelines/text-fields), [virtual-keyboards](https://developer.apple.com/design/human-interface-guidelines/virtual-keyboards))

- Get data from the system (with permission) before asking. Prefer choices over typing.
- Labels plus placeholder hints; sensible defaults; secure fields for secrets; never prefill
  passwords.
- Validate as people type (or on leaving the field for emails); number formatters for
  numeric input; disable Next/Continue until requirements are met.
- Matching keyboard type and text content type; descriptive Return key (`submitLabel`);
  keep the active field and primary button above the keyboard (keyboard layout guide).

## Settings ([settings](https://developer.apple.com/design/human-interface-guidelines/settings))

- Defaults that suit most people; as few settings as possible; don't ask what you can detect.
- Don't duplicate system settings (appearance, accessibility).
- Task options (sort, filter, show/hide) live on the screen they affect, not in Settings.
- Rarely changed options can go in the system Settings app, with a button that opens it.
- macOS: Settings… in the app menu (⌘,), panes in a fixed toolbar, title = pane name.

## Notifications ([notifications](https://developer.apple.com/design/human-interface-guidelines/notifications), [managing-notifications](https://developer.apple.com/design/human-interface-guidelines/managing-notifications))

- Ask for permission in context. Concise, valuable, never duplicated, no instructions to
  open the app, no sensitive data on the Lock Screen.
- Title is a short headline without the app name; body in full sentences.
- ≤ 4 actions, title-case verbs naming the result, no "Open" action, prefer non-destructive.
- Badges count unread notifications only.
- Interruption levels: passive, active (default), time sensitive (now or within the hour,
  never marketing), critical (urgent health and safety information;
  entitlement required). Marketing needs explicit opt-in.
- Errors go in the app (alert or inline), not in a notification.

## Accounts and sign-in ([managing-accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts), [sign-in-with-apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple))

- Require an account only for core functionality; delay sign-in; explain the benefit.
- Prefer Sign in with Apple, then passkeys; name the method on the button
  ("Sign In with Face ID").
- If people can create an account in the app, they must be able to delete it: in the app,
  or through a direct, easy-to-find link to the deletion webpage; real deletion, confirmation
  of completion, revoke Sign in with Apple tokens, explain subscriptions keep
  billing until cancelled.

## Sharing, help, ratings, undo

- **Share** ([activity-views](https://developer.apple.com/design/human-interface-guidelines/activity-views), [collaboration-and-sharing](https://developer.apple.com/design/human-interface-guidelines/collaboration-and-sharing)): Share button (usually in the toolbar,
  `ShareLink`) opens the system sheet; custom actions are verb phrases without the app
  name; report failures, not routine success.
- **Help** ([offering-help](https://developer.apple.com/design/human-interface-guidelines/offering-help)): inline help for short tasks; TipKit tips for one simple feature
  (≤ 3 actions, one or two sentences, throttled, not for features already used); don't
  explain standard components.
- **Ratings** ([ratings-and-reviews](https://developer.apple.com/design/human-interface-guidelines/ratings-and-reviews)): prefer the system prompt; ask after real engagement, at a
  natural pause; avoid first launch and onboarding.
- **Undo** ([undo-and-redo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo)): name what will be undone; show the change; support many levels;
  keep standard gestures (three-finger swipe, shake).

## Multitasking, files, drag and drop, full screen

- **Multitasking** ([multitasking](https://developer.apple.com/design/human-interface-guidelines/multitasking)): save and restore state on every switch; pause activities that
  need attention; finish started work in the background.
- **Files** ([file-management](https://developer.apple.com/design/human-interface-guidelines/file-management)): autosave; system open/save views; Duplicate over Save As.
- **Drag and drop** ([drag-and-drop](https://developer.apple.com/design/human-interface-guidelines/drag-and-drop)): support widely with menu alternatives; move within a
  container, copy across; multi-item; undoable; highlight the destination only while over
  it; animate failure; keep dropped items selected.
- **Full screen** ([going-full-screen](https://developer.apple.com/design/human-interface-guidelines/going-full-screen)): for media, games, focused tasks; people choose when to
  leave; hidden chrome returns with a familiar gesture.

## Media and data

- **Charts** ([charting-data](https://developer.apple.com/design/human-interface-guidelines/charting-data), [charts](https://developer.apple.com/design/human-interface-guidelines/charts)): chart data when it helps people learn something; otherwise
  consider a list.
  Simple common types; a headline summary (Weather: "Chance of light rain in the next hour"); bars
  start at zero unless that hides meaning; color plus shape; VoiceOver labels and Audio
  Graphs; interaction optional.
- **Audio** ([playing-audio](https://developer.apple.com/design/human-interface-guidelines/playing-audio)): obey the Silent switch for nonessential sound; never change system
  volume; pause when headphones disconnect; choose the right audio session category.
- **Video** ([playing-video](https://developer.apple.com/design/human-interface-guidelines/playing-video)): system player; original aspect ratio, no baked letterboxing.
