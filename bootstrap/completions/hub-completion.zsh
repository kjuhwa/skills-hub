# hub-* shell wrapper tab-completion (zsh).
# Outside Claude Code only — see hub-completion.bash for rationale.
#
# Install: source this file from ~/.zshrc:
#   [ -f "$HOME/.claude/skills-hub/completions/hub-completion.zsh" ] \
#     && source "$HOME/.claude/skills-hub/completions/hub-completion.zsh"
#
# Reuses the bash completion via zsh's bashcompinit; bash 4+ syntax
# used in hub-completion.bash is supported.

autoload -Uz bashcompinit && bashcompinit
# shellcheck disable=SC1091
source "${0:A:h}/hub-completion.bash"
