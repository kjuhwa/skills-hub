# hub-* shell wrapper tab-completion (bash).
# Outside Claude Code only — Claude Code's REPL does NOT expose a
# completion-provider API for slash-command args.
#
# Install: source this file from ~/.bashrc:
#   [ -f "$HOME/.claude/skills-hub/completions/hub-completion.bash" ] \
#     && source "$HOME/.claude/skills-hub/completions/hub-completion.bash"

_hub_catalog_path() {
    printf '%s\n' "$HOME/.claude/skills-hub/remote/index.json"
}

_hub_py_bin() {
    if command -v py >/dev/null 2>&1;     then printf 'py -3\n'
    elif command -v python3 >/dev/null 2>&1; then printf 'python3\n'
    else return 1
    fi
}

_hub_slug_list() {
    local catalog py
    catalog="$(_hub_catalog_path)"
    [ -r "$catalog" ] || return 0
    py="$(_hub_py_bin)" || return 0
    # shellcheck disable=SC2016
    $py -c '
import json, os, sys
catalog = os.path.expanduser(sys.argv[1])
try:
    for e in json.load(open(catalog, encoding="utf-8")):
        if e.get("archived"): continue
        n = e.get("name")
        if n: print(n)
except Exception:
    pass
' "$catalog" 2>/dev/null
}

_hub_category_list() {
    local catalog py
    catalog="$(_hub_catalog_path)"
    [ -r "$catalog" ] || return 0
    py="$(_hub_py_bin)" || return 0
    # shellcheck disable=SC2016
    $py -c '
import json, os, sys
catalog = os.path.expanduser(sys.argv[1])
try:
    cats = {e.get("category") for e in json.load(open(catalog, encoding="utf-8")) if e.get("category")}
    for c in sorted(cats): print(c)
except Exception:
    pass
' "$catalog" 2>/dev/null
}

_hub_search_complete() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]:-}"
    case "$prev" in
        --category|--cat)
            # shellcheck disable=SC2207
            COMPREPLY=( $(compgen -W "$(_hub_category_list)" -- "$cur") )
            return
            ;;
    esac
    if [[ "$cur" == --* ]]; then
        # shellcheck disable=SC2207
        COMPREPLY=( $(compgen -W "--category --cat --kind --html --json -n --help" -- "$cur") )
    else
        # shellcheck disable=SC2207
        COMPREPLY=( $(compgen -W "$(_hub_slug_list)" -- "$cur") )
    fi
}

_hub_precheck_complete() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    # shellcheck disable=SC2207
    COMPREPLY=( $(compgen -W "--strict --skip-lint --json --help" -- "$cur") )
}

_hub_index_diff_complete() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local refs
    refs=$(git -C "$HOME/.claude/skills-hub/remote" \
        for-each-ref --format='%(refname:short)' --sort=-committerdate \
        refs/heads refs/tags 2>/dev/null | head -50)
    # shellcheck disable=SC2207
    COMPREPLY=( $(compgen -W "${refs} HEAD HEAD~1 HEAD~5 --help" -- "$cur") )
}

complete -F _hub_search_complete     hub-search
complete -F _hub_precheck_complete   hub-precheck
complete -F _hub_index_diff_complete hub-index-diff
