/** @jsxImportSource @opentui/react */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { SyntaxStyle } from "@opentui/core"
import type { ScrollBoxRenderable } from "@opentui/core"
import { getAuthToken, fetchPRThreads } from "../github.js"
import type { Comment, Filters, RawThread } from "../types.js"

type Mode = "loading" | "error" | "ready"
type Panel = "list" | "detail"

interface State {
  mode: Mode
  panel: Panel
  threads: RawThread[]
  selectedIndex: number
  showMode: "latest" | "all"
  includeOutdated: boolean
  stateFilter: "unresolved" | "resolved" | "all"
  sort: "file" | "date" | "author"
  toast: string | null
  error: string | null
}

interface Props {
  initialOwner: string
  initialRepo: string
  initialPRNumber: number
  filters: Filters
  initialShowMode: "latest" | "all"
  initialIncludeOutdated: boolean
  initialStateFilter: "unresolved" | "resolved" | "all"
  initialSort: "file" | "date" | "author"
}

const filterAndSort = (
  threads: RawThread[],
  filters: Filters,
  showMode: "latest" | "all",
  includeOutdated: boolean,
  stateFilter: "unresolved" | "resolved" | "all",
  sort: "file" | "date" | "author",
): Comment[] => {
  const filtered =
    stateFilter === "resolved"
      ? threads.filter((t) => t.isResolved)
      : stateFilter === "unresolved"
        ? threads.filter((t) => !t.isResolved)
        : threads

  const withCurrent = includeOutdated
    ? filtered
    : filtered.filter((t) => t.line !== null)

  const comments: Comment[] = []

  for (const thread of withCurrent) {
    let nodes = thread.comments.nodes

    if (filters.authors.length > 0) {
      nodes = nodes.filter((c) => filters.authors.includes(c.author.login))
    }

    if (nodes.length === 0) continue

    const candidates =
      showMode === "latest"
        ? [
            nodes
              .slice()
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              .at(-1)!,
          ]
        : nodes

    for (const c of candidates) {
      const date = c.createdAt.split("T")[0]

      if (filters.files.length > 0) {
        const matchesFile = filters.files.some((f) =>
          new RegExp(f).test(thread.path),
        )
        if (!matchesFile) continue
      }

      if (filters.since && date < filters.since) continue
      if (filters.until && date > filters.until) continue

      comments.push({
        author: c.author.login,
        path: thread.path,
        line: thread.line ?? thread.originalLine ?? null,
        url: c.url,
        date,
        body: c.body,
        diffHunk: c.diffHunk,
        isResolved: thread.isResolved,
        isOutdated: thread.line === null,
      })
    }
  }

  if (sort === "date") {
    comments.sort((a, b) => b.date.localeCompare(a.date))
  } else if (sort === "author") {
    comments.sort(
      (a, b) =>
        a.author.localeCompare(b.author) || b.date.localeCompare(a.date),
    )
  } else {
    comments.sort(
      (a, b) => a.path.localeCompare(b.path) || b.date.localeCompare(a.date),
    )
  }

  return comments
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  for (const [cmd, args] of [
    ["pbcopy", [] as string[]],
    ["xclip", ["-selection", "clipboard"]],
    ["xsel", ["--clipboard", "--input"]],
  ] as [string, string[]][]) {
    try {
      const proc = Bun.spawn([cmd, ...args], {
        stdin: new TextEncoder().encode(text),
        stdout: "pipe",
        stderr: "pipe",
      })
      const code = await proc.exited
      if (code === 0) return true
    } catch {
      // try next
    }
  }
  return false
}

const openUrl = (url: string) =>
  Bun.spawn([process.platform === "darwin" ? "open" : "xdg-open", url])

const truncatePath = (
  path: string,
  line: number | null,
  max: number,
): string => {
  const full = line !== null ? `${path}:${line}` : path
  if (full.length <= max) return full
  const head = full.slice(0, 30)
  const tail = full.slice(-20)
  return `${head}…${tail}`
}

