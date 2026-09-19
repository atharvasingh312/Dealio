"""
SQLAlchemy ORM models for Dealio CRM.

Defines three tables:
- leads: B2B lead/contact records
- activities: Notes and tasks linked to leads
- ai_summaries: Cached Gemini AI summaries with staleness tracking
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def _utc_now() -> datetime:
    """Return the current UTC timestamp."""
    return datetime.now(timezone.utc)


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[int] = mapped_column(Integer, default=0)
    stage: Mapped[str] = mapped_column(String(50), default="New")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utc_now, onupdate=_utc_now
    )

    # Relationships
    activities: Mapped[list["Activity"]] = relationship(
        "Activity", back_populates="lead", cascade="all, delete-orphan",
        order_by="Activity.created_at.desc()"
    )
    ai_summary: Mapped["AISummary | None"] = relationship(
        "AISummary", back_populates="lead", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Lead(id={self.id}, name='{self.name}', stage='{self.stage}')>"


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lead_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # "note" or "task"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utc_now
    )

    # Relationships
    lead: Mapped["Lead"] = relationship("Lead", back_populates="activities")

    def __repr__(self) -> str:
        return f"<Activity(id={self.id}, type='{self.type}', lead_id={self.lead_id})>"


class AISummary(Base):
    """
    Cached AI-generated summary for a lead.

    The `is_stale` flag is set to True whenever the lead's stage changes
    or a new activity is added. The summary endpoint checks this flag
    to decide whether to call Gemini or return the cached version.
    """
    __tablename__ = "ai_summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lead_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    background: Mapped[str] = mapped_column(Text, nullable=False)
    intent_signal: Mapped[str] = mapped_column(String(255), nullable=False)
    missing_info: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_next_step: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_stale: Mapped[bool] = mapped_column(Boolean, default=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utc_now
    )

    # Relationships
    lead: Mapped["Lead"] = relationship("Lead", back_populates="ai_summary")

    def __repr__(self) -> str:
        return f"<AISummary(id={self.id}, lead_id={self.lead_id}, stale={self.is_stale})>"
