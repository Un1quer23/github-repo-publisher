# GitHub Repo Publisher

**语言:** [English](README.md) | 简体中文

一个面向独立开发者的轻量 Agent Skill，用于审计 GitHub 公开仓库的发布面，并基于真实仓库事实生成
README、仓库 metadata、PR 和 release 建议——避免把大厂/企业级繁琐模板硬套给个人项目。

## 功能

`github-repo-publisher` 帮助 coding agent 在不编造项目事实的前提下，检查和打磨开源发布面：

- **面向独立开发者的 3 档右尺寸分层：** 区分 `Prototype / Experiment`、
  `Indie Utility / Public Tool` 与 `High-Exposure / Collaborative`，避免给小工具
  强推 `CODE_OF_CONDUCT.md` 或过重的 CI/治理配置。
- **零依赖静态预检：** 纯 Node.js 只读脚本会采集 Git 追踪状态（区分本地 AI 指令文件与
  漏提交的公开资源）、多生态 manifest（`package.json`、`pyproject.toml`、`Cargo.toml`、
  `go.mod`、`manifest.json`）、`.github/` 文件、README 相对路径断链、`package.json`
  脚本漂移，以及常见秘钥/本地绝对路径泄露线索。
- **README 与 metadata 对齐：** 覆盖首屏结构、raw Markdown 行长可维护性、克制的 badge
  策略、About 描述、topics、homepage、social preview 与务实的多语言策略。
- **安全的 Git 与发版边界：** 默认采用草稿 PR 与 draft release，在混合工作区显式
  staging，并在任何远程写操作前确认。

## 安装

使用 GitHub CLI（`gh` v2.90.0+）安装：

```bash
gh skill install Un1quer23/github-repo-publisher
```

或使用开放的 Agent Skills CLI 全局安装：

```bash
npx skills add Un1quer23/github-repo-publisher -g
```

如果只想安装到当前项目，请省略 `-g`。如需手动安装，请将仓库中的
`skills/github-repo-publisher/` 目录复制到你的 agent runtime 的 skills 目录
（或从 [latest release](https://github.com/Un1quer23/github-repo-publisher/releases/latest)
下载版本压缩包）。

安装后开启新的 agent 会话，或在支持的环境中直接调用 `$github-repo-publisher`。

## 目录结构

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

## 验证

对本地仓库运行零依赖的 Node 事实采集与静态预检脚本：

```bash
node skills/github-repo-publisher/scripts/collect-repo-facts.mjs --repo .
```

如果没有安装 Node.js，可使用 PowerShell 7 备用脚本采集基础事实与 Git 追踪状态：

```powershell
pwsh -NoProfile -File ./skills/github-repo-publisher/scripts/collect-repo-facts.ps1 -RepoPath .
```

使用 Node 内置测试运行器执行单元测试：

```bash
node --test tests/collect-repo-facts.test.mjs
```

## 安全边界

两个采集脚本均为纯只读，不会向外部发送任何数据。隐私与秘钥预检结果仅输出文件路径、行号与
模式类别，不回显具体敏感内容。使用该 skill 的 agent 必须在远程写操作前确认、不在混合工作区
使用 `git add -A`，且禁止编造未经验证的能力或测试结果。

## License

MIT License。见 [LICENSE](LICENSE)。