export const CommentsBrowser = ({
  initialOwner,
  initialRepo,
  initialPRNumber,
  filters,
  initialShowMode,
  initialIncludeOutdated,
  initialStateFilter,
  initialSort,
}: Props) => {
  const { width, height } = useTerminalDimensions()
  const listWidth = Math.floor(width * 0.4)
  const syntaxStyle = useMemo(() => SyntaxStyle.create(), [])
  const detailScrollRef = useRef<ScrollBoxRenderable | null>(null)

  const [state, setState] = useState<State>({
    mode: "loading",
    panel: "list",
    threads: [],
    selectedIndex: 0,
    showMode: initialShowMode,
    includeOutdated: initialIncludeOutdated,
    stateFilter: initialStateFilter,
    sort: initialSort,
    toast: null,
    error: null,
  })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, mode: "loading", error: null }))
    try {
      const token = await getAuthToken()
      const threads = await fetchPRThreads(
        initialOwner,
        initialRepo,
        initialPRNumber,
        token,
      )
      setState((s) => ({ ...s, mode: "ready", threads }))
    } catch (err) {
      setState((s) => ({
        ...s,
        mode: "error",
        error: err instanceof Error ? err.message : String(err),
      }))
    }
  }, [initialOwner, initialRepo, initialPRNumber])

  useEffect(() => {
    load()
  }, [])

  const comments = useMemo(
    () =>
      filterAndSort(
        state.threads,
        filters,
        state.showMode,
        state.includeOutdated,
        state.stateFilter,
        state.sort,
      ),
    [
      state.threads,
      filters,
      state.showMode,
      state.includeOutdated,
      state.stateFilter,
      state.sort,
    ],
  )

  const selected = comments[state.selectedIndex] ?? null

  useEffect(() => {
    detailScrollRef.current?.scrollBy(-99999)
  }, [state.selectedIndex])

  useEffect(() => {
    if (!state.toast) return
    const timer = setTimeout(
      () => setState((s) => ({ ...s, toast: null })),
      3000,
    )
    return () => clearTimeout(timer)
  }, [state.toast])

  const toast = (msg: string) => setState((s) => ({ ...s, toast: msg }))

  useKeyboard((e) => {
    if (e.name === "q" || (e.name === "c" && e.ctrl)) process.exit(0)

    if (e.name === "left" || (e.name === "tab" && e.shift)) {
      setState((s) => ({ ...s, panel: "list" }))
      return
    }
    if (e.name === "right" || e.name === "tab") {
      setState((s) => ({ ...s, panel: "detail" }))
      return
    }

    if (state.panel === "list") {
      if (e.name === "up" || e.name === "k") {
        setState((s) => ({
          ...s,
          selectedIndex: Math.max(0, s.selectedIndex - 1),
        }))
        return
      }
      if (e.name === "down" || e.name === "j") {
        setState((s) => ({
          ...s,
          selectedIndex: Math.min(comments.length - 1, s.selectedIndex + 1),
        }))
        return
      }
    }

    if (state.panel === "detail") {
      if (e.name === "up" || e.name === "k") {
        detailScrollRef.current?.scrollBy(-3)
        return
      }
      if (e.name === "down" || e.name === "j") {
        detailScrollRef.current?.scrollBy(3)
        return
      }
    }

    if (e.name === "y") {
      if (selected)
        copyToClipboard(selected.url).then(() => toast("✔ Copied URL"))
      return
    }

    if (e.name === "b") {
      if (selected)
        copyToClipboard(selected.body).then(() => toast("✔ Copied body"))
      return
    }

    if (e.name === "m") {
      if (selected) {
        const md = `> ${selected.path}\n\n[${selected.path}](${selected.url}) — @${selected.author} on ${selected.date}\n\n\`\`\`diff\n${selected.diffHunk}\n\`\`\`\n\n${selected.body}\n`
        copyToClipboard(md).then(() => toast("✔ Copied Markdown"))
      }
      return
    }

    if (e.name === "return") {
      if (selected) {
        const fileLine =
          selected.line !== null
            ? `${selected.path}:${selected.line}`
            : selected.path
        const full = `Review Comment\nAuthor: @${selected.author}\nFile: ${fileLine}\nDate: ${selected.date}\nURL: ${selected.url}\n\n${selected.body}\n`
        copyToClipboard(full).then(() => toast("✔ Copied"))
      }
      return
    }

    if (e.name === "o") {
      if (selected) openUrl(selected.url)
      return
    }

    if (e.name === "r") {
      load()
      return
    }

    if (e.name === "a") {
      setState((s) => ({
        ...s,
        showMode: s.showMode === "latest" ? "all" : "latest",
        selectedIndex: 0,
      }))
      return
    }

    if (e.name === "O") {
      setState((s) => ({
        ...s,
        includeOutdated: !s.includeOutdated,
        selectedIndex: 0,
      }))
      return
    }

    if (e.name === "R") {
      setState((s) => ({
        ...s,
        stateFilter:
          s.stateFilter === "unresolved"
            ? "resolved"
            : s.stateFilter === "resolved"
              ? "all"
              : "unresolved",
        selectedIndex: 0,
      }))
      return
    }

    if (e.name === "s") {
      setState((s) => ({
        ...s,
        sort:
          s.sort === "file" ? "date" : s.sort === "date" ? "author" : "file",
        selectedIndex: 0,
      }))
      return
    }
  })

  const listOptions = comments.map((c) => ({
    name: `  ${truncatePath(c.path, c.line, 55)}`,
    description: `  @${c.author}  ·  ${c.date}  ·  ${c.body.replace(/[\n\r]/g, " ").slice(0, 60)}`,
    value: c.url,
  }))

  const headerStatus = `${initialOwner}/${initialRepo} · PR #${initialPRNumber} · ${comments.length} comment(s) · ${state.stateFilter} · sort:${state.sort} · show:${state.showMode}${state.includeOutdated ? " +outdated" : ""}`

  const footerText =
    state.panel === "detail"
      ? "↑↓/jk scroll · ← list · y URL · b body · m md · Enter copy · o open · r reload · a/O/R/s toggles · q quit"
      : "↑↓/jk navigate · → detail · y URL · b body · m md · Enter copy · o open · r reload · a/O/R/s toggles · q quit"

  return (
    <box
      width={width}
      height={height}
      flexDirection="column"
      backgroundColor="#1a1b26"
    >
      <box
        width="100%"
        height={3}
        border={true}
        borderStyle="single"
        borderColor="#414868"
        backgroundColor="#1a1b26"
        paddingX={1}
        alignItems="center"
      >
        <text fg="#7aa2f7" content="gh pr-comments  " />
        <text fg="#c0caf5" content={headerStatus} />
        {state.toast && <text fg="#73daca" content={`  ${state.toast}`} />}
        {state.mode === "error" && (
          <text fg="#f7768e" content={`  ✗ ${state.error}`} />
        )}
      </box>

      <box flexGrow={1} flexDirection="row" width="100%">
        <box
          width={listWidth}
          height="100%"
          border={true}
          borderStyle="single"
          borderColor={state.panel === "list" ? "#7aa2f7" : "#414868"}
          title=" Comments "
          backgroundColor="#1a1b26"
        >
          {state.mode === "loading" && (
            <box
              width="100%"
              height="100%"
              alignItems="center"
              justifyContent="center"
            >
              <text fg="#565f89" content="Loading…" />
            </box>
          )}
          {state.mode !== "loading" && comments.length === 0 && (
            <box
              width="100%"
              height="100%"
              alignItems="center"
              justifyContent="center"
            >
              <text
                fg="#565f89"
                content="No comments found  (try a/O/R to toggle filters)"
              />
            </box>
          )}
          {state.mode !== "loading" && comments.length > 0 && (
            <select
              width="100%"
              height="100%"
              options={listOptions}
              focused={false}
              selectedIndex={state.selectedIndex}
              backgroundColor="#1a1b26"
              textColor="#c0caf5"
              focusedBackgroundColor="#1a1b26"
              focusedTextColor="#c0caf5"
              selectedBackgroundColor="#2d3561"
              selectedTextColor="#7aa2f7"
              descriptionColor="#565f89"
              selectedDescriptionColor="#7dcfff"
              showDescription={true}
              wrapSelection={false}
            />
          )}
        </box>

        <box
          flexGrow={1}
          height="100%"
          border={true}
          borderStyle="single"
          borderColor={state.panel === "detail" ? "#7aa2f7" : "#414868"}
          title=" Detail "
          backgroundColor="#1a1b26"
        >
          {!selected ? (
            <box
              width="100%"
              height="100%"
              alignItems="center"
              justifyContent="center"
            >
              <text fg="#565f89" content="Select a comment to view details" />
            </box>
          ) : (
            <scrollbox
              ref={detailScrollRef}
              scrollY={true}
              width="100%"
              height="100%"
              padding={1}
            >
              <box flexDirection="row" gap={2} alignItems="center">
                <text fg="#7dcfff" content={`@${selected.author}`} />
                <text fg="#565f89" content="·" />
                <text fg="#565f89" content={selected.date} />
                <text fg="#565f89" content="·" />
                <text
                  fg={selected.isResolved ? "#73daca" : "#e0af68"}
                  content={selected.isResolved ? "resolved" : "unresolved"}
                />
                {selected.isOutdated && (
                  <>
                    <text fg="#565f89" content="·" />
                    <text fg="#f7768e" content="outdated" />
                  </>
                )}
              </box>

              <box height={1} />

              <box flexDirection="row" gap={1}>
                <text fg="#565f89" content="File" />
                <text
                  fg="#7aa2f7"
                  content={
                    selected.line !== null
                      ? `${selected.path}:${selected.line}`
                      : selected.path
                  }
                  wrapMode="word"
                  width="100%"
                />
              </box>

              {selected.diffHunk && (
                <>
                  <box height={1} />
                  <text fg="#565f89" content="Diff" />
                  {selected.diffHunk.split("\n").map((line, i) => {
                    const fg = line.startsWith("+")
                      ? "#73daca"
                      : line.startsWith("-")
                        ? "#f7768e"
                        : line.startsWith("@@")
                          ? "#7aa2f7"
                          : "#565f89"
                    return (
                      <text key={i} fg={fg} content={line} wrapMode="none" />
                    )
                  })}
                </>
              )}

              <box height={1} />
              <text fg="#565f89" content="Comment" />
              <markdown
                content={selected.body}
                syntaxStyle={syntaxStyle}
                conceal={true}
                fg="#c0caf5"
                width="100%"
              />
            </scrollbox>
          )}
        </box>
      </box>

      <box
        width="100%"
        height={1}
        backgroundColor="#16161e"
        paddingX={1}
        alignItems="center"
      >
        <text fg="#565f89" content={footerText} />
      </box>
    </box>
  )
}
