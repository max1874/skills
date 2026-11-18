# Prompt templates

Replace `<…>` with the specifics. English prompts work more reliably. Every wording below has actually worked (a marker-doodle dachshund revised from v1 to a final v5).

## Two fixed descriptions: character + style

Once finalized, write the character as one fixed `CHARACTER` paragraph and include it verbatim in every generation; write the art style as `STYLE`. When the character changes, change both together.

```
CHARACTER = the SAME original character as in the attached reference image, keep it exactly:
<body proportions, e.g. long low sausage body, body length about twice its height, very short stubby legs>,
<color zones with hex values, e.g. back, top of head and both ears in milk-chocolate brown (#AA7B56); muzzle, chest, belly and paws in warm cream (#F6DCAC)>,
<eyes, e.g. two small solid black dot eyes set wide apart with no highlights>,
<mouth, nose, signature features>,
<lines, e.g. thick slightly wobbly black marker outline>,
<things to exclude, e.g. no collar, no clothes, no blush>.
<posture rules, e.g. It is a real four-legged dog: never stands upright on its hind legs.>
<how emotion is expressed, e.g. Its ears show emotion: both ears flared out sideways = shocked.>

STYLE = Style: <art style, e.g. naive hand-drawn doodle with a thick black felt-tip marker on plain off-white paper>,
very few lines, flat fills, no gradients, no shading, lots of white space.
ABSOLUTELY NO text, letters, digits, logos or labels anywhere.
```

## First round: 3 directions (one image per direction, one call each)

```
Character design, single original mascot character, full body, three-quarter view, standing/sitting naturally,
centered on a plain white background, no scenery.
Subject: <this direction's species and body shape, e.g. a chubby bean-shaped doodle dog with one ear up and one ear down>.
Personality shown through the design: <personality keywords, e.g. deadpan, a bit slow, hard-working>.
Colors: <this direction's palette>.
<STYLE>
Must be an ORIGINAL character, not resembling any existing cartoon or mascot.
```

With a style reference image, add this (attach the reference as the 1st image):

```
Use the attached image ONLY as a style reference (line quality, coloring, white space).
Do NOT copy its character: different species/shape, different face, different colors.
```

## Local edits (changing a color, eyebrows, ears…; the most used)

```
Redraw the attached image EXACTLY: same pose, same shapes, same face, same line style, same background.
Change ONLY <what to change, the more specific the better, e.g. the two cream eyebrow spots above the eyes: make them about half their
current size and recolor them a soft light tan (#D8A878), only slightly lighter than the head>.
No text anywhere.
```

- To borrow a color from a photo: attach both images and write `Use the SECOND attached photo only as a color reference (do not copy its fur or realism)`.
- To change one thing in a whole sheet (turnaround, expression sheet): use the same wording, and stress `same layout, same number of panels`.
- To make variants for comparison: the same prompt, changing only the sentence after "Change ONLY", one call each.

## The full set (attach master/base.png to each)

**Turnaround** (3:2 landscape, 1536x1024)

```
Character turnaround sheet of <CHARACTER>
Four views in one row, same size, same scale: front view, three-quarter view, side profile view, back view.
<STYLE>
```

**Expressions** (1:1, 1024x1024)

```
Expression sheet of <CHARACTER>
A 3x3 grid of head-and-shoulders portraits with these expressions: calm (default); curious with head tilted;
confused with a small scribble swirl above its head; shocked <how this character shows shock>; smug with eyes closed in curves
and chin up; sleepy with eyes as flat lines; sulky <how this character shows sulking>; quietly happy with a tiny open mouth;
speechless with flat eyes and a sweat drop.
<STYLE>
```

**Poses** (1:1, 1024x1024)

```
Pose sheet of <CHARACTER>
A 3x3 grid of full-body poses: <nine poses, e.g. sitting; lying flat with chin on the floor; loaf pose with legs tucked;
walking; trotting with motion lines; sleeping curled into a ball; stretching with rear up; rolling on its back;
sniffing the ground>.
<STYLE>
```

**Avatar** (1:1, 1024x1024)

```
Avatar portrait of <CHARACTER>
Head and upper chest, facing three-quarter toward the viewer, calm default expression, centered with generous
margin so it still looks good cropped into a circle. Plain white background.
<STYLE>
```

## New scenes after finalizing

```
Scene: <one-sentence scene: what the character is doing, what props are around it>.
Character: <CHARACTER>
Composition: <aspect ratio>.
<STYLE>
```

When done, accept it mark by mark; if something is off, fix it with "Local edits".
