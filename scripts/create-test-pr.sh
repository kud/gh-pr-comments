#!/bin/zsh
# Create a throwaway GitHub PR with realistic review comments for live testing.
# Usage: mise run create-test-pr [owner/repo]
#
# Defaults to kud/gh-pr-comments-tests. Clones to a temp dir, branches,
# introduces intentional issues, pushes, opens a draft PR, then posts review
# comments so you can browse them with:  gh pr-comments <number> -R kud/gh-pr-comments-tests
#
# Cleanup: gh pr close <number> -R kud/gh-pr-comments-tests && git push --delete origin <branch>

set -euo pipefail

export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.local/bin:$HOME/bin"

REPO="${1:-kud/gh-pr-comments-tests}"
BRANCH="test/pr-comments-$(date +%Y%m%d-%H%M%S)"
BASE="main"
WORKDIR="$(mktemp -d /tmp/gh-pr-comments-tests.XXXXXX)"

printf "→ Repo:    %s\n" "$REPO"
printf "→ Branch:  %s\n" "$BRANCH"
printf "→ Workdir: %s\n\n" "$WORKDIR"

trap 'printf "\n→ Cleaning up workdir...\n"; rm -rf "$WORKDIR"' EXIT

# -- Clone and branch --
gh repo clone "$REPO" "$WORKDIR" -- --quiet
cd "$WORKDIR"
git checkout -b "$BRANCH"

# -- Make changes that reviewers will comment on --

# auth: add algorithms option (good) but skip expiry handling (bad — reviewer will flag)
cat > src/auth/middleware.ts <<'TS'
import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'missing_token' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] })
    req.user = decoded as any
    const userId = req.user && req.user.id ? req.user.id : null
    if (!userId) return next(new Error('unauthenticated'))
    next()
  } catch (err: any) {
    res.status(401).json({ error: 'invalid_token', message: err.message })
  }
}
TS

# api: SQL injection introduced — reviewer will flag
cat > src/api/users/route.ts <<'TS'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`)
  if (!user) return Response.json({ error: 'not_found' }, { status: 404 })
  return Response.json(user)
}

export async function POST(req: Request) {
  const body = await req.json()
  const user = await createUser(body)
  return Response.json(user, { status: 201 })
}
TS

# component: wrong alt text — reviewer will flag accessibility issue
cat > src/components/UserAvatar/index.tsx <<'TSX'
interface Props { user: { login: string; avatarUrl: string }; size?: number }

export const UserAvatar = ({ user, size = 40 }: Props) => (
  <img
    src={user.avatarUrl}
    alt={user.avatarUrl}
    style={{ width: size, height: size, borderRadius: '50%' }}
  />
)
TSX

git add src/
git commit -m "feat: update auth middleware and user API"
git push origin "$BRANCH"

# -- Open draft PR --
PR_URL="$(gh pr create \
  --repo "$REPO" \
  --base "$BASE" \
  --head "$BRANCH" \
  --title "feat: update auth middleware and user API" \
  --body "$(printf '%s' '> **Throwaway PR for testing `gh pr-comments`** — safe to close at any time.

Changes:
- Tighten JWT validation with explicit algorithm
- Add userId guard in auth middleware
- Extend user GET/POST endpoints')" \
  --draft)"

PR_NUMBER="$(printf '%s' "$PR_URL" | grep -oE '[0-9]+$')"
printf "\n✔ PR #%s created: %s\n\n" "$PR_NUMBER" "$PR_URL"

# -- Add review comments --
COMMIT_SHA="$(gh api "repos/${REPO}/pulls/${PR_NUMBER}" --jq .head.sha)"

add_comment() {
  local file_path="$1" line_num="$2" body="$3"
  gh api "repos/${REPO}/pulls/${PR_NUMBER}/comments" \
    -f commit_id="$COMMIT_SHA" \
    -f path="$file_path" \
    -F line="$line_num" \
    -f side="RIGHT" \
    -f body="$body" \
    --silent
  printf "  ✔ %s:%s\n" "$file_path" "$line_num"
}

printf "→ Posting review comments...\n"

add_comment "src/auth/middleware.ts" 8 \
  "Missing expiry check — \`TokenExpiredError\` and \`JsonWebTokenError\` should be handled separately so users get a clearer error message.

\`\`\`ts
} catch (err: any) {
  if (err instanceof TokenExpiredError) {
    return res.status(401).json({ error: 'token_expired' })
  }
  res.status(401).json({ error: 'invalid_token' })
}
\`\`\`"

add_comment "src/auth/middleware.ts" 10 \
  "Nit: this can be a one-liner — \`const userId = req.user?.id ?? null\`"

add_comment "src/api/users/route.ts" 6 \
  "**SQL injection risk.** \`email\` is interpolated directly into the query. Use a parameterised query:

\`\`\`ts
const user = await db.query('SELECT * FROM users WHERE email = \$1', [email])
\`\`\`"

add_comment "src/components/UserAvatar/index.tsx" 6 \
  "Accessibility issue: \`alt\` is set to the raw avatar URL. Screen readers will announce the full URL string. Use the user's name instead: \`alt={\`\${user.login}'s avatar\`}\`"

printf "\n✔ Done.\n\n"
printf "Browse with:\n  gh pr-comments %s -R %s\n\n" "$PR_NUMBER" "$REPO"
printf "Cleanup:\n  gh pr close %s -R %s\n  # then delete the remote branch from the PR page\n" "$PR_NUMBER" "$REPO"
