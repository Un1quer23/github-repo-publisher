# Safety, Privacy, and Right-Sizing

Read this reference before classifying a repository, drafting security/community advice, or performing GitHub writes.

## Claim Safety

Reject or rewrite claims that are:

- Unsupported by code, tests, manifests, or observed GitHub metadata.
- Inferred solely from folder or package names.
- Aspirational (planned integrations, future OS support, roadmap promises).
- Unverified security or speed claims ("secure by default", "blazing fast", "battle-tested").

Use factual phrasing instead:

- `Includes a GitHub Actions workflow running unit tests` instead of `battle-tested CI`.
- `Runs read-only local checks without external dependencies` instead of `fully automated`.

## Attribution and License

- Use `fork` only when forked or preserving upstream git history.
- Use `derived from` when adapting copied code, scripts, templates, or substantial prose.
- Use `inspired by` or `acknowledgements` for ideas or structure only.
- Keep upstream license/copyright notices with copied assets; flag GPL/AGPL compatibility risks before reuse.

## Secrets and Privacy

- Review `checks.safetyHints` from `collect-repo-facts.mjs` first (`trackedSensitiveFiles` and `findings`).
- Never paste full secret values into chat, issues, PRs, or reports; reference only file path, line number, and type.
- Check screenshots, terminal logs, `.env*` files, and issue drafts for API keys, private URLs/hostnames, emails, and local absolute paths (`C:\Users\<name>\`, `/Users/<name>/`, `/home/<name>/`).
- Replace sensitive examples with clear placeholders like `<YOUR_API_KEY>` when needed.

## Indie Project Tiers (Right-Sizing)

Pick the simplest tier that fits the repo (or follow the user's explicit intent). **Do not prescribe enterprise governance to solo repos.**

| Tier | Fits | Include by default | Skip by default |
| :--- | :--- | :--- | :--- |
| **Prototype / Experiment** | Personal scripts, demos, learning repos | Clear purpose, run command, limitations, About text, 3–5 topics, optional License | `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, templates, CI, release process, multi-locale docs |
| **Indie Utility / Public Tool** | Solo CLIs, libraries, plugins, apps, MCP servers | High-signal README, real proof (screenshot/CLI output), verified install/quick start, About + topics, License, leak check, simple release/issue notes | `CODE_OF_CONDUCT.md`, heavy issue forms, `CODEOWNERS`, Dependabot/CodeQL configs, multi-locale matrices |
| **High-Exposure / Collaborative** | Package registries, installers, credential/network tools, active external PRs | Everything above + `SECURITY.md` contact path, lightweight `CONTRIBUTING` note, tag/main anti-force-push ruleset | Blocking solo work with mandatory multi-reviewer rules; heavy enterprise compliance docs |

### 4 Quick Toggles

Adjust recommendations only when direct repo evidence triggers a toggle:

1. **Distribution**: `Source-only` | `Release assets / binary` | `Package registry` | `App/extension store` — controls SemVer, manifest alignment, install steps, and release assets.
2. **Sensitive Surface**: `Low` | `Moderate/High` (tokens, cookies, user files, network, installers) — escalates `SECURITY.md` contact path and GitHub Secret Scanning / Push Protection reminder.
3. **External PRs**: `Solo` | `Accepting PRs` — controls whether a brief PR checklist or lightweight `CONTRIBUTING.md` helps.
4. **Locales**: `Single language` | `User-facing locales` — controls whether translated `README.<locale>.md` is warranted.

## Security Automation Boundary

- Recommend GitHub's free native protections (`Secret scanning`, `Push protection`, `Dependabot alerts`) and local preflight checks first.
- Do **not** create `.github/dependabot.yml`, CodeQL workflows, or change remote rulesets/security settings unless the user explicitly asks for that specific change.

## Write Confirmation Rules

Proceed only when the user already authorized the exact write. Otherwise confirm first before:

- Pushing commits, creating tags, publishing GitHub Releases, or editing repo About/topics/visibility.
- Creating or editing security workflows, `.github/dependabot.yml`, branch protection, or rulesets.
- Staging in mixed worktrees with unrelated user modifications.

## Audit Output Format

Keep audit reports scannable in 4 concise sections unless another format is requested:

1. **Project tier & toggles**: chosen tier + triggered toggles with brief evidence.
2. **Critical blockers**: broken relative links, false claims, command drift, tracked sensitive files/paths, license gaps.
3. **Right-sized recommendations**: only context-appropriate items, labeled `Recommended` or `Optional`.
4. **Ready-to-use metadata & edits**: exact About text, topics, local file edits, and `Validation status` (commands run, raw line check, remaining unknowns).
