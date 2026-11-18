# Web pages and web apps

For anything that renders in a browser: product sites, landing pages, web apps, admin consoles, docs. The method in SKILL.md and the floor apply first; this file adds what is specific to the web. Sources: impeccable `mode-persuade`, `mode-operate`, `mode-read`, `operate`; hallmark `anatomy`, `macrostructures`, `review-hero`, `responsive`, `interaction-and-states`, `craft` §6–9; ai-design-skills' landing-page interview (commits in SKILL.md).

## Name the mode first

The mode decides how much the page's own world may take over. A page can mix modes by region (a product site's docs are Read; its pricing is Persuade).

**Persuade** (landing, product, pricing). The first screen makes the offer understandable and wanted, shows the one action in its working form (a download button, a real input), and demonstrates something only this product can prove. Proof sits next to each claim, not in a testimonials section at the bottom.

**Operate** (web apps, consoles, settings, dashboards). A user fluent in this kind of tool should know where everything is before noticing the style. Character comes only from type, palette, density and one named signature move (service health drawn as a transit map; a schedule set in timetable columns); layout, navigation and controls stay the standard ones. Rules:
- One well-tuned sans is usually enough; a fixed rem scale with steps of about 1.125–1.2, never fluid headings.
- The accent marks primary actions, selection and state only. A second neutral (slightly warmer or cooler) separates sidebars, toolbars and panels from content.
- Standard affordances: no reshaped scrollbars, invented form controls, or display fonts in labels, buttons or data.
- Most transitions 150–250 ms (overlays and view changes up to 500 ms, per the floor); no load choreography; skeletons instead of spinners in content; empty states that teach the screen.
- Density is allowed when the work needs it: tables with many rows, panels with many labels.
- Dropdowns and popovers escape `overflow: hidden` ancestors (popover API, `<dialog>`, `position: fixed`, or a portal).

**Read** (docs, guides, changelogs, articles). The reader's question leads. The frame (masthead, navigation rail, title and section openers, how code and tables are set) carries the product's character fully; the reading column stays calm: a reading face, real contrast, 60–75 characters, nothing moving behind the text. Documentation still reads as documentation. The reader always knows where they are and where to go next.

**Experience** (portfolio, demo). The work leads from the first screen; the page frames it and gets out of the way.

## Persuade pages

**Before any visual work**, have answers to: the one action the page exists for; where visitors arrive from; their top three doubts; what real evidence exists (captures, numbers, quotes the owner supplied). Ask the user in one batch for what is missing.

**Inventory material.** Mark each thing real, capturable from the product, or absent. A missing fact (a price, a date) is a visibly blank slot named in the handoff, never a plausible value; a link with no known URL points to the section of this page that does the job, never to an invented route; a form with no endpoint says plainly that nothing was sent and never shows success.

