---
name: github-repo-publisher
description: Standardize GitHub repository publishing and agent workflows. Use when an agent needs to audit, create, or update repository README files, translated or multilingual READMEs, raw README line length, Markdown source maintainability, diff-friendly README formatting, GitHub About descriptions, topics, homepage URLs, social preview guidance, attribution and license notices, community health files, issue and pull request templates, package metadata alignment, privacy-safe publishing, release/changelog/versioning copy, repository lifecycle and maintenance status, project scale classification, fit-to-scope and right-sized repository recommendations, badge policy, documentation architecture, verification commands, audit output format, branch rulesets, security automation, large files/Git LFS guidance, PR titles/bodies, releases, discussions, issues, or other public-facing GitHub copy; also use when an agent must operate on GitHub through git, gh, GitHub APIs, or connector tools while preserving repo facts, user changes, auth boundaries, and safe write behavior.
---

# GitHub Repo Publisher

Use this skill to make GitHub-facing work factual, consistent, and safe. Treat README, About metadata, topics, releases, PRs, issues, and discussions as one publishing surface, not separate scraps of copy.

## Core Workflow

1. Resolve context.
   - Identify the local repository, target GitHub remote, default branch, current branch, and whether the task is read-only or write-capable.
   - Read local `AGENTS.md` or equivalent repo instructions before using network commands, `gh`, git writes, or packaging/release commands.
   - Prefer GitHub connector tools for structured repo, issue, and PR data when available. Use `gh` or git when local branch state, Actions logs, commits, pushes, or fields unsupported by the connector matter.

2. Collect facts before writing.
   - Inspect source files, package manifests, docs, CI config, license, examples, screenshots, releases, and existing GitHub metadata.
   - For local repos, run `scripts/collect-repo-facts.ps1 -RepoPath <path>` for a quick fact map when PowerShell is available.
   - Before changing README, About, topics, or homepage, check package manifest metadata, README raw line structure, available screenshot/image assets, license files, and attribution clues.
   - If the project has i18n config, `_locales`, locale directories, translation resources, or existing translated READMEs, evaluate whether README languages match the user-facing project-supported locales.
   - Do not invent features, badges, benchmarks, compatibility claims, sponsorship claims, security posture, or installation commands.

3. Classify project scale before making recommendations.
   - Read `references/safety-quality.md` and classify the repository as `Tiny / Personal / Experiment`, `Small Public / Low-Risk`, `Usable / Public Utility`, or `Serious / Community / Product`.
   - Fit recommendations to the project scale and audience. Do not prescribe community governance, security automation, release process, or multilingual documentation for tiny/private/experimental projects unless the user asks or the project risk justifies it.

4. Choose the publishing track.
   - README/About/Topics/Homepage/Social preview/multilingual docs: read `references/readme-metadata.md`.
   - PR, issue, discussion, release, and changelog copy: read `references/publishing-copy.md`.
   - GitHub operations, commits, pushes, PR creation, or API writes: read `references/github-operations.md`.
   - Risk checks, write confirmations, and quality gates: read `references/safety-quality.md`.

5. Draft or edit with traceability.
   - Tie each public claim to observed repository facts.
   - Keep copy audience-aware: first-time evaluator, potential contributor, package user, maintainer, or reviewer.
   - If facts are missing, add a clear placeholder note, ask a focused question, or omit the claim.

6. Validate before delivery.
   - Re-read changed files for broken headings, links, image paths, tables, fenced code blocks, and stale badges.
   - For README audits, report whether raw Markdown line structure was checked. Prefer `lineCount` and `maxLineLength` from `scripts/collect-repo-facts.ps1` when available.
   - Run relevant tests or lint/docs checks when the repo provides them.
   - For GitHub writes, summarize target repo, branch, files/metadata, and exact action before applying unless the user already explicitly requested that write.

## Operating Rules

- Preserve user work. Do not reset, checkout away, delete, or overwrite unrelated changes.
- Keep local edits and remote writes separate. A polished README draft is not permission to push it.
- Use explicit paths when staging mixed worktrees. Avoid broad `git add -A` unless every change belongs to the task.
- Prefer draft PRs unless the user asks for ready review.
- For `gh` or HTTPS failures, check auth first, then repo instructions for proxy requirements. If a local instruction requires proxy environment variables, apply them to the command invocation.
- If a requested GitHub field is not available through the current tool, state the limitation and provide an exact fallback command or manual update text.

## Output Shape

For audits, include `Scale classification`, concrete findings, and right-sized proposed edits. Mark every recommendation as `Required for this scale` or `Optional for this scale`. For creation/update tasks, provide the changed files plus concise notes on what GitHub metadata should be set to. For write operations, include what succeeded, what was verified, and anything still requiring the user's GitHub permissions.
