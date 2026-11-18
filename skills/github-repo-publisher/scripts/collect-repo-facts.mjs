#!/usr/bin/env node
/**
 * Read-only fact collector and static preflight checker for GitHub repositories.
 * Uses only Node.js built-ins and optional local git so solo devs need zero extra dependencies.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "out",
  "target",
  ".next",
  ".cache",
  "vendor",
  ".venv",
  "venv",
  "__pycache__",
]);

const LOCALE_DIR_NAMES = new Set([
  "_locales",
  "locales",
  "locale",
  "i18n",
  "translations",
  "translation",
  "lang",
  "langs",
]);

const MANIFEST_NAMES = new Set([
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "Gemfile",
  "manifest.json",
  "extension.json",
]);

const INTERESTING_ROOT_FILES = [
  "README.md",
  "README.mdx",
  "README.txt",
  "LICENSE",
  "LICENSE.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "SUPPORT.md",
  "CHANGELOG.md",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "Gemfile",
  "Dockerfile",
  "manifest.json",
  "extension.json",
];

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"]);
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".ico",
  ".pdf", ".zip", ".gz", ".tar", ".tgz", ".7z", ".exe", ".dll", ".so",
  ".dylib", ".wasm", ".woff", ".woff2", ".ttf", ".otf", ".mp4", ".mov", ".webm",
]);

const MAX_SCAN_FILE_BYTES = 512 * 1024;
const PLACEHOLDER_USERNAMES = new Set([
  "user",
  "username",
  "yourname",
  "your-user",
  "example",
  "demo",
]);

function parseArgs(argv) {
  let repoPath = ".";
  for (let i = 0; i < argv.length; i += 1) {
    if ((argv[i] === "--repo" || argv[i] === "-r" || argv[i] === "--repo-path") && argv[i + 1]) {
      repoPath = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log("Usage: node scripts/collect-repo-facts.mjs --repo <path>");
      process.exit(0);
    }
  }
  return { repoPath };
}

function gitLines(root, args) {
  try {
    const output = execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.split(/\r?\n/).filter((line) => line.length > 0);
  } catch {
    return [];
  }
}

function pathExists(target) {
  try {
    fs.accessSync(target);
    return true;
  } catch {
    return false;
  }
}

function rel(root, target) {
  return path.relative(root, target).split(path.sep).join("/");
}

function normalizeGitPath(file) {
  return file.split("\\").join("/").replace(/^\.\//, "");
}

function uniqueSorted(files) {
  return [...new Set(files.map(normalizeGitPath).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function isInstructionFile(file) {
  const lower = normalizeGitPath(file).toLowerCase();
  const basename = path.posix.basename(lower);
  const instructionNames = new Set(["agents.md", "claude.md", "gemini.md", "codex.md"]);
  const instructionPrefixes = [
    ".cursor/rules",
    ".claude",
    ".codex",
    ".agents",
    ".gemini",
    ".github/instructions",
  ];

  if (
    instructionNames.has(basename) ||
    lower === ".cursorrules" ||
    lower === ".windsurfrules" ||
    lower === ".clinerules" ||
    lower === ".github/copilot-instructions.md"
  ) {
    return true;
  }

  return instructionPrefixes.some((prefix) => lower === prefix || lower.startsWith(`${prefix}/`));
}

function looksPublicFacing(file) {
  const normalized = normalizeGitPath(file);
  const lower = normalized.toLowerCase();
  const basename = path.posix.basename(lower);

  if (isInstructionFile(normalized)) {
    return false;
  }

  if (
    /^readme(\.|$)/i.test(basename) ||
    /^(license|copying|notice|changelog|contributing|security|code_of_conduct|support)(\.|$)/i.test(basename)
  ) {
    return true;
  }

  const publicDirs = [
    "docs/",
    "doc/",
    "examples/",
    "example/",
    "samples/",
    "sample/",
    "assets/",
    "images/",
    "screenshots/",
    "public/",
    "media/",
    ".github/workflows/",
    ".github/issue_template/",
  ];
  if (publicDirs.some((dir) => lower.startsWith(dir)) || lower === ".github/pull_request_template.md") {
    return true;
  }

  if (MANIFEST_NAMES.has(basename) || basename === "dockerfile") {
    return true;
  }

  const ext = path.posix.extname(lower);
  const publicAssetPattern = /(readme|screenshot|preview|social|demo|hero|cover|banner|logo)/i;
  return IMAGE_EXTENSIONS.has(ext) && publicAssetPattern.test(normalized);
}

function shouldIgnore(root, target, ignoredDirs) {
  const parts = rel(root, target).split("/").filter(Boolean);
  return parts.some((part) => ignoredDirs.has(part));
}

function readLinesUtf8(file) {
  const content = fs.readFileSync(file, "utf8");
  if (content.length === 0) {
    return [];
  }
  const lines = content.split(/\r\n|\n|\r/);
  if (/\r\n|\n|\r/.test(content.slice(-2))) {
    lines.pop();
  }
  return lines;
}

function walkDirs(root, maxDepth, ignoredDirs) {
  const results = [];

  function visit(dir, depth) {
    if (depth > maxDepth) {
      return;
    }
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (shouldIgnore(root, fullPath, ignoredDirs)) {
        continue;
      }
      results.push(fullPath);
      visit(fullPath, depth + 1);
    }
  }

  visit(root, 1);
  return results;
}

function walkFiles(root, maxDepth, ignoredDirs) {
  const results = [];

  function visit(dir, depth) {
    if (depth > maxDepth) {
      return;
    }
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (shouldIgnore(root, fullPath, ignoredDirs)) {
        continue;
      }
      if (entry.isDirectory()) {
        visit(fullPath, depth + 1);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  }

  visit(root, 1);
  return results;
}

/**
 * Lightweight INI/TOML section key-value extractor (single-line scalars only)
 * to avoid external TOML dependencies when reading pyproject.toml and Cargo.toml.
 */
