# GitHub Operations and Git Hygiene

Read this reference before inspecting git tracking state, running `gh` / GitHub MCP writes, or configuring lightweight repo protections.

## Tool Preference

1. **GitHub MCP Server** (when connected): structured repo, issue, PR, label, and release reads/writes.
2. **`gh` CLI**: current-branch PR status, Actions logs (`gh run view --log-failed`), releases, repo metadata (`gh repo edit`), and `gh api` / `gh skill` operations.
3. **Local `git`**: status, tracking review, diff, branch, explicit staging, commit, and push.
4. **Browser**: only for actions requiring the user's logged-in web UI session (e.g. uploading Social Preview images).

## Before Write Operations

Check only the target and state relevant to the write. Local staging/commit operations need worktree checks, while remote metadata-only edits do not require enumerating all local files. Reuse unchanged state already checked in this task, and inspect ignored paths only when a tracking question requires it (avoid enumerating dependency or build directories).

Relevant checks:

- `git status --short --branch` and `git remote -v`
- Unrelated local changes in the worktree (never overwrite or `git add -A` over them)
- Local `AGENTS.md`, `GEMINI.md`, or `CLAUDE.md` rules (especially proxy env vars, commit style, or branch naming)
- `gh auth status` before running remote `gh` commands

If repo instructions require a proxy for GitHub HTTPS:

```powershell
$env:HTTPS_PROXY='<proxy-url>'; $env:HTTP_PROXY='<proxy-url>'; gh repo view
```

## Git Tracking Review

Inspect `git.trackingReview` from `collect-repo-facts.mjs`:

- **Local assistant files** (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `.cursor/rules`, `.agents/`, `.gemini/`, `.github/copilot-instructions.md`):
  - If **ignored or untracked**: treat as local operational context, **not** a missing GitHub file.
  - If **tracked**: check whether publishing them is intentional and free of private notes/paths.
- **Forgotten public candidates**: flag untracked `README*`, `LICENSE*`, `docs/`, screenshots, manifests, or workflows so the user decides whether to commit them.

## Safe Git Flow & Solo Protection

Execute only the steps authorized by the request: a local doc edit ends after focused validation; commit, push, and PR creation are separate actions. Existing authorization remains valid—do not ask again for the same action.

- Avoid destructive commands (`git reset --hard`, `git checkout --`) unless explicitly asked.
- Prefer a task branch + draft PR when collaborating or when branch protection applies.
- **Solo maintainer protection tip**: do **not** suggest branch rules requiring "1+ external reviewer approval" for solo repos—they block your own merges. Instead, suggest lightweight protection against accidental force-pushes and branch/tag deletion:
  - Main branch ruleset: block deletions + block non-fast-forward (force) pushes.
  - Tag ruleset (`v*`): especially helpful when publishing releases or `gh skill` packages (immutable release tags).

## Metadata, Releases, and Large Assets

- **Metadata**: draft exact values first, then apply with `gh repo edit`:
  ```bash
  gh repo edit OWNER/REPO --description "..." --homepage "https://..." --add-topic cli --add-topic developer-tools
  ```
- **Releases**: verify the real latest tag with `git tag --sort=-v:refname` as well as `gh release list`. Default to `--draft` unless told to publish immediately.
- **Large assets**: keep repo git history lean—put installers/archives/videos in GitHub Release assets and keep README screenshots optimized.
