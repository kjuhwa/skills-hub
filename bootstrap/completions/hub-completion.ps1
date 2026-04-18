# hub-* shell wrapper tab-completion (PowerShell 5.1+ / 7+).
# Outside Claude Code only — Claude Code's REPL does NOT expose a
# completion-provider API for slash-command args.
#
# Install: dot-source this file from $PROFILE:
#   . $HOME\.claude\skills-hub\completions\hub-completion.ps1

$script:HubCatalogPath = Join-Path $HOME ".claude\skills-hub\remote\index.json"

function Get-HubSlugs {
    if (-not (Test-Path $script:HubCatalogPath)) { return @() }
    try {
        (Get-Content $script:HubCatalogPath -Raw -Encoding UTF8 |
            ConvertFrom-Json) |
            Where-Object { -not $_.archived -and $_.name } |
            ForEach-Object { $_.name }
    } catch { @() }
}

$hubCompleter = {
    param($wordToComplete, $commandAst, $cursorPosition)
    Get-HubSlugs |
        Where-Object { $_ -like "$wordToComplete*" } |
        ForEach-Object {
            [System.Management.Automation.CompletionResult]::new(
                $_, $_, 'ParameterValue', $_)
        }
}

Register-ArgumentCompleter -CommandName 'hub-search'     -Native -ScriptBlock $hubCompleter
Register-ArgumentCompleter -CommandName 'hub-precheck'   -Native -ScriptBlock {
    param($wordToComplete)
    @('--strict','--skip-lint','--json','--help') |
        Where-Object { $_ -like "$wordToComplete*" } |
        ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
}
Register-ArgumentCompleter -CommandName 'hub-index-diff' -Native -ScriptBlock {
    param($wordToComplete)
    $remote = Join-Path $HOME ".claude\skills-hub\remote"
    $refs = @()
    if (Test-Path (Join-Path $remote ".git")) {
        try {
            $refs = & git -C $remote for-each-ref --format='%(refname:short)' --sort=-committerdate refs/heads refs/tags 2>$null |
                    Select-Object -First 50
        } catch {}
    }
    ($refs + @('HEAD','HEAD~1','HEAD~5','--help')) |
        Where-Object { $_ -like "$wordToComplete*" } |
        ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
}
