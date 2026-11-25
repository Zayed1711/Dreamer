# WayPoint website: AI image prompts

These images are for the public website's scroll story, "Good things *fall* into place". It follows the coffee-reel style: one object per full screen, ending with the suitcase.

Generate them with any image model (for example Gemini or Imagen in Google AI Studio). **Every image must look like part of the same photo shoot**, so start every prompt with the style block below and change only the object.

---

## 1. Style block (paste at the start of every prompt)

> Studio product photograph of a single object, centred, floating, seen from a slight three-quarter angle from above (about 20°). Soft, diffused key light from the upper left, gentle fill, one soft contact shadow underneath. Photorealistic materials with fine texture. Plain seamless light warm-grey background (#ECE8E1), nothing else in frame. Shallow depth of field, crisp focus on the object. Calm, premium, editorial look, like a luxury product catalogue. No text, no letters, no numbers, no logos, no flags, no emblems, no people, no hands.

**Why the plain grey background:** the website floods the stage with a different colour for every step. The object has to be cut out and placed on that colour, and a plain background makes the cut-out clean.

---

## 2. The objects (in story order)

| # | File name | Object prompt (add after the style block) |
|---|---|---|
| 1 | `story-passport.webp` | A closed passport booklet with a deep green cover, slightly worn soft-touch texture, rounded corners, a subtle gold foil border pressed into the cover. Plain cover with no emblem or writing. |
| 2 | `story-ielts.webp` | A single sheet of thick premium paper, a test-result certificate, curling slightly at one corner, with an embossed gold seal near the bottom. Faint grey lines suggest printed rows, but nothing is readable. |
| 3 | `story-offer.webp` | A cream envelope, partly open, with a folded letter sliding out. A dark red wax seal on the flap. Fine paper fibres visible. |
| 4 | `story-funds.webp` | A neat stack of three bank documents held with a silver paper clip, a closed slim leather card holder resting on top. Muted navy and cream tones. |
| 5 | `story-visa.webp` | An open passport booklet lying flat, the right page showing a generic holographic sticker with a subtle rainbow sheen and a round ink stamp in faded blue. Nothing readable, no national symbols. |
| 6a | `suitcase-open.webp` | A modern hard-shell carry-on suitcase lying open, seen from above at a slight angle, ribbed polycarbonate shell in matte charcoal, soft fabric lining in warm sand, two compression straps, silver zipper running around the edge. **Empty inside.** |
| 6b | `suitcase-packed.webp` | **The same suitcase, same angle and lighting**, open, now neatly packed with folded clothes in muted tones, with a green passport and a few cream documents tucked into the lid's mesh pocket. |
| 6c | `suitcase-closed.webp` | **The same suitcase, same angle and lighting**, now closed and zipped, standing upright on its four spinner wheels with the telescoping handle extended, and a blank cream luggage tag hanging from the handle on a short leather strap. |

**Keeping the suitcase consistent:** 6a, 6b and 6c must look like the same suitcase. Generate 6a first, then **give the model 6a as a reference image** and ask for 6b and 6c "of this exact suitcase". If the colour or shape drifts, regenerate. Consistency matters more than any single good shot.

The website draws the route on the luggage tag ("DAC → FRA") in code, so the tag must stay blank in the image.

**Status (24 Nov 2026):** all 8 story images are generated and saved in `apps/web/public/story/` as WebP. Two fixes are still needed:
1. **Re-do `suitcase-packed`:** its shell is **dark green**, while the open and closed ones are **charcoal**. Give the model `suitcase-open` as the reference and ask for "this exact charcoal suitcase, packed".
2. **Cut out the backgrounds:** the grey varies between images, so each needs a transparent background before it can sit on the coloured stages (see section 5).

---

## 3. A 3D flag badge for each country (the destination picker hero)

The hero in the destination picker is the country's **flag as a tactile 3D badge**, like the jacket in the Shopify reel. Use the **flag only, never a national coat of arms or state emblem**: those are restricted in many countries and would suggest an official connection.

> Add after the style block (and change "no flags" in it to "the flag design described here is allowed"): "A premium enamel badge in the shape of a softly rounded shield, about the size of a palm, showing the flag of [COUNTRY] in hard glossy enamel colours separated by thin polished gold metal lines, with bevelled metal edges catching the light and a subtle reflection. Flag colours and layout as the real flag, simplified, with no text, no coat of arms and no seal."

**Flags with an emblem in them:** use the plain or simplified version without the emblem, and check each one by eye:
- **Hungary** and **Italy**: plain tricolours.
- **Poland**: white over red, no eagle.
- **Malaysia** and **New Zealand**: keep the stars, crescent and Union Jack shapes, simplified.
- **South Korea**: keep the taegeuk circle and the four trigrams.

**Consistency:** make all 18 the same shape, angle and lighting. Generate Germany first, approve it, then give it to the model as the reference for the other 17.

| Code | Country | Code | Country | Code | Country |
|---|---|---|---|---|---|
| DE | Germany | JP | Japan | US | United States |
| GB | United Kingdom | CA | Canada | AU | Australia |
| FI | Finland | SE | Sweden | NL | Netherlands |
| IE | Ireland | MY | Malaysia | KR | South Korea |
| HU | Hungary | IT | Italy | FR | France |
| PL | Poland | NZ | New Zealand | CN | China |

File names: `badge-de.webp`, `badge-jp.webp`, and so on, saved in `apps/web/public/countries/`.

**Not an image:** the giant country name behind the badge (DEUTSCHLAND, NIHON…) is drawn in code, as a slowly moving ticker. It doesn't need generating.

---

## 4. Rules (please check every image)

- [ ] **No readable text, numbers or logos.** The model invents fake writing; regenerate if any appears.
- [ ] **No real official designs.** No Bangladesh national emblem, no real visa or passport layouts, no embassy or bank logos. These are illustrations, never copies of real documents.
- [ ] **No hands or people.**
- [ ] **Same light, same angle, same background** across the set. Line them up side by side before accepting them.
- [ ] **No "AI look":** reject melted edges, warped zippers, extra wheels, or impossible folds.
- [ ] **Usage rights:** check that the image tool's terms allow commercial use (Google AI Studio's do at the time of writing; confirm for your account).

---

## 5. Hand-over

1. Remove the background so each object sits on transparency (Google AI Studio, remove.bg, or any photo editor). Keep the soft shadow if the tool allows.
2. Export as **WebP, 1600 px on the longest side**, transparent, ideally under 200 KB each.
3. Put them in `apps/web/public/story/` (story objects and suitcase) and `apps/web/public/countries/` (landmarks), using the file names above.
4. Delete the old script-drawn images in `apps/web/public/3d/` once the new ones are in, together with `scripts/generate_3d_assets.py`.
