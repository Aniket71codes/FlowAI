from typing import Literal, Optional

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(default="")


class NoteUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str


class NoteAIRequest(BaseModel):
    action: Literal["summarize", "improve", "expand"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Literal["low", "medium", "high"] = "medium"
    due_date: Optional[str] = None


class TaskUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Literal["low", "medium", "high"] = "medium"
    status: Literal["todo", "in_progress", "done"] = "todo"
    due_date: Optional[str] = None


class TaskAISuggestRequest(BaseModel):
    description: str = Field(min_length=5, max_length=2000)


class ResumeSectionCreate(BaseModel):
    section_type: Literal["summary", "experience", "education", "skills", "projects", "other"]
    title: Optional[str] = None
    content: str = Field(default="")
    order_idx: int = 0


class ResumeSectionUpdate(BaseModel):
    title: Optional[str] = None
    content: str


class ResumeAIRequest(BaseModel):
    action: Literal["improve_bullet", "tailor"]
    job_description: Optional[str] = None


class StudyGenerateRequest(BaseModel):
    text: str = Field(min_length=50, max_length=5000)
    deck_name: Optional[str] = Field(default="default", max_length=100)
