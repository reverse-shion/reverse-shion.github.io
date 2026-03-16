# TAROT BREAKER Cosmic IP Portal Blueprint

## 1) Refined Site Architecture
- `/index.html`: universe entrance with layered navigation.
- `/cosmogenesis.html`: core mythology.
- `/world/*.html`: concept-per-page world gates.
- `/characters/*.html`: emotional + philosophical character gates.
- `/projects/*.html`: real-world resonance implementations.
- `/story/guide.html`, `/story/arcs.html`, `/story/timeline.html`, `/story/entry-points.html`: onboarding and narrative progression.
- `/lore/glossary.html`, `/lore/myth-map.html`, `/lore/archive.html`: deep reading map.

## 2) Redesigned index structure plan
1. Hero
2. Introduction
3. Core Identity
4. Myth Gate
5. World Hub
6. Lore Gate
7. Characters
8. Projects / Resonance
9. Summon
10. Guide
11. Entry
12. Final CTA

## 3) Myth Gate replacement plan
- Replace heavy cosmogenesis preview with a short poetic stanza.
- Keep only one CTA: **Open Cosmogenesis**.
- Tone: invitation, not explanation.

## 4) cosmogenesis template structure
- Opening declaration (what this page is, what it is not)
- Five layers: Silence → Resonance/N-code → Symbol/Arcana → Distortion/Anti Arcana → Rereading/TAROT BREAKER
- Footer block: **Related Gates** links

## 5) World page example
- `world/arcana.html`: defines Arcana as prayer language, connects to Anti Arcana/Re:Card/Pamera/Summon.

## 6) Character page example
- `characters/shion.html`: role, philosophy, myth position, story entry, relation gates.

## 7) Lore page example
- `lore/myth-map.html`: conceptual map with beginner/deep-reader paths.

## 8) Maintainable CSS extension strategy
- Keep existing modular CSS untouched.
- Add `css/tb-portal-extension.css` for portal-specific atmosphere and related-gates UI.
- Use additive selectors only; avoid rewriting core files.

## 9) Keeping tarot summon intact
- Preserve summon DOM API attributes: `data-summon-root`, `data-summon-button`, `data-summon-card`, and arcana data targets.
- Keep existing summon scripts unchanged (`tb-engine.js`, `tb-ui.js`, `tb-summon.js`, `tb-stars.js`, `tb-parallax.js`, `tb-intro.js`).
- Validate that summon section still renders and card state defaults remain present.
