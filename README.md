# GitHub Repo Publisher

**Languages:** English | [简体中文](README.zh-CN.md)

Agent skill for auditing already published or public GitHub repository publishing surfaces, and producing factual README, metadata, pull request, and release guidance.

## What It Does

`github-repo-publisher` helps AI coding agents check and prepare repository-facing GitHub content without inventing project facts. It focuses on:

- README structure, raw Markdown maintainability, screenshots, badges, and accessibility.
- GitHub About descriptions, topics, homepage, and social preview guidance.
- Multilingual README strategy and translation drift checks.
- Attribution, license, privacy, secrets, and community health review.
- Project scale and right-sizing dimensions so small projects are not overburdened.
- PR, issue, changelog, release, branch ruleset, and GitHub operation guidance.

## Install

Recommended: download `github-repo-publisher-skill-v0.1.2.zip` from the [v0.1.2 release](https://github.com/Un1quer23/github-repo-publisher/releases/tag/v0.1.2), then extract the included `github-repo-publisher/` folder into your agent runtime's skills directory.

Use git when you want the latest source version:

```powershell
git clone https://github.com/Un1quer23/github-repo-publisher.git "<skills-dir>\github-repo-publisher"
```

Or copy the repository folder to:

```text
<skills-dir>/github-repo-publisher
```

After installation, start a new agent session or refresh skill discovery. If your runtime supports `$skill-name` invocation, use:

```text
$github-repo-publisher
```

Otherwise, load the repository folder according to your agent runtime's skill or instruction-loading mechanism.

## Structure

```text
.
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── github-operations.md
│   ├── publishing-copy.md
│   ├── readme-metadata.md
│   └── safety-quality.md
└── scripts/
    ├── collect-repo-facts.mjs
    └── collect-repo-facts.ps1
```

## Validate

Run the recommended cross-platform fact collection helper against a local repository:

```bash
node scripts/collect-repo-facts.mjs --repo .
```

If Node.js is unavailable but PowerShell 7 is installed, use the fallback helper:

```powershell
pwsh -NoProfile -File ./scripts/collect-repo-facts.ps1 -RepoPath .
```

Both scripts are read-only. They report repository facts such as manifests, README line statistics, locale signals, image assets, CI files, and selected package metadata.

## Safety Boundaries

The skill is designed to recommend and draft GitHub-facing changes. It tells agents to confirm before remote writes, avoid broad staging in mixed worktrees, preserve user changes, and avoid unsupported claims about security, compatibility, releases, or community processes.

## License

MIT License. See [LICENSE](LICENSE).
