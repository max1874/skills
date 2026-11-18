---
name: ip-design
description: Designs an original IP character from scratch (an account mascot, a personal cartoon avatar, a brand character). First asks where it will be used, who it is for and what the user wants, offers 3 directions to pick from, revises round by round until the user is happy, then produces the full set (base character, turnaround, expressions, poses, avatar) and a one-page character sheet. Draws with Codex's built-in image generation, at no extra cost. Use when the user says "design my IP", "make a mascot", "design a cartoon character for me", "my account needs a character", "turn me into a cartoon", "设计我的 IP", "做个吉祥物", "帮我设计个卡通形象", "账号想要个角色" or "把我画成卡通".
---

# Design an original IP

The goal: a character **people recognize at a glance, and that is still the same character after hundreds of drawings**. Looking good is only half of it. The other half is holding steady: every new image can be checked against a few marks to tell whether it is still the character.

## How to draw

- **In Codex**: use the built-in image generation tool (`image_gen`, the default path of the built-in imagegen skill). No API key is needed and there is no per-image charge. Generated images are saved to `$CODEX_HOME/generated_images/` by default; **copy each one into the project folder** before showing it to the user.
- **In Claude Code and other environments without an image tool**: call the local Codex with `codex exec --skip-git-repo-check -s workspace-write --enable image_generation "<instruction>" -i <reference images...>`, and write "generate an image and copy it to <absolute path>" in the instruction. Put the prompt before `-i`, or it is swallowed as an image path.
- **Do not switch to any usage-billed image API** unless the user explicitly asks for it and knows the price.
- **When using a reference image** (the finalized base character, a style image or photo from the user): in Codex, first open the image with `view_image` so it enters the context, then generate, and write "the 1st image is the character reference" in the prompt; with `codex exec`, attach it with `-i`.
- **Never put text in the images**: generated lettering is often wrong. Names and labels are laid out on the web page.
- Prompts work more reliably in English; chat with the user in the user's language. Prompt templates are in [references/prompts.md](references/prompts.md).

## Step 0: Create the project folder

In the current directory create `ip-<short name in English or pinyin>/` (use `ip-draft/` until there is a name), containing:

```
rounds/      candidate images for each round: r1-A.png, r1-B.png, r2-A.png…
master/      finalized originals: base.png, turnaround.png, expressions.png, poses.png, avatar.png
character.md the fixed prompts and acceptance checklist once finalized (written in step 4)
index.html   the character sheet (made last)
README.md    version log: what changed in each version, and why
```

## Step 1: Ask everything at once, not bit by bit

Ask all of the following in one message, and tell the user "skip anything you don't know, and I'll suggest a direction":

1. **Where it will be used**: a Xiaohongshu/Douyin account, a WeChat Official Account, a product, your own avatar? What is the content about?
2. **Who it is for**: roughly how old, what tone they like (cute, funny, aloof, artsy, techy)?
3. **What it is**: an animal (what breed), a person (based on you?), an object, or not decided yet?
4. **Personality**: three keywords are enough, for example "deadpan, a bit clumsy, very hard-working".
5. **Style reference**: any screenshots of an art style you like? If not, pick from "marker doodle / flat illustration / crayon hand-drawn / pixel".
6. **What to avoid**: colors, styles or elements you dislike.

If the user gives reference screenshots: **borrow only the art style (line quality, coloring, white space); never copy the character in the screenshot**. Write down in the README "how our character differs from the reference image", at least three ways (for example color zones, how the eyes are drawn, body shape).

When basing it on the user themselves: borrow only the 2–3 most recognizable features (hairstyle, glasses, a color they often wear, a signature small object) and turn them into a character, not a realistic portrait.

## Step 2: First round, 3 directions

- Make 3 **base character** images, one direction each (different species, body shape, palette or drawing style): white background, a single character, three-quarter view, full body, no scenery.
- Generate a comparison page with `scripts/compare.ts` and open it (see "How to show the user images" below).
- Give each direction one sentence: what it is, and how its personality shows in the design.
- Ask the user to pick one, or to mix, like "A's body + C's colors".

## Step 3: Revise round by round

