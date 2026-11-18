param(
  [string]$RepoPath = "."
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath $RepoPath).Path

function Invoke-GitLines {
  param([string[]]$GitArgs)
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $output = & git @GitArgs 2>$null
    if ($LASTEXITCODE -ne 0) {
      return @()
    }
    return @($output)
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
}

function Normalize-GitPath {
  param([string]$File)
  return (($File -replace "\\", "/") -replace "^\./", "")
}

function Get-UniqueSorted {
  param([string[]]$Files)
  return @($Files | ForEach-Object { Normalize-GitPath $_ } | Where-Object { $_ } | Sort-Object -Unique)
}

function Test-InstructionFile {
  param([string]$File)
  $normalized = Normalize-GitPath $File
  $lower = $normalized.ToLowerInvariant()
  $basename = @($lower -split "/")[-1]
  $instructionNames = @("agents.md","claude.md","gemini.md","codex.md")
  $prefixes = @(".cursor/rules",".claude",".codex",".agents",".gemini",".github/instructions")

  if (($instructionNames -contains $basename) -or
      $lower -eq ".cursorrules" -or
      $lower -eq ".windsurfrules" -or
      $lower -eq ".clinerules" -or
      $lower -eq ".github/copilot-instructions.md") {
    return $true
  }

  foreach ($prefix in $prefixes) {
    if ($lower -eq $prefix -or $lower.StartsWith("$prefix/")) {
      return $true
    }
  }
  return $false
}

function Test-PublicFacingFile {
  param([string]$File)
  $normalized = Normalize-GitPath $File
  $lower = $normalized.ToLowerInvariant()
  $basename = @($lower -split "/")[-1]

  if (Test-InstructionFile $normalized) {
    return $false
  }

  if ($basename -match "^(readme)(\.|$)" -or
      $basename -match "^(license|copying|notice|changelog|contributing|security|code_of_conduct|support)(\.|$)") {
    return $true
  }

  $publicDirs = @(
    "docs/","doc/","examples/","example/","samples/","sample/",
    "assets/","images/","screenshots/","public/","media/",
    ".github/workflows/",".github/issue_template/"
  )
  foreach ($dir in $publicDirs) {
    if ($lower.StartsWith($dir)) {
      return $true
    }
  }
  if ($lower -eq ".github/pull_request_template.md") {
    return $true
  }

  $manifestNames = @(
    "package.json","pyproject.toml","cargo.toml","go.mod",
    "composer.json","gemfile","dockerfile","manifest.json","extension.json"
  )
  if ($manifestNames -contains $basename) {
    return $true
  }

  $publicAssetExtensions = @(".png",".jpg",".jpeg",".gif",".webp",".avif",".svg")
  $extension = [IO.Path]::GetExtension($lower)
  return ($publicAssetExtensions -contains $extension) -and ($normalized -match "(?i)(readme|screenshot|preview|social|demo|hero|cover|banner|logo)")
}

function Find-FirstExisting {
  param([string[]]$Candidates)
  foreach ($candidate in $Candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }
  return $null
}

