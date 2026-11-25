import { useEffect, useRef, useState } from "react"
import {
  ArrowUp,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Cpu,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Waypoints,
} from "lucide-react"
import { sendChat } from "./api.js"

type Meta = {
  resolution_source: string
  model: string
  latency_ms: number
  input_tokens: number
  output_tokens: number
  key_id: string | null
  fallback_attempts: number
}
type Msg = { role: "user" | "assistant" | "error"; content: string; metadata?: Meta }

const newSid = () =>
  "s-" + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(16).slice(2, 10))

const PROMPTS = [
  { icon: BrainCircuit, title: "Neural networks", body: "Explain how a neural network learns step by step." },
  { icon: Waypoints, title: "Blockchain", body: "How does blockchain achieve decentralized trust?" },
  { icon: Cpu, title: "Quantum computing", body: "What makes quantum computers different from classical ones?" },
  { icon: BookOpen, title: "Big Bang theory", body: "Summarize the Big Bang theory and what came before it." },
]

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ring-1 ${color}`}>
      {children}
    </span>
  )
}

function MetaRow({ m }: { m: Meta }) {
  const hit = m.resolution_source === "LLM_CACHE"
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-2.5 text-[11px] text-zinc-500">
      {hit ? (
        <Badge color="bg-amber-400/10 text-amber-300 ring-amber-400/20">
          <span data-testid="meta-source">LLM_CACHE</span>
        </Badge>
      ) : (
        <Badge color="bg-emerald-400/10 text-emerald-300 ring-emerald-400/20">
          <span data-testid="meta-source">LIVE_INFERENCE</span>
        </Badge>
      )}
      <span data-testid="meta-model" className="font-mono text-zinc-400">{m.model.split("/").pop()}</span>
      <span>·</span>
      <span><span data-testid="meta-latency">{m.latency_ms}</span> ms</span>
      <span>·</span>
      <span><span data-testid="meta-input-tokens">{m.input_tokens}</span>↑ <span data-testid="meta-output-tokens">{m.output_tokens}</span>↓ tokens</span>
      {m.key_id && <><span>·</span><span className="text-zinc-600">{m.key_id} · {m.fallback_attempts} fb</span></>}
    </div>
  )
}

export default function Chat() {
  const [sid, setSid] = useState(newSid)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [sysPrompt, setSysPrompt] = useState("")
  const [simulate, setSimulate] = useState("")
  const [busy, setBusy] = useState(false)
  const [sideOpen, setSideOpen] = useState(() => window.innerWidth >= 900)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const hasMessages = msgs.length > 0

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs, busy])

  useEffect(() => {
    if (!hasMessages) textRef.current?.focus()
  }, [hasMessages])

  async function send(override?: string) {
    const text = (override ?? input).trim()
    if (!text || busy) return
    setInput("")
    setMsgs((m) => [...m, { role: "user", content: text }])
    setBusy(true)
    try {
      const d = await sendChat({ sessionId: sid, message: text, systemPrompt: sysPrompt, simulate })
      setMsgs((m) => [...m, { role: "assistant", content: d.reply, metadata: d.metadata }])
    } catch (e) {
      setMsgs((m) => [...m, { role: "error", content: (e as Error).message }])
    } finally {
      setBusy(false)
    }
  }

  function newChat() {
    setMsgs([])
    setInput("")
    setSid(newSid())
    textRef.current?.focus()
  }

  const field = "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition"

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0c0c0f] text-white">

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className={
          "flex shrink-0 flex-col border-r border-white/[0.06] bg-[#111116] transition-[width] duration-300 overflow-hidden " +
          (sideOpen ? "w-[260px]" : "w-0 border-r-0")
        }
      >
        {/* Brand */}
        <div className="flex w-[260px] items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-violet-500/20">
              <BrainCircuit className="size-4 text-violet-400" />
            </div>
            <span className="text-sm font-semibold tracking-tight">LLM Chat</span>
          </div>
          <button
            onClick={() => setSideOpen(false)}
            className="cursor-pointer rounded-md p-1.5 text-zinc-600 hover:text-zinc-300 transition"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        {/* New chat */}
        <div className="w-[260px] px-3 pb-4">
          <button
            onClick={newChat}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.07] hover:text-white hover:border-white/[0.14]"
          >
            <MessageSquarePlus className="size-4 text-violet-400" />
            New conversation
          </button>
        </div>

        {/* Settings */}
        <div className="w-[260px] flex-1 overflow-y-auto px-3">
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition"
          >
            Settings
            {settingsOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>

          {settingsOpen && (
            <div className="mt-2 space-y-3">
              <label className="block text-xs text-zinc-500">
                System prompt
                <textarea
                  data-testid="system-prompt-input"
                  value={sysPrompt}
                  onChange={(e) => setSysPrompt(e.target.value)}
                  rows={4}
                  placeholder="You are a helpful assistant."
                  className={field + " mt-1.5 resize-none font-mono text-xs"}
                />
              </label>
              <label className="block text-xs text-zinc-500">
                Simulate failure
                <input
                  value={simulate}
                  onChange={(e) => setSimulate(e.target.value)}
                  placeholder="key_1=429  or  *=429"
                  className={field + " mt-1.5 font-mono text-xs"}
                />
                <span className="mt-1 block text-[10px] text-zinc-700">
                  Sends X-Simulate-Failure header
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="w-[260px] border-t border-white/[0.05] px-4 py-3">
          <div className="font-mono text-[10px] text-zinc-700 truncate">session {sid}</div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Top bar */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.05] px-4">
          {!sideOpen && (
            <button
              onClick={() => setSideOpen(true)}
              className="cursor-pointer rounded-md p-1.5 text-zinc-600 hover:text-zinc-300 transition"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          )}
          {!sideOpen && (
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded bg-violet-500/20">
                <BrainCircuit className="size-3 text-violet-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-300">LLM Chat</span>
            </div>
          )}
          {hasMessages && (
            <button
              onClick={newChat}
              className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.07] transition"
            >
              <MessageSquarePlus className="size-3.5" /> New
            </button>
          )}
        </div>

        {/* Messages / empty state */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {!hasMessages ? (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
              <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/20">
                <BrainCircuit className="size-6 text-violet-400" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">What's on your mind?</h1>
              <p className="mt-2 text-sm text-zinc-500">Ask anything — I remember our full conversation.</p>

              <div className="mt-8 grid w-full max-w-xl grid-cols-2 gap-2.5">
                {PROMPTS.map(({ icon: Icon, title, body }) => (
                  <button
                    key={title}
                    onClick={() => send(body)}
                    className="group cursor-pointer rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-left transition hover:border-violet-500/30 hover:bg-violet-500/[0.06]"
                  >
                    <Icon className="mb-2.5 size-4 text-zinc-500 group-hover:text-violet-400 transition" />
                    <div className="text-xs font-semibold text-zinc-300 group-hover:text-white transition">{title}</div>
                    <div className="mt-0.5 text-[11px] text-zinc-600 leading-relaxed">{body}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
              {msgs.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-violet-600 to-violet-800 px-4 py-3 text-sm leading-relaxed shadow-lg shadow-violet-900/20">
                      {m.content}
                    </div>
                  </div>
                ) : m.role === "error" ? (
                  <div
                    key={i}
                    role="alert"
                    className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400"
                  >
                    {m.content}
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div
                      data-testid="assistant-message"
                      className="max-w-[88%] rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.04] px-5 py-4 text-sm leading-relaxed text-zinc-200 shadow-sm"
                    >
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                      {m.metadata && <MetaRow m={m.metadata} />}
                    </div>
                  </div>
                )
              )}

              {busy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.04] px-5 py-4">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="size-1.5 animate-bounce rounded-full bg-zinc-500"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-white/[0.05] px-4 py-4">
          <div className="mx-auto w-full max-w-2xl">
            <div className="flex items-end gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 shadow-sm transition focus-within:border-violet-500/40 focus-within:bg-white/[0.06]">
              <textarea
                ref={textRef}
                data-testid="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
                }}
                rows={1}
                placeholder="Message…"
                className="flex-1 resize-none bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                style={{ maxHeight: 160, overflowY: "auto" }}
                onInput={(e) => {
                  const t = e.currentTarget
                  t.style.height = "auto"
                  t.style.height = Math.min(t.scrollHeight, 160) + "px"
                }}
              />
              <button
                data-testid="send-button"
                onClick={() => send()}
                disabled={busy || !input.trim()}
                className="flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-violet-500 p-2.5 text-white shadow-md transition hover:bg-violet-400 disabled:cursor-default disabled:opacity-35"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-zinc-700">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
