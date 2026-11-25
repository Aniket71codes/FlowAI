import { ChevronDown, ChevronUp, Plus, Sparkles, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { aiSuggestTasks, createTask, deleteTask, getTasks, updateTask } from "../api.js"

type Priority = "low" | "medium" | "high"
type Status = "todo" | "in_progress" | "done"
type Task = {
  id: number
  title: string
  description: string | null
  priority: Priority
  status: Status
  due_date: string | null
}

const PRIORITY_BADGE: Record<Priority, string> = {
  high: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  low: "bg-sky-500/15 text-sky-400 border-sky-500/25",
}
const STATUS_NEXT: Record<Status, Status> = { todo: "in_progress", in_progress: "done", done: "todo" }
const STATUS_LABEL: Record<Status, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" }
const STATUS_STYLE: Record<Status, string> = {
  todo: "bg-white/8 text-white/55",
  in_progress: "bg-amber-500/15 text-amber-300",
  done: "bg-emerald-500/15 text-emerald-300",
}

type Filter = "all" | Status

const field =
  "rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-400/60 transition"

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [newTitle, setNewTitle] = useState("")
  const [newPriority, setNewPriority] = useState<Priority>("medium")
  const [aiOpen, setAiOpen] = useState(false)
  const [aiDesc, setAiDesc] = useState("")
  const [suggested, setSuggested] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getTasks()
      .then((d) => setTasks(d.tasks))
      .catch((e) => setErr(e.message))
  }, [])

  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setErr(null)
    try {
      const t = await createTask({ title: newTitle.trim(), priority: newPriority })
      setTasks((prev) => [t, ...prev])
      setNewTitle("")
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function cycle(task: Task) {
    try {
      const updated = await updateTask(task.id, { ...task, status: STATUS_NEXT[task.status] })
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function remove(id: number) {
    try {
      await deleteTask(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function suggest() {
    if (!aiDesc.trim()) return
    setAiLoading(true)
    setErr(null)
    setSuggested([])
    try {
      const r = await aiSuggestTasks(aiDesc.trim())
      setSuggested(r.tasks)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

  async function addSuggested(s: any) {
    try {
      const t = await createTask({ title: s.title, description: s.description, priority: s.priority ?? "medium" })
      setTasks((prev) => [t, ...prev])
      setSuggested((prev) => prev.filter((x) => x !== s))
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <span className="text-sm text-white/40">{tasks.filter((t) => t.status !== "done").length} pending</span>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {err}
        </div>
      )}

      {/* Add task */}
      <form onSubmit={add} className="mb-6 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task…"
          className={field + " flex-1"}
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as Priority)}
          className={field + " w-28"}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
        >
          <Plus className="size-4" /> Add
        </button>
      </form>

      {/* AI Suggest */}
      <div className="mb-6 rounded-xl border border-white/10 bg-white/4 backdrop-blur-sm">
        <button
          onClick={() => setAiOpen((o) => !o)}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-white/70 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-400" /> AI Task Suggestions
          </span>
          {aiOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {aiOpen && (
          <div className="border-t border-white/8 p-4">
            <div className="flex gap-2">
              <textarea
                value={aiDesc}
                onChange={(e) => setAiDesc(e.target.value)}
                placeholder="Describe your goal, e.g. 'Launch a personal blog this weekend'"
                rows={2}
                className={field + " flex-1 resize-none"}
              />
              <button
                onClick={suggest}
                disabled={aiLoading}
                className="flex cursor-pointer items-center gap-1.5 self-start rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
              >
                {aiLoading ? "…" : "Generate"}
              </button>
            </div>

            {suggested.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-white/40">Click + to add tasks to your list</p>
                {suggested.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-violet-500/20 bg-violet-500/8 px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{s.title}</div>
                      {s.description && (
                        <div className="mt-0.5 text-xs text-white/45">{s.description}</div>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[s.priority as Priority] ?? PRIORITY_BADGE.medium}`}
                    >
                      {s.priority}
                    </span>
                    <button
                      onClick={() => addSuggested(s)}
                      className="cursor-pointer shrink-0 rounded-md bg-violet-500 p-1 text-white hover:bg-violet-400"
                      title="Add to tasks"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-white/8 bg-white/4 p-1">
        {(["all", "todo", "in_progress", "done"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "flex-1 cursor-pointer rounded-md py-1.5 text-xs font-medium transition " +
              (filter === f ? "bg-violet-500/20 text-violet-300" : "text-white/50 hover:text-white")
            }
          >
            {f === "all" ? "All" : STATUS_LABEL[f as Status]}
          </button>
        ))}
      </div>

      {/* Task list */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/30">
          {filter === "all" ? "No tasks yet" : `No ${STATUS_LABEL[filter as Status]} tasks`}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3 backdrop-blur-sm"
            >
              <button
                onClick={() => cycle(t)}
                className={`shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition hover:opacity-80 ${STATUS_STYLE[t.status]}`}
                title="Click to advance status"
              >
                {STATUS_LABEL[t.status]}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${t.status === "done" ? "line-through text-white/40" : ""}`}>
                  {t.title}
                </div>
                {t.description && (
                  <div className="mt-0.5 text-xs text-white/35 truncate">{t.description}</div>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[t.priority]}`}
              >
                {t.priority}
              </span>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 cursor-pointer rounded-md p-1.5 text-white/25 hover:bg-red-500/15 hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