function parseTomlSections(content) {
  const sections = {};
  let currentSection = "";

  for (const rawLine of content.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const sectionMatch = trimmed.match(/^\[+([^\]]+)\]+$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      if (!sections[currentSection]) {
        sections[currentSection] = {};
      }
      continue;
    }
    const kvMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (!kvMatch || !currentSection) {
      continue;
    }
    const key = kvMatch[1];
    let val = kvMatch[2].replace(/\s+#.*$/, "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    sections[currentSection][key] = val;
  }

  return sections;
}

function collectGitFacts(root) {
  if (!pathExists(path.join(root, ".git"))) {
    return {};
  }

  const trackedFiles = uniqueSorted(gitLines(root, ["ls-files"]));
  const untrackedFiles = uniqueSorted(gitLines(root, ["ls-files", "--others", "--exclude-standard"]));
  const ignoredFiles = uniqueSorted(gitLines(root, ["ls-files", "--others", "--ignored", "--exclude-standard"]));

  const trackedInstructions = trackedFiles.filter(isInstructionFile);
  const untrackedInstructions = untrackedFiles.filter(isInstructionFile);
  const ignoredInstructions = ignoredFiles.filter(isInstructionFile);
  const localOnly = uniqueSorted([...untrackedInstructions, ...ignoredInstructions]);

  return {
    branch: gitLines(root, ["branch", "--show-current"])[0] ?? null,
    status: gitLines(root, ["status", "--short", "--branch"]),
    remotes: gitLines(root, ["remote", "-v"]),
    defaultBranchGuess: gitLines(root, ["symbolic-ref", "refs/remotes/origin/HEAD"])[0] ?? null,
    trackedFiles,
    untrackedFiles,
    ignoredFiles,
    instructionFiles: {
      tracked: trackedInstructions,
      untracked: untrackedInstructions,
      ignored: ignoredInstructions,
      localOnly,
    },
    trackingReview: {
      localOnlyInstructionFiles: localOnly,
      possiblyMistakenlyTrackedInstructionFiles: trackedInstructions,
      possiblyForgottenPublicFiles: untrackedFiles.filter(looksPublicFacing),
    },
  };
}

