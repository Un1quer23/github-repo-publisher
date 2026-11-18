# GitHub Repo Publisher

**Languages:** English | [简体中文](README.zh-CN.md)

A lightweight Agent Skill for independent developers to audit public GitHub
repository surfaces and produce factual README, metadata, PR, and release
guidance—without enterprise governance bloat.

## What It Does

`github-repo-publisher` helps coding agents review and prepare public-facing
repository surfaces grounded in observed repository files and commands:

- **Indie right-sizing (3 tiers):** separates `Prototype / Experiment`,
  `Indie Utility / Public Tool`, and `High-Exposure / Collaborative` so small
  tools are not overloaded with `CODE_OF_CONDUCT.md` or heavy workflows.
- **Fact-first static preflight:** zero-dependency Node script checks Git
  tracking state, multi-ecosystem manifests (`package.json`, `pyproject.toml`,
  `Cargo.toml`, `go.mod`, `manifest.json`), `.github/` files, broken README
  relative links, `package.json` script drift, and accidental secret/local-path
  exposure.
- **README & metadata alignment:** covers first-screen structure, raw Markdown
  line maintainability, optional badges, About descriptions, lowercase topics,
  homepage, social preview notes, and practical language selection.
- **Safe git & release operations:** enforces draft-first PR/release habits,
  explicit staging in mixed worktrees, and confirmation before remote writes.

## Install

Install with GitHub CLI (`gh` v2.90.0+):

```bash
gh skill install Un1quer23/github-repo-publisher
```

Or install with the open Agent Skills CLI:

```bash
npx skills add Un1quer23/github-repo-publisher -g
```

Omit `-g` to install only for the current project. For manual installation,
copy `skills/github-repo-publisher/` into your agent runtime's skills directory
(or download the archive from the
[latest release](https://github.com/Un1quer23/github-repo-publisher/releases/latest)).

After installation, start a new agent session or invoke `$github-repo-publisher`
where supported.

## Structure

```text
.
├── .github/
│   └── workflows/
│       └── validate.yml
├── README.md
├── README.zh-CN.md
├── LICENSE
├── skills/
│   └── github-repo-publisher/
│       ├── SKILL.md
│       ├── agents/
│       │   └── openai.yaml
│       ├── references/
│       │   ├── github-operations.md
│       │   ├── publishing-copy.md
│       │   ├── readme-metadata.md
│       │   └── safety-quality.md
│       └── scripts/
│           ├── collect-repo-facts.mjs
│           └── collect-repo-facts.ps1
└── tests/
    └── collect-repo-facts.test.mjs
```

## Validate

Run the zero-dependency Node collector and static preflight against a local
repository:

```bash
node skills/github-repo-publisher/scripts/collect-repo-facts.mjs --repo .
```

If Node.js is unavailable, use the PowerShell 7 fallback for basic repository
facts and Git tracking review:

```powershell
pwsh -NoProfile -File ./skills/github-repo-publisher/scripts/collect-repo-facts.ps1 -RepoPath .
```

Run the test suite with Node's built-in test runner:

```bash
node --test tests/collect-repo-facts.test.mjs
```

## Safety Boundaries

Both scripts are strictly read-only and never transmit data externally. Secret
preflight findings report only file path, line number, and pattern category—not
matched secret values. Agents using this skill must confirm before remote
writes, avoid `git add -A` in mixed worktrees, and avoid unverified claims.

## License

MIT License. See [LICENSE](LICENSE).
