# Bundled webfonts

Most font files in this directory are licensed under the
**SIL Open Font License, Version 1.1** (OFL-1.1), which permits bundling
and redistribution with this project. Full text: <https://openfontlicense.org/>

**Two families are not OFL — see “Thmanyah” below before reusing anything here.**

All OFL families are sourced from [Google Fonts](https://fonts.google.com/).
Only the `arabic` and `latin` unicode subsets are bundled, at the weights
declared in the stylesheets.

## Two stylesheets, one declaration each

| Sheet | Loaded | Families |
|---|---|---|
| `garden-core.css` | on every page, imported by `shared/garden.css` | the site's own faces |
| `garden-fonts.css` | injected only when a reader opens the appearance dialog | the reading-font library |

A family is declared in exactly one of the two. Declaring it twice would let
the later sheet win and silently narrow its weight range.

Declaring a face does not download it: the browser fetches a file only when a
glyph actually needs it. Picking a font from the library costs one request.

## `garden-core.css`

| Family | Designers / Foundry |
|---|---|
| Cairo | Gaser Mostafa Ahmed, Mohamed Gaber |
| Inter | Rasmus Andersson |
| JetBrains Mono | JetBrains, Philipp Nurullin, Konstantin Bulenkov |
| Plus Jakarta Sans | Tokotype |
| Tajawal | Boutros Fonts |

## `garden-fonts.css` — Arabic

| Family | Designers / Foundry |
|---|---|
| IBM Plex Sans Arabic | IBM, Bold Monday |
| Readex Pro | Thomas Jockin, Nadine Chahine, Santiago Orozco |
| Noto Sans Arabic | Google |
| Amiri | Khaled Hosny, Sebastian Kosch |
| Noto Naskh Arabic | Google |
| Almarai | Boutros Fonts |
| Alexandria | Mohamed Gaber, Julieta Ulanovsky |
| Vazirmatn | Saber Rastikerdar |
| El Messiri | Mohamed Gaber, Jovanny Lemonad |
| Noto Kufi Arabic | Google |
| Zain | Boutros Fonts |
| Rubik | Hubert and Fischer, Meir Sadan, Cyreal, Daniel Grumer, Omaima Dajani |

## `garden-fonts.css` — Latin

| Family | Designers / Foundry |
|---|---|
| Source Serif 4 | Frank Grießhammer |
| Newsreader | Production Type |
| Literata | TypeTogether |
| Atkinson Hyperlegible | Braille Institute, Applied Design Works, Elliott Scott, Megan Eiswerth, Linus Boman, Theodore Petrosky |
| Merriweather | Sorkin Type |
| Lora | Cyreal |
| EB Garamond | Georg Duffner, Octavio Pardo |
| Spectral | Production Type |
| Fraunces | Undercase Type, Phaedra Charles, Flavia Zimbardi |
| IBM Plex Sans | Mike Abbink, Bold Monday |
| Source Sans 3 | Paul D. Hunt |
| Geist | Andrés Briganti, Mateo Zaragoza, Guillermo Rauch, Evil Rabbit, José Rago, Facundo Santana |

## Thmanyah — used by permission, not open licence

| Family | Weights bundled |
|---|---|
| Thmanyah Sans | 400 · 500 · 700 · 900 |
| Thmanyah Serif Text | 400 · 700 |

© thmanyah Publishing and Distribution, Reserved Font Name "thmanyah".
Source and contact: <https://font.thmanyah.com/>

**These files are not open source.** thmanyah's public font licence permits
commercial use of the typeface but forbids redistributing, uploading or hosting
the font files, including through web embedding. That licence also provides for
exceptions granted in writing by the company.

The owner of this site obtained permission directly from thmanyah to host these
files here, on the basis that this is a non-profit student project. That
permission covers **this site only**.

⚠️ If you cloned or forked this repository: the grant does not travel with the
code. Delete these files, or request your own permission from thmanyah, before
serving them anywhere. Everything else in this directory is OFL-1.1 and free to
reuse.

## Variable files

Most families ship as a **single variable file per subset** covering their whole
weight range (`font-weight: 400 700` and similar). Google Fonts returns the same
file for every weight of a variable family, so storing one weight per file would
ship identical bytes under different names. Only Amiri, Spectral and Zain are
static, and they ship two weights each.

The Arabic library files carry the `arabic` subset only. Latin characters inside
an Arabic page — course codes, digits — fall through to Cairo, the site face,
which is already loaded. That keeps them identical whichever reading font is
chosen, and halves the download.
