import { Plus, Sparkles, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { createNote, deleteNote, getNotes, noteAI, updateNote } from "../api.js"

type Note = { id: number; title: string; content: string; updated_at: string }

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const field =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-400/60 transition"

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ text: string; action: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getNotes()
      .then((d) => setNotes(d.notes))
      .catch((e) => setErr(e.message))
  }, [])

  function selectNote(n: Note) {
    setSelected(n.id)
    setTitle(n.title)
    setContent(n.content)
    setDirty(false)
    setAiResult(null)
    setErr(null)
  }

  async function newNote() {
    try {
      const n = await createNote("Untitled", "")
      setNotes((prev) => [n, ...prev])
      selectNote(n)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function save() {
    if (!selected || !dirty) return
    setSaving(true)
    try {
      const updated = await updateNote(selected, title, content)
      setNotes((prev) => prev.map((n) => (n.id === selected ? updated : n)))
      setDirty(false)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!selected) return
    if (!confirm("Delete this note?")) return
    try {
      await deleteNote(selected)
      setNotes((prev) => prev.filter((n) => n.id !== selected))
      setSelected(null)
      setTitle("")
      setContent("")
      setAiResult(null)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function runAI(action: "summarize" | "improve" | "expand") {
    if (!selected) return
    if (dirty) await save()
    setAiLoading(true)
    setAiResult(null)
    setErr(null)
    try {
      const r = await noteAI(selected, action)
      setAiResult({ text: r.result, action })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setAiLoading(false)
    }
  }

  function applyAI() {
    if (!aiResult) return
    setContent(aiResult.text)
    setDirty(true)
    setAiResult(null)
  }

  return (
    <div className="flex h-full">
      {/* Note list */}
      <div className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-black/30">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <span className="text-sm font-semibold">Notes</span>
          <button
            onClick={newNote}
            className="cursor-pointer rounded-md p-1.5 text-violet-400 hover:bg-violet-500/15"
            title="New note"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 && (
            <div className="p-6 text-center text-xs text-white/30">
              No notes yet.
              <br />
              Click + to create one.
            </div>
          )}
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => selectNote(n)}
              className={
                "flex w-full cursor-pointer flex-col border-b border-white/5 px-4 py-3 text-left transition " +
                (selected === n.id ? "bg-violet-500/15" : "hover:bg-white/5")
              }
            >
              <span className="truncate text-sm font-medium">{n.title || "Untitled"}</span>
              <span className="mt-0.5 text-xs text-white/35">{fmt(n.updated_at)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 flex-col min-w-0 p-6">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-white/30 text-sm">
            Select a note or create a new one
          </div>
        ) : (
          <>
            {err && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {err}
              </div>
            )}

            {/* Title */}
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
              placeholder="Note title"
              className="mb-3 w-full border-0 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/20"
            />

            {/* Content */}
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setDirty(true) }}
              placeholder="Start writing…"
              className="flex-1 min-h-[200px] resize-none bg-transparent text-sm text-white/85 outline-none placeholder:text-white/20 leading-relaxed"
            />

            {/* AI result */}
            {aiResult && (
              <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/8 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-400">
                  <Sparkles className="size-3.5" /> AI · {aiResult.action}
                </div>
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{aiResult.text}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={applyAI}
                    className="cursor-pointer rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-400"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setAiResult(null)}
                    className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="cursor-pointer rounded-lg bg-violet-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-400 disabled:cursor-default disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>

              <div className="flex items-center gap-1 ml-auto">
                {(["summarize", "improve", "expand"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => runAI(a)}
                    disabled={aiLoading}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/20 disabled:opacity-50"
                  >
                    <Sparkles className="size-3" />
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                ))}
                <button
                  onClick={remove}
                  className="ml-1 cursor-pointer rounded-lg border border-red-500/20 bg-red-500/8 p-1.5 text-red-400 hover:bg-red-500/20"
                  title="Delete note"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
