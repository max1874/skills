# ip-design: design your own IP character in Codex

Chat with Codex for a bit and it will build an original character with you from scratch:

1. It asks first: where it will be used, who it is for, what animal or figure you want, what personality, what art style you like (you can drop in screenshots).
2. It draws 3 different directions side by side for you to pick from.
3. You say what you don't like, and it fixes things one at a time; where it is unsure it makes two or three versions for you to compare, and it shrinks every image to avatar size to check it.
4. Once settled, it produces a full set: base character, turnaround, nine expressions, nine poses, an avatar, plus a one-page character sheet (open it and it is your IP's guidebook).

Drawing uses Codex's built-in image generation, which comes with a ChatGPT subscription, at no extra cost.

## Install

Put the whole `ip-design` folder under `~/.agents/skills/` (create that folder if it doesn't exist), then restart Codex.

If you'd rather not do it yourself, you can also drag the zip into Codex and tell it: "install this skill into ~/.agents/skills/".

## How to use

Create an empty folder, open Codex in it, and say:

> Use ip-design to design an IP for me

Or just say "design my IP". It asks you a few questions first, and starts drawing once you've answered. The finished images are all in the `ip-<name>/` folder; open `index.html` in a browser and that is the character sheet.

## Drawing new images after it is final

The companion `ip-draw` skill: open Codex in the folder above the IP folder and say "draw a picture with my IP: it is sneaking cake in the kitchen". It brings along the reference image and the fixed description, checks the result against the marks when done, and redraws locally if something is off. New images are saved in `ip-<name>/drawings/`.

## Tips

- If you like an art style, drop in a screenshot; it learns only the style and never copies someone else's character.
- To base it on yourself: send a photo and tell it your most distinctive features (hairstyle, glasses, a color you often wear).
- Whether the name is already taken and whether it can be registered as a trademark, you need to check yourself at the end.