function collectManifestSummaries(root, facts) {
  const summary = {};

  const pkgPath = path.join(root, "package.json");
  if (pathExists(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      facts.package = {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        license: pkg.license,
        homepage: pkg.homepage,
        scripts: pkg.scripts,
      };
      summary["package.json"] = {
        name: pkg.name ?? null,
        version: pkg.version ?? null,
        description: pkg.description ?? null,
        license: pkg.license ?? null,
        homepage: pkg.homepage ?? null,
        bin: pkg.bin ?? null,
        scriptNames: pkg.scripts ? Object.keys(pkg.scripts) : [],
      };
    } catch (error) {
      facts.packageParseError = error.message;
    }
  }

  const pyprojectPath = path.join(root, "pyproject.toml");
  if (pathExists(pyprojectPath)) {
    try {
      const sections = parseTomlSections(fs.readFileSync(pyprojectPath, "utf8"));
      const proj = sections.project ?? sections["tool.poetry"] ?? {};
      const scriptSection = sections["project.scripts"] ?? sections["tool.poetry.scripts"] ?? {};
      summary["pyproject.toml"] = {
        name: proj.name ?? null,
        version: proj.version ?? null,
        description: proj.description ?? null,
        scriptNames: Object.keys(scriptSection),
      };
    } catch (error) {
      summary["pyproject.toml"] = { parseError: error.message };
    }
  }

  const cargoPath = path.join(root, "Cargo.toml");
  if (pathExists(cargoPath)) {
    try {
      const sections = parseTomlSections(fs.readFileSync(cargoPath, "utf8"));
      const pkg = sections.package ?? {};
      summary["Cargo.toml"] = {
        name: pkg.name ?? null,
        version: pkg.version ?? null,
        description: pkg.description ?? null,
        license: pkg.license ?? null,
        homepage: pkg.homepage ?? null,
      };
    } catch (error) {
      summary["Cargo.toml"] = { parseError: error.message };
    }
  }

  const goModPath = path.join(root, "go.mod");
  if (pathExists(goModPath)) {
    try {
      const text = fs.readFileSync(goModPath, "utf8");
      const moduleMatch = text.match(/^module\s+(\S+)/m);
      const goVersionMatch = text.match(/^go\s+(\S+)/m);
      summary["go.mod"] = {
        module: moduleMatch ? moduleMatch[1] : null,
        goVersion: goVersionMatch ? goVersionMatch[1] : null,
      };
    } catch (error) {
      summary["go.mod"] = { parseError: error.message };
    }
  }

  const manifestJsonPath = path.join(root, "manifest.json");
  if (pathExists(manifestJsonPath)) {
    try {
      const extManifest = JSON.parse(fs.readFileSync(manifestJsonPath, "utf8"));
      summary["manifest.json"] = {
        name: extManifest.name ?? null,
        version: extManifest.version ?? null,
        description: extManifest.description ?? null,
        defaultLocale: extManifest.default_locale ?? null,
        homepageUrl: extManifest.homepage_url ?? null,
      };
    } catch (error) {
      summary["manifest.json"] = { parseError: error.message };
    }
  }

  return summary;
}

function collectGithubFiles(root) {
  const githubDir = path.join(root, ".github");
  const githubAll = pathExists(githubDir)
    ? walkFiles(githubDir, 4, IGNORED_DIRS).map((f) => rel(root, f)).sort()
    : [];

  const findExact = (candidates) => {
    for (const candidate of candidates) {
      if (pathExists(path.join(root, candidate))) {
        return candidate;
      }
    }
    return null;
  };

  const communityCandidates = ["CONTRIBUTING.md", "SECURITY.md", "CODE_OF_CONDUCT.md", "SUPPORT.md"];
  const otherCommunityFiles = communityCandidates.filter((file) => pathExists(path.join(root, file)));

  return {
    workflows: githubAll.filter((f) => f.startsWith(".github/workflows/")),
    issueTemplates: githubAll.filter((f) => f.startsWith(".github/ISSUE_TEMPLATE/")),
    pullRequestTemplate: findExact([
      ".github/pull_request_template.md",
      ".github/PULL_REQUEST_TEMPLATE.md",
      "PULL_REQUEST_TEMPLATE.md",
    ]),
    dependabot: findExact([".github/dependabot.yml", ".github/dependabot.yaml"]),
    releaseConfig: findExact([
      ".github/release.yml",
      ".github/release.yaml",
      ".github/release-drafter.yml",
    ]),
    codeowners: findExact([".github/CODEOWNERS", "CODEOWNERS", "docs/CODEOWNERS"]),
    funding: findExact([".github/FUNDING.yml"]),
    otherCommunityFiles,
  };
}

