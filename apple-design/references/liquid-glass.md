# Liquid Glass: the current design system

Distilled from the HIG mirror on 2026-10-20; our wording, keeping the HIG's strength
(see SKILL.md › Rule strength). Liquid Glass guidance entered the HIG on 2025-06-09 and was
refined through 2025-12-16, 2026-06-08, and the iPhone Duo update of 2026-09-09; mapping
those dates to iOS 26 and iOS 27 is ours. Base URL:
`https://developer.apple.com/design/human-interface-guidelines/`.

## The model: two layers ([materials](https://developer.apple.com/design/human-interface-guidelines/materials))

- **Content layer** — data, images, lists, app backgrounds.
- **Functional layer** — Liquid Glass "forms a distinct functional layer for controls and
  navigation elements — like tab bars and sidebars — that floats above the content layer";
  content scrolls and peeks through beneath it.

(ours) Start every decision with "which layer is this in?". A card holding content is
content: standard material or background color. A control that navigates or acts belongs to
the functional layer — ideally a system bar item or system control, which gets glass
automatically. Content-layer controls stay ordinary controls; the HIG notes that transient
parts like a slider thumb or toggle take on glass while being activated.

## Materials ([materials](https://developer.apple.com/design/human-interface-guidelines/materials))

- **Don't use Liquid Glass in the content layer**; use standard materials (`ultraThin`,
  `thin`, `regular`, `thick`) for content elements such as app backgrounds.
- **Use Liquid Glass effects sparingly** on custom controls (`glassEffect(_:in:)`); system
  components pick it up automatically. Limit it to the most important functional elements.
- Variants: **regular** blurs and adjusts luminosity — most system components use it; use it
  when background content could hurt legibility or the component has a significant amount
  of text (alerts, sidebars, popovers). **Only use clear** for components over visually rich
  backgrounds such as photos and video. Over bright content, consider a dark dimming layer of
  35% opacity behind clear glass; not needed over dark content or with AVKit's own controls.
- Glass appearance responds to people's settings (preferred Liquid Glass look, Reduce
  Transparency, Increase Contrast); (ours) so check legibility with those settings on.
- On standard materials use vibrant semantic colors (`label`, `secondaryLabel`, fills), not
  fixed grays; avoid quaternary label on thin and ultraThin.

## Separating controls from content ([layout](https://developer.apple.com/design/human-interface-guidelines/layout), [scroll-views](https://developer.apple.com/design/human-interface-guidelines/scroll-views))

- Instead of a solid or semi-opaque background color beneath controls, **use a scroll edge
  effect** to lift them above content. Extend full-screen background content underneath
  sidebars, toolbars, and tab bars.
- If a sidebar or inspector would cover an important part of a background image, use
  `backgroundExtensionEffect()` to mirror and blur it underneath.
- Scroll edge effect styles (`ScrollEdgeEffectStyle`): **prefer `automatic`** — it already
  gives more opaque separation for top toolbars with many controls, text outside Liquid Glass
  controls, and pinned table headers. `hard` (opaque blur, defined edge) and `soft` (fading
  blur) are options mainly for custom bars; test `soft` thoroughly for legibility.
- Use the effect only where scrolling content sits behind floating UI — not as decoration or
  a dimmer. One per view; in split views one per pane, at consistent heights.
