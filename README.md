# Dealio — Modern AI-Powered B2B CRM

Dealio is a modern, full-stack B2B CRM platform designed to streamline sales cycles, synthesize lead signals with Google Gemini AI intelligence, and enrich account insights with an automated Searchio AI research agent.

---

## Key Features

- **Gemini AI Intelligence**: Synthesizes client background, buying intent signals, and missing B2B information from call notes, emails, and CRM interactions.
- **AI Suggested Next Steps & 1-Click Task Creation**: Automatically suggests actionable next moves with instant one-click conversion into follow-up tasks.
- **Mocked "Searchio" Web Search & Enrichment Agent**: Simulates autonomous internet research to verify company size, funding rounds, and executive decision-makers.
- **Interactive Deal Pipeline Stepper**: 5-stage visual stepper (`New` &rarr; `Contacted` &rarr; `Qualified` &rarr; `Proposal` &rarr; `Won` / `Lost`) with instant state persistence.
- **Dynamic Activity Feed & Tasks**: Timeline updates for client notes and tasks with interactive completion toggling and strict validation.
- **Resilient UI & Fallback Handling**: Graceful error boundaries and amber fallback states for AI connectivity.

---

## Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **ORM & Database**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) with [SQLite](https://www.sqlite.org/)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **AI Integration**: [Google GenAI SDK](https://github.com/google-gemini/generative-ai-python) (Gemini Flash)
- **Server**: [Uvicorn](https://www.uvicorn.org/)

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Tailwind CSS & Vanilla CSS design tokens
- **API Proxy**: Next.js route rewrites to FastAPI backend

---

## Project Structure

```
dealio/
├── backend/
│   ├── ai_service.py       # Gemini AI prompt synthesis & response parsing
│   ├── database.py         # SQLAlchemy engine & DB session setup
│   ├── main.py             # FastAPI REST endpoints & schema migrations
│   ├── models.py           # SQLAlchemy models (Lead, Activity, AISummary)
│   ├── schemas.py          # Pydantic v2 validation & response schemas
│   ├── seed.py             # Database seeding script with realistic B2B data
│   ├── example.env         # Environment configuration template
│   └── requirements.txt    # Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router pages (Dashboard, Lead Detail)
│   │   ├── components/     # UI Components (AISummaryCard, PipelineStepper, ActivityFeed, TopNav)
│   │   └── lib/            # Centralized API client & TypeScript interfaces
│   ├── package.json        # Frontend dependencies & scripts
│   └── tsconfig.json       # TypeScript configuration
├── .gitignore              # Repository git ignore rules
└── README.md               # Project documentation
```

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/dealio.git
cd dealio
```

### 2. Backend Setup
Navigate to the `backend` directory, create a virtual environment, and install dependencies:

```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Configure your environment variables:
```bash
# Copy example.env to .env
cp example.env .env
```

Open `.env` and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
*(Get a free key from [Google AI Studio](https://aistudio.google.com/apikey))*

Seed the SQLite database with sample leads:
```bash
python seed.py
```

Start the FastAPI backend server:
```bash
python -m uvicorn main:app --port 8000 --reload
```
The API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 3. Frontend Setup
In a new terminal window, navigate to the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/leads/` | List all leads ordered by update timestamp |
| `POST` | `/leads/` | Create a new lead |
| `GET` | `/leads/{id}` | Get lead details with activity timeline and AI summary |
| `PATCH` | `/leads/{id}/stage` | Update lead pipeline stage (persists to SQLite) |
| `POST` | `/leads/{id}/activities` | Add a note or task activity to a lead |
| `PATCH` | `/activities/{id}/toggle` | Toggle task completion state |
| `POST` | `/leads/{id}/summary` | Generate or retrieve cached Gemini AI summary |

---

## License

This project is licensed under the MIT License.
