---
name: taste
description: How to design any screen or page the user ships — iOS, iPadOS and macOS apps, web apps and sites, and company products — while the user builds their own taste. A working method (references first, real material, distinct options in one image, verify on the real device, record every verdict), an objective quality floor (contrast, type, spacing, states, copy, motion), scoped edit moves (bolder, quieter, distill, polish…), and twenty high-taste companies as exemplars. Use when building or redesigning a screen or page, making a scoped visual change ("make this bolder", "改一下这页", "太乱了"), reviewing a UI, or when the user says it is ugly, not premium, dated, "AI 味", or "像系统 app". On Apple platforms use /apple-design alongside for platform correctness. The project's own DESIGN.md and brand win over this.
---

# Taste

Sources: **twenty high-taste companies** from cosign.co's community list, looked at on 2026-11-01 ([references/exemplars.md](references/exemplars.md)), or the exemplars the user has chosen; **three design repositories** read in full on 2026-10-28 (pbakaus/impeccable, Nutlope/hallmark, elayadesign/ai-design-skills), restated in our words in the references; **platform guidance** in `/apple-design` and its local HIG mirror; and **the user's new verdicts** as they accumulate (section 1).

If the user's instructions point to settings for this skill (their exemplars, where their verdicts are recorded, device and capture rules), read them first.

Order of authority:

1. The user's instruction in the conversation.
2. The project's `DESIGN.md`, brand guidelines, and repository rules (for company products, also the decisions of the company's designers). A project's own decisions outrank every default below, including the floor's "refuse" list.
3. Measurable correctness: contrast ratios, touch targets, text scaling, every state working, behavior the platform enforces. When an approved design fails one, show the user the measured number; never change it silently, never let it pass silently.
4. The user's new verdicts (section 1).
5. The exemplars, platform conventions (`/apple-design`), the floor's defaults ([references/floor.md](references/floor.md)), [references/web.md](references/web.md), frontend-design and other design skills.

## Surfaces

| Surface | Also load | Notes |
|---|---|---|
| iOS / iPadOS | `/apple-design` | Verify on the user's own device, following any device rules they have. |
| macOS | `/apple-design` | Capture without taking focus (apple-design step 6). |
| Web app or site | [references/web.md](references/web.md) | Name the page's mode first; render at phone and desktop widths in a real browser. |
| Company product (built for an employer or client) | the product's brand and `DESIGN.md` | The company's brand and its designers' decisions win. The user's verdicts there go only into that repository's own `DESIGN.md` and local, untracked notes, never into the user's personal settings or any tracked personal record. |

Every surface: [references/floor.md](references/floor.md) once the direction is settled; [references/edits.md](references/edits.md) for a scoped change to something that exists.

## 1. The user's taste

The user's taste is built from their own verdicts. If they have cleared earlier verdicts to start over, do not reconstruct them from old sessions or repository research folders, and do not steer toward or away from what they said. Until new verdicts accumulate, propose from the exemplars and your own judgment, and treat every answer the user gives as data:

- Record each verdict in the project's `DESIGN.md` (method step 2): what was shown, what they chose or rejected, their words, the date, and why when they say.
- When the same judgment shows up in two or more projects, propose adding it to the user's cross-project verdicts (where their settings for this skill keep them), with the dates and projects; add it only when they agree.

## 2. Working method

