# Publishing Copy (PRs, Releases, Changelogs)

Read this reference when drafting PR descriptions, release notes, or changelog entries.

## Pull Requests

- **Titles** (under ~72 chars, imperative): `Add <capability>`, `Fix <user-visible bug>`, `Update <area> docs`, `Refactor <area> to <reason>`.
- **Body**: concise and factual, never claim tests ran if they did not.

```markdown
## Summary
- What changed and why.

## Validation
- Exact commands run and outcomes (or `Not run: <reason>`).

## Notes
- Screenshots, migration steps, or risks (omit if none).
```

## Releases and Tags

1. Confirm the source of truth before picking a version:
   - Check `git tag --sort=-v:refname` (some repos tag without GitHub Releases) and `gh release list`.
   - Check manifest versions (`package.json`, `pyproject.toml`, `Cargo.toml`, `manifest.json`) so version surfaces stay aligned.
2. Summarize real commits/diffs since the last tag—never dump raw `git log` or invent version numbers/dates.
3. Group notes by user impact:
   - **Added** / **Changed** / **Fixed** / **Breaking Changes** / **Security**
   - Mention upgrade steps or deprecations when real; skip internal noise unless it affects users.
4. GitHub's `--generate-notes` is a good starting draft, but tighten it for user clarity before publishing.
5. Prefer `--draft` unless the user explicitly asks to publish live immediately.

## Changelogs and Issue Guidance

- Maintain `CHANGELOG.md` (Keep a Changelog categories) only for projects with regular versioned releases; skip for small scripts/prototypes.
- Do not force Conventional Commits or heavy `.github/ISSUE_TEMPLATE` forms onto solo repos unless requested. A short README bug-report note (version, OS, repro steps) is often enough.
