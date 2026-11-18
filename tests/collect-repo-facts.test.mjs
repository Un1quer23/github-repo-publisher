import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, it } from "node:test";

const COLLECTOR_PATH = path.resolve(
  "skills",
  "github-repo-publisher",
  "scripts",
  "collect-repo-facts.mjs",
);

const tempDirs = [];

function createTempRepo(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "grp-test-"));
  tempDirs.push(dir);
  for (const [relPath, content] of Object.entries(files)) {
    const target = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
  }
  return dir;
}

function runCollector(repoDir) {
  const output = execFileSync(process.execPath, [COLLECTOR_PATH, "--repo", repoDir], {
    encoding: "utf8",
  });
  return JSON.parse(output);
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("collect-repo-facts.mjs", () => {
  it("parses package.json, pyproject.toml, Cargo.toml, go.mod, and manifest.json", () => {
    const dir = createTempRepo({
      "package.json": JSON.stringify({
        name: "indie-cli",
        version: "0.2.0",
        description: "Tiny tool",
        license: "MIT",
        scripts: { test: "node --test", build: "tsc" },
      }),
      "pyproject.toml": [
        "[project]",
        'name = "py-indie"',
        'version = "1.0.0"',
        'description = "Python CLI"',
        "",
        "[project.scripts]",
        'pyindie = "py_indie.cli:main"',
      ].join("\n"),
      "Cargo.toml": [
        "[package]",
        'name = "rust-indie"',
        'version = "0.3.1"',
        'description = "Rust tool"',
      ].join("\n"),
      "go.mod": "module github.com/example/go-indie\n\ngo 1.23\n",
      "manifest.json": JSON.stringify({
        name: "Browser Helper",
        version: "0.1.0",
        description: "Page notes",
        default_locale: "en",
      }),
      ".github/workflows/ci.yml": "name: CI\n",
      ".github/ISSUE_TEMPLATE/bug.yml": "name: Bug\n",
      ".github/pull_request_template.md": "## Summary\n",
      "SECURITY.md": "# Security\n",
    });

    const facts = runCollector(dir);
    assert.equal(facts.manifestSummary["package.json"].name, "indie-cli");
    assert.deepEqual(facts.manifestSummary["package.json"].scriptNames, ["test", "build"]);
    assert.equal(facts.manifestSummary["pyproject.toml"].name, "py-indie");
    assert.deepEqual(facts.manifestSummary["pyproject.toml"].scriptNames, ["pyindie"]);
    assert.equal(facts.manifestSummary["Cargo.toml"].name, "rust-indie");
    assert.equal(facts.manifestSummary["go.mod"].module, "github.com/example/go-indie");
    assert.equal(facts.manifestSummary["go.mod"].goVersion, "1.23");
    assert.equal(facts.manifestSummary["manifest.json"].defaultLocale, "en");
    assert.deepEqual(facts.githubFiles.workflows, [".github/workflows/ci.yml"]);
    assert.deepEqual(facts.githubFiles.issueTemplates, [".github/ISSUE_TEMPLATE/bug.yml"]);
    assert.equal(facts.githubFiles.pullRequestTemplate, ".github/pull_request_template.md");
    assert.deepEqual(facts.githubFiles.otherCommunityFiles, ["SECURITY.md"]);
  });

  it("detects broken local README links and script drift without flagging code-fence examples", () => {
    const dir = createTempRepo({
      "package.json": JSON.stringify({
        name: "demo",
        scripts: { dev: "vite", test: "vitest" },
      }),
      "docs/guide.md": "# Guide\n",
      "README.md": [
        "# Demo",
        "",
        "See [guide](docs/guide.md#intro) and [missing](docs/nope.md) and ![shot](assets/missing.png).",
        "Inline `[ignore](does-not-exist.md)` should not be flagged.",
        "External [site](https://example.com) and anchor [top](#demo) are fine.",
        "",
        "```bash",
        "npm run dev",
        "npm run deploy-prod",
        "```",
      ].join("\n"),
    });

    const facts = runCollector(dir);
    assert.equal(facts.checks.readmeChecks.length, 1);
    assert.deepEqual(facts.checks.readmeChecks[0].brokenLinks, [
      { line: 3, kind: "markdown-link", target: "docs/nope.md" },
      { line: 3, kind: "markdown-image", target: "assets/missing.png" },
    ]);
    assert.equal(facts.checks.scriptDrift.checkedAgainstPackageJson, true);
    assert.deepEqual(facts.checks.scriptDrift.unknownScripts, [
      { file: "README.md", line: 9, script: "deploy-prod" },
    ]);
  });

  it("detects local absolute paths and token patterns without echoing raw values", () => {
    const fakeToken = ["ghp", "AbCdEfGhIjKlMnOpQrStUvWxYz123456"].join("_");
    const leakedWinPath = ["C:", "Users", "alice", "secret-project", "key.txt"].join("\\");
    const dir = createTempRepo({
      "README.md": [
        "# App",
        `Config file at ${leakedWinPath}`,
        `Placeholder C:\\Users\\<user>\\project should be ignored.`,
      ].join("\n"),
      "src/config.ts": `export const token = "${fakeToken}";\n`,
    });

    const rawJson = execFileSync(process.execPath, [COLLECTOR_PATH, "--repo", dir], {
      encoding: "utf8",
    });
    assert.equal(rawJson.includes(fakeToken), false);
    assert.equal(rawJson.includes("alice"), false);

    const facts = JSON.parse(rawJson);
    assert.deepEqual(facts.checks.safetyHints.findings, [
      { file: "README.md", line: 2, kind: "local-absolute-path" },
      { file: "src/config.ts", line: 1, kind: "github-classic-token" },
    ]);
  });

  it("classifies git-tracked vs ignored instruction files and tracked .env files", () => {
    const dir = createTempRepo({
      ".gitignore": ".env\nGEMINI.md\n.gemini/\n",
      ".env": "SECRET=1\n",
      ".env.example": "SECRET=\n",
      "AGENTS.md": "# Agent rules\n",
      "GEMINI.md": "# Local Gemini rules\n",
      ".gemini/notes.md": "local\n",
      "README.md": "# Repo\n",
      "docs/overview.md": "# Untracked public doc\n",
    });

    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["add", ".gitignore", ".env.example", "AGENTS.md", "README.md"], {
      cwd: dir,
      stdio: "ignore",
    });

    const facts = runCollector(dir);
    assert.deepEqual(facts.git.instructionFiles.tracked, ["AGENTS.md"]);
    assert.deepEqual(facts.git.instructionFiles.ignored, [".gemini/notes.md", "GEMINI.md"]);
    assert.deepEqual(
      facts.git.trackingReview.possiblyForgottenPublicFiles,
      ["docs/overview.md"],
    );
    assert.deepEqual(facts.checks.safetyHints.trackedSensitiveFiles, []);
  });
});
