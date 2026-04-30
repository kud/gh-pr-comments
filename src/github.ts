import type { RawThread } from "./types.js"

const QUERY = `
query($owner:String!, $name:String!, $number:Int!) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$number) {
      reviewThreads(first: 100) {
        nodes {
          path
          line
          originalLine
          isResolved
          comments(first: 100) {
            nodes {
              author { login }
              body
              url
              diffHunk
              createdAt
            }
          }
        }
      }
    }
  }
}
`

const run = async (cmd: string[]): Promise<string> => {
  const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" })
  const output = await new Response(proc.stdout).text()
  const code = await proc.exited
  if (code !== 0) {
    const err = await new Response(proc.stderr).text()
    throw new Error(err.trim() || `Command failed: ${cmd.join(" ")}`)
  }
  return output.trim()
}

export const getAuthToken = async (): Promise<string> => {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  return run(["gh", "auth", "token"])
}

export const inferRepo = async (): Promise<{ owner: string; repo: string }> => {
  const json = await run(["gh", "repo", "view", "--json", "owner,name"])
  const { owner, name } = JSON.parse(json) as {
    owner: { login: string }
    name: string
  }
  return { owner: owner.login, repo: name }
}

export const inferPRNumber = async (): Promise<string> => {
  try {
    const num = await run([
      "gh",
      "pr",
      "view",
      "--json",
      "number",
      "--jq",
      ".number",
    ])
    if (num && num !== "null") return num
  } catch {
    // fall through to branch-based lookup
  }
  const branch = await run(["git", "branch", "--show-current"])
  const num = await run([
    "gh",
    "pr",
    "list",
    "--state",
    "all",
    "--head",
    branch,
    "--json",
    "number",
    "--jq",
    ".[0].number",
  ])
  if (!num || num === "null") throw new Error("No PR found for current branch")
  return num
}

export const fetchPRThreads = async (
  owner: string,
  repo: string,
  prNumber: number,
  token: string,
): Promise<RawThread[]> => {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { owner, name: repo, number: prNumber },
    }),
  })
  if (!res.ok)
    throw new Error(`GitHub API error: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as {
    data?: {
      repository?: { pullRequest?: { reviewThreads?: { nodes?: RawThread[] } } }
    }
    errors?: Array<{ message: string }>
  }
  if (data.errors?.length)
    throw new Error(data.errors.map((e) => e.message).join("; "))
  return data.data?.repository?.pullRequest?.reviewThreads?.nodes ?? []
}
