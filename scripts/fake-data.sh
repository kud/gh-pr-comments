#!/bin/zsh
# Generate test/fixtures/graphql-response.json for offline testing.
# Usage: mise run fake-data
#        GH_REVIEW_PR_JSON=test/fixtures/graphql-response.json ./gh-pr-comments 42 -R acme/demo-app

set -euo pipefail

export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.local/bin:$HOME/bin"

FIXTURE="$(dirname "$0")/../test/fixtures/graphql-response.json"
mkdir -p "$(dirname "$FIXTURE")"

# Helper to produce a fake GitHub node ID
fake_id() { printf "RT_%s" "$(openssl rand -hex 8 2>/dev/null || date +%s%N | head -c16)"; }

NOW="2026-04-04T10:00:00Z"
YESTERDAY="2026-04-03T14:30:00Z"
LAST_WEEK="2026-03-28T09:15:00Z"

cat > "$FIXTURE" <<'JSON'
{
  "data": {
    "repository": {
      "pullRequest": {
        "reviewThreads": {
          "nodes": [
            {
              "id": "RT_kwDOABC123_thread1",
              "path": "src/auth/middleware.ts",
              "line": 42,
              "originalLine": 42,
              "isResolved": false,
              "comments": {
                "nodes": [
                  {
                    "databaseId": 1001,
                    "author": { "login": "alice" },
                    "body": "This token validation is missing the expiry check. We should also handle the `TokenExpiredError` case separately from `JsonWebTokenError` to give users a clearer error message.\n\n```ts\nif (err instanceof TokenExpiredError) {\n  return res.status(401).json({ error: 'token_expired' })\n}\n```",
                    "bodyText": "This token validation is missing the expiry check.",
                    "url": "https://github.com/acme/demo-app/pull/42#discussion_r1001",
                    "path": "src/auth/middleware.ts",
                    "diffHunk": "@@ -38,8 +38,12 @@ export const authMiddleware = async (req, res, next) => {\n   try {\n     const token = req.headers.authorization?.split(' ')[1]\n     if (!token) return res.status(401).json({ error: 'missing_token' })\n-    const decoded = jwt.verify(token, process.env.JWT_SECRET)\n+    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })\n     req.user = decoded\n     next()\n   } catch (err) {\n-    res.status(401).json({ error: 'invalid_token' })\n+    res.status(401).json({ error: 'invalid_token', message: err.message })\n   }\n }",
                    "createdAt": "2026-04-04T10:00:00Z"
                  }
                ]
              }
            },
            {
              "id": "RT_kwDOABC123_thread2",
              "path": "src/auth/middleware.ts",
              "line": 67,
              "originalLine": 67,
              "isResolved": false,
              "comments": {
                "nodes": [
                  {
                    "databaseId": 1002,
                    "author": { "login": "bob" },
                    "body": "Nit: this can be a one-liner with optional chaining.",
                    "bodyText": "Nit: this can be a one-liner with optional chaining.",
                    "url": "https://github.com/acme/demo-app/pull/42#discussion_r1002",
                    "path": "src/auth/middleware.ts",
                    "diffHunk": "@@ -64,6 +64,8 @@ export const authMiddleware = async (req, res, next) => {\n+  const userId = req.user && req.user.id ? req.user.id : null\n+  if (!userId) return next(new Error('unauthenticated'))",
                    "createdAt": "2026-04-03T14:30:00Z"
                  },
                  {
                    "databaseId": 1003,
                    "author": { "login": "alice" },
                    "body": "Good catch, updating.",
                    "bodyText": "Good catch, updating.",
                    "url": "https://github.com/acme/demo-app/pull/42#discussion_r1003",
                    "path": "src/auth/middleware.ts",
                    "diffHunk": "@@ -64,6 +64,8 @@ export const authMiddleware = async (req, res, next) => {\n+  const userId = req.user && req.user.id ? req.user.id : null\n+  if (!userId) return next(new Error('unauthenticated'))",
                    "createdAt": "2026-04-03T15:00:00Z"
                  }
                ]
              }
            },
            {
              "id": "RT_kwDOABC123_thread3",
              "path": "src/api/users/route.ts",
              "line": 18,
              "originalLine": 18,
              "isResolved": false,
              "comments": {
                "nodes": [
                  {
                    "databaseId": 1004,
                    "author": { "login": "copilot-pull-request-reviewer" },
                    "body": "**Potential SQL injection risk.** The `email` parameter is interpolated directly into the query string. Use parameterised queries instead:\n\n```ts\nconst user = await db.query(\n  'SELECT * FROM users WHERE email = $1',\n  [email]\n)\n```",
                    "bodyText": "Potential SQL injection risk.",
                    "url": "https://github.com/acme/demo-app/pull/42#discussion_r1004",
                    "path": "src/api/users/route.ts",
                    "diffHunk": "@@ -15,6 +15,8 @@ export async function GET(req: Request) {\n   const { searchParams } = new URL(req.url)\n   const email = searchParams.get('email')\n+  const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`)\n+  if (!user) return Response.json({ error: 'not_found' }, { status: 404 })",
                    "createdAt": "2026-04-04T09:00:00Z"
                  }
                ]
              }
            },
            {
              "id": "RT_kwDOABC123_thread4",
              "path": "src/components/UserAvatar/index.tsx",
              "line": 31,
              "originalLine": 31,
              "isResolved": false,
              "comments": {
                "nodes": [
                  {
                    "databaseId": 1005,
                    "author": { "login": "charlie" },
                    "body": "The `alt` text here is not accessible — screen readers will announce the raw URL. Use the user's display name instead.",
                    "bodyText": "The alt text here is not accessible.",
                    "url": "https://github.com/acme/demo-app/pull/42#discussion_r1005",
                    "path": "src/components/UserAvatar/index.tsx",
                    "diffHunk": "@@ -28,5 +28,6 @@ export const UserAvatar = ({ user, size = 40 }: Props) => (\n   <img\n     src={user.avatarUrl}\n-    alt={user.avatarUrl}\n+    alt={`${user.login}'s avatar`}\n     style={{ width: size, height: size, borderRadius: '50%' }}\n   />",
                    "createdAt": "2026-04-03T11:00:00Z"
                  }
                ]
              }
            },
            {
              "id": "RT_kwDOABC123_thread5",
              "path": "scripts/deploy.sh",
              "line": null,
              "originalLine": 12,
              "isResolved": false,
              "comments": {
                "nodes": [
                  {
                    "databaseId": 1006,
                    "author": { "login": "bob" },
                    "body": "This is an outdated comment (thread is on a line that no longer exists after the rebase).",
                    "bodyText": "This is an outdated comment.",
                    "url": "https://github.com/acme/demo-app/pull/42#discussion_r1006",
                    "path": "scripts/deploy.sh",
                    "diffHunk": "@@ -10,4 +10,5 @@ set -euo pipefail\n-echo \"Deploying to $ENV...\"\n+echo \"Deploying to ${ENV:?ENV is required}...\"",
                    "createdAt": "2026-03-28T09:15:00Z"
                  }
                ]
              }
            },
            {
              "id": "RT_kwDOABC123_thread6",
              "path": "src/api/users/route.ts",
              "line": 45,
              "originalLine": 45,
              "isResolved": true,
              "comments": {
                "nodes": [
                  {
                    "databaseId": 1007,
                    "author": { "login": "alice" },
                    "body": "Should we add rate limiting here? The endpoint is public.",
                    "bodyText": "Should we add rate limiting here?",
                    "url": "https://github.com/acme/demo-app/pull/42#discussion_r1007",
                    "path": "src/api/users/route.ts",
                    "diffHunk": "@@ -42,5 +42,8 @@ export async function POST(req: Request) {\n+  const body = await req.json()\n+  const user = await createUser(body)\n+  return Response.json(user, { status: 201 })",
                    "createdAt": "2026-04-02T16:00:00Z"
                  },
                  {
                    "databaseId": 1008,
                    "author": { "login": "you" },
                    "body": "Added `rateLimit` middleware in the previous commit, resolving.",
                    "bodyText": "Added rate limiting middleware.",
                    "url": "https://github.com/acme/demo-app/pull/42#discussion_r1008",
                    "path": "src/api/users/route.ts",
                    "diffHunk": "@@ -42,5 +42,8 @@ export async function POST(req: Request) {\n+  const body = await req.json()\n+  const user = await createUser(body)\n+  return Response.json(user, { status: 201 })",
                    "createdAt": "2026-04-02T17:30:00Z"
                  }
                ]
              }
            }
          ]
        }
      }
    }
  }
}
JSON

printf "✔ Fixture written to %s\n" "$FIXTURE"
printf "\nRun offline:\n  GH_REVIEW_PR_JSON=%s ./gh-pr-comments 42 -R acme/demo-app\n\n" "$FIXTURE"
printf "Or via mise:\n  mise run test-offline\n"
