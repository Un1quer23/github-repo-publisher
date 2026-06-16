# GitHub Repo Publisher

**语言:** [English](README.md) | 简体中文

一个用于帮助 agent 准备和审计即将发布或已公开的 GitHub 仓库发布面，并生成可信 README、仓库 metadata、PR 和 release 建议的通用 skill。

## 功能

`github-repo-publisher` 帮助 AI 编程 agent 准备和检查面向 GitHub 仓库的公开内容，并避免编造项目事实。它关注：

- README 结构、raw Markdown 可维护性、截图、badge 和可访问性。
- GitHub About 描述、topics、homepage 和 social preview 建议。
- 多语言 README 策略和翻译漂移检查。
- 归属、license、隐私、敏感信息和社区健康度审查。
- 项目规模分层和右尺寸判断，避免给小项目套用过重规范。
- PR、issue、changelog、release、branch ruleset 和 GitHub 操作建议。

## 安装

推荐方式：从 [latest release](https://github.com/Un1quer23/github-repo-publisher/releases/latest) 下载 `github-repo-publisher-skill-v<version>.zip`，然后把压缩包里的 `github-repo-publisher/` 文件夹解压到你的 agent runtime 的 skills 目录。

如果你想使用最新源码版本，可以用 git 克隆：

```powershell
git clone https://github.com/Un1quer23/github-repo-publisher.git "<skills-dir>\github-repo-publisher"
```

或者把仓库目录复制到：

```text
<skills-dir>/github-repo-publisher
```

安装后，启动新的 agent 会话或刷新 skill 发现。如果你的 runtime 支持 `$skill-name` 调用方式，可以使用：

```text
$github-repo-publisher
```

否则，请按你的 agent runtime 的 skill 或 instruction 加载机制来加载这个仓库目录。

## 目录结构

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

## 验证

对本地仓库运行推荐的跨平台事实采集脚本：

```bash
node scripts/collect-repo-facts.mjs --repo .
```

如果没有 Node.js，但安装了 PowerShell 7，可以使用备用脚本：

```powershell
pwsh -NoProfile -File ./scripts/collect-repo-facts.ps1 -RepoPath .
```

两个脚本都是只读的。它们会报告 manifests、README 行统计、locale 线索、图片资产、CI 文件和部分 package metadata 等仓库事实。

## 安全边界

这个 skill 用于建议和起草面向 GitHub 的变更。它要求 agent 在远程写操作前确认，避免在混合工作区里粗暴 staging，保留用户已有改动，并避免对安全性、兼容性、release 或社区流程做无依据声明。

## License

MIT License。见 [LICENSE](LICENSE)。
