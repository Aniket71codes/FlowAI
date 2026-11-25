import { ArrowRight, Database, KeyRound, Sparkles, Zap } from "lucide-react"

const FEATURES = [
  { icon: KeyRound, title: "Key Failover", desc: "Automatic fallback across your API key pool — no crashes, no blank screens." },
  { icon: Zap, title: "Response Caching", desc: "Identical prompts hit the cache instantly. LLM_CACHE badge shows when it fires." },
  { icon: Database, title: "Session History", desc: "Every conversation is stored in SQLite — full multi-turn memory per session." },
  { icon: Sparkles, title: "Per-Request Metadata", desc: "Latency, tokens, model, key ID and fallback count shown with every reply." },
]

interface Props {
  onStart: () => void
}

export default function Home({ onStart }: Props) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black px-6 text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(120%_120%_at_50%_0%,#000_45%,#5b21b6_100%)]" />

      {/* Badge */}
      <div className="mb-6 flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300">
        <Sparkles className="size-3.5" /> LiteLLM · FastAPI · React · SQLite
      </div>

      {/* Heading */}
      <h1 className="max-w-2xl text-center text-5xl font-bold tracking-tight sm:text-6xl">
        LLM Chatbot with{" "}
        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Key Failover
        </span>
      </h1>
      <p className="mt-5 max-w-xl text-center text-base text-white/55 leading-relaxed">
        Multi-turn AI chat with an automatic key-pool fallback, in-memory response caching,
        and per-request metadata — all shipped in a single Docker Compose stack.
      </p>

      {/* CTA */}
      <button
        onClick={onStart}
        className="group mt-10 flex cursor-pointer items-center gap-2.5 rounded-xl bg-violet-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-400 hover:shadow-violet-400/30"
      >
        Start chatting
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* Feature cards */}
      <div className="mt-20 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm"
          >
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-violet-500/15">
              <Icon className="size-4.5 text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/50">{desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-xs text-white/25">
        Open source · MIT · React + FastAPI + LiteLLM + SQLite
      </p>
    </div>
  )
}
