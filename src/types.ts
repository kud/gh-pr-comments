export interface RawThread {
  path: string
  line: number | null
  originalLine: number | null
  isResolved: boolean
  comments: {
    nodes: RawComment[]
  }
}

export interface RawComment {
  author: { login: string }
  body: string
  url: string
  diffHunk: string
  createdAt: string
}

export interface Comment {
  author: string
  path: string
  line: number | null
  url: string
  date: string
  body: string
  diffHunk: string
  isResolved: boolean
  isOutdated: boolean
}

export interface Filters {
  authors: string[]
  files: string[]
  since: string
  until: string
}

export interface CliArgs {
  prNumber: string
  owner: string
  repo: string
  filters: Filters
  showMode: "latest" | "all"
  includeOutdated: boolean
  stateFilter: "unresolved" | "resolved" | "all"
  sort: "file" | "date" | "author"
}
