# Job Intelligence Platform for CS Freshers

An explainable, hybrid-scored job recommendation engine, parsing pipeline, and application tracker tailored for early-career computer science candidates.

## Technical Architecture

The platform consists of three main modules:
1. **Frontend App (`/web`)**: Next.js (App Router), TypeScript, and Tailwind CSS. Next.js handles server-side rendering, user authentication, and profile CRUD endpoints.
2. **FastAPI Microservice (`/services`)**: Python backend handling PyMuPDF-based resume text extraction, NLP-based skill extraction and taxonomy mapping, sentence-transformers (`all-MiniLM-L6-v2`) embeddings, an 8-factor hybrid matching engine, and data ingestion workers (Greenhouse, Lever, GitHub, Hacker News).
3. **Database (`/database`)**: PostgreSQL with the `pgvector` extension for semantic and keyword search.

## Setup Instructions

### Prerequisites
- Docker & Docker Compose
- Node.js v18+ (for local development)
- Python 3.10+ (for local development)

### Quick Start with Docker (One Command)

To build images and launch all services simultaneously (Next.js web, FastAPI backend, PostgreSQL + pgvector):

**Using script (Windows):**
```cmd
docker-run.bat
```
or in PowerShell:
```powershell
.\docker-run.ps1
```

**Or using Docker Compose directly:**
```bash
docker compose up --build -d
```

### Access URLs & Test Accounts
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database**: `localhost:5432` (`jobintel` / `postgres` / `postgrespassword`)

**Pre-seeded Test Credentials:**
- **Admin Account**: `admin@jobintel.com` / `AdminPassword123` (Access `/admin`)
- **Demo Fresher Account**: `demo@jobintel.com` / `DemoPassword123` (Access `/dashboard`)

### Complete Cleanup (One Command)
To stop all containers and remove all networks, persistent volumes, and built images cleanly:

**Using script (Windows):**
```cmd
docker-clean.bat
```
or in PowerShell:
```powershell
.\docker-clean.ps1
```

**Or using Docker Compose directly:**
```bash
docker compose down -v --rmi local --remove-orphans
```

### Database Details
The schema includes 18 tables loaded on initialization via docker-compose:
- **`users`** & **`user_profiles`**: Demographics and profile context.
- **`resumes`**: Raw extracted text and parsed JSON segments.
- **`companies`** & **`company_insights`**: Core company metadata and scraped context.
- **`jobs`**: Normalized job listings.
- **`job_matches`**: Score metrics and explanations.
- **`applications`** & **`saved_jobs`**: Job tracking modules.

## Authors
Designed as a final-year CS project. Released under the MIT License.