function splitMarkdownCodeFences(lines) {
  const proseLines = [];
  const codeLines = [];
  let activeFenceChar = null;
  let activeFenceLength = 0;

  for (let idx = 0; idx < lines.length; idx += 1) {
    const text = lines[idx];
    const lineNumber = idx + 1;
    const fenceMatch = text.match(/^\s*(`{3,}|~{3,})(.*)$/);

    if (fenceMatch) {
      const marker = fenceMatch[1];
      const char = marker[0];
      if (!activeFenceChar) {
        activeFenceChar = char;
        activeFenceLength = marker.length;
        continue;
      }
      if (char === activeFenceChar && marker.length >= activeFenceLength && !fenceMatch[2].trim()) {
        activeFenceChar = null;
        activeFenceLength = 0;
        continue;
      }
    }

    if (activeFenceChar) {
      codeLines.push({ lineNumber, text });
    } else {
      proseLines.push({ lineNumber, text });
    }
  }

  return { proseLines, codeLines };
}

function cleanMarkdownTarget(rawTarget) {
  let target = rawTarget.trim();
  if (target.startsWith("<") && target.includes(">")) {
    target = target.slice(1, target.indexOf(">")).trim();
  } else {
    target = target.split(/\s+/)[0];
  }
  return target;
}

function isSkippableLinkTarget(target) {
  if (!target || target.startsWith("#") || target.startsWith("//")) {
    return true;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) {
    return true;
  }
  return /^<[^>]+>$/.test(target) || target.includes("${");
}

function resolveLocalLink(root, rawTarget) {
  const clean = cleanMarkdownTarget(rawTarget);
  if (isSkippableLinkTarget(clean)) {
    return null;
  }

  const withoutQueryOrHash = clean.split("#")[0].split("?")[0];
  if (!withoutQueryOrHash) {
    return null;
  }

  let decoded = withoutQueryOrHash;
  try {
    decoded = decodeURIComponent(withoutQueryOrHash);
  } catch {
    decoded = withoutQueryOrHash;
  }

  const normalized = decoded.startsWith("/") ? decoded.slice(1) : decoded;
  const resolved = path.resolve(root, normalized);
  const relativeToRoot = path.relative(root, resolved);
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    return { target: clean, exists: false };
  }

  return { target: clean, exists: pathExists(resolved) };
}

function checkReadmeFiles(root, readmeNames, packageScripts) {
  const readmeChecks = [];
  const unknownScripts = [];
  const knownScripts = packageScripts ? new Set(Object.keys(packageScripts)) : null;

  for (const name of readmeNames) {
    const fullPath = path.join(root, name);
    let lines;
    try {
      lines = readLinesUtf8(fullPath);
    } catch {
      continue;
    }

    const { proseLines, codeLines } = splitMarkdownCodeFences(lines);
    const brokenLinks = [];

    if (/\.(md|mdx)$/i.test(name)) {
      for (const { lineNumber, text } of proseLines) {
        const withoutInlineCode = text.replace(/`[^`]*`/g, "");
        const mdPattern = /(!?)\[[^\]]*\]\(([^)\r\n]+)\)/g;
        let match;
        while ((match = mdPattern.exec(withoutInlineCode)) !== null) {
          const check = resolveLocalLink(root, match[2]);
          if (check && !check.exists) {
            brokenLinks.push({
              line: lineNumber,
              kind: match[1] === "!" ? "markdown-image" : "markdown-link",
              target: check.target,
            });
          }
        }

        const htmlImgPattern = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
        while ((match = htmlImgPattern.exec(withoutInlineCode)) !== null) {
          const check = resolveLocalLink(root, match[1]);
          if (check && !check.exists) {
            brokenLinks.push({
              line: lineNumber,
              kind: "html-img",
              target: check.target,
            });
          }
        }
      }

      if (knownScripts) {
        const scriptPattern = /\b(?:npm|pnpm|yarn|bun)\s+run\s+([A-Za-z0-9:._-]+)/g;
        for (const { lineNumber, text } of codeLines) {
          let match;
          while ((match = scriptPattern.exec(text)) !== null) {
            const scriptName = match[1];
            if (!knownScripts.has(scriptName)) {
              unknownScripts.push({
                file: name,
                line: lineNumber,
                script: scriptName,
              });
            }
          }
        }
      }
    }

    readmeChecks.push({
      file: name,
      lineCount: lines.length,
      maxLineLength: lines.length ? Math.max(...lines.map((line) => line.length)) : 0,
      brokenLinks,
    });
  }

  return {
    readmeChecks,
    scriptDrift: {
      checkedAgainstPackageJson: Boolean(knownScripts),
      unknownScripts,
    },
  };
}

