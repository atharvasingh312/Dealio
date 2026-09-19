"""
Pydantic v2 schemas for Dealio CRM API.

Separates request (Create/Update) schemas from response schemas
to enforce input validation while controlling serialized output.
"""

from datetime import datetime
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class StageEnum(str, Enum):
    """Valid pipeline stages for a lead."""
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    PROPOSAL = "Proposal"
    WON = "Won"
    LOST = "Lost"


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class LeadCreate(BaseModel):
    """Schema for creating a new lead."""
    name: str = Field(..., min_length=1, max_length=255, description="Contact name")
    company: str = Field(..., min_length=1, max_length=255, description="Company name")
    value: int = Field(default=0, ge=0, description="Deal value in dollars")


class LeadUpdateStage(BaseModel):
    """Schema for updating a lead's pipeline stage."""
    stage: StageEnum


class ActivityCreate(BaseModel):
    """Schema for creating a new activity on a lead."""
    type: Literal["note", "task"] = Field(..., description="Activity type")
    content: str = Field(..., min_length=1, description="Activity content")

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Input content cannot be empty.")
        return v.strip()


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class ActivityResponse(BaseModel):
    """Serialized activity for API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    type: str
    content: str
    is_completed: bool
    created_at: datetime


class AISummaryResponse(BaseModel):
    """Serialized AI summary for API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    background: str
    intent_signal: str
    missing_info: str
    suggested_next_step: Optional[str] = None
    is_stale: bool
    generated_at: datetime


class AISummaryError(BaseModel):
    """Returned when AI summary generation fails."""
    error: str


class LeadResponse(BaseModel):
    """Serialized lead for API responses (list view — no nested relations)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str
    value: int
    stage: str
    created_at: datetime
    updated_at: datetime


class LeadDetailResponse(LeadResponse):
    """Serialized lead for detail view — includes activities and summary."""
    activities: list[ActivityResponse] = []
    ai_summary: Optional[AISummaryResponse] = None
