# Components

Distilled from the HIG mirror on 2026-10-20; our wording. One section per component page,
grouped as the HIG groups them. Bars, buttons, sheets, and search are covered in depth in
[liquid-glass.md](liquid-glass.md); this file holds the rest and the cross-component rules.
Base URL: `https://developer.apple.com/design/human-interface-guidelines/`.

## Choosing the right component

| Need | Use | Not |
| --- | --- | --- |
| Switch top-level sections | Tab bar (sidebar on wide/complex) | Segmented control, toolbar |
| Act on the current view | Toolbar item, inline button, menu | Tab bar item |
| Switch closely related views of one thing | Segmented control (≤ ~5 on iPhone) | Tab bar |
| Choose one of a flat set | Pop-up button (menu picker); picker for medium-to-long lists | Toggle |
| Several actions behind one control | Pull-down button (about 3+ items) | Pop-up button |
| On/off in an iOS list row | Switch | — |
| On/off outside lists (iOS) | Button that toggles its appearance | Switch |
| Choices right after a person's action | Action sheet / confirmation dialog | Alert, menu |
| Unexpected problem needing a decision | Alert | Notification |
| Scoped task returning to context | Sheet | Push navigation |
| Small info anchored to a control (regular width) | Popover | Popover in compact width |
| Item commands | Context menu (also elsewhere in UI) | Context menu as the only path |
| Image-heavy items | Collection (grid) | List |
| Text people scan | List | Collection |

## Content