function isLikelyPlaceholderUser(username) {
  const lower = username.toLowerCase();
  return (
    PLACEHOLDER_USERNAMES.has(lower) ||
    (lower.startsWith("<") && lower.endsWith(">")) ||
    lower.includes("placeholder")
  );
}

function isBinaryBuffer(buf) {
  const sampleLen = Math.min(buf.length, 8192);
  for (let i = 0; i < sampleLen; i += 1) {
    if (buf[i] === 0) {
      return true;
    }
  }
  return false;
}

function scanTextForSafetyHints(relPath, content, findings) {
  const winUserRegex = /\b[A-Za-z]:\\Users\\([^\\/:*?"<>|\r\n]+)\\/;
  const unixUserRegex = /(?:^|[\s"'(=`])\/(?:Users|home)\/([^/\s"'`<>|)]+)\//;
  const tokenRules = [
    { kind: "github-classic-token", regex: /\bghp_[A-Za-z0-9]{20,}\b/ },
    { kind: "github-fine-grained-token", regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
    { kind: "google-api-key", regex: /\bAIza[0-9A-Za-z_-]{35}\b/ },
    { kind: "aws-access-key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
    { kind: "generic-sk-key", regex: /\bsk-(?!xxxx|0000|test|example)[A-Za-z0-9]{20,}\b/ },
    { kind: "private-key-header", regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  ];

  const lines = content.split(/\r\n|\n|\r/);
  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    const lineNumber = idx + 1;

    const winMatch = line.match(winUserRegex);
    if (winMatch && !isLikelyPlaceholderUser(winMatch[1])) {
      findings.push({ file: relPath, line: lineNumber, kind: "local-absolute-path" });
    } else {
      const unixMatch = line.match(unixUserRegex);
      if (unixMatch && !isLikelyPlaceholderUser(unixMatch[1])) {
        findings.push({ file: relPath, line: lineNumber, kind: "local-absolute-path" });
      }
    }

    for (const rule of tokenRules) {
      if (rule.regex.test(line)) {
        findings.push({ file: relPath, line: lineNumber, kind: rule.kind });
      }
    }
  }
}

function collectSafetyHints(root, trackedFiles, readmeNames) {
  const trackedSensitiveFiles = trackedFiles.filter((file) => {
    const lower = file.toLowerCase();
    const base = path.posix.basename(lower);
    if (
      /^\.env(\..+)?$/.test(base) &&
      !base.endsWith(".example") &&
      !base.endsWith(".sample") &&
      !base.endsWith(".template")
    ) {
      return true;
    }
    if (/\.(pem|key|p12|pfx|keystore|jks)$/.test(base)) {
      return true;
    }
    return /^(id_rsa|id_ed25519|id_ecdsa)$/.test(base);
  });

  const candidateRelPaths = trackedFiles.length > 0
    ? uniqueSorted([...trackedFiles, ...readmeNames])
    : uniqueSorted(walkFiles(root, 4, IGNORED_DIRS).map((f) => rel(root, f)));

  const findings = [];
  for (const relPath of candidateRelPaths) {
    if (findings.length >= 100) {
      break;
    }
    const ext = path.posix.extname(relPath.toLowerCase());
    if (BINARY_EXTENSIONS.has(ext)) {
      continue;
    }
    const fullPath = path.join(root, relPath);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }
    if (!stat.isFile() || stat.size === 0 || stat.size > MAX_SCAN_FILE_BYTES) {
      continue;
    }
    let buf;
    try {
      buf = fs.readFileSync(fullPath);
    } catch {
      continue;
    }
    if (isBinaryBuffer(buf)) {
      continue;
    }
    scanTextForSafetyHints(relPath, buf.toString("utf8"), findings);
  }

  return {
    trackedSensitiveFiles,
    findings,
  };
}

function main() {
  const { repoPath } = parseArgs(process.argv.slice(2));
  const root = path.resolve(repoPath);

  const facts = {
    root,
    git: collectGitFacts(root),
    files: {},
    manifests: [],
    manifestSummary: {},
    scripts: {},
    githubFiles: {},
    localeSignals: [],
    imageAssets: [],
    checks: {},
  };

  for (const file of INTERESTING_ROOT_FILES) {
    const fullPath = path.join(root, file);
    if (!pathExists(fullPath)) {
      continue;
    }
    const stat = fs.statSync(fullPath);
    facts.files[file] = {
      size: stat.size,
      modified: stat.mtime.toISOString(),
    };
    if (MANIFEST_NAMES.has(file)) {
      facts.manifests.push(file);
    }
  }

  const readmeNames = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.startsWith("README")) {
      continue;
    }
    readmeNames.push(entry.name);
    const fullPath = path.join(root, entry.name);
    const stat = fs.statSync(fullPath);
    if (!facts.files[entry.name]) {
      facts.files[entry.name] = {
        size: stat.size,
        modified: stat.mtime.toISOString(),
      };
    }

    try {
      const lines = readLinesUtf8(fullPath);
      facts.files[entry.name].lineCount = lines.length;
      facts.files[entry.name].maxLineLength = lines.length
        ? Math.max(...lines.map((line) => line.length))
        : 0;
    } catch (error) {
      facts.files[entry.name].lineStatsError = error.message;
    }
  }

  facts.manifestSummary = collectManifestSummaries(root, facts);
  facts.githubFiles = collectGithubFiles(root);
  facts.ci = facts.githubFiles.workflows;

  facts.localeSignals = walkDirs(root, 4, IGNORED_DIRS)
    .filter((dir) => LOCALE_DIR_NAMES.has(path.basename(dir).toLowerCase()))
    .slice(0, 40)
    .map((dir) => rel(root, dir));

  const imageNamePattern = /(screenshot|preview|social|demo|hero|readme|cover|banner|logo)/i;
  const imageDirPattern = /(docs|assets|images|screenshots|public|media)/i;
  facts.imageAssets = walkFiles(root, 5, IGNORED_DIRS)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      const dirname = path.dirname(file);
      return IMAGE_EXTENSIONS.has(ext) && (
        imageNamePattern.test(path.basename(file)) ||
        imageNamePattern.test(dirname) ||
        imageDirPattern.test(dirname)
      );
    })
    .slice(0, 80)
    .map((file) => rel(root, file));

  facts.topLevel = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.name !== ".git")
    .slice(0, 80)
    .map((entry) => entry.name);

  const { readmeChecks, scriptDrift } = checkReadmeFiles(
    root,
    readmeNames.sort((a, b) => a.localeCompare(b)),
    facts.package?.scripts ?? null,
  );
  const safetyHints = collectSafetyHints(root, facts.git.trackedFiles ?? [], readmeNames);

  facts.checks = {
    readmeChecks,
    scriptDrift,
    safetyHints,
  };

  console.log(JSON.stringify(facts, null, 2));
}

main();
