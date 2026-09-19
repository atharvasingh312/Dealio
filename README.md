# Dealio CRM

Dealio is a focused CRM prototype for a B2B sales team. It helps a sales rep find leads, understand a deal's current context, record activity, move an opportunity through a pipeline, create follow-up tasks, and generate a concise AI summary before the next customer interaction.

This repository is prepared as an interview/demo submission. The seeded names, companies, contact details, notes, and deal values are fictional sample data created only to demonstrate the workflow.

## Features

- Browse and search leads by name or company.
- Open a lead detail view with deal value, company context, activity history, and follow-up tasks.
- Add notes and tasks, then mark tasks complete.
- Move a deal through `New`, `Contacted`, `Qualified`, `Proposal`, `Won`, or `Lost`.
- Generate a cached AI lead summary with background, intent signal, missing information, and a suggested next step.
- Simulate account research through the Searchio enrichment control, which adds sample activity and a follow-up task.
- Persist lead, activity, stage, task, and cached summary state in SQLite.

## Tech Stack and Architecture

### Frontend

- Next.js App Router
- React 19 and TypeScript
- Tailwind CSS 4 and local CSS design tokens
- Browser-side API client in `frontend/src/lib/api.ts`

The frontend provides the dashboard and lead detail workflow. It calls the FastAPI service and updates the UI from the API responses. The main UI surfaces are in `frontend/src/app/` and `frontend/src/components/`.

### Backend

- Python 3.10+
- FastAPI and Uvicorn
- SQLAlchemy 2.0
- SQLite
- Pydantic v2
- Google GenAI SDK

The backend exposes REST endpoints in `backend/main.py`. SQLAlchemy models in `backend/models.py` define three core entities:

```text
Lead       -> the contact/account opportunity and its pipeline stage
Activity   -> a note or task linked to a lead
AISummary  -> the cached structured AI result for a lead
```

The SQLite database is created at `backend/crm.db` during local development. It is intentionally ignored and must not be included in a submission archive.

## Setup and Run

### Prerequisites

- Python 3.10 or newer
- Node.js 18.18 or newer
- npm
- A Gemini API key is optional. The core CRM workflow works without one; AI summary generation shows a graceful fallback when no key is configured.

### 1. Start the backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

For AI summaries, create a local `backend/.env` from `backend/example.env` and set your own values. Do not commit or share that file:

```env
GEMINI_API_KEY=replace-with-your-local-key
GEMINI_MODEL=gemini-2.5-pro
```

The model is read from `GEMINI_MODEL`, so it can be changed without editing source code. A key is not required to run the rest of the CRM.

Seed the fictional sample data and start the API:

```powershell
python seed.py
python -m uvicorn main:app --reload --port 8000
```

The backend API and interactive documentation are available at:

- API: http://localhost:8000
- OpenAPI docs: http://localhost:8000/docs

### 2. Start the frontend

Open a second terminal from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000/dashboard.

The frontend expects the FastAPI backend at `http://localhost:8000`. The API client contains the local backend base URL used by the current demo.

## Loading and Accessing Sample Leads

Run `python seed.py` from `backend/`. Seeding is idempotent: if the database already contains leads, it prints a message and leaves the existing data unchanged. To reset the local demo data, stop the backend, delete the ignored file `backend/crm.db`, and run `python seed.py` again.

The seed contains six fictional B2B opportunities across multiple stages, with notes and tasks designed to make the detail workflow immediately demonstrable. The dashboard is the entry point, and selecting any row opens `/leads/{id}`.

There is no demo login or authentication flow in this prototype. It is intended to run locally for the interview recording.

## AI Lead Summary

On a lead detail page, **Generate AI Summary** sends a structured prompt to Gemini. The prompt currently includes:

- Lead name and company
- Deal value and current pipeline stage
- The complete activity history available for that lead
- Whether task activities are complete

Gemini is asked to return JSON containing:

- `background`: who the lead is and the relevant context
- `intent_signal`: a short buying-intent label
- `missing_info`: an important unknown for the sales rep
- `suggested_next_step`: one concrete follow-up action

The backend validates the expected response fields and caches successful results in `AISummary`. Adding an activity or changing the deal stage marks the cached summary stale, so the next request can regenerate it with the latest context. A fresh cached summary is returned without another model call.

### AI failure fallback

The AI integration never exposes a raw provider exception to the user. If the API key is missing, the provider call fails, JSON parsing fails, or the response is missing required fields, the backend returns an error result. The frontend displays an amber unavailable message and directs the rep to the raw activity history. Existing cached summaries remain available until a replacement summary is successfully generated.

## Demo Workflow

1. Browse the dashboard and search for a lead by name or company.
2. Open a lead and review its deal value, stage, activity timeline, tasks, and AI summary.
3. Add a note and verify it appears in the activity history.
4. Move the deal to another pipeline stage.
5. Add or complete a follow-up task, then refresh to demonstrate SQLite persistence.
6. Generate or update the AI summary and review the missing-information and next-step sections.

## API Surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/leads/` | List leads |
| `POST` | `/leads/` | Create a lead |
| `GET` | `/leads/{id}` | Load a lead with activities and summary |
| `PATCH` | `/leads/{id}/stage` | Update pipeline stage |
| `POST` | `/leads/{id}/activities` | Add a note or task |
| `PATCH` | `/activities/{id}/toggle` | Toggle task completion |
| `POST` | `/leads/{id}/summary` | Generate or return a cached AI summary |

## Assumptions and Trade-offs

- The prototype optimizes for a complete, understandable demo rather than a production CRM feature set.
- SQLite keeps setup simple and makes persistence visible during the demo; a hosted relational database would be more appropriate for multiple users.
- Dashboard search is intentionally small and local for the six-lead dataset; production search should move server-side and be indexed.
- AI summaries are generated on demand and cached to control latency and model usage; a production system would likely use a background job and retry policy.
- Searchio enrichment is a mocked interaction for demonstrating how external research could add structured CRM activity. It does not make a real web search.
- Authentication, authorization, and tenant isolation were omitted to keep the interview scope focused.

## Known Limitations

- No authentication, user accounts, role-based access, or multi-tenant isolation.
- No production deployment or live URL is configured.
- No automated test suite is currently included; validation was performed through the local UI/API workflow.
- SQLite and the local development server are not designed for concurrent production traffic.
- Search is client-side and limited to the leads already loaded in the browser.
- AI output depends on provider availability and model quality; the fallback preserves usability but does not generate an offline summary.
- Contact information shown in the detail view is demo-generated and should not be treated as real customer data.

## Security and Submission Notes

- No API keys, passwords, tokens, or customer data are included in this repository.
- `backend/.env`, database files, Python caches, Node modules, and Next.js build output are ignored and must stay out of the ZIP.
- `backend/example.env` contains placeholders only. Replace the placeholder locally; never put a real key in that file or in source code.
- Before sharing, inspect the archive contents and confirm it contains source code and this README only, without `.env`, `crm.db`, `.venv`, `node_modules`, `.next`, or `__pycache__`.

## Tests

No automated test suite is included in this interview POC. The intended smoke test is to seed the database, start both services, complete the workflow in the **Demo Workflow** section, refresh the browser, and verify that notes, stages, tasks, and cached summaries persist as expected.

## Deployment

This submission is local-only. There is no live deployment URL.

## License

This project is provided as an demo prototype.
