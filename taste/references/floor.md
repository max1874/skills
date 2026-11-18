# The floor

Objective mechanics that hold on every surface, whatever the direction. Load it once the direction is settled and build to it without announcing a checklist; check it on the rendered result, not on intentions. The floor never picks the direction: a page that passes every item can still be generic, and then the exemplars and the project's own character are what is missing.

Apple apps: `/apple-design` owns platform specifics (text styles, Dynamic Type, 44 pt targets, semantic colors); where a number here is web-only it says so. Sources: impeccable `craft-floor`, `typeset`, `layout`, `colorize`, `operate`, `animate`, `harden`, `clarify`; hallmark `craft`, `dark-mode`, `interaction-and-states` (commits in SKILL.md).

## Contrast and color roles

- Body and placeholder text at least 4.5:1; large text, icons, focus indicators and field edges at least 3:1. Measure computed pairs in every state (hover, disabled, error), both themes, overlays and text on images; eyesight is not a measurement.
- Secondary text on a colored surface is a shade of that surface's hue or of the foreground, never generic grey.
- Color is never the only signal: pair it with text, shape, icon or position. Red and green alone never carry meaning.
- Every color has a role: canvas and raised surfaces, primary and secondary text, action, focus and selection, separators, success / warning / error / info, data series. A color with no role is decoration.
- The accent is a signal, not a fill: the primary action, the current selection, focus, state. Inactive states never carry heavy or saturated color.
- Prefer explicit colors over stacked translucent overlays, whose contrast changes with whatever is behind them.

## Type

- The fewest families that make the hierarchy unmistakable. App UI: one family is usually right. Pages: at most a display and a body face, plus one outlier with a single job (a wordmark, code). At most three weights, chosen far apart.
- A role scale, not a collection of sizes: heading, body, label, metadata and data each recognizable without reading the words. App UI steps of about 1.125–1.2; marketing pages about 1.25. Native: the platform's text styles.
- Body: 16 px minimum on the web, line height about 1.5–1.65, measure 45–75 characters (prose 60–75). Display: line height 1.0–1.15, tighter as it grows; tracking no tighter than −0.04em.
- Figures that compare use tabular numerals. Text scaling (Dynamic Type, browser zoom, user font size) keeps working.
- Light text on a dark ground reads heavier and blurrier: adjust line height and weight by eye on the real device in both themes.
- Line breaks: no heading ending on a stub, no paragraph ending on one word, no single Chinese character alone on the last line, at every width the text renders at. Break a heading by hand only between phrases, and check the break on a phone.

## Space and surfaces

- Group by proximity before adding any container. Tight inside a group, generous between groups, more space above a heading than below it. Squint at the screen: the primary element, the secondary one and the major groups should still read in order.
- One spacing scale on a 4 base (4, 8, 12, 16, 24, 40, 64, 96…); off-scale values only as rare optical corrections made after looking at the render.
- Climb the surface ladder only as far as needed: whitespace, then a hairline, then a tinted well, then a card. A card is for content that is independently interactive or of a different kind. Never a card inside a card, never a border and a wide shadow on the same card, never a raised surface darker than its canvas.
- One radius per level, nested radii concentric (inner = outer − padding). Card radii stay modest; pills are for small controls.
- Depth only when it explains state or hierarchy; one shadow style at most, soft and offset. A zero-offset colored halo around a control is decoration.
- Same role, same treatment, on every screen: if the save button looks different in two places, one of them is wrong.

## States

Every interactive element has all of its states, designed: default, hover (pointer devices), focus, pressed, disabled, loading, error, success; plus selected where it applies. An element missing one is not finished.

- **Disabled** near the user's attention says why. On the web, disable submit only while the request is in flight.
- **Loading:** a skeleton where the content's shape is known; a spinner only inside a control, without the control changing width. Show it after 150–300 ms, keep it at least 300 ms, name the operation past 2 s. Never invent progress.
- **Empty:** distinguish first use, no results, filtered out, no permission and failure. Each says what is empty, why it matters, and gives one action.
- **Success** is the result itself, shown from the real answer; no success state where no request was made, no toast for routine success.
- **Error:** what failed, why when known, how to recover; never an internal code as the message.
- **Undo over confirm** for reversible actions. Irreversible ones confirm, naming the object and the action on the button itself, never "OK".
- Touch targets at least 44 × 44 even when the visible mark is smaller.

## Copy

- The product's own words: the nouns its users use, a real number, a real place. A headline that would work unchanged on a competitor's page is rewritten.
- Buttons name their action ("Save draft", not "OK"). Same concept, same word, everywhere.
- Say each thing once. A heading that explains the state needs no introduction repeating it.
- No generated voice: no triads of adjectives, no "not just X, but Y", no "say goodbye to…", no exclamation marks in errors.

## Motion

- Motion explains state, relationship or continuity, or is the one authored moment a surface has earned. Remove anything that is only decoration.
- Durations: 100–150 ms feedback, 150–300 ms routine state change, 300–500 ms layout, overlay or view transition, 500–800 ms one deliberate focal entrance. Exits faster than entrances.
- Decelerating ease for arrivals; no bounce or elastic by reflex. Never animate the focus ring.
- Apps load straight into the task: no page-load choreography, no identical entrance on every section. A page gets at most one reveal, from content that is already visible without it.
- Reduce Motion / `prefers-reduced-motion` gets a designed alternative that keeps meaningful feedback.
- Gestures follow the finger continuously and can be interrupted; never a two-stage sequence that makes people wait.

## Dark mode

- A second designed rendering of the same system, never an inversion. Elevation goes lighter, not shadowed (a shadow on dark reads as glow). Accents lose some saturation and gain lightness, or they glare. Headings keep one color.
- Re-measure every contrast pair in dark. Never filter or invert photographs.
- Whether a dark ground is pure black or a lifted grey is a product decision; read the project's `DESIGN.md`.

## Stress cases

Before calling a screen done, push it through what users will actually bring: a 100-character name; Chinese, English and mixed text, and 30–40% longer translations; the largest accessibility text size or 200% zoom; an empty account and one with 1,000+ items; offline and a slow network; a forced server error; a button tapped ten times; a drag interrupted by a second finger or released outside the control.

## Refuse unless something earns it

These are the category's defaults. Reaching for one when nothing in the brief or the product asks for it means no decision was made; rewrite the element rather than softening it. A project's own decisions can earn any of them; read its `DESIGN.md` first.

- A page structured as a grid of identical icon + heading + text cards.
- The hero-metric template: a big number, a small label, supporting stats, an accent.
- A small label or kicker above a heading (never earned), and section numbers 01 / 02 / 03 that carry no information.
- A modal for a task that needs neither interruption nor protected focus.
- Gradient text; glass and blur as decoration; a thick colored stripe on one edge of cards or alerts; hard offset block shadows.
- Sparklines, progress rings and soft rounded rectangles standing in for content.
- Monospace as a costume for "technical"; emoji or Unicode glyphs standing in for an icon set.
- Decorative sketch-style illustration, grid or stripe backgrounds with nothing measured under them.
- Light or dark chosen by product category rather than by who uses it, where, and in what light.
- Invented testimonials, customer logos, metrics or ratings, in any form.
