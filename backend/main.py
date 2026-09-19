"""
Dealio CRM — FastAPI Backend

A lightweight B2B CRM API with Gemini-powered AI summaries.
Provides endpoints for managing leads, activities, and cached AI insights.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from ai_service import generate_summary
from database import Base, engine, get_db
from models import Activity, AISummary, Lead
from schemas import (
    ActivityCreate,
    ActivityResponse,
    AISummaryError,
    AISummaryResponse,
    LeadCreate,
    LeadDetailResponse,
    LeadResponse,
    LeadUpdateStage,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Application lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup and apply minor schema migrations."""
    Base.metadata.create_all(bind=engine)
    try:
        with engine.connect() as conn:
            cols = [r[1] for r in conn.execute(text("PRAGMA table_info(ai_summaries)")).fetchall()]
            if cols and "suggested_next_step" not in cols:
                conn.execute(text("ALTER TABLE ai_summaries ADD COLUMN suggested_next_step TEXT"))
                conn.commit()
                logger.info("Migrated ai_summaries: added suggested_next_step column.")
    except Exception as e:
        logger.warning(f"Schema migration check skipped or failed: {e}")
    logger.info("Database tables created/verified successfully.")
    yield


app = FastAPI(
    title="Dealio CRM API",
    description="B2B CRM backend with Gemini AI-powered lead summaries",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js frontend
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _get_lead_or_404(lead_id: int, db: Session) -> Lead:
    """Fetch a lead by ID or raise a 404."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found.",
        )
    return lead


def _mark_summary_stale(lead_id: int, db: Session) -> None:
    """Mark the cached AI summary as stale (if it exists)."""
    summary = db.query(AISummary).filter(AISummary.lead_id == lead_id).first()
    if summary:
        summary.is_stale = True
        db.commit()


# ---------------------------------------------------------------------------
# Lead endpoints
# ---------------------------------------------------------------------------

@app.get("/leads/", response_model=list[LeadResponse])
def list_leads(db: Session = Depends(get_db)):
    """Return all leads ordered by most recently updated."""
    return db.query(Lead).order_by(Lead.updated_at.desc()).all()


@app.post("/leads/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    """Create a new lead."""
    lead = Lead(
        name=payload.name,
        company=payload.company,
        value=payload.value,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    logger.info(f"Created lead: {lead}")
    return lead


@app.get("/leads/{lead_id}", response_model=LeadDetailResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    """Return a single lead with its activities and cached AI summary."""
    lead = _get_lead_or_404(lead_id, db)
    return lead


@app.patch("/leads/{lead_id}/stage", response_model=LeadResponse)
def update_lead_stage(
    lead_id: int, payload: LeadUpdateStage, db: Session = Depends(get_db)
):
    """Update a lead's pipeline stage and mark AI summary as stale."""
    lead = _get_lead_or_404(lead_id, db)
    lead.stage = payload.stage.value
    _mark_summary_stale(lead_id, db)
    db.commit()
    db.refresh(lead)
    logger.info(f"Updated lead {lead_id} stage to '{lead.stage}'")
    return lead


# ---------------------------------------------------------------------------
# Activity endpoints
# ---------------------------------------------------------------------------

@app.post(
    "/leads/{lead_id}/activities",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_activity(
    lead_id: int, payload: ActivityCreate, db: Session = Depends(get_db)
):
    """Add an activity to a lead and mark AI summary as stale."""
    _get_lead_or_404(lead_id, db)  # Ensure lead exists

    activity = Activity(
        lead_id=lead_id,
        type=payload.type,
        content=payload.content,
    )
    db.add(activity)
    _mark_summary_stale(lead_id, db)
    db.commit()
    db.refresh(activity)
    logger.info(f"Created {activity.type} for lead {lead_id}")
    return activity


@app.patch("/activities/{activity_id}/toggle", response_model=ActivityResponse)
def toggle_activity(activity_id: int, db: Session = Depends(get_db)):
    """Toggle the completion status of a task activity."""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activity with id {activity_id} not found.",
        )
    if activity.type != "task":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only task activities can be toggled.",
        )
    activity.is_completed = not activity.is_completed
    db.commit()
    db.refresh(activity)
    logger.info(f"Toggled activity {activity_id} to completed={activity.is_completed}")
    return activity


# ---------------------------------------------------------------------------
# AI Summary endpoint
# ---------------------------------------------------------------------------

@app.post("/leads/{lead_id}/summary", response_model=AISummaryResponse | AISummaryError)
async def get_or_generate_summary(lead_id: int, db: Session = Depends(get_db)):
    """
    Return the cached AI summary if fresh, otherwise generate a new one.

    - If no summary exists → call Gemini, cache result, return it.
    - If summary exists and is_stale=False → return cached version.
    - If summary exists and is_stale=True → call Gemini, update cache, return it.
    - On Gemini failure → return {"error": "..."} with HTTP 200.
    """
    lead = _get_lead_or_404(lead_id, db)

    # Check for cached, fresh summary
    existing = db.query(AISummary).filter(AISummary.lead_id == lead_id).first()
    if existing and not existing.is_stale:
        logger.info(f"Returning cached summary for lead {lead_id}")
        return existing

    # Generate new summary via Gemini
    result = await generate_summary(lead, lead.activities)

    # Handle AI error
    if "error" in result:
        return result

    # Upsert the summary
    if existing:
        existing.background = result["background"]
        existing.intent_signal = result["intent_signal"]
        existing.missing_info = result["missing_info"]
        existing.suggested_next_step = result.get("suggested_next_step")
        existing.is_stale = False
    else:
        existing = AISummary(
            lead_id=lead_id,
            background=result["background"],
            intent_signal=result["intent_signal"],
            missing_info=result["missing_info"],
            suggested_next_step=result.get("suggested_next_step"),
        )
        db.add(existing)

    db.commit()
    db.refresh(existing)
    logger.info(f"Generated and cached new summary for lead {lead_id}")
    return existing
