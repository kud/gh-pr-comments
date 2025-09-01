# 📝 Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

### Added

- `--json` flag to output parsed comments for scripting
- `--list` flag to print the UI list without launching fzf
- `GH_REVIEW_PR_JSON` env var to inject GraphQL JSON (path or raw) for offline workflows
- Filters: `-f/--file`, `--since`, `--until` for file/date-focused workflows

### Changed

- Dynamic dependency checks: only require `gh`/`fzf` when needed
- UI list is file-first (path • author • date)

## [0.1.0] - 2025-09-01

### Added

- Initial release as a GitHub CLI extension
- fzf UI to browse unresolved PR review threads
- Preview with code context and markdown rendering (glow/mdcat optional)
- Copy to clipboard (Enter/Ctrl-Y) and open in browser (Ctrl-O)
- Filters: --author, --all-comments, --include-outdated
- Debug summary via --debug
- Version flag (-v/--version)

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
