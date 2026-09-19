"""
Seed script for Dealio CRM.

Populates the database with realistic B2B demo data.
Idempotent — only seeds if the leads table is empty.
"""

from database import Base, SessionLocal, engine
from models import Activity, Lead


def seed():
    """Populate the database with sample leads and activities."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Skip if data already exists
        if db.query(Lead).count() > 0:
            print("Database already seeded. Skipping.")
            return

        leads_data = [
            {
                "name": "Sarah Chen",
                "company": "Acme Technologies",
                "value": 75000,
                "stage": "Qualified",
                "activities": [
                    {"type": "note", "content": "Initial discovery call completed. Strong interest in enterprise plan."},
                    {"type": "task", "content": "Send product comparison deck", "is_completed": True},
                    {"type": "note", "content": "CTO wants a technical deep-dive on API integrations."},
                    {"type": "task", "content": "Schedule technical demo with engineering team", "is_completed": False},
                ],
            },
            {
                "name": "Marcus Rivera",
                "company": "GlobalSync Inc.",
                "value": 120000,
                "stage": "Proposal",
                "activities": [
                    {"type": "note", "content": "Met at SaaS Connect conference. Very engaged."},
                    {"type": "note", "content": "Follow-up call — discussed pricing tiers and contract length."},
                    {"type": "task", "content": "Draft custom proposal with annual pricing", "is_completed": True},
                    {"type": "task", "content": "Get legal review on MSA terms", "is_completed": False},
                    {"type": "note", "content": "CFO is the final decision maker. Needs ROI justification doc."},
                ],
            },
            {
                "name": "Emily Nakamura",
                "company": "Bright Health Systems",
                "value": 45000,
                "stage": "Contacted",
                "activities": [
                    {"type": "note", "content": "Inbound lead from website form. Looking for HIPAA-compliant solution."},
                    {"type": "task", "content": "Send compliance certification docs", "is_completed": False},
                ],
            },
            {
                "name": "David Okonkwo",
                "company": "NexGen Logistics",
                "value": 200000,
                "stage": "Won",
                "activities": [
                    {"type": "note", "content": "Closed deal after 3-month sales cycle. 2-year contract signed."},
                    {"type": "task", "content": "Hand off to customer success team", "is_completed": True},
                    {"type": "task", "content": "Schedule onboarding kickoff", "is_completed": True},
                    {"type": "note", "content": "Client requested priority support add-on."},
                ],
            },
            {
                "name": "Lisa Park",
                "company": "Vertex Analytics",
                "value": 30000,
                "stage": "New",
                "activities": [
                    {"type": "note", "content": "Referred by David Okonkwo at NexGen. Small team, big ambitions."},
                ],
            },
            {
                "name": "James Patterson",
                "company": "Sterling Manufacturing",
                "value": 90000,
                "stage": "Lost",
                "activities": [
                    {"type": "note", "content": "Was evaluating us against CompetitorX. Budget constraints cited."},
                    {"type": "task", "content": "Add to re-engagement campaign for Q1", "is_completed": False},
                    {"type": "note", "content": "Mentioned they may revisit in next fiscal year."},
                ],
            },
        ]

        for lead_data in leads_data:
            activities_data = lead_data.pop("activities")
            lead = Lead(**lead_data)
            db.add(lead)
            db.flush()  # Get the lead.id

            for act_data in activities_data:
                activity = Activity(lead_id=lead.id, **act_data)
                db.add(activity)

        db.commit()
        print(f"Successfully seeded {len(leads_data)} leads with activities.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
