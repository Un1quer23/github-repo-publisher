# README and GitHub Metadata

Use this reference for README structure, raw Markdown quality, About text, topics, homepage, social preview, badges, and language choices.

## Fact-First Inputs

Inspect before drafting:

- Existing `README*`, docs, examples, screenshots (`imageAssets`), `LICENSE*`, `CHANGELOG*`.
- Manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `manifest.json`, Dockerfile, CI workflows).
- Real usage from tests, CLI help/entrypoints, or exported APIs.
- Public GitHub state (`gh repo view`): description, homepage, topics, license, latest release.

## High-Signal README Structure

Keep the first screen scannable so a visitor understands **what it is, proof it works, and how to run it** without scrolling far:

1. Title and one-sentence positioning.
2. Fast proof: real screenshot, demo GIF, CLI output, or 5-line example (never fabricate).
3. Why / key capabilities grounded in real code.
4. Install and shortest working Quick Start.
5. Configuration / API / caveats only as needed; move long manuals into `docs/` once README grows heavy.
6. License and short contribution/feedback note (when public).

## README Quality and Maintainability

- Prefer concrete verbs and nouns over fluff ("powerful", "seamless", "blazing fast", "production ready").
- Verify commands, flags, and script names against manifests and code. Check `checks.scriptDrift` and `checks.readmeChecks.brokenLinks`.
- Use **relative links** (`docs/guide.md`, `assets/demo.png`) for files inside the repo so links work across forks and branches.
- Keep **raw Markdown diff-friendly**: wrap normal prose at natural sentence/paragraph boundaries instead of packing whole sections or lists into giant single lines (`maxLineLength` in `collect-repo-facts.mjs` flags this).
- Keep heading levels sequential (`#` -> `##` -> `###`) and give meaningful `alt` text to screenshots.
- Reflect lifecycle honestly near the top if the repo is `experimental`, `WIP`, `deprecated`, or `archived`.

## Badges (Optional for Indie Repos)

- Prefer **0–4 useful badges** (CI status, package version, license) backed by real workflows, registries, or files.
- Skip decorative, unverifiable, or vanity badges. Put badges right below the title/language switcher.

## GitHub About, Topics, Homepage, Social Preview

- **About description**: 50–160 characters, compact and searchable, usually no trailing period:
  - Pattern: `<Project type> that <core capability> for <audience/context>.`
  - Reuse the same core positioning sentence across README, manifest `description`, and GitHub About.
- **Topics**: 5–12 lowercase tags covering ecosystem, language/framework, type, and domain (no aspirational tech).
- **Homepage**: link only to a working docs site, live demo, or package page; leave blank if none exists.
- **Social preview**: recommend a crisp 1280×640 image showing actual UI, CLI output, or clean title card if missing—never pretend one exists.

## README Language Policy

Keep multilingual docs simple for solo maintenance:

- **Default**: follow the repository's primary language (English `README.md` is usually best for global discoverability; Chinese/local language is fine if the target audience is local).
- **When to add translations (`README.<locale>.md`)**: only when the user asks, the repo already ships translations, or the project itself has user-facing locales (e.g. `_locales/`, `i18n/`).
- If shipping multiple READMEs:
  - Add a symmetric top switcher between title and description, e.g. `**Languages:** English | [简体中文](README.zh-CN.md)`.
  - Only link files that actually exist.
  - Keep code blocks, CLI commands, flags, paths, and identifiers untranslated.
  - Update translations in the same change or mark `<!-- translation-status: outdated -->` to avoid drift.
- Keep GitHub About and topics in English unless the project intentionally serves a single non-English community.