- **Charts** ([charts](https://developer.apple.com/design/human-interface-guidelines/charts)): bars for comparison, lines for trends, points for relationships, outliers, clusters; fixed
  axis when bounds mean something (0–100%), dynamic otherwise; familiar tick steps; compact
  width → maximize plot, units in the title; accessibility labels for each mark or group of
  marks, with context, no subjective words; don't rely on color alone.
- **Image views** ([image-views](https://developer.apple.com/design/human-interface-guidelines/image-views)): display only; an interactive image is a button showing an image.
  Text over images: consider a text shadow or background layer for contrast.
- **Text views** ([text-views](https://developer.apple.com/design/human-interface-guidelines/text-views)): long or styled text; Dynamic Type; make useful text selectable.
- **Web views** ([web-views](https://developer.apple.com/design/human-interface-guidelines/web-views)): brief embedded web content; not a browser.

## Layout and organization

- **Lists and tables** ([lists-and-tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)): text people scan; short row text; navigation lists
  keep the selected row highlighted, option lists show a checkmark; chevron
  (disclosure indicator) navigates, the info button only shows details; no section index
  next to trailing accessories; match the list style to the data (iOS grouped style for
  sections with headers and footers); built-in row content configurations.
- **Collections** ([collections](https://developer.apple.com/design/human-interface-guidelines/collections)): visual content in standard rows or grids, not attention-seeking
  layouts; padding so focus/hover effects show; animate insert/delete/reorder; don't
  rearrange while people interact.
- **Boxes** ([boxes](https://developer.apple.com/design/human-interface-guidelines/boxes)): small groupings; padding instead of nested boxes; optional short title.
- **Labels** ([labels](https://developer.apple.com/design/human-interface-guidelines/labels)): semantic label colors (`label`, `secondaryLabel`, `tertiaryLabel` for
  unavailable, `quaternaryLabel` watermark) instead of custom grays.
- **Disclosure controls** ([disclosure-controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls)): hide advanced options (`DisclosureGroup`), label
  what's revealed; one disclosure button per view.
- **Split views** ([split-views](https://developer.apple.com/design/human-interface-guidelines/split-views)): on iOS prefer them in regular width; highlight the path in every pane;
  iPad windows resize fluidly — design every width; macOS thin dividers, min/max pane sizes,
  hideable panes with a toolbar button and menu command.
- macOS-only: column views (Finder columns), outline views (hierarchy in the first column,
  persist expansion). Tab views: macOS (≤ 6 tabs, nouns, title case; watchOS shows them as
  pages). tvOS-only: lockups.

## Menus and actions

- **Buttons**: see liquid-glass.md. macOS: ellipsis on push buttons that open another
  window; square (+/−) buttons sit under the view they act on.
- **Menus** ([menus](https://developer.apple.com/design/human-interface-guidelines/menus)): verb labels, title case, no articles; "…" when more input follows;
  most used first; separators between groups; submenus one level deep (≤ ~5 items); toggled
  items change their label (Show Map / Hide Map); icons all-or-none per group, standard
  icons for standard actions. iOS menu layouts: small (4 symbol-only items on top), medium
  (3 symbol + label items on top, e.g. Notes' Scan/Lock/Pin), large (list).
- **Context menus** ([context-menus](https://developer.apple.com/design/human-interface-guidelines/context-menus)): only the most relevant item commands, short, ≤ ~3 groups;
  every command also available elsewhere; hide unavailable items; destructive items last
  and red; standard icons; a context menu or an edit menu on an item, not both.
- **Edit menus** ([edit-menus](https://developer.apple.com/design/human-interface-guidelines/edit-menus)): prefer the system menu; applicable commands only; custom items next to
  related system ones, static text selectable.
- **Pop-up buttons** ([pop-up-buttons](https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons)) show the current choice; **pull-down buttons**
  ([pull-down-buttons](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons)) hold actions (about three or more feels worthwhile); avoid putting all of
  a view's actions in one; destructive items need confirmation.
- **Activity views** ([activity-views](https://developer.apple.com/design/human-interface-guidelines/activity-views)): open only from a Share button.
- **Home Screen quick actions** ([home-screen-quick-actions](https://developer.apple.com/design/human-interface-guidelines/home-screen-quick-actions)): ≤ 4, title states the result, SF
  Symbol icons, no app name.
- **Dock menus**, **the menu bar**: see principles-and-platforms.md (Mac).
- **Ornaments** (visionOS): system toolbars and tab bars become ornaments automatically.

## Navigation and search

Tab bars, toolbars, sidebars, and search fields: see liquid-glass.md.
macOS-only: path controls (in the window body), token fields (comma tokenizes).

## Presentation

- **Sheets, alerts, action sheets, popovers**: liquid-glass.md and patterns.md.
- **Page controls** ([page-controls](https://developer.apple.com/design/human-interface-guidelines/page-controls)): only for sequential flat pages, ≤ ~10 dots, centered at the
  bottom; custom indicator images only with meaning (≤ 2 kinds); system colors.
- **Scroll views** ([scroll-views](https://developer.apple.com/design/human-interface-guidelines/scroll-views)): avoid nesting same-direction scroll views; hint at more content
  with partly visible items; paging with a page control hides that axis's indicator; scroll
  edge effects per liquid-glass.md.
- **Windows** ([windows](https://developer.apple.com/design/human-interface-guidelines/windows)): iPad/Mac/Vision only; adapt to any size; open new windows only on
  purpose; call them "windows"; on iPad keep leading toolbar items clear of window controls;
  macOS: no critical controls in a bottom bar.
- **Panels** (macOS): floating controls for the current selection, e.g. an inspector; menu
  items say "Show Fonts"/"Show Inspector", not "panel"; help text may say "Fonts window".

## Selection and input

- **Toggles** ([toggles](https://developer.apple.com/design/human-interface-guidelines/toggles)): only for two opposite states; iOS switches only inside list rows,
  default green unless there's a reason; outside lists use a button whose appearance toggles,
  without a text label; state shown by more than color.
- **Pickers** ([pickers](https://developer.apple.com/design/human-interface-guidelines/pickers)): short list → consider a pull-down button; medium/long → picker; very long → list or
  table (with an index);
  logical order; shown in context, not on a new screen; date pickers: compact style when space is
  constrained; minute intervals that divide 60.
- **Segmented controls** ([segmented-controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)): related views or modes of one thing; equal widths;
  text or symbols, not both; nouns in title case; ≤ ~5 on iPhone; not for app sections.
- **Sliders** ([sliders](https://developer.apple.com/design/human-interface-guidelines/sliders)): min leading, max trailing; end icons only when meaningful; pair with a
  field for precision; never a custom volume slider (use the system volume view).
- **Steppers** ([steppers](https://developer.apple.com/design/human-interface-guidelines/steppers)): beside the value they change; add a field for big changes.
- **Text fields** ([text-fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)): sized to expected input; stacked, even spacing; Clear button on
  the trailing end; secure field for secrets; validation timing per field type.
- **Virtual keyboards**: patterns.md (entering data).
- **Color wells**: the system color picker.

## Status

- **Progress indicators**: patterns.md.
- **Gauges** ([gauges](https://developer.apple.com/design/human-interface-guidelines/gauges)): value within a range; short labels for value and both ends; a gradient
  may reinforce meaning (hot → cold).
- **Activity rings**: only Move/Exercise/Stand, unaltered, on black, one person.
- **Rating indicators** (macOS): whole stars, editable inline.
