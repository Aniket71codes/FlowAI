import { BookOpen, FileText, FileUser, SquareCheckBig } from "lucide-react"
import { useEffect, useState } from "react"
import { getNotes } from "../api.js"
import { getTasks } from "../api.js"
import { getResume } from "../api.js"
import { getFlashcards } from "../api.js"
import type { Route } from "../Root"

interface Props {
  navigate: (r: Route) => void
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-rose-400",
  medium: "text-amber-400",
  low: "text-sky-400",
}

const STATUS_COLOR: Record<string, string> = {
  todo: "bg-white/10 text-white/60",
  in_progress: "bg-amber-500/15 text-amber-300",
  done: "bg-emerald-500/15 text-emerald-300",
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export default function Dashboard({ navigate }: Props) {
  const [notes, setNotes] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])

  useEffect(() => {
    getNotes().then((d) => setNotes(d.notes)).catch(() => {})
    getTasks().then((d) => setTasks(d.tasks)).catch(() => {})
    getResume().then((d) => setSections(d.sections)).catch(() => {})
    getFlashcards().then((d) => setCards(d.flashcards)).catch(() => {})
  }, [])

  const pending = tasks.filter((t) => t.status !== "done")
  const done = tasks.filter((t) => t.status === "done")

  const stats = [
    { label: "Notes", value: notes.length, icon: FileText, color: "text-violet-400", route: "notes" as Route },
    { label: "Tasks pending", value: pending.length, icon: SquareCheckBig, color: "text-amber-400", route: "tasks" as Route },
    { label: "Resume sections", value: sections.length, icon: FileUser, color: "text-sky-400", route: "resume" as Route },
    { label: "Flashcards", value: cards.length, icon: BookOpen, color: "text-emerald-400", route: "study" as Route },
  ]

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Good day! 👋</h1>
        <p className="mt-1 text-sm text-white/50">Here's what's on your plate.</p>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, route }) => (
          <button
            key={label}
            onClick={() => navigate(route)}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-sm transition hover:border-white/20 hover:bg-white/8"
          >
            <Icon className={`mb-2 size-5 ${color}`} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="mt-0.5 text-xs text-white/50">{label}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Recent Notes */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/70">Recent Notes</h2>
            <button
              onClick={() => navigate("notes")}
              className="cursor-pointer text-xs text-violet-400 hover:text-violet-300"
            >
              View all →
            </button>
          </div>
          {notes.length === 0 ? (
            <div
              className="cursor-pointer rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/30 hover:border-violet-500/30"
              onClick={() => navigate("notes")}
            >
              No notes yet — create your first one
            </div>
          ) : (
            <div className="space-y-2">
              {notes.slice(0, 4).map((n) => (
                <button
                  key={n.id}
                  onClick={() => navigate("notes")}
                  className="flex w-full cursor-pointer items-start justify-between rounded-lg border border-white/8 bg-white/4 px-4 py-3 text-left transition hover:border-white/15 hover:bg-white/7"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{n.title}</div>
                    <div className="mt-0.5 truncate text-xs text-white/40">
                      {n.content.slice(0, 60) || "Empty note"}
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 text-xs text-white/30">{fmt(n.updated_at)}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Pending Tasks */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/70">Pending Tasks</h2>
            <button
              onClick={() => navigate("tasks")}
              className="cursor-pointer text-xs text-violet-400 hover:text-violet-300"
            >
              View all →
            </button>
          </div>
          {pending.length === 0 ? (
            <div
              className="cursor-pointer rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/30 hover:border-violet-500/30"
              onClick={() => navigate("tasks")}
            >
              {done.length > 0 ? "All tasks done! 🎉" : "No tasks yet — add your first one"}
            </div>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/4 px-4 py-3"
                >
                  <span className={`shrink-0 text-xs font-semibold ${PRIORITY_COLOR[t.priority] ?? ""}`}>
                    {t.priority.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[t.status] ?? ""}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <div className="mt-10 flex flex-wrap gap-3">
        {[
          { label: "✏️  New note", route: "notes" as Route },
          { label: "✅  Add task", route: "tasks" as Route },
          { label: "📄  Edit resume", route: "resume" as Route },
          { label: "🧠  Study flashcards", route: "study" as Route },
        ].map(({ label, route }) => (
          <button
            key={route}
            onClick={() => navigate(route)}
            className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
