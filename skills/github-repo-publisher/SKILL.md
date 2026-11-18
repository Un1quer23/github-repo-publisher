---
name: github-repo-publisher
license: MIT
metadata:
  version: "0.2.1"
description: >-
  Audit and prepare public GitHub publishing surfaces (README, About, topics,
  releases, PR copy) for solo and indie projects without over-engineering. Use
  for publishing-readiness reviews or edits to public materials, not routine
  Git operations.
---

# GitHub Repo Publisher

Keep public GitHub work factual, right-sized for independent developers, and safe. Treat README, About metadata, topics, releases, PRs, and git tracking state as one publishing surface.

## Core Workflow

Choose steps by scope: run full fact collection and tier classification for readiness audits or governance/release recommendations; for localized edits, inspect only relevant source facts and validate changed materials without expanding into a repo-wide audit.

1. **Resolve context.**
   - Identify the local repo, target GitHub remote, default/current branch, and whether the task is read-only or write-capable.
   - Read local `AGENTS.md`, `GEMINI.md`, or `CLAUDE.md` before network, `gh`, git write, or release commands (for proxy, branch, or commit conventions).
   - Prefer GitHub MCP Server tools or `gh` CLI for remote repo, issue, PR, ruleset, and release state; use local `git` for branch, diff, and tracking state.

2. **Collect facts and run static preflight.**
   - For readiness audits or broad updates, run the read-only Node helper first:
     `node <skill-dir>/scripts/collect-repo-facts.mjs --repo <path>`
   - Fallback when Node.js is unavailable:
     `pwsh -NoProfile -File <skill-dir>/scripts/collect-repo-facts.ps1 -RepoPath <path>`
   - Inspect `git.trackingReview` (distinguish local-only assistant instructions from forgotten public docs/assets), `manifestSummary`, `githubFiles`, and `checks` (`readmeChecks.brokenLinks`, `scriptDrift`, `safetyHints`).
   - For localized edits, check only the manifests, files, links, and assets relevant to changed claims. Never invent features, benchmarks, badges, compatibility, or security claims.

3. **Pick the right-sized tier before recommending anything.**
   - Skip tier classification for localized copy edits. For readiness audits or governance/docs/release expansion, read `references/safety-quality.md` and pick one of 3 indie tiers:
     - `Prototype / Experiment`: clear purpose, run steps, limitations, and no leaks; skip governance/CI/release ceremony.
     - `Indie Utility / Public Tool` (default for solo tools, CLIs, libraries, plugins, apps): sharp first-screen README, real proof, verified commands, aligned About/topics, license, leak check, and lightweight release notes. Do **not** prescribe `CODE_OF_CONDUCT.md`, complex issue forms, multi-locale matrices, or heavy security workflows by default.
     - `High-Exposure / Collaborative` (network, credentials, installers, published packages, or active external PRs): add `SECURITY.md` contact guidance, light `CONTRIBUTING` notes, and non-blocking branch/tag protection advice.
   - Adjust only along the 4 toggles in `references/safety-quality.md` (`Distribution`, `Sensitive Surface`, `External PRs`, `Locales`) when direct repo evidence justifies it.

4. **Load only the needed reference.**
   - README, About, topics, homepage, social preview, badges, language choice → `references/readme-metadata.md`
   - PRs, changelogs, release notes, and tags → `references/publishing-copy.md`
   - Git, `gh`, MCP writes, tracking review, solo protection → `references/github-operations.md`
   - Tiers, claim safety, privacy, write gates → `references/safety-quality.md`

5. **Draft, validate, and deliver.**
   - Tie every public claim to observed code, manifests, or executed commands.
   - Re-read edited Markdown for broken relative links, heading order, and natural line wrapping (avoid single-line blobs).
   - Run focused checks relevant to the change (pure prose edits need link, fact, and line-format checks, not an application test suite); mark unverified commands explicitly as unverified.
   - Confirm target repo, branch, and exact action before any remote write, release publish, or security/ruleset edit unless already explicitly authorized.

## Operating Rules

- Preserve unrelated user changes. Stage explicit paths in mixed worktrees instead of `git add -A`.
- Keep local drafts separate from remote writes; editing a README is not permission to push.
- Treat ignored/untracked assistant instructions (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules`, `.agents/`) as local context, not GitHub gaps. Review tracked ones only for public intent.
- Prefer draft PRs and draft releases unless the user asks to publish immediately.
- Treat security automation (Dependabot, CodeQL, rulesets) as recommendations unless the user explicitly asks to create or modify them.

## Output Shape

- **Full readiness audits**: `Project tier & toggles` → `Critical blockers (fix first)` → `Right-sized recommendations` (tagged `Recommended` or `Optional`) → `Ready-to-use metadata & edits`.
- **Edits or writes**: changed files, validation run vs skipped, exact metadata values, and any remote steps remaining for the user.
