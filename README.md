# ✨ gh review-pull-request

Browse GitHub PR review discussions with fzf.

This is a GitHub CLI extension that lets you filter unresolved review threads for a pull request, preview comment context, copy a comment to your clipboard, or open it in the browser.

## 📦 Install

From a local checkout of this repo:

```
gh extension install .
```

Or directly from GitHub:

```
gh extension install kud/gh-review-pull-request
```

## ▶️ Usage

```
gh review-pull-request                 # infer repo and current PR
gh review-pull-request <number>        # browse specific PR number
gh review-pull-request -R owner/repo   # target a specific repository
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
- --debug Write a small debug summary file
- -R, --repo <owner/repo> Target a specific repository
- -h, --help Show help
- -v, --version Show version

Keybindings inside fzf:

- Enter / Ctrl-Y: Copy comment details to clipboard
- Ctrl-O: Open selected comment in browser

## 🧰 Requirements

- gh, jq, fzf
- awk, sed, base64, wc, tr, nl, cat, cut, rev
- Optional: glow or mdcat for nicer markdown rendering
  - Clipboard: pbcopy (macOS) or xclip/xsel (Linux) for copy action

## 🧪 Testing locally

You can bypass live GitHub calls by providing a GraphQL result via the `GH_REVIEW_PR_JSON` env variable. This can be either a path to a file or the JSON string itself.

Example with your own GraphQL response file:

```
GH_REVIEW_PR_JSON=/path/to/your_graphql.json \
  ./gh-review-pull-request 123 -R owner/repo --json
```

The above prints the parsed comments as JSON (use `--list` to print the UI list instead).

## 🔎 Filtering tips

- File-first list: the UI list now starts with the file path for quick scanning.
- Filter by file: `-f src/app.py` can be repeated. Values are treated as regex by jq’s `test(...)`, so you can use patterns like `-f '^src/.*\.py$'`.
- Filter by date: `--since 2024-01-01`, `--until 2024-01-31` (inclusive, UTC based on `createdAt`).
- Combine filters: `-f src -a @alice --since 2024-01-01 --include-outdated`.

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
gh review-pull-request --version
```
