import { Plus, Sparkles, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import {
  createResumeSection,
  deleteResumeSection,
  getResume,
  resumeAI,
  updateResumeSection,
} from "../api.js"

type SectionType = "summary" | "experience" | "education" | "skills" | "projects" | "other"
type Section = {
  id: number
  section_type: SectionType
  title: string | null
  content: string
  order_idx: number
}

const SECTION_TYPES: SectionType[] = ["summary", "experience", "education", "skills", "projects", "other"]
const TYPE_COLOR: Record<SectionType, string> = {
  summary: "bg-violet-500/15 text-violet-400",
  experience: "bg-sky-500/15 text-sky-400",
  education: "bg-emerald-500/15 text-emerald-400",
  skills: "bg-amber-500/15 text-amber-400",
  projects: "bg-rose-500/15 text-rose-400",
  other: "bg-white/10 text-white/50",
}

const field =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-400/60 transition"

export default function Resume() {
  const [sections, setSections] = useState<Section[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editTitle, setEditTitle] = useState("")
  const [dirty, setDirty] = useState(false)
  const [addType, setAddType] = useState<SectionType>("experience")
  const [aiLoading, setAiLoading] = useState<number | null>(null)
  const [aiResult, setAiResult] = useState<{ id: number; text: string; action: string } | null>(null)
  const [jobDesc, setJobDesc] = useState("")
  const [showJobDesc, setShowJobDesc] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getResume()
      .then((d) => setSections(d.sections))
      .catch((e) => setErr(e.message))
  }, [])

  function openEdit(s: Section) {
    setEditing(s.id)
    setEditContent(s.content)
    setEditTitle(s.title ?? "")
    setDirty(false)
    setAiResult(null)
  }

  async function save(id: number) {
    if (!dirty) return
    try {
      const updated = await updateResumeSection(id, { title: editTitle || null, content: editContent })
      setSections((prev) => prev.map((s) => (s.id === id ? updated : s)))
      setDirty(false)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function add() {
    try {
      const s = await createResumeSection({
        section_type: addType,
        title: addType === "other" ? "Custom Section" : null,
        content: "",
        order_idx: sections.length,
      })
      setSections((prev) => [...prev, s])
      openEdit(s)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this section?")) return
    try {
      await deleteResumeSection(id)
      setSections((prev) => prev.filter((s) => s.id !== id))
      if (editing === id) setEditing(null)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function runAI(id: number, action: "improve_bullet" | "tailor") {
    if (dirty) await save(id)
    setAiLoading(id)
    setAiResult(null)
    setErr(null)
    try {
      const r = await resumeAI(id, action, action === "tailor" ? jobDesc : undefined)
      setAiResult({ id, text: r.result, action })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setAiLoading(null)
    }
  }

  function applyAI() {
    if (!aiResult || aiResult.id !== editing) return
    setEditContent(aiResult.text)
    setDirty(true)
    setAiResult(null)
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resume Builder</h1>
        <div className="flex items-center gap-2">
          <select
            value={addType}
            onChange={(e) => setAddType(e.target.value as SectionType)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white outline-none"
          >
            {SECTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={add}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-400"
          >
            <Plus className="size-4" /> Add Section
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {err}
        </div>
      )}

      {sections.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-white/30">
          No sections yet. Add a section to start building your resume.
        </div>
      )}

      <div className="space-y-4">
        {sections.map((s) => {
          const isEditing = editing === s.id
          return (
            <div
              key={s.id}
              className="rounded-xl border border-white/10 bg-white/4 backdrop-blur-sm"
            >
              {/* Section header */}
              <div
                className="flex cursor-pointer items-center gap-3 px-5 py-4"
                onClick={() => (isEditing ? setEditing(null) : openEdit(s))}
              >
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLOR[s.section_type]}`}>
                  {s.section_type}
                </span>
                <span className="flex-1 text-sm font-medium">
                  {s.title || s.section_type.charAt(0).toUpperCase() + s.section_type.slice(1)}
                </span>
                <span className="text-xs text-white/30">{isEditing ? "▲" : "▼"}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(s.id) }}
                  className="cursor-pointer rounded-md p-1.5 text-white/20 hover:bg-red-500/15 hover:text-red-400"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {/* Editor */}
              {isEditing && (
                <div className="border-t border-white/8 px-5 pb-5 pt-4">
                  {(s.section_type === "other" || s.title) && (
                    <input
                      value={editTitle}
                      onChange={(e) => { setEditTitle(e.target.value); setDirty(true) }}
                      placeholder="Section title"
                      className={field + " mb-3"}
                    />
                  )}
                  <textarea
                    value={editContent}
                    onChange={(e) => { setEditContent(e.target.value); setDirty(true) }}
                    placeholder="Enter content…"
                    rows={6}
                    className={field + " resize-y"}
                  />

                  {/* AI result */}
                  {aiResult && aiResult.id === s.id && (
                    <div className="mt-3 rounded-xl border border-violet-500/30 bg-violet-500/8 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-400">
                        <Sparkles className="size-3.5" /> AI · {aiResult.action.replace("_", " ")}
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-white/80 leading-relaxed">{aiResult.text}</p>
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

                  {/* Tailor job description */}
                  {showJobDesc && (
                    <textarea
                      value={jobDesc}
                      onChange={(e) => setJobDesc(e.target.value)}
                      placeholder="Paste the job description here for AI tailoring…"
                      rows={4}
                      className={field + " mt-3 resize-y"}
                    />
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => save(s.id)}
                      disabled={!dirty}
                      className="cursor-pointer rounded-lg bg-violet-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => runAI(s.id, "improve_bullet")}
                      disabled={aiLoading === s.id}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/20 disabled:opacity-50"
                    >
                      <Sparkles className="size-3" /> Improve
                    </button>
                    <button
                      onClick={() => {
                        setShowJobDesc((v) => !v)
                        if (showJobDesc) runAI(s.id, "tailor")
                      }}
                      disabled={aiLoading === s.id}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20 disabled:opacity-50"
                    >
                      <Sparkles className="size-3" /> {showJobDesc ? "Tailor now" : "Tailor to job"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