**Structure is a choice.** Two different products must not come out as color swaps of one template. When proposing directions, vary the structure itself. A vocabulary of shapes (hallmark's 21, `macrostructures.md` in the repository): an irregular bento of real items; a long document that reads like a memo; a marquee hero that is the whole first screen; a page led by one real figure; a workbench tour of real captures; an honest FAQ; a manifesto; one huge photograph per fold; a page led by a real quote; a serif specimen for publishing and writing products; a type specimen where a typeface is the product; a catalogue of variations; a founder's letter; an index of links; a staged workflow; a split studio with proof always on one side; a sticky heading with scroll-synced captures; a portfolio grid; one large diagram; a browsing ecosystem; an interactive component playground. Pick from what the material supports: a shape built on captures needs real captures.

For a product page, the honest building blocks are: a spec sheet (limits, formats, platforms, in real figures); a worked example (the product doing one real job, a capture with its caption); a changelog with real dates; the product beside today's way of doing the job, row by row; the real price; real objections answered plainly. Logo rows, feature triplets and testimonials exist only when the material does.

**Hero review**, by someone who did not build it, from screenshots at phone and desktop widths:
- Does the headline say something only this product could say, in about seven words?
- Is the visual a real thing (a capture, the product itself, a photograph) and big enough to hold its half of the screen? Delete it in your head: if the screen says the same, it is too weak or too small.
- Does anything read as a template: a centered stack, a pill above the headline, a gradient blob, an empty colored box, a drawn illustration, two filled buttons side by side?
- Is the page's strongest real thing on this screen?

Then review the whole page the same way: read only the headings and the hero; if they tell the story, the rest is the right length.

**Copy.** Section headings say what the visitor will see or get, never a category label ("Features", "Our story", "Why choose us"). Short headlines, one-line intros, two-sentence paragraphs. One filled primary button per page; secondary actions outlined or plain text.

## Responsive

- Every page works without fault from 320 to 1920 CSS px. Check by eye at about 375, 768, 1024 and 1440.
- Two shared breakpoints in `rem` (about 40rem and 60rem) so they follow the user's font size; add one only where the content itself breaks. Layout changes at breakpoints; sizes that change continuously use `clamp()`.
- Under the wide breakpoint, multi-column grids go to one column, sidebars and filter columns collapse into a menu or disclosure, sticky panes unstick.
- Detect hover and touch with `@media (hover: hover)` and `(pointer: coarse)`, never by width. No hover-only interaction.
- Buttons, primary navigation and calls to action never wrap. Fix in order: shorten the label, `white-space: nowrap` and let the row reflow, then move overflow links behind a menu.
- `dvh`/`svh` for heights that meet mobile browser chrome, never `vh` on a hero; `width: 100%`, never `100vw`. With `viewport-fit=cover`, fold safe areas into the gutter.
- Tables on a phone keep the column that names the row and the one that acts on it in view: restack rows as labelled blocks or pin the first column.
- Images carry `width` and `height`, `srcset` sizes, `loading="lazy"` below the fold and never on the largest above-the-fold image.
- Logical properties and room for 30–40% longer strings; no hard-coded date or number formats.

## Forms and controls

- A visible label above every field; a placeholder shows a format, never an instruction or the label.
- Validate a field on blur once touched, then on every input. An error says what broke and how to fix it, tied to the field (`aria-describedby`, `aria-invalid`); a failed submit focuses the first invalid field.
- A field's border never changes width between states; state moves to background, border color, outline or shadow, so nothing shifts. Reserve the helper line and a right-edge slot (clear, error glyph, spinner) so nothing reflows.
- Focus ring: `outline: 2px solid` in the focus color with a 2 px offset (inset on inputs), 3:1 against both the element and the page, on `:focus-visible`. Never `outline: none` without a replacement.
- Inputs match the height of the button beside them. Marketing controls 44–52 px; app controls 32–40 px with a 44 px hit area (48 on coarse pointers). At most two button sizes.
- Native `<dialog>` for modals (focus trap and Escape for free), `inert` behind it, closable by Escape, backdrop and a visible control. Native select, checkbox and radio unless a custom one keeps native keyboard and screen-reader behavior.
- `name`, `autocomplete`, the right `type` and `inputmode` on every field; paste never blocked; 16 px text on mobile so iOS does not zoom.

## Browser surfaces

The parts nobody drew still ship: text selection, the caret, scrollbars, focus rings, link underline offset, numerals in tables. Theme their colors from the palette (`::selection`, `caret-color`, `accent-color`, `scrollbar-color`, `text-underline-offset`, `font-variant-numeric`), without changing their shape or behavior. Set `color-scheme` so form controls and scrollbars follow the theme.

## Fonts and resources

The project decides. Some projects use system fonts and load nothing external (for example, to stay reachable from mainland China); others load web fonts. Keep whatever the project has decided. Where a project does load fonts: only the weights used, `font-display: swap`, a fallback of the same build, `font-synthesis: none`.

## Dark mode on the web

Only when the product ships both modes. One token set with a dark override block, applied by `prefers-color-scheme` unless the user picked a mode; the choice is persisted and read before first paint so the page never flashes the wrong mode.

## Verify in a real browser

Render this task's code in a real browser (the browser tool the agent has, such as Playwright or a browser extension) at phone and desktop widths, both themes if both ship, and with reduced motion. Screenshot every changed state, open every image, and walk the floor against them. The checkers in the source repositories skip Chinese line breaking, so check it by eye.
