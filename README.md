# gh review-pull-request

Browse GitHub PR review discussions with fzf.

This is a GitHub CLI extension that lets you filter unresolved review threads for a pull request, preview comment context, copy a comment to your clipboard, or open it in the browser.

## Install

From a local checkout of this repo:

```
gh extension install .
```

Or directly from GitHub once published:

```
gh extension install <owner>/gh-review-pull-request
```

## Usage

```
gh review-pull-request                 # infer repo and current PR
gh review-pull-request <number>        # browse specific PR number
```

Options:

- -a, --author <login> Filter by author (can be repeated)
- --all, --all-comments Show all comments in threads (not just latest)
- --include-outdated Include outdated comment threads
- --debug Write a small debug summary file
- -h, --help Show help
- -v, --version Show version

Keybindings inside fzf:

- Enter / Ctrl-Y: Copy comment details to clipboard
- Ctrl-O: Open selected comment in browser

## Requirements

- gh, jq, fzf
- awk, sed, base64, wc, tr, nl, cat, cut, rev
- Optional: glow or mdcat for nicer markdown rendering

## Notes

- By default, only the latest non-outdated comment of each unresolved thread is shown. Use `--all` to see every comment, and `--include-outdated` to include outdated threads.

## Versioning & Releases

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

Users can check the installed version with:

```
gh review-pull-request --version
```