Push-Location $root
try {
  $facts = [ordered]@{
    root = $root
    git = [ordered]@{}
    files = [ordered]@{}
    manifests = @()
    scripts = [ordered]@{}
    githubFiles = [ordered]@{}
    localeSignals = @()
    imageAssets = @()
    note = "Fallback collector. Run collect-repo-facts.mjs when Node.js is available for multi-manifest parsing, README broken-link checks, script drift, and privacy preflight."
  }

  if (Test-Path -LiteralPath ".git") {
    $facts.git.branch = (Invoke-GitLines @("branch", "--show-current") | Select-Object -First 1)
    $facts.git.status = @(Invoke-GitLines @("status", "--short", "--branch"))
    $facts.git.remotes = @(Invoke-GitLines @("remote", "-v"))
    $facts.git.defaultBranchGuess = (Invoke-GitLines @("symbolic-ref", "refs/remotes/origin/HEAD") | Select-Object -First 1)
    $facts.git.trackedFiles = @(Get-UniqueSorted @(Invoke-GitLines @("ls-files")))
    $facts.git.untrackedFiles = @(Get-UniqueSorted @(Invoke-GitLines @("ls-files", "--others", "--exclude-standard")))
    $facts.git.ignoredFiles = @(Get-UniqueSorted @(Invoke-GitLines @("ls-files", "--others", "--ignored", "--exclude-standard")))

    $trackedInstructions = @($facts.git.trackedFiles | Where-Object { Test-InstructionFile $_ })
    $untrackedInstructions = @($facts.git.untrackedFiles | Where-Object { Test-InstructionFile $_ })
    $ignoredInstructions = @($facts.git.ignoredFiles | Where-Object { Test-InstructionFile $_ })
    $localOnlyInstructions = @(Get-UniqueSorted @($untrackedInstructions + $ignoredInstructions))
    $facts.git.instructionFiles = [ordered]@{
      tracked = $trackedInstructions
      untracked = $untrackedInstructions
      ignored = $ignoredInstructions
      localOnly = $localOnlyInstructions
    }
    $facts.git.trackingReview = [ordered]@{
      localOnlyInstructionFiles = $localOnlyInstructions
      possiblyMistakenlyTrackedInstructionFiles = $trackedInstructions
      possiblyForgottenPublicFiles = @($facts.git.untrackedFiles | Where-Object { Test-PublicFacingFile $_ })
    }
  }

  $interesting = @(
    "README.md","README.mdx","README.txt",
    "LICENSE","LICENSE.md",
    "CONTRIBUTING.md","SECURITY.md","CODE_OF_CONDUCT.md","SUPPORT.md","CHANGELOG.md",
    "package.json","pyproject.toml","Cargo.toml","go.mod",
    "composer.json","Gemfile","Dockerfile",
    "manifest.json","extension.json"
  )

  foreach ($file in $interesting) {
    if (Test-Path -LiteralPath $file) {
      $item = Get-Item -LiteralPath $file
      $facts.files[$file] = [ordered]@{
        size = $item.Length
        modified = $item.LastWriteTimeUtc.ToString("o")
      }
      if ($file -match "^(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|composer\.json|Gemfile|manifest\.json|extension\.json)$") {
        $facts.manifests += $file
      }
    }
  }

  foreach ($item in @(Get-ChildItem -File -Filter "README*" -ErrorAction SilentlyContinue)) {
    $name = $item.Name
    if (-not $facts.files.Contains($name)) {
      $facts.files[$name] = [ordered]@{
        size = $item.Length
        modified = $item.LastWriteTimeUtc.ToString("o")
      }
    }

    try {
      $lines = @(Get-Content -LiteralPath $item.FullName -Encoding UTF8)
      $facts.files[$name]["lineCount"] = $lines.Count
      if ($lines.Count -gt 0) {
        $facts.files[$name]["maxLineLength"] = ($lines | ForEach-Object { $_.Length } | Measure-Object -Maximum).Maximum
      } else {
        $facts.files[$name]["maxLineLength"] = 0
      }
    } catch {
      $facts.files[$name]["lineStatsError"] = $_.Exception.Message
    }
  }

  if (Test-Path -LiteralPath "package.json") {
    try {
      $pkg = Get-Content -Raw -Encoding UTF8 -LiteralPath "package.json" | ConvertFrom-Json
      $facts.package = [ordered]@{
        name = $pkg.name
        version = $pkg.version
        description = $pkg.description
        license = $pkg.license
        homepage = $pkg.homepage
        scripts = $pkg.scripts
      }
    } catch {
      $facts.packageParseError = $_.Exception.Message
    }
  }

  $ignoredDirs = @(".git","node_modules","dist","build","out","target",".next",".cache","vendor",".venv","venv","__pycache__")
  $localeDirNames = @("_locales","locales","locale","i18n","translations","translation","lang","langs")
  $scanDirs = @(Get-ChildItem -Directory -Recurse -Depth 4 -Force -ErrorAction SilentlyContinue | Where-Object {
    $parts = $_.FullName.Substring($root.Length).Split([IO.Path]::DirectorySeparatorChar, [StringSplitOptions]::RemoveEmptyEntries)
    -not ($parts | Where-Object { $ignoredDirs -contains $_ })
  })

  $facts.localeSignals = @($scanDirs | Where-Object {
    $localeDirNames -contains $_.Name.ToLowerInvariant()
  } | Select-Object -First 40 | ForEach-Object {
    Normalize-GitPath $_.FullName.Substring($root.Length + 1)
  })

  $imageExtensions = @(".png",".jpg",".jpeg",".gif",".webp",".avif",".svg")
  $imageNamePattern = "(?i)(screenshot|preview|social|demo|hero|readme|cover|banner|logo)"
  $facts.imageAssets = @(Get-ChildItem -File -Recurse -Depth 5 -Force -ErrorAction SilentlyContinue | Where-Object {
    $parts = $_.FullName.Substring($root.Length).Split([IO.Path]::DirectorySeparatorChar, [StringSplitOptions]::RemoveEmptyEntries)
    -not ($parts | Where-Object { $ignoredDirs -contains $_ }) -and
      ($imageExtensions -contains $_.Extension.ToLowerInvariant()) -and
      ($_.Name -match $imageNamePattern -or $_.DirectoryName -match $imageNamePattern -or $_.DirectoryName -match "(?i)(docs|assets|images|screenshots|public|media)")
  } | Select-Object -First 80 | ForEach-Object {
    Normalize-GitPath $_.FullName.Substring($root.Length + 1)
  })

  $workflowsPath = Join-Path ".github" "workflows"
  $issueTemplatesPath = Join-Path ".github" "ISSUE_TEMPLATE"
  $workflows = @(Get-ChildItem -File -Recurse -Depth 3 -Path $workflowsPath -ErrorAction SilentlyContinue | ForEach-Object { Normalize-GitPath $_.FullName.Substring($root.Length + 1) })
  $issueTemplates = @(Get-ChildItem -File -Recurse -Depth 2 -Path $issueTemplatesPath -ErrorAction SilentlyContinue | ForEach-Object { Normalize-GitPath $_.FullName.Substring($root.Length + 1) })
  $otherCommunity = @("CONTRIBUTING.md","SECURITY.md","CODE_OF_CONDUCT.md","SUPPORT.md" | Where-Object { Test-Path -LiteralPath $_ })

  $facts.githubFiles = [ordered]@{
    workflows = $workflows
    issueTemplates = $issueTemplates
    pullRequestTemplate = Find-FirstExisting @(".github/pull_request_template.md",".github/PULL_REQUEST_TEMPLATE.md","PULL_REQUEST_TEMPLATE.md")
    dependabot = Find-FirstExisting @(".github/dependabot.yml",".github/dependabot.yaml")
    releaseConfig = Find-FirstExisting @(".github/release.yml",".github/release.yaml",".github/release-drafter.yml")
    codeowners = Find-FirstExisting @(".github/CODEOWNERS","CODEOWNERS","docs/CODEOWNERS")
    funding = Find-FirstExisting @(".github/FUNDING.yml")
    otherCommunityFiles = $otherCommunity
  }
  $facts.ci = $workflows
  $facts.topLevel = @(Get-ChildItem -Force | Where-Object { $_.Name -ne ".git" } | Select-Object -First 80 -ExpandProperty Name)

  $facts | ConvertTo-Json -Depth 8
} finally {
  Pop-Location
}
