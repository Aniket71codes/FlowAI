# FlowAI — AI Productivity Platform

React + FastAPI + LiteLLM + SQLite. Four tools in one app: AI-powered Notes, Task Manager, Resume Builder, and Study Flashcards. Runs entirely locally with Docker or without.

## Live URLs

- Frontend: `<TODO: deployed frontend URL>`
- Backend: `<TODO: deployed backend URL>` (try `/health`)
- Repo: `<TODO: GitHub URL>`

## Run locally

### With Docker
```bash
cp .env.example .env      # add your OpenRouter key(s) to LLM_API_KEYS
make up                   # backend :8000, frontend :3000
make down
```

### Without Docker
```bash
# backend (Python 3.12)
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
export LLM_API_KEYS=sk-or-v1-your-key DATABASE_URL=sqlite:///./flowai.db
uvicorn app.main:app --port 8000

# frontend
cd Frontend && npm install && npm run dev   # :3000
```

## Features

| Module | Capabilities |
|--------|-------------|
| **Notes** | Create / edit / delete notes. AI: Summarize · Improve · Expand |
| **Tasks** | To-do list with priorities & statuses. AI suggests tasks from a goal description |
| **Resume** | Add sections (summary, experience, education, skills, projects). AI: Improve · Tailor to job description |
| **Study** | Paste any text → AI generates flashcards. Interactive flip-card study mode |

## API Routes

```
GET  /health
GET  /notes              POST /notes
GET  /notes/:id          PUT /notes/:id    DELETE /notes/:id
POST /notes/:id/ai       {action: "summarize"|"improve"|"expand"}

GET  /tasks              POST /tasks
POST /tasks/ai-suggest   {description}
PUT  /tasks/:id          DELETE /tasks/:id

GET  /resume             POST /resume/sections
PUT  /resume/sections/:id    DELETE /resume/sections/:id
POST /resume/sections/:id/ai {action: "improve_bullet"|"tailor", job_description?}

GET  /study/flashcards   POST /study/generate    DELETE /study/flashcards/:id
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LLM_API_KEYS` | Comma-separated OpenRouter API keys (key pool with failover) |
| `DATABASE_URL` | SQLite URL, e.g. `sqlite:////data/flowai.db` |
| `ALLOWED_ORIGINS` | CORS origins |
| `LLM_MODEL` | LiteLLM model, e.g. `openrouter/google/gemini-flash-lite` |
| `VITE_API_URL` | Frontend build-time backend URL |

## Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS v4, Lucide icons
- **Backend**: FastAPI, LiteLLM (key pool + response cache), SQLite (stdlib)
- **AI**: Any OpenRouter model via LiteLLM key failover
