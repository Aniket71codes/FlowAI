import { ChevronLeft, ChevronRight, GraduationCap, Sparkles, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { deleteFlashcard, generateFlashcards, getFlashcards } from "../api.js"

type Card = { id: number; question: string; answer: string; deck_name: string }

const field =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-400/60 transition"

export default function Study() {
  const [cards, setCards] = useState<Card[]>([])
  const [inputText, setInputText] = useState("")
  const [deckName, setDeckName] = useState("default")
  const [loading, setLoading] = useState(false)
  const [studyMode, setStudyMode] = useState(false)
  const [studyIdx, setStudyIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getFlashcards()
      .then((d) => setCards(d.flashcards))
      .catch((e) => setErr(e.message))
  }, [])

  async function generate() {
    if (!inputText.trim() || inputText.trim().length < 50) {
      setErr("Please enter at least 50 characters of text to generate flashcards.")
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const r = await generateFlashcards(inputText.trim(), deckName || "default")
      setCards((prev) => [...r.flashcards, ...prev])
      setInputText("")
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: number) {
    try {
      await deleteFlashcard(id)
      setCards((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  function startStudy() {
    if (cards.length === 0) return
    setStudyIdx(0)
    setFlipped(false)
    setStudyMode(true)
  }

  function next() {
    setFlipped(false)
    setTimeout(() => setStudyIdx((i) => (i + 1) % cards.length), 150)
  }

  function prev() {
    setFlipped(false)
    setTimeout(() => setStudyIdx((i) => (i - 1 + cards.length) % cards.length), 150)
  }

  if (studyMode && cards.length > 0) {
    const c = cards[studyIdx]
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="mb-6 flex w-full max-w-lg items-center justify-between">
          <span className="text-sm text-white/50">
            {studyIdx + 1} / {cards.length}
          </span>
          <span className="text-sm font-medium text-white/60">🧠 Study Mode</span>
          <button
            onClick={() => setStudyMode(false)}
            className="cursor-pointer rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Flip card */}
        <div className="flashcard w-full max-w-lg" style={{ height: 260 }}>
          <div
            className={`flashcard-inner h-full w-full cursor-pointer ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped((f) => !f)}
          >
            {/* Front */}
            <div className="flashcard-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/6 p-8 text-center backdrop-blur-sm">
              <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-400">Question</span>
              <p className="text-lg font-medium leading-relaxed">{c.question}</p>
              <p className="mt-4 text-xs text-white/30">Tap to reveal answer</p>
            </div>

            {/* Back */}
            <div className="flashcard-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-8 text-center backdrop-blur-sm">
              <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Answer</span>
              <p className="text-base leading-relaxed text-white/90">{c.answer}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={prev}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => setFlipped((f) => !f)}
            className="cursor-pointer rounded-xl border border-violet-500/30 bg-violet-500/15 px-6 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/25"
          >
            Flip
          </button>
          <button
            onClick={next}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <p className="mt-4 text-xs text-white/25">Use arrow keys or tap the card to flip</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Study</h1>
        {cards.length > 0 && (
          <button
            onClick={startStudy}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
          >
            <GraduationCap className="size-4" /> Study {cards.length} cards
          </button>
        )}
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {err}
        </div>
      )}

      {/* Generate */}
      <div className="mb-8 rounded-xl border border-white/10 bg-white/4 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-violet-400" /> Generate Flashcards from Text
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste any text, notes, article or lecture content (min 50 characters)…"
          rows={5}
          className={field + " resize-y"}
        />
        <div className="mt-3 flex items-center gap-3">
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Deck name"
            className={field + " max-w-[160px]"}
          />
          <button
            onClick={generate}
            disabled={loading}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-violet-500 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {/* Flashcard grid */}
      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-white/30">
          No flashcards yet. Paste some text above to generate your first set.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-white/35">{cards.length} flashcard{cards.length !== 1 ? "s" : ""}</p>
          {cards.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-white/8 bg-white/4 px-5 py-4 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90">{c.question}</p>
                  <p className="mt-1.5 text-sm text-white/50">{c.answer}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs text-white/35">
                    {c.deck_name}
                  </span>
                  <button
                    onClick={() => remove(c.id)}
                    className="cursor-pointer rounded-md p-1.5 text-white/20 hover:bg-red-500/15 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
