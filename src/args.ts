import type { CliArgs, Filters } from "./types.js"

const normalizeAuthor = (a: string): string => {
  const stripped = a.startsWith("@") ? a.slice(1) : a
  return stripped === "copilot" ? "copilot-pull-request-reviewer" : stripped
}

export const parseArgs = (argv: string[]): Partial<CliArgs> => {
  const args = argv.slice(2)
  const filters: Filters = { authors: [], files: [], since: "", until: "" }
  let prNumber: string | undefined
  let owner: string | undefined
  let repo: string | undefined
  let showMode: "latest" | "all" = "latest"
  let includeOutdated = false
  let stateFilter: "unresolved" | "resolved" | "all" = "unresolved"
  let sort: "file" | "date" | "author" = "file"

  let i = 0
  while (i < args.length) {
    const arg = args[i]
    switch (arg) {
      case "-a":
      case "--author": {
        const val = args[++i]
        if (!val) throw new Error(`${arg} requires a value`)
        filters.authors.push(normalizeAuthor(val))
        break
      }
      case "-f":
      case "--file": {
        const val = args[++i]
        if (!val) throw new Error(`${arg} requires a value`)
        filters.files.push(val)
        break
      }
      case "--since": {
        const val = args[++i]
        if (!val) throw new Error("--since requires YYYY-MM-DD")
        filters.since = val
        break
      }
      case "--until": {
        const val = args[++i]
        if (!val) throw new Error("--until requires YYYY-MM-DD")
        filters.until = val
        break
      }
      case "--all":
      case "--all-comments":
        showMode = "all"
        break
      case "--include-outdated":
        includeOutdated = true
        break
      case "--resolved":
        stateFilter = "resolved"
        break
      case "--sort": {
        const val = args[++i]
        if (val !== "file" && val !== "date" && val !== "author")
          throw new Error("--sort must be file|date|author")
        sort = val
        break
      }
      case "-R":
      case "--repo": {
        const val = args[++i]
        if (!val) throw new Error(`${arg} requires <owner/repo>`)
        const slash = val.indexOf("/")
        if (slash < 1) throw new Error("--repo must be in the form owner/repo")
        owner = val.slice(0, slash)
        repo = val.slice(slash + 1)
        break
      }
      default:
        if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`)
        prNumber = arg
    }
    i++
  }

  return {
    prNumber,
    owner,
    repo,
    filters,
    showMode,
    includeOutdated,
    stateFilter,
    sort,
  }
}
