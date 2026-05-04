# VBP SaaS Platform

Provider Performance Analytics for Value-Based Care

A healthcare analytics platform for ACOs, Provider Groups, and Value-Based Care operators to track VBP performance, manage populations, optimize quality metrics, and reduce avoidable costs.

---

## Overview

### Core Modules

1. **Performance Command Center** - Executive VBP performance summary
2. **Population & Risk Intelligence** - Risk stratification and intervention prioritization  
3. **Quality & Access Improvement Hub** - Care gap closure and quality optimization
4. **Cost & Utilization Control Center** - Hospital, referral, and specialty cost management
5. **Benchmarks & Settings** - Governance, methodology transparency, and trust

### Technology Stack

- **Frontend**: React 18 with React Router
- **Backend**: FastAPI (Python 3.12)
- **Database**: PostgreSQL 15
- **Authentication**: JWT (development mode, no login required)
- **Deployment**: Docker & Docker Compose

### Architecture

```
React Frontend (3000) <-> FastAPI Backend (8000) <-> PostgreSQL (5432)
```

---

## Quick Start

### First Time Setup

**Project Directory**: `/home/user_1/code/provider-performance-os-mvp`

```bash
# Navigate to project directory
cd /home/user_1/code/provider-performance-os-mvp

# Build and start all services (includes automatic database initialization)
docker-compose build
docker-compose up -d

# Wait 15-20 seconds for services and database initialization to complete
```

**What Happens on First Start**:
- PostgreSQL container starts and creates database
- `database/init/01-init.sql` runs automatically, creating schema and loading demo data
- Backend API starts and connects to populated database
- Frontend starts and connects to backend

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## Daily Usage

### Starting the Application (After PC Restart)

Run this single command from the project directory:

```bash
docker-compose up -d
```

Wait 10-15 seconds, then access http://localhost:3000

### Stopping the Application

```bash
docker-compose down
```

---

## Development Workflow

### Hot Reload is Enabled

**No rebuild needed for code changes.** The application automatically reloads when you save files:

- **Backend**: Auto-reloads on `.py` file changes
- **Frontend**: Auto-reloads on `.js`, `.jsx`, `.css` file changes

Just edit code, save, and see changes immediately.

### When to Rebuild

Only rebuild when you modify dependencies:

```bash
docker-compose up -d --build
```

Required when changing:
- `requirements.txt` (Python dependencies)
- `package.json` (Node dependencies)  
- `Dockerfile` (container configuration)

### Local Development (Without Docker)

**Backend:**
```bash
cd backend

# Using Windows Python 3.12 via WSL
/mnt/c/python.exe -m venv venv
source venv/Scripts/activate
venv/Scripts/python.exe -m pip install -r requirements.txt

# Run backend
venv/Scripts/python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## Database Access

### Connection Information

- **Host**: localhost
- **Port**: 5432
- **Database**: vbp_database
- **Username**: vbp_user
- **Password**: vbp_password

### Connection String

```
postgresql://vbp_user:vbp_password@localhost:5432/vbp_database
```

### Connect via Command Line

```bash
# Via Docker container
docker-compose exec db psql -U vbp_user -d vbp_database

# Via local psql client
psql -h localhost -p 5432 -U vbp_user -d vbp_database
```

### Connect via GUI Tools

Use the credentials above with tools like DBeaver, pgAdmin, TablePlus, etc.

### Database Schema & Initialization

**Automatic Schema Setup**: When the PostgreSQL container is first created, it automatically executes `database/init/01-init.sql`, which:
- Creates 26 tables with proper relationships
- Loads synthetic demo data for 5 Wichita-based provider groups
- Populates 30 members, 12 users, and performance metrics
- Sets up VBP contracts with 4 domains per contract

**Key Tables**:
- `organizations`, `providers`, `users` - Core entities
- `contracts`, `vbp_domains` - VBP contract structure
- `members`, `member_attribution`, `member_conditions` - Population data
- `metric_definitions`, `provider_metric_results`, `benchmarks` - Performance tracking
- `domain_scores` - VBP domain performance and earnings
- `care_gaps`, `action_tasks`, `outreach_log` - Care management workflow
- `hospital_events`, `referral_events`, `specialists` - Utilization tracking
- `cost_summary`, `cost_cap_summary`, `cost_cap_member_detail` - Financial data

### Reset Database (Fresh Start)

To completely reset the database with fresh data:

```bash
# Stop and remove containers, volumes
docker-compose down -v

# Start fresh - this will run 01-init.sql automatically
docker-compose up -d

# Wait 15-20 seconds for initialization to complete
```

**Note**: The `-v` flag removes volumes, triggering a fresh database initialization.

---

## Common Commands

### View Service Status

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Restart Services

```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
docker-compose restart frontend
```

### Access Container Shell

```bash
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Clean Up

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

---

## Troubleshooting

### Services Won't Start

```bash
docker-compose down
docker-compose up -d
```

### Port Already in Use

Check what's using the ports:

```bash
# Linux/WSL
lsof -i :3000
lsof -i :8000
lsof -i :5432

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
```

Or modify ports in `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "3001:3000"  # Use port 3001 instead

backend:
  ports:
    - "8001:8000"  # Use port 8001 instead
```

### Frontend Not Updating

The frontend has hot reload enabled. If changes don't appear:

1. Check logs: `docker-compose logs frontend`
2. Hard refresh browser: Ctrl+Shift+R
3. Restart frontend: `docker-compose restart frontend`

### Backend Not Updating

Backend uses auto-reload. If changes don't appear:

1. Check logs: `docker-compose logs backend`
2. Verify file saved correctly
3. Restart backend: `docker-compose restart backend`

### Database Connection Issues

```bash
# Check database status
docker-compose ps db

# Restart database
docker-compose restart db

# View database logs
docker-compose logs db
```

### Complete Reset

```bash
# Nuclear option - removes everything
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## Configuration

### Environment Variables

Key settings in `.env` file:

```bash
# Database
DATABASE_URL=postgresql://vbp_user:vbp_password@db:5432/vbp_database

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

### CORS Configuration

CORS origins are configured in `backend/config.py` and can be set via environment variable:

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:80
```

---

## Project Structure

```
provider-performance-os-mvp/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── database.py          # Database connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth_utils.py        # Authentication utilities
│   ├── requirements.txt     # Python dependencies
│   └── routers/             # API endpoints
│       ├── auth.py
│       ├── performance.py
│       ├── population.py
│       ├── quality_access.py
│       ├── cost_utilization.py
│       └── benchmarks.py
├── frontend/
│   ├── src/
│   │   ├── App.js           # Main application
│   │   ├── api.js           # API client
│   │   ├── components/      # Reusable components
│   │   └── pages/           # Dashboard pages
│   └── package.json         # Node dependencies
├── database/
│   └── init/
│       └── 01-init.sql      # Database initialization
├── docker-compose.yml       # Docker services configuration
└── README.md                # This file
```

---

## Additional Resources

- **API Documentation**: http://localhost:8000/docs (interactive Swagger UI)
- **Design Document**: See `Design.md` for product strategy
- **Development Guide**: See `DEVELOPMENT.md` for detailed setup instructions