- Status bar: obscure content under it with a scroll edge effect rather than leaving it
  illegible ([status-bars](https://developer.apple.com/design/human-interface-guidelines/status-bars)).

## Color on glass ([color](https://developer.apple.com/design/human-interface-guidelines/color#Liquid-Glass-color), [branding](https://developer.apple.com/design/human-interface-guidelines/branding))

- Glass has no inherent color; it takes color from content behind it. Symbols and text on
  small elements like toolbars and tab bars are monochrome and flip light/dark with the
  content underneath.
- **Apply color sparingly**, to elements that truly benefit (status, primary actions). To
  emphasize a primary action, color its **background** (the prominent style), not its symbol
  or text. Refrain from coloring the background of multiple controls.
- Over colorful content, prefer monochrome bars and labels, or an accent with clear
  differentiation; avoid label colors similar to the content behind them.
- Consider moving brand color into the content layer, where it scrolls under the glass.
- Colorful content may scroll under controls intermittently; make sure the default/resting
  state keeps clear legibility.
- Provide light and dark colors even if the app ships one appearance, to support Liquid
  Glass adaptivity.

## Tab bars ([tab-bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars))

- **Use a tab bar to support navigation, not to provide actions.** Controls that act on the
  current view go in a toolbar.
- iOS: floats above content at the bottom on Liquid Glass.
- Keep it visible across sections (a modal may cover it). Don't disable or hide tab buttons;
  explain an empty section inside it.
- Labels (single words where possible); SF Symbols, preferring filled; badges only for
  critical information.
- Avoid overflow (the More tab); for complex apps consider a sidebar or `sidebarAdaptable`.
- **Accessory**: e.g. Music's MiniPlayer, attached to the tab bar
  (`TabViewBottomAccessoryPlacement`). With `TabBarMinimizeBehavior` the tab bar can minimize
  on scroll and the accessory moves inline beside it.
- **Search tab** at the trailing end: standard-tab style opens a search landing page
  (discovery, rich suggestions); button appearance focuses the field and keyboard
  immediately (quick lookups; leaving returns to the previous tab).
- iPadOS: tab bar near the top, may share the strip with the toolbar; consider customization
  (`TabViewCustomization`); default to five or fewer tabs.

## Toolbars ([toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars))

The iOS navigation bar is a top toolbar; bottom toolbars carry actions too.

- Zones: **leading** — Back or sidebar toggle at the far edge, then the title, optionally a
  document menu; **center** — common controls (customizable on iPad/Mac, collapse to
  overflow); **trailing** — items that must stay visible, inspectors, optional search, the
  More menu, and the primary action.
- In general aim for at most three groups, grouped by function and frequency
  (`ToolbarItemGroup`); insert space between groups where appropriate. Navigation and
  critical actions (Done, Close, Save) get distinct, familiar groups.
- **Use the `.prominent` style for key actions such as Done or Submit; only one primary
  action, on the trailing side.**
- **Use the standard Back and Close buttons**: standard symbols, no "Back"/"Close" text (a
  capsule with chevron + "Back" is the HIG's "don't").
- Prefer symbols over text for common actions (text where no symbol fits, e.g. Edit); prefer
  system symbols without borders (no outlined-circle variants). Keep text-labeled actions
  separate from symbol actions (fixed space between them).
- Titles: don't use the app name; keep under 15 characters. iOS: large title that collapses
  on scroll.
- Avoid overcrowding; iOS: only essential items in the main toolbar, the rest in a More menu.
  On macOS and iPadOS the system adds an overflow menu automatically — don't add your own.
- Minimize custom toolbar backgrounds and tinted controls.
- Standard components have corner radii concentric with the bar; custom ones should too.
- iPhone Duo: give each symbol item a title as well (`Label`); the system uses titles in
  overflow menus and expanded forms
  ([designing-for-iphone-duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)).

## Buttons ([buttons](https://developer.apple.com/design/human-interface-guidelines/buttons))

- In general, a prominent style (accent-colored background) for the most likely action;
  keep prominent buttons to one or two per view. Distinguish the preferred option by style,
  not size.
- Avoid button label colors similar to colorful content behind them.
- Hit region at least 44×44 pt; custom buttons need a pressed appearance.
- Don't give the primary (Return) role to a destructive action.
- Actions that don't complete instantly: consider an activity indicator in the button,
  optionally with a changed label ("Checking out…").
- SDK names (not in the HIG): SwiftUI `.buttonStyle(.glass)` / `.buttonStyle(.glassProminent)`;
  UIKit bar style `.prominent`; shapes via `ButtonBorderShape`. (ours) Glass button styles
  belong on functional-layer controls, not on chips or buttons inside content cards.

## Sheets ([sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), button placement updated 2026-03-24)

- iOS/iPadOS single-view sheet: **Cancel on the leading edge** of the top toolbar, **Done on
  the trailing edge**.
- If there's a Done button, always pair it with Cancel, or with Back in a later step. Avoid
  showing Cancel, Done, and Back together. Back goes to a previous step or a parent view.
- Multi-step: first step Cancel + inactive Done; later steps Back + inactive Done; last step
  Back + active Done.
- Detents: support `medium` for progressive disclosure; skip it when content needs full
  height. Resizable sheets show a grabber. Support swipe down to dismiss; confirm (action
  sheet) if unsaved changes would be lost.
- Display only one sheet at a time from the main interface. For complex or long flows,
  consider alternatives such as a full-screen modal.

## Search ([search-fields](https://developer.apple.com/design/human-interface-guidelines/search-fields), [searching](https://developer.apple.com/design/human-interface-guidelines/searching))

iOS placements:

1. **Search tab** in the tab bar (above).
2. **Toolbar**: in the bottom toolbar when search is a priority and there's room (Settings
   alone; Mail and Notes alongside other controls); in the top toolbar as a button when the
   bottom must stay clear. Tapping expands it into a field above the keyboard, or at the top
   if there's no room at the bottom (`searchable(text:placement:prompt:)`).
3. **Inline** above the content it searches, when proximity shows its scope.

If search is important, give it a primary position. Placeholder text can reinforce the
scope; start searching as people type; recents before typing and suggestions while typing
(`searchSuggestions(_:)`); scope bars or tokens to filter. iPad/Mac: commonly at the trailing
end of the toolbar, or at the top of the sidebar when it filters the sidebar.

## Sidebars and split views ([sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [split-views](https://developer.apple.com/design/human-interface-guidelines/split-views))

- Sidebars float on Liquid Glass; extend rich content beneath them (horizontal scrolling or
  `backgroundExtensionEffect()`).
- In general no more than two levels in a sidebar; deeper hierarchies use a split view with a
  content list.
- Sidebar icons use the accent color by default (macOS: the person's accent color); fixed
  colors sparingly, for meaning.
- iOS: prefer split views in regular-width environments.

## Menus, keyboard, icons, motion

- Menu item icons: standard icons for common actions; within a group, icons for all items or
  none; no icon rather than an arbitrary one ([menus](https://developer.apple.com/design/human-interface-guidelines/menus), 2026-06-08).
- Controls above the keyboard: only task-relevant ones; consider a Liquid Glass container,
  or use a standard toolbar, which adopts it ([virtual-keyboards](https://developer.apple.com/design/human-interface-guidelines/virtual-keyboards)).
- App icons: layered, built in Icon Composer; square unmasked layers; let the system handle
  highlights, shadows, and blur (custom effects only intentionally and tested); default, dark,
  clear, and tinted variants keep the same features ([app-icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)).
- Liquid Glass motion is emphatic for direct touch and subdued with a trackpad; system
  components handle it ([motion](https://developer.apple.com/design/human-interface-guidelines/motion)).

## SwiftUI names the HIG links to

`glassEffect(_:in:)`, `Glass.regular`, `Glass.clear`, `GlassBackgroundEffect` (visionOS),
`ScrollEdgeEffectStyle`, `backgroundExtensionEffect()`, `TabBarMinimizeBehavior`,
`TabViewBottomAccessoryPlacement`, `TabViewCustomization`, tab view styles `sidebarAdaptable`
and `tabBarOnly`, `ToolbarItemPlacement` (`topBarLeading`, `topBarTrailing`, `bottomBar`,
`primaryAction`), `ToolbarItemGroup`, `ToolbarItemVisibilityPriority`, `ToolbarOverflowMenu`,
`ToolbarVerticalCompressionBehavior`, `ButtonBorderShape`, `ButtonRole.destructive`,
`searchable(text:placement:prompt:)`, `searchSuggestions(_:)`, `confirmationDialog(...)`,
`sheet(item:onDismiss:content:)`, `ReservedRegion`, `ArrangementView`. Check the current SDK
documentation before relying on an exact signature.
