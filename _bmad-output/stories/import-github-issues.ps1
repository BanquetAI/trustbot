# TrustBot 2.0 GitHub Issues Import Script
# Run this from the repository root with GitHub CLI installed
# Usage: .\import-github-issues.ps1

$ErrorActionPreference = "Stop"

Write-Host "Creating labels..." -ForegroundColor Cyan

# Create labels
$labels = @(
    @{ name = "epic-1-trust"; color = "0366d6"; description = "Enhanced Trust Scoring" },
    @{ name = "epic-2-audit"; color = "d73a49"; description = "Cryptographic Audit Trail" },
    @{ name = "epic-3-council"; color = "6f42c1"; description = "Council Governance" },
    @{ name = "epic-4-delegation"; color = "28a745"; description = "Delegation & Budgets" },
    @{ name = "epic-5-frontend"; color = "fd7e14"; description = "API & Frontend" },
    @{ name = "P0-blocker"; color = "b60205"; description = "Blocks other work" },
    @{ name = "P1-high"; color = "d93f0b"; description = "High priority" },
    @{ name = "P2-medium"; color = "fbca04"; description = "Medium priority" },
    @{ name = "size-1"; color = "c5def5"; description = "1 story point" },
    @{ name = "size-2"; color = "bfd4f2"; description = "2 story points" },
    @{ name = "size-3"; color = "a2c4e0"; description = "3 story points" }
)

foreach ($label in $labels) {
    Write-Host "  Creating label: $($label.name)"
    gh label create $label.name --color $label.color --description $label.description --force 2>$null
}

Write-Host "`nCreating milestones..." -ForegroundColor Cyan

# Create milestones
$milestones = @(
    "Sprint 1: Foundation",
    "Sprint 2: Complete Scoring",
    "Sprint 3: Council Governance",
    "Sprint 4: Delegation & Budgets",
    "Sprint 5: API & Frontend"
)

foreach ($milestone in $milestones) {
    Write-Host "  Creating milestone: $milestone"
    gh api repos/:owner/:repo/milestones -f title="$milestone" 2>$null
}

Write-Host "`nCreating issues..." -ForegroundColor Cyan

# Load and parse the JSON file
$json = Get-Content -Path "_bmad-output/stories/import-github-issues.json" -Raw | ConvertFrom-Json

foreach ($issue in $json.issues) {
    Write-Host "  Creating: $($issue.id) - $($issue.title)"

    $labelArgs = ($issue.labels | ForEach-Object { "--label `"$_`"" }) -join " "

    # Create the issue
    $cmd = "gh issue create --title `"$($issue.title)`" --body `"$($issue.body)`" $labelArgs --milestone `"$($issue.milestone)`""
    Invoke-Expression $cmd

    Start-Sleep -Milliseconds 500  # Rate limiting
}

Write-Host "`nDone! Created $($json.issues.Count) issues." -ForegroundColor Green
