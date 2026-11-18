# Scoped edits

Moves for changing something that already exists. Each one keeps the established look, content and behavior and works inside it; replacing the look is a redesign (method steps 3–7 in SKILL.md), not an edit. If the concept itself is wrong, say so and propose a redesign instead of smuggling one in. Source: impeccable's command references (`bolder`, `quieter`, `distill`, `clarify`, `typeset`, `layout`, `colorize`, `animate`, `harden`, `polish`), restated.

## Rules for every edit

- **Scope is literal.** Touch only the named target. Do not restyle its neighbors or add a color, font, radius, shadow, or motion the surface does not already own. If the system genuinely cannot express the change, ask the user, naming the exact addition and its job.
- **Write down what must stay first**: the hero, approved typefaces, factual claims, links and their targets, anything that triggers an action.
- **Change the means, not the amount.** When a move is not working, a different expression beats more of the same (a 3 pt border that does not work will not work at 4+3 pt either).
- **Finish check**: everything outside the target is unchanged; nothing new appeared that was not asked for; actions still work the same way; it is still unmistakably the same product.

## The moves

Map the user's words to a move before starting.

| Move | The user says | What it does | What it must not do |
|---|---|---|---|
| **bolder** | doesn't stand out, too subtle, no presence, make it stand out more | Raises one part to the strength the rest of the product already reaches, in its own vocabulary: its type scale at full size, its signature move, a change of density or pace. Make one decisive move on the target itself. Skeleton test: with the words removed, the structure alone should still say what this part is and why it matters. | Add effects, rings, badges, glows or new colors: louder is not bolder. |
| **quieter** | too noisy, too busy, too harsh, too much impact | Lowers intensity while keeping a point of view: less saturation and fewer colors, lighter weights, thinner or no lines, fewer effects, shorter and gentler motion, smaller jumps between sizes. Decide which very few things stay strong. | Lose the point of view: one weight, no hierarchy, nothing that is unmistakably this product. |
| **distill** | too cluttered, too much stuff, can't tell what matters | Finds the one goal of the screen and removes what does not serve it: repeated information, competing actions, unnecessary containers and decorations, filler copy. One primary action, few secondary ones, everything else further down or behind disclosure. Note what was removed and where it can still be reached. | Remove a function or an entry point people use, or information needed to make the decision. |
| **clarify** | I don't get it, what does this even say, the copy is wrong | Rewrites interface text along the whole path: for each state, the one fact the user needs, the next action, and only the context that changes the decision. Buttons name actions; errors say what failed and how to recover; empty states say what is empty and what to do. Say each thing once. | Change a factual claim, legal meaning or a domain term without asking. |
| **typeset** | the type is ugly, the hierarchy is unclear, tiring to read | Sets roles first (heading, body, label, metadata, data) and the contrast between them, then tunes size, weight, measure, line height and line breaks within the families the product already uses. | Introduce a new family without a job only it can do; make type decorative at the cost of reading. |
| **layout** | cramped, scattered, misaligned, the rhythm is off | Names the reading path, what belongs together and what leads, then fixes grouping by proximity, rhythm by tight-versus-generous spacing, alignment, and how the structure adapts across sizes. | Move boxes before naming the structural problem; add containers to compensate for weak grouping. |
| **colorize** | too plain, no color, too grey | Gives color a role (action, selection, state, wayfinding, atmosphere) and a deliberate region instead of scattering accents, preserving the product's confirmed colors. | Replace the product's palette; spend the accent on decoration. |
| **animate** | too stiff, not smooth enough, can it move | Finds where motion acknowledges an action, explains a change, keeps continuity, or is the one earned moment, and writes the plan (focal moment, continuity, feedback, budget) before building. Continuous and interruptible; follows the finger. | Animate a static area because it exists; add page-load sequences or identical section entrances. |
| **harden** | breaks when it gets long, weird when empty, what happens offline | Runs the stress cases in [floor.md](floor.md) and fixes what breaks: overflow and wrapping, localization length, empty and error states, slow and offline paths, repeated taps, interrupted gestures, the largest text size. | Change the look while doing it. |
| **polish** | wrap it up, refine the details a bit more | The last pass across the whole path, in this order: broken or blocked tasks and misleading states; missing states; flow and consistency drift against neighboring screens; visual and motion inconsistencies; leftover code and assets. Fix each at its cause (a missing token, a one-off that a shared component should replace). | Hide a redesign inside it; perfect one corner while the rest stays below the same bar. |

Most moves end with a polish pass on the same target.
