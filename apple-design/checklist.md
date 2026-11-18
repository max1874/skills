# Screen review checklist

Use at the screenshot gate (SKILL.md, step 6). Look at each captured screenshot and answer
every line for every changed screen. A "no" is a defect to fix, or a deliberate exception
written into the design note with its source. Strength follows SKILL.md › Rule strength;
lines marked (ours) are our own checks, not HIG statements.

Capture set per changed screen: light + dark, resting + scrolled, one accessibility text
size (AX3 or larger) for text-heavy screens, and each changed empty/loading/error state.

## 1. Structure and placement

- [ ] The screen has one clear job, and the most important content sits top/leading.
- [ ] The navigation container fits the hierarchy: tab bar for top-level sections, push for
      drill-down, sheet for a scoped task, full-screen modal for immersive or long tasks.
- [ ] The tab bar only navigates. Controls that act on the current view are in a toolbar
      (or inline / in a menu), not in or on the tab bar. ([tab-bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars))
- [ ] Every action's position matches a cited HIG rule or a named first-party analog (ours).
- [ ] Toolbar: in general ≤ 3 groups; standard symbol-only Back/Close at leading; one
      `.prominent` primary action at trailing; text items kept apart from symbol items;
      title < 15 characters and not the app name. ([toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars))
- [ ] Sheets: Cancel leading / Done trailing; Done paired with Cancel or Back; one sheet at a
      time. ([sheets](https://developer.apple.com/design/human-interface-guidelines/sheets))
- [ ] Search, if important, has a primary position (search tab, toolbar, or inline above its
      content), and its scope is clear. ([searching](https://developer.apple.com/design/human-interface-guidelines/searching))

## 2. Layers and materials

- [ ] No Liquid Glass in the content layer: cards, rows, and chips inside content use
      standard materials or colors. ([materials](https://developer.apple.com/design/human-interface-guidelines/materials))
- [ ] No solid or semi-opaque backgrounds under controls; a scroll edge effect separates them,
      and full-screen backgrounds extend under the bars. ([layout](https://developer.apple.com/design/human-interface-guidelines/layout))
- [ ] Scrolled screenshot: bar items stay legible over content passing beneath. Resting
      screenshot: the default state keeps clear legibility. ([color](https://developer.apple.com/design/human-interface-guidelines/color))
- [ ] Custom glass is limited to the most important functional elements; clear glass only
      over visually rich backgrounds, with dimming considered over bright content.

## 3. Color

- [ ] Prominent (tinted) buttons: one or two per view at most; the primary action's
      background carries the tint; no colored backgrounds on several controls.
      ([buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [color](https://developer.apple.com/design/human-interface-guidelines/color))
- [ ] Accent/brand color is used judiciously on controls. ([branding](https://developer.apple.com/design/human-interface-guidelines/branding))
- [ ] Semantic colors for text and backgrounds; custom colors have light, dark, and
      increased-contrast variants; the dark screenshot looks intentional.
- [ ] Information isn't conveyed by color alone (status, selection, chart series).
- [ ] Text contrast ≥ 4.5:1 up to 17 pt, ≥ 3:1 at 18 pt or bold, including text over images.
      ([accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility))

## 4. Typography

- [ ] Text uses the built-in text styles, or a deviation is justified; hierarchy comes from
      weight, size, and color.
- [ ] Ultralight/Thin/Light weights are avoided for text people need to read.
      ([typography](https://developer.apple.com/design/human-interface-guidelines/typography))
- [ ] Nothing below 11 pt on iOS.
- [ ] At the AX size: no clipped or overlapping text, minimal truncation, rows grow,
      horizontal groups stack where needed, primary content still near the top.

## 5. Controls and interaction

- [ ] Tap targets use the 44×44 pt default (never below the 28×28 pt minimum) with enough
      spacing between neighbors. ([accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility))
- [ ] System components are used where one fits (list, switch in a list row, picker, menu,
      segmented control) instead of look-alikes. ([components.md](references/components.md))
- [ ] SF Symbols carry their standard meanings (Done `checkmark`, Close `xmark`, Delete
      `trash`, Share `square.and.arrow.up`). ([icons](https://developer.apple.com/design/human-interface-guidelines/icons))
- [ ] Core functionality works through more than one kind of interaction; destructive actions
      confirm or can be undone.
- [ ] Custom buttons have a pressed state; long actions show progress; haptics follow the
      meaning of system patterns. ([playing-haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics))

## 6. States and copy

- [ ] Empty state explains what's missing and offers the next step. ([writing](https://developer.apple.com/design/human-interface-guidelines/writing))
- [ ] Loading shows content or placeholders right away; any progress description is specific.
      ([loading](https://developer.apple.com/design/human-interface-guidelines/loading), [progress-indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators))
- [ ] Errors sit near the problem, say how to fix it, don't blame, and skip interjections
      like "oops" and the word "we".
- [ ] Action labels are clear (usually verbs); capitalization is consistent; device verbs
      ("tap").
- [ ] Permission requests come when the feature needs them (not at launch unless required),
      with a specific purpose string. ([privacy](https://developer.apple.com/design/human-interface-guidelines/privacy))
- [ ] AI features: AI involvement is disclosed; refine/undo/retry controls sit beside
      results; waiting has a designed loading experience. ([generative-ai](https://developer.apple.com/design/human-interface-guidelines/generative-ai))

## 7. Adaptivity and accessibility

- [ ] Layout uses safe areas and size classes; nothing under the Dynamic Island or home
      indicator; wider sizes keep the same functionality. ([layout](https://developer.apple.com/design/human-interface-guidelines/layout))
- [ ] VoiceOver labels exist for icon-only buttons, meaningful images, and charts; decorative
      images are hidden. ([voiceover](https://developer.apple.com/design/human-interface-guidelines/voiceover))
- [ ] Animations have a purpose, are brief, and respect Reduce Motion. ([motion](https://developer.apple.com/design/human-interface-guidelines/motion))

## 8. Compare with Apple (ours)

- [ ] Put the screenshot next to the first-party analog named in the design note. Every
      visible difference is intentional and justified, or fixed.