1. **Name the page's job; it sets how much expression to spend.** Persuade (landing, product, pricing): one memorable moment that proves the product. Operate (app UI, settings, consoles, admin): the tool disappears into the task; character lives in type, palette, density and one signature move, never in the controls. Read (docs, changelog, articles): a calm reading column inside a frame that carries the character. Experience (portfolio, demo): the work is the hero. Don't give a settings screen landing-page treatment. Details per mode: [references/web.md](references/web.md).
2. **Read the project's design record.** Read the project's `DESIGN.md`. Every verdict the user gives goes into it, so a rejected element never comes back and a chosen one is not lost. Create the file at the first verdict if the project has none.
3. **Look at references before designing anything.** Start from the exemplars (the user's own if their settings name them, otherwise [references/exemplars.md](references/exemplars.md)) and say which one a direction learns from and what mechanism it takes, never a copied look. Open the competitors the user names, the products they actually use, and comparable real products found by search, and look at the screens, not descriptions of them. Write down what each one actually does.
4. **Inventory real material; never invent proof.** List what is real now, what can be captured from the product, and what is absent. No fabricated testimonials, logos or metrics, even as samples; a missing fact is a visible blank to fill, never a plausible value. Every sentence of copy traces to the product, its data, or the user's words. For a Persuade page, ask in one batch only what is missing: the one action, where visitors come from, their top three doubts, and what real evidence exists.
5. **Propose with your own taste.** Offer three to five genuinely different directions: different structure or expression, not color swaps, each recognizably different at thumbnail size. Put them side by side in one labeled image, recommend one, and say why you find it good, not only why it is safe or compliant. Do not hand the choice back to the user as a palette or a reference board. While they are building their taste, also say in one line what each direction is betting on, so their pick teaches something.
6. **Scoped changes touch only the named target** ([references/edits.md](references/edits.md)). Add no color, font, radius, shadow or motion the surface does not already own. Write down what must stay first: hero, approved typefaces, factual copy, links. If the fix is not working, change the means rather than increasing the amount.
7. **Redesigns: record what cannot be lost.** Before the redesign, list links, forms and their targets, handlers, legal and support URLs, and factual claims. Afterwards, check that each one still works in the running product.
8. **Build to the floor.** Once the direction is chosen, build to [references/floor.md](references/floor.md) without announcing a checklist, and check it on the rendered result: contrast in every state and theme, type roles, spacing, every state of every control, copy, the stress cases.
9. **Verify what the user will see.** Use the real device on the current OS, the user's text size, light and dark, a real data volume, and motion at real speed with a real finger; for the web, a real browser at phone and desktop widths. Simulator layouts, slowed recordings and untried prototypes have each passed for verification before and missed what the user saw. Open every image before sending it; a comparison must actually show the thing being compared. Get the hero right first, then the whole page: does each screen have something only this product could have? Then send it to an independent reviewer. The reviewer gets the request, the constraints and real screenshots, and lists visible problems before seeing any checker output. For Chinese text, check line breaks and orphan characters at the widths that matter.
10. **Read the user's answer correctly.** An explicit pick ("this is the one", "let's go with 2") is acceptance. "Leave it like this for now", "it's okay, I guess" and "either is fine, you pick one, I'm tired" are fatigue, not approval, and a passive "I suppose we can keep it" has been followed by rejecting the whole result later. Record which kind it was in the project's `DESIGN.md`.

Acceptance evidence, unless the user's instructions set their own: runtime screenshots, before and after composed into one labeled side-by-side image, files numbered in viewing order.

## References

| File | Covers |
|---|---|
| [references/exemplars.md](references/exemplars.md) | Twenty high-taste companies from cosign.co's community list (looked at 2026-11-01): what their websites do, how their iOS apps differ, how they use motion |
| [references/floor.md](references/floor.md) | The objective floor on every surface: contrast, type roles, space and surfaces, states, copy, motion timing, dark mode, stress cases, and the template defaults to question |
| [references/web.md](references/web.md) | Web pages and web apps: the four modes in depth, Persuade-page structure and hero review, responsive rules, forms and controls, browser surfaces, verification in a browser |
| [references/edits.md](references/edits.md) | Scoped moves on an existing design (bolder, quieter, distill, clarify, typeset, layout, colorize, animate, harden, polish): what each may and may not touch |
| `/apple-design` | Apple platform correctness: HIG mirror, Liquid Glass, components, icons, the screenshot gate |

## Not taken, on purpose

The source repositories do these by default; this skill leaves them out:

- Installing hooks or running their checkers on every edit (whether agent hooks and local check suites run at all is the user's decision, not a design skill's).
- Calling paid image or design generation because a key is present. Every paid batch needs the user's explicit yes. Image generation that costs nothing extra (for example, under a subscription the user already has) is fine, and so are SVG and code; no production method is required.
- Universal aesthetic mandates as hard rules: font allow-lists or bans (including impeccable's ban on the platform's system face), gradient headlines, per-section entrance animations, word-by-word reveals, fixed word and section budgets, "never pure black or white", blanket bans on glow. The floor lists the common ones as defaults to question; a project's decision overrides them.
- Treating a checker's exit 0 as success: hallmark exits 0 when rendering never ran, and impeccable's regex path undercounts.
- Fabricated social proof or metrics in any form.

Sources: [pbakaus/impeccable](https://github.com/pbakaus/impeccable) at `3e3a917` (Apache-2.0), [Nutlope/hallmark](https://github.com/Nutlope/hallmark) at `6033bab` (MIT), [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) (MIT); the references restate their guidance in our words. Exemplar list: cosign.co's community list of "high taste companies".
