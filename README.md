# GitHub Repo Publisher

Codex skill for auditing GitHub repositories and producing factual README, metadata, pull request, and release guidance.

## What It Does

`github-repo-publisher` helps Codex prepare repository-facing GitHub content without inventing project facts. It focuses on:

- README structure, raw Markdown maintainability, screenshots, badges, and accessibility.
- GitHub About descriptions, topics, homepage, and social preview guidance.
- Multilingual README strategy and translation drift checks.
- Attribution, license, privacy, secrets, and community health review.
- Project scale classification so small projects are not overburdened.
- PR, issue, changelog, release, branch ruleset, and GitHub operation guidance.

## Install

Clone this repository into your Codex skills directory:

```powershell
git clone https://github.com/Un1quer23/github-repo-publisher.git "$env:USERPROFILE\.codex\skills\github-repo-publisher"
```

Or copy the repository folder to:

```text
%USERPROFILE%\.codex\skills\github-repo-publisher
```

After installation, start a new Codex session or refresh skill discovery, then invoke:

```text
$github-repo-publisher
```

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
    └── collect-repo-facts.ps1
```

## Validate

Run the fact collection helper against a local repository:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\collect-repo-facts.ps1 -RepoPath .
```

The script is read-only. It reports repository facts such as manifests, README line statistics, locale signals, image assets, CI files, and selected package metadata.

## Safety Boundaries

The skill is designed to recommend and draft GitHub-facing changes. It tells Codex to confirm before remote writes, avoid broad staging in mixed worktrees, preserve user changes, and avoid unsupported claims about security, compatibility, releases, or community processes.

## License

MIT License. See [LICENSE](LICENSE).
