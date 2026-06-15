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

Push-Location $root
try {
  $facts = [ordered]@{
    root = $root
    git = [ordered]@{}
    files = [ordered]@{}
    manifests = @()
    scripts = [ordered]@{}
    localeSignals = @()
    imageAssets = @()
  }

  if (Test-Path -LiteralPath ".git") {
    $facts.git.branch = (Invoke-GitLines @("branch", "--show-current") | Select-Object -First 1)
    $facts.git.status = @(Invoke-GitLines @("status", "--short", "--branch"))
    $facts.git.remotes = @(Invoke-GitLines @("remote", "-v"))
    $facts.git.defaultBranchGuess = (Invoke-GitLines @("symbolic-ref", "refs/remotes/origin/HEAD") | Select-Object -First 1)
  }

  $interesting = @(
    "README.md","README.mdx","README.txt",
    "LICENSE","LICENSE.md",
    "CONTRIBUTING.md","SECURITY.md","CHANGELOG.md",
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
        scripts = $pkg.scripts
      }
    } catch {
      $facts.packageParseError = $_.Exception.Message
    }
  }

  $ignoredDirs = @(".git","node_modules","dist","build","out","target",".next",".cache","vendor")
  $localeDirNames = @("_locales","locales","locale","i18n","translations","translation","lang","langs")
  $scanDirs = @(Get-ChildItem -Directory -Recurse -Depth 4 -Force -ErrorAction SilentlyContinue | Where-Object {
    $parts = $_.FullName.Substring($root.Length).Split([IO.Path]::DirectorySeparatorChar, [StringSplitOptions]::RemoveEmptyEntries)
    -not ($parts | Where-Object { $ignoredDirs -contains $_ })
  })

  $facts.localeSignals = @($scanDirs | Where-Object {
    $localeDirNames -contains $_.Name.ToLowerInvariant()
  } | Select-Object -First 40 | ForEach-Object {
    $_.FullName.Substring($root.Length + 1)
  })

  $imageExtensions = @(".png",".jpg",".jpeg",".gif",".webp",".avif",".svg")
  $imageNamePattern = "(?i)(screenshot|preview|social|demo|hero|readme|cover|banner|logo)"
  $facts.imageAssets = @(Get-ChildItem -File -Recurse -Depth 5 -Force -ErrorAction SilentlyContinue | Where-Object {
    $parts = $_.FullName.Substring($root.Length).Split([IO.Path]::DirectorySeparatorChar, [StringSplitOptions]::RemoveEmptyEntries)
    -not ($parts | Where-Object { $ignoredDirs -contains $_ }) -and
      ($imageExtensions -contains $_.Extension.ToLowerInvariant()) -and
      ($_.Name -match $imageNamePattern -or $_.DirectoryName -match $imageNamePattern -or $_.DirectoryName -match "(?i)(docs|assets|images|screenshots|public|media)")
  } | Select-Object -First 80 | ForEach-Object {
    $_.FullName.Substring($root.Length + 1)
  })

  $workflowsPath = Join-Path ".github" "workflows"
  $facts.ci = @(Get-ChildItem -File -Recurse -Depth 3 -Path $workflowsPath -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName.Substring($root.Length + 1) })
  $facts.topLevel = @(Get-ChildItem -Force | Where-Object { $_.Name -ne ".git" } | Select-Object -First 80 -ExpandProperty Name)

  $facts | ConvertTo-Json -Depth 8
} finally {
  Pop-Location
}
