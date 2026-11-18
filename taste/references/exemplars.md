# Exemplars: twenty high-taste companies

cosign.co's community list of twenty "high taste companies": Apple, Linear, A24, Notion, teenage engineering, Runway, Figma, fal, Anthropic, ElevenLabs, Nothing, Supabase, Stripe, Magnific, Midjourney, Ramp, Mercury, Cursor, Sandbar, Airbnb. On 2026-11-01 each homepage was captured and looked at (desktop 1440 and phone 390). The same day their App Store iPhone screenshots and their websites' motion were examined too (sections below); logged-in use was not seen. Sites change; what follows describes them as they were then.

Use this file when proposing directions, unless the user has chosen their own exemplars: name which exemplar a direction learns from and what exactly it takes. Never copy a company's look; take the mechanism.

## What most of them do

1. **The first screen is the real thing** (16 of 20): the product UI with realistic data (Linear, Supabase, Ramp, Cursor, Mercury, Stripe, Notion), the product photographed (Apple, teenage engineering, Nothing, Sandbar), or the real output (A24 stills, Runway and Magnific generations, Airbnb's listings, which are the homepage itself).
2. **One signature move, everything else plain.** Stripe's ribbon, Cursor's product UI over impressionist landscapes, teenage engineering's one object in one beam of light, Nothing's dot-matrix type and dot grid, Ramp's live counters, A24's giant title over a film still, Anthropic's paper collages, Mercury's superscript cents. Buttons, cards and navigation stay ordinary. Restraint and character at once: remove everything else, keep one move only this product could have, and commit to it fully.
3. **Neutral ground; color comes from content** (15 of 20). Where there is a brand color (Ramp, Supabase, Airbnb, Apple, Notion, Mercury), it sits on the logo and the primary action only, far under 5% of the screen. Magnific takes its single accent, a wine red, from the hue of its hero image.
4. **A two-tone heading replaces kicker + heading + subheading** (Linear, Figma, Ramp, Supabase, Stripe, Anthropic): one claim in full ink, then its explanation continuing in the same block in grey (or the brand color). One block, two levels, no eyebrow label.
5. **Real numbers as proof, set with care**: Stripe's live share of global GDP, Ramp's processed volume and agent counters, Mercury's balances with superscript cents, Linear's real issue IDs. Tabular figures; secondary digits smaller.
6. **A deliberately chosen typeface** instead of the platform default (19 of 20), usually one family plus a mono. Serif appears only for reading and quotes (Anthropic's lead paragraph, Notion's quotes).
7. **Dark grounds are tinted near-blacks** (Linear #08090A, Cursor rgb(20,18,11), Supabase green-tinted); pure black is kept as a stage for product photography (teenage engineering, Nothing, Apple's product tiles). Light grounds are pure white or a warm off-white (Anthropic #FAF9F5, Sandbar #FAF8F0).
8. **Copy is short and concrete**: "Time is money. Save both." "Build in a weekend / Scale to millions." "Radically different banking." "Your Voice, Anywhere."

## Inside their iOS apps

From the App Store iPhone screenshots of 18 official apps (marketing composites with idealized data; logged-in use was not seen).

1. **The app is far quieter than the website.** Most keep native structure: large titles, plain lists, the standard tab bar (Apple Store, Figma, Stripe, Ramp, Notion, Airbnb). The website's signature move mostly stays on the App Store frames (Ramp's highlighter underline, Stripe's purple gradient, Figma's color blocks, Claude's photographs).
2. **In the app, character comes from four places:** the content itself (listing photos, generations, film stills, the user's files); one accent on the primary action or state only (Stripe's purple button, Ramp's green Approve, Runway's and Magnific's blue Generate, Claude's orange send, Nothing's red); the type of the content (Claude sets its answers in serif and the user's messages in sans); and how numbers are set (Mercury's superscript cents on every amount, Nothing's "7/40").
3. **Few carry the whole web signature into the app**: Nothing (dot-matrix type, dot charts, one red), teenage engineering (OP-Z's own instrument UI; TP-7 nearly empty with one large drawn icon and an orange playhead), Sandbar, ElevenLabs (a gradient orb per voice), Linear (its own floating toolbar, small status glyphs, real issue IDs). They put it on their own elements, never by changing how system controls behave.
4. **Dark or light by job**: creative and media tools dark (Runway, Magnific, A24, Nothing, Linear); money and work light (Mercury, Ramp, Stripe, Notion, Airbnb, Apple, Claude), and light is often tinted (Mercury lavender, Claude and Sandbar warm).

## Motion

From timed frames, scroll checks, `getAnimations()` and computed transitions on all 20 websites at desktop width, with and without reduced motion (frames from 0.8 s after navigation, not video; hover was read from CSS, not filmed). When a product needs a specific motion, look at one or two references for that exact case at real speed, preferably the logged-in apps on a real phone, since app motion was not seen at all.

1. **What moves is mostly the product working**: Cursor's agent session advancing with its working dots, Mercury's cursor moving through its accounts list, Figma's collaborator cursors, Stripe filling a checkout, Ramp's counters, Supabase's status pulses.
2. **At most one signature motion**: Mercury's scroll pushes the camera from a landscape into the laptop screen showing the real product; Anthropic's collage assembles and its images go from washed out to full color on scroll; Sandbar and Nothing turn the product slowly in a video; Figma cycles real user work in its hero.
3. **Many do no decorative motion at all**: A24, teenage engineering, Airbnb (its only motion is the search bar collapsing on scroll, a state change), Apple's homepage, Midjourney. Stillness is a legitimate choice.
4. **Feedback is quick and decelerating, never bouncy**: Linear 100–160 ms, Airbnb 200–300 ms on `cubic-bezier(0.2,0,0,1)`, Apple 320 ms, Sandbar 450 ms; most use `cubic-bezier(0.4,0,0.2,1)` or ease-out. Speed follows character: tools are snappy, the calm luxury object is slow.
5. **Loops are slow and small**: logo marquees of 30–60 s (Supabase, Notion), status dots and working indicators of about 3 s (Linear, Cursor).
6. **Reduced motion**: Notion, fal, Ramp, Stripe and Mercury honor it; Linear (75 infinite animations) and Cursor (36) keep running. High taste does not guarantee it; the floor's rule stands.

## Applying them

- Typeface is the largest lever the exemplars pull. Proposing a chosen face for a product is in scope; ask before adding one, and for web fonts check that the font host is reachable where the audience is (some are blocked in mainland China).
- For an app screen, the exemplars point to native structure with character placed in content, one accent, the type of the content, and number setting; save the loud signature for the App Store screenshots, or carry it in only on the app's own elements, as Nothing does.
