# Principles and platforms

Distilled from the HIG mirror on 2026-10-20 (iOS 27 / macOS 27). Our wording; follow
the links for Apple's text. Base URL: `https://developer.apple.com/design/human-interface-guidelines/`.

## Design principles ([design-principles](https://developer.apple.com/design/human-interface-guidelines/design-principles), reintroduced 2026-06-08)

| Principle | What it asks of a screen |
| --- | --- |
| Purpose | It creates real value, stays focused on the most important features, and finds its own way to solve the problem rather than re-creating existing solutions. |
| Agency | The UI stays out of the way; people explore freely, can skip or escape even necessary guided flows, and recover from mistakes. |
| Responsibility | Transparent about what happens and why; collect the minimum data. |
| Familiarity | Known concepts, consistent visuals and interactions, clear feedback; system patterns for alerts and choices. |
| Flexibility | Designed for everyone and as many inputs as possible; accessibility from the start; context preserved through consistent positions and natural animation; each platform used on its own terms. |
| Simplicity | "Simple" is not "minimal": concise words, a clear hierarchy, recognizable controls. |
| Craft | Quality in details, iteration, staying current with the platform. |
| Delight | Choose the feeling deliberately, invest in defining moments; decoration is not delight; consider the whole experience. |

Use these as the "why" column in a design note. A choice that serves none of them is
usually decoration.

## iPhone ([designing-for-ios](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios))

- Few onscreen controls; secondary actions discoverable with little effort (menus,
  context menus, swipe actions).
- Adapt to orientation, Dark Mode, Dynamic Type.
- Controls in the middle or bottom of the display are easier to reach, so support swipe
  to go back and swipe actions on list rows.
- Use platform data (with permission) instead of asking people to type what the
  device already knows.

## iPhone Duo ([designing-for-iphone-duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo), new 2026-09-09)

A new form factor: an outer display (compact width, wide and short) and an
inner display (regular width) with a hinge.

- Build to resize: size classes, layout margins, safe areas; no fixed widths or
  display-specific code. Compact layout for outer, regular for inner covers every pose.
- Same functionality and state on both displays; the inner display may show one more
  level of hierarchy (Mail: list or message closed, both side by side open).
- On the outer display (and inner in landscape) the system moves the status bar,
  toolbar, and tab bar to a vertical strip on the side. Standard bars get this for free;
  don't override the default placement.
- Toolbar order on the vertical axis: Back/Close first, then the prominent action
  (Done), then remaining groups. Group with `ToolbarItemGroup`; avoid adding fixed spacing yourself.
  Give every symbol item a title too (`Label`), since the system uses titles in overflow menus and
  expanded forms.
  Minimize text-only buttons. Set `ToolbarItemVisibilityPriority` so frequent actions
  (Compose, New Note) and badged items survive overflow.
- Navigation-centric screens compress the toolbar into the overflow menu (default);
  task-centric screens minimize the tab bar instead (`ToolbarVerticalCompressionBehavior`).
- Use the system overflow menu; the ellipsis symbol means overflow only.
- Keep controls next to the content they affect (list controls stay above the list pane).
- Reserved regions: outer camera (always), inner camera (only when active), the fold
  (when partly open). System alerts, sheets, menus, split views avoid them; custom
  views use `ReservedRegion`. Prefer an even number of grid columns; small adjustments,
  not rearrangement, as the device folds.
- Consider `ArrangementView` (split or overlay) when a layout already resembles an
  HStack/VStack or ZStack pair; keep navigation containers outside it.
- Games: playable in every pose; change aspect ratio rather than letterbox.

## iPad ([designing-for-ipados](https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados), [multitasking](https://developer.apple.com/design/human-interface-guidelines/multitasking))

- Elevate content; minimize modal views and full-screen transitions.
- Apps run full screen or, in windowed mode, in freely resizable windows: adapt fluidly to
  any size; size content for viewing distance and input.
- Tab bar sits near the top; it can convert to a sidebar (`sidebarAdaptable`) for
  complex hierarchies.
- Save and restore context on every switch; pause attention-needing activity when
  the app leaves the foreground; finish started tasks in the background.
- Pointer: highlight effect for small transparent controls, lift for small opaque
  ones, hover for large; ~12 pt hit padding around bezelled, ~24 pt around borderless
  elements; contiguous hit regions in bars ([pointing-devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices)).

## Mac ([designing-for-macos](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos), [the-menu-bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar))

- Shallow hierarchy, little modality, resizable windows, full-screen support,
  customizable toolbars, keyboard shortcuts for everything frequent.
- **Every command lives in the menu bar**, even if it also exists elsewhere.
  Menu order: App, File, Edit, Format, View, app menus, Window, Help. Items stay put;
  disable rather than hide. One-word menu titles. About first, then Settings….
  Window menu always (Minimize, Zoom); View menu even if it only holds Enter Full Screen.
  Undo/Redo name the action ("Undo Typing"); "Delete" not "Erase"/"Clear".
  Avoid making a dynamic (modifier-revealed) item the only way to do something; use one
  modifier.
- Menu bar extra: consider a symbol or template icon (bar height 24 pt); clicking shows a
  menu — avoid a popover unless the functionality is too complex for a menu; let people
  decide whether it shows; consider exposing its functions elsewhere too.
- No critical controls at the bottom edge of a window; keep clear of the camera housing.
- Documents: autosave, hide extensions, Duplicate over Save As; you can append "Edited" to
  the title while there are unsaved changes.
- Text styles are fixed (no Dynamic Type): Body 13 pt, Headline 13 pt bold, Large Title
  26 pt; default text 13 pt, minimum 10 pt; control size 28×28 pt default, 20×20 minimum.
- Standard cursors: pointing hand for links, open/closed hand for panning, I-beam for
  text, resize arrows on edges.

## Watch, TV, Vision Pro, games (brief)

- **watchOS** ([designing-for-watchos](https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos)): glanceable, one screen at a time, shallow
  hierarchy, Digital Crown; complications and notifications matter more than the app.
  Text 16 pt default / 12 min; ≤3 glyph buttons or 2 text buttons per row; double tap
  performs a non-scrolling view's primary action.
- **tvOS** ([designing-for-tvos](https://developer.apple.com/design/human-interface-guidelines/designing-for-tvos)): focus-driven, legible from across the room (29 pt body),
  safe area 60 pt top/bottom and 80 pt sides; controls 66×66 pt.
- **visionOS** ([designing-for-visionos](https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos)): windows for UI, the least immersion that serves the
  moment, comfort first (content in the field of view, indirect gestures, no
  head-locked content), button centers ≥60 pt apart.
- **Games** ([designing-for-games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games), [game-controls](https://developer.apple.com/design/human-interface-guidelines/game-controls)): playable soon after install, teach through
  play, defer permission prompts; touch controls 44 pt (28 pt for minor), visible and
  haptic press states, symbols instead of "A/X/R1", movement left / camera right; support
  the platform's default input as well as controllers (tvOS and visionOS may require one).

## Platform size table

| Platform | Body text default / min | Control default / min |
| --- | --- | --- |
| iOS, iPadOS | 17 / 11 pt | 44×44 / 28×28 pt |
| macOS | 13 / 10 pt | 28×28 / 20×20 pt |
| tvOS | 29 / 23 pt | 66×66 / 56×56 pt |
| visionOS | 17 / 12 pt | 60×60 / 28×28 pt |
| watchOS | 16 / 12 pt | 44×44 / 28×28 pt |

Source: [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [typography](https://developer.apple.com/design/human-interface-guidelines/typography).
