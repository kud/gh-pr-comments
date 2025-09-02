# ✨ gh pr-comments

Browse GitHub PR review comments with fzf.

This is a GitHub CLI extension that lets you filter unresolved review threads for a pull request, preview comment context, copy a comment to your clipboard, or open it in the browser.

## 📦 Install

From a local checkout of this repo:

```
gh extension install .
```

Or directly from GitHub:

```
gh extension install kud/gh-pr-comments
```

## ▶️ Usage

```
gh pr-comments                 # infer repo and current PR
gh pr-comments <number>        # browse specific PR number
gh pr-comments -R owner/repo   # target a specific repository
```

Options:

- -a, --author Filter by author (can be repeated)
- -f, --file <path/regex> Filter by file path (repeatable)
- --since <YYYY-MM-DD> Filter comments created on/after date
- --until <YYYY-MM-DD> Filter comments created on/before date
- --all, --all-comments Show all comments in threads (not just latest)
- --include-outdated Include outdated comment threads
- --json Print parsed comments as JSON and exit
- --list Print UI list output and exit
- --resolved Show resolved threads instead of unresolved
- --sort <file|date|author> Sorting mode (default: file)
- --no-color Disable ANSI colors in UI/preview
- --debug Write a small debug summary file
- -R, --repo <owner/repo> Target a specific repository
- -h, --help Show help
- -v, --version Show version

Keybindings inside fzf:

- Enter / Ctrl-Y: Copy comment details
- Ctrl-M: Copy Markdown block (with diff context)
- Ctrl-U: Copy URL only
- Ctrl-B: Copy body only
- Ctrl-O: Open selected comment in browser
- Ctrl-E: Open file:line in $EDITOR or VS Code
- Alt-A: Toggle latest/all comments per thread
- Alt-O: Toggle including outdated threads
- Alt-R: Cycle thread state (unresolved → resolved → all)
- Alt-S: Cycle sort (file → date → author)

## 🧰 Requirements

- gh, jq (>= 1.6), fzf
- awk, sed, base64, wc, tr, nl, cat, cut, rev, perl
- Optional: glow or mdcat for nicer markdown rendering
  - Clipboard: pbcopy (macOS) or xclip/xsel (Linux) for copy action

### Install requirements quickly

- macOS (Homebrew):

```
brew install gh jq fzf glow mdcat
```

Enable fzf key bindings (history search, Alt-C, etc.):

```
$(brew --prefix)/opt/fzf/install
```
Choose to enable key bindings and shell completion when prompted.

- Ubuntu/Debian:

```
sudo apt update
sudo apt install -y gh jq fzf xclip
# optional renderers: sudo apt install -y glow mdcat
```

- Fedora:

```
sudo dnf install -y gh jq fzf xclip
```

- Arch Linux:

```
sudo pacman -S --needed github-cli jq fzf xclip
```

Notes:

- On Linux, ensure `$HOME/.local/bin` is in your `PATH` so tools are discoverable.
- If your distro doesn’t package `gh`, install it via GitHub’s instructions: https://github.com/cli/cli#installation

WSL clipboard tips:

- This tool supports `pbcopy`, `xclip`, or `xsel` for copying.
- On WSL without X11, a quick shim is to add this to `~/.zshrc`:

```
pbcopy() { clip.exe; }
```

- Alternatively, install `xclip` and run an X server, or install `win32yank` and symlink it to `pbcopy`.

## 🧪 Testing locally

You can bypass live GitHub calls by providing a GraphQL result via the `GH_REVIEW_PR_JSON` env variable. This can be either a path to a file or the JSON string itself.

Example with your own GraphQL response file:

```
GH_REVIEW_PR_JSON=/path/to/your_graphql.json \
  ./gh-pr-comments 123 -R owner/repo --json
```

The above prints the parsed comments as JSON (use `--list` to print the UI list instead).

## 🔎 Filtering tips

- File-first list: the UI list now starts with the file path for quick scanning.
- Filter by file: `-f src/app.py` can be repeated. Values are treated as regex by jq’s `test(...)`, so you can use patterns like `-f '^src/.*\.py$'`.
- Filter by date: `--since 2024-01-01`, `--until 2024-01-31` (inclusive, UTC based on `createdAt`).
- Combine filters: `-f src -a @alice --since 2024-01-01 --include-outdated`.

Sorting and state:

- Sort: `--sort date` to sort by newest first; `--sort author` groups by author.
- Resolved: `--resolved` to browse resolved threads as a follow-up queue.

Color:

- Disable colors with `--no-color` or `NO_COLOR=1`.

## 📝 Notes

- By default, only the latest non-outdated comment of each unresolved thread is shown. Use `--all` to see every comment, and `--include-outdated` to include outdated threads.
- `--author` accepts either `user` or `@user`. `copilot` is normalized to `copilot-pull-request-reviewer`.
- If no unresolved comments are found, try `--all` or `--include-outdated`.
- On Linux, ensure `$HOME/.local/bin` is in your `PATH` so `fzf`/`jq` can be found.

## 🏷️ Versioning & Releases

This repo uses a simple SemVer approach with a plain `VERSION` file:

1. Bump version in `VERSION` (first line only).
2. Update `CHANGELOG.md`.
3. Commit and tag:

```
git add -A
git commit -m "chore(release): v0.1.1"
git tag v0.1.1
git push && git push --tags
```

Quick one-liner to tag using the `VERSION` file:

```
version=$(cat VERSION) && git tag "v$version" && git push origin "v$version"
```

Users can check the installed version with:

```
gh pr-comments --version
```


## 🛠️ Troubleshooting

- GitHub auth error: If the API call fails, run `gh auth status` and `gh auth login`.
- No comments found: Try `--all`, `--include-outdated`, or `--resolved`. Also check filters like `--author`, `--file`, `--since/--until`.
- Clipboard not working: Install `pbcopy` (macOS), `xclip`/`xsel` (Linux). On WSL, add `pbcopy() { clip.exe; }` to your shell or install `win32yank`.
- Colors look noisy: Use `--no-color` or set `NO_COLOR=1`. Piping output? Prefer `--no-color`.
- fzf not launching: Ensure `fzf` is installed and your `TERM` is not `dumb` (use a real terminal). On macOS, run `$(brew --prefix)/opt/fzf/install` to enable key bindings.
- jq version: Requires jq >= 1.6 (for `fromdateiso8601`). Check with `jq --version` and upgrade if needed.
- Markdown rendering: If `glow`/`mdcat` are missing, plain text is shown. Install one for nicer previews.
- Open in editor (Ctrl-E) does nothing: Set the `EDITOR` env var, or ensure `code` is available for VS Code. Falls back to `vim`.
- Large PRs: Extremely long diff hunks are collapsed for performance in previews. Currently up to 100 comments per thread are fetched.
