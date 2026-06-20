<div align="center">

![TypeScript](https://img.shields.io/badge/Zsh-3178C6?style=flat-square&logo=gnu-bash&logoColor=white)
![GitHub CLI](https://img.shields.io/badge/gh_extension-181717?style=flat-square&logo=github&logoColor=white)
![MIT](https://img.shields.io/badge/licence-MIT-22C55E?style=flat-square)

**Browse and triage unresolved GitHub PR review threads from your terminal with fzf.**

<a href="https://kud.io/projects/gh-pr-comments">Website</a> · <a href="https://kud.io/projects/gh-pr-comments/docs">Documentation</a>

</div>

## Features

- **fzf-powered picker** — fuzzy-search unresolved review threads by file, author, or date with a live diff-hunk preview.
- **Rich previews** — code context with optional Markdown rendering via `glow` or `mdcat`.
- **Copy modes** — copy the full comment, Markdown, URL, or body only straight to your clipboard.
- **Open anywhere** — jump to the comment in your browser or to `file:line` in your editor with a single keypress.
- **Interact inline** — reply, resolve, and unresolve threads without leaving the terminal.
- **Pre-filter on launch** — narrow by file path/regex, author, or date range before the picker even opens.

## Install

From a local checkout:

```sh
gh extension install .
```

Or directly from GitHub:

```sh
gh extension install kud/gh-pr-comments
```

**Requirements:** `gh`, `jq` (>= 1.6), `fzf`. Optional: `glow` or `mdcat` for Markdown rendering; `pbcopy` / `xclip` / `xsel` for clipboard support.

```sh
# macOS
brew install gh jq fzf glow

# Ubuntu/Debian
sudo apt install -y gh jq fzf xclip
```

## Usage

```console
$ gh pr-comments                              # infer repo and current PR
$ gh pr-comments 42                           # browse PR #42
$ gh pr-comments -R owner/repo                # target a specific repository
$ gh pr-comments -f src -a @alice             # pre-filter by file and author
$ gh pr-comments --since 2024-01-01 --until 2024-03-31
$ gh pr-comments --resolved                   # browse resolved threads
$ gh pr-comments --sort date                  # sort by newest first
```

Inside the fzf picker:

| Keys                  | Action                                |
| --------------------- | ------------------------------------- |
| Enter / Ctrl-Y        | Copy full comment                     |
| Ctrl-M                | Copy as Markdown                      |
| Ctrl-U                | Copy URL                              |
| Ctrl-O                | Open in browser                       |
| Ctrl-E                | Jump to file:line in editor           |
| Ctrl-R                | Reply inline                          |
| Ctrl-] / Ctrl-\       | Resolve / unresolve thread            |
| Alt-A / Alt-O / Alt-S | Toggle all comments / outdated / sort |
| ?                     | Toggle help overlay                   |

## Development

```sh
git clone https://github.com/kud/gh-pr-comments.git
cd gh-pr-comments
gh extension install .
```

Bypass live GitHub calls during development by injecting a GraphQL result:

```sh
GH_REVIEW_PR_JSON=/path/to/graphql.json ./gh-pr-comments 123 -R owner/repo --json
```

📚 **Full documentation → [gh-pr-comments/docs](https://kud.io/projects/gh-pr-comments/docs)**