- **Change only one or two things per round**; leave everything else alone. For local changes, use the "redraw from the reference image, change only X" wording (see "Local edits" in prompts.md); it is far more stable than regenerating the whole image.
- **Where you are unsure, make 2–3 variants side by side**, for example lighter or darker colors, eyebrows or none. When the user says "too X", suggest one fix, then make variants for them to choose from; do not change one version and leave them guessing.
- **Run the thumbnail test every round**: the comparison page shrinks each image to avatar size (48px, 96px). If the small version looks like it has an extra pair of eyes, looks like a different animal, or its colors blur together, fix it. Pitfalls actually hit:
  - Light eyebrow spots above the eyes were cute in the big image but looked like four eyes in the small avatar → change them to small spots close to the base color.
  - Dog ears pointing up looked like a rabbit → show emotion with "ears flared out to the sides" instead.
  - Saying only "brown" gave a different color every time → before finalizing, fix every color to a specific hex value.
  - The user sent a photo saying "I want this color" → borrow only the color, not the fur or realism in the photo.
- Each round, bump the version (v1, v2…) and write one line in the README: what changed, and what the user said that prompted it.
- **Images first, then the README**: the README and your replies name only files that already exist. If an image failed to generate, say so plainly, and redraw it or tell the user.

## Step 4: Finalize, and write down the "marks"

When the user says it is final, write the character down as checkable rules, in the README and the character sheet:

- **5–7 marks that must be kept**: body proportions, color zones (with hex values), how the eyes are drawn, the most recognizable feature, line style. The test: as long as all of these are present, a new image is still the character; if one is missing, redraw it.
- **Palette**: a hex value for every color on the character, plus 1 accent color for props and highlights.
- **How emotion is expressed**: through which part (ears, tail, eyebrows, a small symbol above the head), and what the common expressions look like.
- **Do / don't**: for example, whether an animal may stand upright, wear clothes, have big eye highlights.
- **Limits of small drift**: what may vary a little from image to image, and what must never change.

Also write `character.md` (later drawing with `ip-draw` relies on it entirely), in this fixed format:

```
# <name>
## CHARACTER
<English character description, written per "Two fixed descriptions" in prompts.md, with every mark and hex value>
## STYLE
<English style description, ending with an explicit statement that the image contains no text>
## Acceptance checklist
- <mark 1, one sentence, judgeable by looking at the image>
- …
```

## Step 5: Produce the full set

Attach `master/base.png` as the reference for each, and write out every mark in the prompt (templates in prompts.md):

| File | Content | Aspect |
|---|---|---|
| `master/base.png` | The finalized base character (the chosen image, or a clean redraw per the final spec) | 2:3 portrait |
| `master/turnaround.png` | Turnaround: front, three-quarter, side, back, in one row | 3:2 landscape |
| `master/expressions.png` | Expressions 3×3: nine common expressions | 1:1 |
| `master/poses.png` | Poses 3×3: nine common poses | 1:1 |
| `master/avatar.png` | Avatar: head close-up that also looks good inside a circle | 1:1 |

**Accept each image**: go through the marks one by one (body shape, color zones, eyes, signature feature, anything extra added, any text in the image). If one fails, redraw that one image with "Local edits"; do not redo the whole set.

## Step 6: The character sheet

Copy [assets/spec-template.html](assets/spec-template.html) to `index.html` in the project, and replace every `{{…}}` and all sample text with this character's content (name, one-line intro, who it is, marks, expression notes, pose notes, color swatches, do/don't, name and version history), with image paths pointing to the files under `master/`. Open it for the user.

## Step 7: Name and originality

- Offer 2–3 candidate names, each with where it comes from, avoiding the names of well-known products and existing IPs.
- If you can go online, search whether a character with the same name exists on Xiaohongshu, Douyin and Taobao; if you cannot, tell the user plainly "name clashes and trademarks have not been checked yet", and tell them where to check (China's trademark office, sbj.cnipa.gov.cn).
- Do not draw or imitate any existing well-known character (Snoopy, Line Friends, Chiikawa and the like), and do not copy the character in a reference image the user gave.

## How to show the user images

After each round of images, run:

```
node <this skill's directory>/scripts/compare.ts <project>/rounds/compare-r1.html <project>/rounds/r1-A.png=A·Round <project>/rounds/r1-B.png=B·Long ...
```

It generates a web page: the big images side by side, with 48/96/160px circular avatar thumbnails below each. Then open it with `open` (macOS), or give the file path in your reply for the user to open. It uses only Node's built-in modules (Node.js 22.18+ runs it directly), nothing to install.

## Wrapping up, tell the user

- Where the folder is and how to open the character sheet.
- To draw new images later: use the `ip-draw` skill (say "draw a picture with my IP…"); it reads `character.md` and `master/base.png` to stay consistent.
- What is not done yet: checking the name for clashes, trademarks.
