import json
import logging
import re
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import llm
from .config import get_settings
from .db import Database
from .schemas import (
    NoteAIRequest,
    NoteCreate,
    NoteUpdate,
    ResumeAIRequest,
    ResumeSectionCreate,
    ResumeSectionUpdate,
    StudyGenerateRequest,
    TaskAISuggestRequest,
    TaskCreate,
    TaskUpdate,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

AI_PROMPTS = {
    ("notes", "summarize"): "Summarize the given note in 2-3 concise sentences. Return only the summary, no preamble.",
    ("notes", "improve"): "Improve the writing quality, grammar and clarity of this text. Preserve the original meaning. Return only the improved text, no preamble.",
    ("notes", "expand"): "Expand this note with more context, details and examples. Return only the expanded text, no preamble.",
    ("tasks", "suggest"): (
        "You are a task planner. Given a goal or project description, generate 3-6 specific, actionable tasks. "
        "Respond with ONLY a valid JSON array, no markdown code blocks, no explanation. "
        'Format: [{"title":"...","description":"...","priority":"high|medium|low"}]'
    ),
    ("resume", "improve_bullet"): (
        "You are a resume expert. Improve this resume content: use strong action verbs, quantify results where possible, "
        "be concise and impactful. Return only the improved text, no preamble."
    ),
    ("resume", "tailor"): (
        "You are a resume expert. The user will provide a resume section followed by a job description. "
        "Tailor the resume section to match the job, using relevant keywords and emphasizing matching skills. "
        "Return only the improved section text, no preamble."
    ),
    ("study", "generate"): (
        "Generate 5-8 flashcard question-answer pairs from the provided text. "
        "Respond with ONLY a valid JSON array, no markdown code blocks, no explanation. "
        'Format: [{"question":"...","answer":"..."}]'
    ),
}


def _strip_json_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```[a-z]*\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    return text.strip()


def _ai_call(messages, settings):
    try:
        return llm.complete(messages, settings, {})
    except llm.AllProvidersUnavailable:
        raise HTTPException(status_code=503, detail="AI service unavailable — check LLM_API_KEYS")


def create_app() -> FastAPI:
    settings = get_settings()
    db = Database(settings.db_path)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        db.init()
        llm.setup_cache()
        yield

    app = FastAPI(title="FlowAI", lifespan=lifespan)
    app.state.settings = settings
    app.state.db = db

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(StarletteHTTPException)
    async def http_exc(_: Request, exc: StarletteHTTPException):
        return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_exc(_: Request, exc: RequestValidationError):
        return JSONResponse(
            {"detail": [{"loc": e.get("loc"), "msg": e.get("msg")} for e in exc.errors()]},
            status_code=422,
        )

    @app.exception_handler(Exception)
    async def any_exc(_: Request, exc: Exception):
        logger.exception("unhandled error")
        return JSONResponse({"detail": "internal server error"}, status_code=500)

    # ── Health ────────────────────────────────────────────────────────────────

    @app.get("/health")
    def health():
        if not db.ping():
            raise HTTPException(status_code=503, detail="database not ready")
        return {"status": "ok", "keys_configured": len(settings.api_keys), "app": "FlowAI"}

    # ── Notes ─────────────────────────────────────────────────────────────────

    @app.get("/notes")
    def list_notes():
        return {"notes": db.list_notes()}

    @app.post("/notes", status_code=201)
    def create_note(body: NoteCreate):
        return db.create_note(body.title, body.content)

    @app.get("/notes/{note_id}")
    def get_note(note_id: int):
        note = db.get_note(note_id)
        if not note:
            raise HTTPException(status_code=404, detail="note not found")
        return note

    @app.put("/notes/{note_id}")
    def update_note(note_id: int, body: NoteUpdate):
        note = db.update_note(note_id, body.title, body.content)
        if not note:
            raise HTTPException(status_code=404, detail="note not found")
        return note

    @app.delete("/notes/{note_id}", status_code=204)
    def delete_note(note_id: int):
        if not db.delete_note(note_id):
            raise HTTPException(status_code=404, detail="note not found")

    @app.post("/notes/{note_id}/ai")
    async def note_ai(note_id: int, body: NoteAIRequest):
        note = db.get_note(note_id)
        if not note:
            raise HTTPException(status_code=404, detail="note not found")
        system = AI_PROMPTS[("notes", body.action)]
        messages = [{"role": "system", "content": system}, {"role": "user", "content": note["content"]}]
        result = await run_in_threadpool(_ai_call, messages, settings)
        return {"result": result.reply, "action": body.action}

    # ── Tasks ─────────────────────────────────────────────────────────────────

    @app.get("/tasks")
    def list_tasks():
        return {"tasks": db.list_tasks()}

    @app.post("/tasks/ai-suggest")
    async def tasks_ai_suggest(body: TaskAISuggestRequest):
        system = AI_PROMPTS[("tasks", "suggest")]
        messages = [{"role": "system", "content": system}, {"role": "user", "content": body.description}]
        result = await run_in_threadpool(_ai_call, messages, settings)
        try:
            tasks = json.loads(_strip_json_fences(result.reply))
            if not isinstance(tasks, list):
                raise ValueError
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(status_code=502, detail="AI returned invalid task list")
        return {"tasks": tasks}

    @app.post("/tasks", status_code=201)
    def create_task(body: TaskCreate):
        return db.create_task(body.title, body.description, body.priority, body.due_date)

    @app.put("/tasks/{task_id}")
    def update_task(task_id: int, body: TaskUpdate):
        task = db.update_task(task_id, body.title, body.description, body.priority, body.status, body.due_date)
        if not task:
            raise HTTPException(status_code=404, detail="task not found")
        return task

    @app.delete("/tasks/{task_id}", status_code=204)
    def delete_task(task_id: int):
        if not db.delete_task(task_id):
            raise HTTPException(status_code=404, detail="task not found")

    # ── Resume ────────────────────────────────────────────────────────────────

    @app.get("/resume")
    def get_resume():
        return {"sections": db.list_resume_sections()}

    @app.post("/resume/sections", status_code=201)
    def create_resume_section(body: ResumeSectionCreate):
        return db.create_resume_section(body.section_type, body.title, body.content, body.order_idx)

    @app.put("/resume/sections/{section_id}")
    def update_resume_section(section_id: int, body: ResumeSectionUpdate):
        section = db.update_resume_section(section_id, body.title, body.content)
        if not section:
            raise HTTPException(status_code=404, detail="section not found")
        return section

    @app.delete("/resume/sections/{section_id}", status_code=204)
    def delete_resume_section(section_id: int):
        if not db.delete_resume_section(section_id):
            raise HTTPException(status_code=404, detail="section not found")

    @app.post("/resume/sections/{section_id}/ai")
    async def resume_ai(section_id: int, body: ResumeAIRequest):
        section = db.get_resume_section(section_id)
        if not section:
            raise HTTPException(status_code=404, detail="section not found")
        system = AI_PROMPTS[("resume", body.action)]
        content = section["content"]
        if body.action == "tailor" and body.job_description:
            content = f"RESUME SECTION:\n{content}\n\nJOB DESCRIPTION:\n{body.job_description}"
        messages = [{"role": "system", "content": system}, {"role": "user", "content": content}]
        result = await run_in_threadpool(_ai_call, messages, settings)
        return {"result": result.reply, "action": body.action}

    # ── Study / Flashcards ────────────────────────────────────────────────────

    @app.get("/study/flashcards")
    def list_flashcards(deck: Optional[str] = None):
        return {"flashcards": db.list_flashcards(deck)}

    @app.post("/study/generate")
    async def study_generate(body: StudyGenerateRequest):
        system = AI_PROMPTS[("study", "generate")]
        messages = [{"role": "system", "content": system}, {"role": "user", "content": body.text}]
        result = await run_in_threadpool(_ai_call, messages, settings)
        try:
            cards = json.loads(_strip_json_fences(result.reply))
            if not isinstance(cards, list):
                raise ValueError
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(status_code=502, detail="AI returned invalid flashcard data")
        deck = body.deck_name or "default"
        saved = [
            db.create_flashcard(c["question"], c["answer"], deck)
            for c in cards
            if isinstance(c, dict) and "question" in c and "answer" in c
        ]
        return {"flashcards": saved, "deck": deck}

    @app.delete("/study/flashcards/{card_id}", status_code=204)
    def delete_flashcard(card_id: int):
        if not db.delete_flashcard(card_id):
            raise HTTPException(status_code=404, detail="flashcard not found")

    return app


app = create_app()
