#!/usr/bin/env bun
/** @jsxImportSource @opentui/react */
import React from "react"
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { parseArgs } from "./args.js"
import { inferRepo, inferPRNumber } from "./github.js"
import { CommentsBrowser } from "./ui/comments-browser.js"

const HELP = `gh pr-comments — Browse PR review comments (OpenTUI)

Usage:
  gh pr-comments                   # infer repo and current PR
  gh pr-comments <number>          # browse specific PR number

Options:
  -a, --author <login>        Filter by author (repeatable)
  -f, --file <path/regex>     Filter by file path (repeatable)
      --since <YYYY-MM-DD>    Filter on/after date
      --until <YYYY-MM-DD>    Filter on/before date
      --all, --all-comments   Show all comments in threads
      --include-outdated      Include outdated threads
      --resolved              Show resolved threads
      --sort <file|date|author>
  -R, --repo <owner/repo>     Target repository
  -h, --help                  Show this help
  -v, --version               Show version

Keybindings:
  ↑↓ / j k      Navigate list / scroll detail
  ← →  Tab      Switch panels
  y              Copy URL
  b              Copy body
  m              Copy Markdown block
  Enter          Copy full comment
  o              Open in browser
  r              Refresh
  a / O / R / s  Toggle show/outdated/state/sort
  q              Quit`

const rawArgs = process.argv.slice(2)

if (rawArgs.includes("-h") || rawArgs.includes("--help")) {
  console.log(HELP)
  process.exit(0)
}

if (rawArgs.includes("-v") || rawArgs.includes("--version")) {
  console.log("gh-pr-comments v0.5.0")
  process.exit(0)
}

let cliArgs: ReturnType<typeof parseArgs>
try {
  cliArgs = parseArgs(process.argv)
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
}

let owner = cliArgs.owner ?? ""
let repo = cliArgs.repo ?? ""

if (!owner || !repo) {
  try {
    const inferred = await inferRepo()
    owner = inferred.owner
    repo = inferred.repo
  } catch {
    console.error(
      "Cannot infer repository. Pass -R owner/repo or run inside a GitHub repo.",
    )
    process.exit(1)
  }
}

let prNumber = cliArgs.prNumber ? parseInt(cliArgs.prNumber, 10) : 0
if (!prNumber || isNaN(prNumber)) {
  try {
    prNumber = parseInt(await inferPRNumber(), 10)
  } catch {
    console.error(
      "Cannot infer PR number. Pass it as an argument or run on a PR branch.",
    )
    process.exit(1)
  }
}

if (!prNumber || isNaN(prNumber)) {
  console.error("Could not determine PR number.")
  process.exit(1)
}

const renderer = await createCliRenderer({ exitOnCtrlC: true })
process.on("exit", () => renderer.destroy())

createRoot(renderer).render(
  <CommentsBrowser
    initialOwner={owner}
    initialRepo={repo}
    initialPRNumber={prNumber}
    filters={cliArgs.filters!}
    initialShowMode={cliArgs.showMode ?? "latest"}
    initialIncludeOutdated={cliArgs.includeOutdated ?? false}
    initialStateFilter={cliArgs.stateFilter ?? "unresolved"}
    initialSort={cliArgs.sort ?? "file"}
  />,
)
