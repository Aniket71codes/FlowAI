const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

async function req(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: body != null ? { "Content-Type": "application/json" } : {},
    body: body != null ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    const msg = Array.isArray(err.detail)
      ? err.detail.map((e) => e.msg).join("; ")
      : (err.detail ?? `HTTP ${r.status}`)
    throw new Error(msg)
  }
  return r.status === 204 ? null : r.json()
}

// Notes
export const getNotes = () => req("GET", "/notes")
export const createNote = (title, content) => req("POST", "/notes", { title, content })
export const updateNote = (id, title, content) => req("PUT", `/notes/${id}`, { title, content })
export const deleteNote = (id) => req("DELETE", `/notes/${id}`)
export const noteAI = (id, action) => req("POST", `/notes/${id}/ai`, { action })

// Tasks
export const getTasks = () => req("GET", "/tasks")
export const createTask = (data) => req("POST", "/tasks", data)
export const updateTask = (id, data) => req("PUT", `/tasks/${id}`, data)
export const deleteTask = (id) => req("DELETE", `/tasks/${id}`)
export const aiSuggestTasks = (description) => req("POST", "/tasks/ai-suggest", { description })

// Resume
export const getResume = () => req("GET", "/resume")
export const createResumeSection = (data) => req("POST", "/resume/sections", data)
export const updateResumeSection = (id, data) => req("PUT", `/resume/sections/${id}`, data)
export const deleteResumeSection = (id) => req("DELETE", `/resume/sections/${id}`)
export const resumeAI = (sectionId, action, jobDescription) =>
  req("POST", `/resume/sections/${sectionId}/ai`, { action, job_description: jobDescription ?? null })

// Study / Flashcards
export const getFlashcards = (deck) =>
  req("GET", `/study/flashcards${deck ? `?deck=${encodeURIComponent(deck)}` : ""}`)
export const generateFlashcards = (text, deckName) =>
  req("POST", "/study/generate", { text, deck_name: deckName ?? "default" })
export const deleteFlashcard = (id) => req("DELETE", `/study/flashcards/${id}`)
