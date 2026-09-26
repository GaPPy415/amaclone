/**
 * agent-capture — automatic prompt/response capture (8x assignment).
 * Drop this in `.opencode/plugins/` and opencode auto-discovers it.
 *
 * opencode has no shell-style hooks; its lifecycle mechanism is the plugin API
 * (`Plugin = (input, options?) => Promise<Hooks>`). Two verified hooks drive
 * capture: `chat.message` fires on a newly created user message (the prompt),
 * and the generic `event` hook reports `session.idle`, which marks end-of-turn
 * and is where the final assistant text is read back.
 *
 * Keep this file free of external imports so opencode's plugin loader never has
 * to resolve or install a package to run it. Only node: builtins are used.
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { join } from "node:path"

const AUTHOR = "GaPPy415"
const TOOL = "opencode"
const PROJECT = "amaclone"

type AnyPart = {
  type?: string
  text?: string
  synthetic?: boolean
  ignored?: boolean
}

type State = {
  sessionID: string
  file: string
  body: string
  exchanges: number
  firstISO: string | null
  lastISO: string | null
  firstModel: string
  promptMessageID: string | null
  pendingPrompt: boolean
}

const pad = (n: number) => String(n).padStart(2, "0")

const fileStamp = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
  `_${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}`

const textOf = (parts: AnyPart[] | undefined | null): string => {
  if (!Array.isArray(parts)) return ""
  const texts = parts.filter(
    (p) => p && p.type === "text" && typeof p.text === "string",
  )
  const prose = texts.filter((p) => !p.synthetic && !p.ignored)
  return (prose.length ? prose : texts).map((p) => p.text).join("\n")
}

const recoverBody = (text: string): string => {
  const i = text.indexOf("[LOG_ENTRY")
  return i >= 0 ? text.slice(i).trimEnd() : ""
}

export default async (input: any) => {
  const client = input?.client
  const directory: string = input?.directory ?? process.cwd()
  const worktree: string | undefined = input?.worktree

  const root = worktree && worktree !== "/" ? worktree : directory
  const dir = join(root, ".agent-logs")

  const states = new Map<string, State>()
  const rootCache = new Map<string, boolean>()

  const log = async (level: string, message: string) => {
    try {
      await client?.app?.log?.({
        body: { service: "agent-capture", level, message },
      })
    } catch {}
  }

  /**
   * Child sessions (subagents spawned via `task`, plus opencode's own
   * title/summarize sessions) carry `parentID`. Their traffic is intermediate
   * working rather than the prompt/final-response pair we log, so gate on it.
   */
  const isRootSession = async (sessionID: string): Promise<boolean> => {
    if (rootCache.has(sessionID)) return rootCache.get(sessionID) as boolean
    let isRoot = true
    try {
      const res = await client?.session?.get?.({ path: { id: sessionID } })
      const info = res?.data ?? res
      if (info && typeof info === "object" && info.parentID) isRoot = false
    } catch {
      isRoot = true
    }
    rootCache.set(sessionID, isRoot)
    return isRoot
  }

  const loadState = async (sessionID: string): Promise<State> => {
    const existing = states.get(sessionID)
    if (existing) return existing

    await mkdir(dir, { recursive: true })

    let file = ""
    let body = ""
    let exchanges = 0
    let firstISO: string | null = null
    let lastISO: string | null = null
    let firstModel = "unknown"

    try {
      const files = (await readdir(dir))
        .filter((f) => f.endsWith(`_${sessionID}.md`))
        .sort()
      if (files.length) {
        file = join(dir, files[files.length - 1])
        const prev = await readFile(file, "utf8")
        body = recoverBody(prev)
        exchanges = Number(prev.match(/^total_exchanges:\s*(\d+)/m)?.[1] ?? 0)
        firstISO = prev.match(/^first_prompt_time:\s*(\S+)/m)?.[1] ?? null
        lastISO = prev.match(/^last_prompt_time:\s*(\S+)/m)?.[1] ?? null
        firstModel = prev.match(/^model:\s*(.+)$/m)?.[1]?.trim() ?? "unknown"
      }
    } catch {}

    const state: State = {
      sessionID,
      file,
      body,
      exchanges,
      firstISO,
      lastISO,
      firstModel,
      promptMessageID: null,
      pendingPrompt: false,
    }
    states.set(sessionID, state)
    return state
  }

  const render = (s: State): string => {
    const date = (s.firstISO ?? new Date().toISOString()).slice(0, 10)
    const frontmatter = [
      "---",
      `session_id: ${s.sessionID}`,
      `date: ${date}`,
      `author: ${AUTHOR}`,
      `model: ${s.firstModel}`,
      `tool: ${TOOL}`,
      `project: ${PROJECT}`,
      `total_exchanges: ${s.exchanges}`,
      `first_prompt_time: ${s.firstISO ?? ""}`,
      `last_prompt_time: ${s.lastISO ?? ""}`,
      "---",
      "",
      `# Session Log - ${date}`,
      "",
      `Session: \`${s.sessionID}\` | Project: \`${PROJECT}\` | Author: \`${AUTHOR}\``,
      "",
      "---",
      "",
    ].join("\n")
    return s.body ? `${frontmatter}${s.body}\n` : frontmatter
  }

  const flush = async (s: State) => {
    if (!s.file) {
      const when = new Date(s.firstISO ?? Date.now())
      s.file = join(dir, `${fileStamp(when)}_${s.sessionID}.md`)
    }
    await mkdir(dir, { recursive: true })
    await writeFile(s.file, render(s), "utf8")
  }

  const entry = (
    type: "PROMPT" | "RESPONSE",
    num: number,
    sessionID: string,
    iso: string,
    model: string,
    text: string,
  ) =>
    [
      `[LOG_ENTRY type=${type} num=${num} session=${sessionID}]`,
      `timestamp: ${iso}`,
      `model: ${model}`,
      "",
      text,
    ].join("\n")

  const append = (s: State, block: string) => {
    s.body = s.body ? `${s.body}\n\n${block}` : block
  }

  return {
    config: async () => {
      await log("info", `agent-capture loaded; writing to ${dir}`)
    },

    "chat.message": async (hookInput: any, output: any) => {
      try {
        const sessionID: string | undefined =
          hookInput?.sessionID ?? output?.message?.sessionID
        if (!sessionID) return
        if (!(await isRootSession(sessionID))) return

        const promptText = textOf(output?.parts)
        if (!promptText.trim()) return

        const s = await loadState(sessionID)
        const iso = new Date().toISOString()
        const model = hookInput?.model
          ? `${hookInput.model.providerID}/${hookInput.model.modelID}`
          : `${output?.message?.model?.providerID ?? "?"}/${output?.message?.model?.modelID ?? "?"}`

        if (s.firstModel === "unknown") s.firstModel = model
        s.exchanges += 1
        s.firstISO = s.firstISO ?? iso
        s.lastISO = iso
        s.promptMessageID = output?.message?.id ?? hookInput?.messageID ?? null
        s.pendingPrompt = true

        append(s, entry("PROMPT", s.exchanges, sessionID, iso, model, promptText))
        await flush(s)
      } catch (e) {
        await log("error", `chat.message capture failed: ${String(e)}`)
      }
    },

    event: async ({ event }: any) => {
      try {
        if (!event || event.type !== "session.idle") return
        const sessionID: string | undefined = event?.properties?.sessionID
        if (!sessionID) return

        const s = states.get(sessionID)
        if (!s || !s.pendingPrompt) return
        s.pendingPrompt = false

        const res = await client?.session?.messages?.({
          path: { id: sessionID },
        })
        const messages = Array.isArray(res?.data) ? res.data : res
        if (!Array.isArray(messages)) return

        let answers = messages.filter(
          (m: any) =>
            m?.info?.role === "assistant" &&
            s.promptMessageID &&
            m.info.parentID === s.promptMessageID,
        )
        if (!answers.length) {
          answers = messages
            .filter((m: any) => m?.info?.role === "assistant")
            .slice(-1)
        }

        const responseText = answers
          .map((m: any) => textOf(m?.parts))
          .filter((t: string) => t.trim())
          .join("\n\n")

        const info = answers[0]?.info
        const model = info
          ? `${info.providerID ?? "?"}/${info.modelID ?? "?"}`
          : s.firstModel
        const iso = new Date().toISOString()
        s.lastISO = iso

        append(
          s,
          entry(
            "RESPONSE",
            s.exchanges,
            sessionID,
            iso,
            model,
            responseText || "(no text response was produced for this turn)",
          ),
        )
        await flush(s)
      } catch (e) {
        await log("error", `session.idle capture failed: ${String(e)}`)
      }
    },
  }
}
