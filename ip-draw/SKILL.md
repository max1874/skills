---
name: ip-draw
description: Draws new images with an original IP character that is already finalized — Xiaohongshu (RedNote) post images, sticker packs, avatars, holiday images, a set of images that tells a story. Reads character.md and master/base.png in the IP folder so every image is still the same character, checks each finished image against the character's marks one by one, and redraws just the wrong part when one is off. Uses Codex's built-in image generation, at no extra cost. Use when the user says "draw a picture with my IP…", "have <character name> …", "make a few images of <character name>", "make a sticker pack", "用我的 IP 画一张……", "让 <角色名> ……", "出几张 <角色名> 的图" or "做一套表情包"; for an IP that is not finalized yet, use ip-design first.
---

# Draw new images with a fixed IP

The goal: hundreds of images, and every one still the same character. Three things make that work: the **reference image** (`master/base.png`), the **fixed prompt** (CHARACTER and STYLE from `character.md`, carried over verbatim), and **checking every image** (the acceptance checklist in `character.md`).

## Step 0: Find the IP

1. Look for `ip-*/character.md` in the current directory and one level below. If you find several, ask which one to use; if there are none, ask the user where the IP folder is.
2. The files you need:
   - `character.md`: three sections, `## CHARACTER`, `## STYLE` and `## Acceptance checklist`.
   - `master/base.png`: the base design. Attach it every time.
   - `master/turnaround.png` (use it if it exists): attach it as well when drawing an angle the base design does not show, such as the back or a full side view.
3. **No `character.md`** (for example, the IP was designed elsewhere): read the marks and color values in `index.html` or `README.md`, write one in the three-section format above, have the user look it over and confirm, then start drawing. If there are only images and no written spec at all, look at the images first and write down the marks, and again have the user confirm.

## Step 1: Ask what to draw (do not ask what you can infer)

- **What to draw**: the scene in one sentence (where it is, what it is doing, what is around it). For a set, one sentence per image.
- **Where it will be used → aspect ratio**:

  | Use | Ratio | Size |
  |---|---|---|
  | Xiaohongshu / WeChat Moments post image | 3:4 portrait | 1024x1536 (generate at 2:3, crop to 3:4 when laying it out) |
  | Avatar, sticker pack, sticker | 1:1 | 1024x1024 |
  | Landscape cover, WeChat Official Account header image | 3:2 landscape | 1536x1024 |

- **Text or not**: never put text in the image (generated text often comes out wrong). If text is wanted, add it after drawing with a web page or an image editor, or leave empty space in the image for it (write "leave the top third empty" in the prompt).
- **Stickers and sticker packs need a transparent background**: ask for a transparent background in the prompt.

When only one image is wanted and the request is clear, just draw it; there is no need to ask.

## Step 2: Assemble the prompt

```
Scene: <scene description in English: where the character is, what it is doing, its expression, the props around it>.

Character: <CHARACTER from character.md, pasted verbatim>

Composition: <ratio and size>. <empty-space requirement, optional>

<STYLE from character.md, pasted verbatim>
```

- **Do not change a single word** of CHARACTER or STYLE; the scene goes only in Scene. To switch the art style for one occasion (a holiday version, say), say so in Scene; do not edit STYLE.
- For actions and expressions, prefer picking the closest one from the spec page's expression sheet and pose sheet and describing that; the character stays more stable.
- In the scene, spell out how the character interacts with the props, consistent with the character's rules (if the spec says it is a real four-legged animal, write that it presses with a paw or carries something in its mouth, not that it is "holding" something).
- Save each image's full prompt next to the image, as a `.txt` with the same name, so a later redraw can use it directly.

## Step 3: Generate

- **In Codex**: first open `master/base.png` with `view_image` (and `turnaround.png` when needed) so it enters the context, then call the built-in image generation tool, with the prompt starting "The attached image is the character reference". Generated images land in `$CODEX_HOME/generated_images/`. Copy them into the IP folder's `drawings/`, named `YYYY-MM-DD-<short English name>.png`; if a file with that name already exists, add `-2`. Never overwrite.
- **In Claude Code and other environments without an image tool**: `codex exec --skip-git-repo-check -s workspace-write --enable image_generation "<generate one image, copy it to <absolute path>, the prompt is as follows…>" -i <absolute path to base.png>`. The prompt goes before `-i`. A set can be generated in parallel, at most 3 at a time.
- Do not switch to any pay-per-use image API unless the user explicitly asks for it and knows the price.
- In a set, generate each image separately and attach the reference image every time. Do not use the previous generated image as the reference: it drifts further with every pass.

## Step 4: Check every image

Open each image and go through the acceptance checklist in `character.md` item by item, then these general checks:

- Is there any text, lettering, numbers or a watermark in the image?
- Is there an extra character, or two of it?
- Is there anything that breaks its rules (clothes, blush, standing up… see the spec)?
- Is the scene the thing the user asked for?

If it fails, **edit it locally**; do not redo the whole image. Attach this image and `master/base.png`, and write

```
Redraw the FIRST attached image EXACTLY: same composition, same scene, same props, same line style.
Change ONLY <what is wrong, e.g. the character's ears: they must be long floppy ears hanging down, like in the SECOND attached image>.
No text anywhere.
```

If it is still wrong after two edits, redraw the whole image with a different description, and tell the user what keeps coming out wrong.

## Step 5: Hand it to the user

- For a set, use `ip-design`'s `scripts/compare.ts` (if it is installed), or just write a simple web page that lays the images out together, and open it for the user. For a single image, just give the path.
- Say clearly: how many images you drew, where they are saved, which ones were edited and what was fixed, and which one you are still not happy with.
- When the user says "this one is wrong": ask what is wrong (or see it for yourself), redraw that one image with a local edit, and leave the others alone.
- If a kind of scene will be drawn again and again (a weekly cooking cover, say), record this time's Scene wording under `## Common scenes` at the end of `character.md`, to reuse next time.
