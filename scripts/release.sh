#!/bin/zsh
# Tag and push a new release.
# Usage: mise run release -- v0.6.0
#        scripts/release.sh v0.6.0

set -euo pipefail

export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.local/bin:$HOME/bin"

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  printf "Usage: %s <version>  (e.g. v0.6.0)\n" "$0" >&2
  exit 1
fi

# Normalise: ensure leading v
case "$VERSION" in
  v*) ;;
  *) VERSION="v${VERSION}" ;;
esac

CURRENT_DATE="$(date +%Y-%m-%d)"

printf "→ Releasing %s on %s\n\n" "$VERSION" "$CURRENT_DATE"

# Verify working tree is clean
if ! git diff --quiet || ! git diff --cached --quiet; then
  printf "✗ Working tree has uncommitted changes. Commit or stash first.\n" >&2
  exit 1
fi

# Verify tag does not already exist
if git tag --list "$VERSION" | grep -q .; then
  printf "✗ Tag %s already exists.\n" "$VERSION" >&2
  exit 1
fi

# Verify CHANGELOG has an [Unreleased] section to stamp
if ! grep -q '^\#\# \[Unreleased\]' CHANGELOG.md 2>/dev/null; then
  printf "✗ No [Unreleased] section found in CHANGELOG.md\n" >&2
  exit 1
fi

# Stamp CHANGELOG: replace [Unreleased] heading with the versioned one and insert fresh [Unreleased]
STRIPPED="${VERSION#v}"
TMPFILE="$(mktemp /tmp/changelog-release.XXXXXX.md)"
awk -v ver="$STRIPPED" -v date="$CURRENT_DATE" '
  /^## \[Unreleased\]/ {
    print "## [Unreleased]"
    print ""
    print "## [" ver "] - " date
    next
  }
  { print }
' CHANGELOG.md > "$TMPFILE"
mv "$TMPFILE" CHANGELOG.md

git add CHANGELOG.md
git commit -m "chore(release): ${VERSION}"
git tag "$VERSION"

printf "✔ Committed and tagged %s\n\n" "$VERSION"
printf "Push with:\n  git push && git push --tags\n"
