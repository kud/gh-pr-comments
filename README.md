# ✨ gh pr-comments

Browse and triage unresolved GitHub PR review threads from your terminal with fzf.

## 📦 Install

From a local checkout of this repo:

```sh
gh extension install .
```

Or directly from GitHub:

```sh
gh extension install kud/gh-pr-comments
```

## ▶️ Usage

```sh
gh pr-comments                 # infer repo and current PR
gh pr-comments <number>        # browse a specific PR number
gh pr-comments -R owner/repo   # target a specific repository
gh pr-comments -f src -a @alice --since 2024-01-01   # pre-filter on launch
```

## 🛠️ Development

Bypass live GitHub calls by injecting a GraphQL result via `GH_REVIEW_PR_JSON`
(a file path or raw JSON):

```sh
GH_REVIEW_PR_JSON=/path/to/graphql.json ./gh-pr-comments 123 -R owner/repo --json
```

---

📚 **Full documentation → https://kud.io/projects/gh-pr-comments/docs**
