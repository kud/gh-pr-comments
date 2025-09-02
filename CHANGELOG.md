# 📝 Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [0.4.0] - 2025-09-02

### Breaking

- Command renamed to `gh pr-comments` (was `gh review-pull-request`).

### Added

### Added

- In-UI toggles: Alt-A (latest/all), Alt-O (include outdated), Alt-R (cycle unresolved/resolved/all), Alt-S (cycle sort file/date/author)
- Copy modes: Ctrl-M (Markdown with diff), Ctrl-U (URL only), Ctrl-B (body only)
- Editor integration: Ctrl-E opens file:line in `$EDITOR`/VS Code/Vim
- Flags: `--resolved`, `--sort {file|date|author}`, `--no-color`
- Color handling honors `NO_COLOR` and `CLICOLOR=0`; disables `fzf --ansi` when off
- jq version check (>= 1.6)

### Changed

- Strict mode: `set -e -u -o pipefail`
- mdcat uses `--no-color` and markdown rendering respects no-color mode
- fzf display and matching fixed; header styled and help toggle added
- Large diff hunks are collapsed (show head/tail 200 lines)

### Notes

- Threads pagination is prepared via structure; comments per-thread remain limited to 100 (future work: paginate comments).

## [0.2.0] - 2025-09-01

### Added

- `--json` flag to output parsed comments for scripting
- `--list` flag to print the UI list without launching fzf
- `GH_REVIEW_PR_JSON` env var to inject GraphQL JSON (path or raw) for offline workflows
- Filters: `-f/--file`, `--since`, `--until` for file/date-focused workflows

### Changed

- Dynamic dependency checks: only require `gh`/`fzf` when needed
- UI list is file-first (path • author • date)

## [0.1.1] - 2025-09-01

### Changed

- Safer temp dir via `mktemp -d` and consistent cleanup
- Stricter arg parsing: unknown flags now error out
- Author normalization now strips leading `@`; `copilot` maps to GitHub reviewer bot
- New `-R/--repo` to target a specific repository
- PATH includes `$HOME/.local/bin` and `$HOME/bin` for Linux setups
- More helpful message when no unresolved comments are found

### Removed

- Unused `chmod` and `bat` dependencies

## [0.1.0] - 2025-09-01

### Added

- Initial release as a GitHub CLI extension
- fzf UI to browse unresolved PR review threads
- Preview with code context and markdown rendering (glow/mdcat optional)
- Copy to clipboard (Enter/Ctrl-Y) and open in browser (Ctrl-O)
- Filters: --author, --all-comments, --include-outdated
- Debug summary via --debug
- Version flag (-v/--version)
