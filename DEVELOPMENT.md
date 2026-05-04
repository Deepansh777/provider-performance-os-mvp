# Development Guide

## Local Development Setup

This guide will help you set up the development environment for the VBP SaaS Platform.

---

## Prerequisites

- Python 3.12.0
- Node.js 18+
- Docker & Docker Compose
- Git

---

## Backend Development

### 1. Create Virtual Environment

```bash
cd backend

# Create venv
python -m venv venv

# Activate venv
# Linux/Mac:
source venv/bin/activate
# Windows:
.\venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up Database

Option A: Use Docker for database only
```bash
# From project root
docker-compose up -d db
```

Option B: Install PostgreSQL locally and create database
```bash
createdb vbp_database
```

### 4. Run Backend

```bash
# Make sure you're in backend directory and venv is activated
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

---

## Frontend Development

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Set Environment Variables

Create `frontend/.env.local`:
```bash
REACT_APP_API_URL=http://localhost:8000
```

### 3. Run Frontend

```bash
npm start
```

Frontend will be available at: http://localhost:3000

---

## Database Migrations with Alembic

### Initialize Alembic (Already Done)

```bash
cd backend
alembic init alembic
```

### Create Migration

```bash
# Auto-generate migration from models
alembic revision --autogenerate -m "Add new table"

# Or create empty migration
alembic revision -m "Custom migration"
```

### Apply Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Apply specific migration
alembic upgrade <revision_id>
```

### Rollback Migrations

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# Rollback all
alembic downgrade base
```

### View Migration History

```bash
# Show current revision
alembic current

# Show all revisions
alembic history
```

---

## Code Structure

### Backend Structure

```
backend/
├── routers/           # API endpoints
│   ├── auth.py       # Authentication endpoints
│   ├── performance.py
│   ├── population.py
│   ├── quality_access.py
│   ├── cost_utilization.py
│   └── benchmarks.py
├── models.py         # SQLAlchemy models
├── schemas.py        # Pydantic schemas
├── database.py       # Database config
├── config.py         # App settings
├── auth_utils.py     # Auth utilities
└── main.py          # FastAPI app
```

### Frontend Structure

```
frontend/src/
├── components/       # Reusable components
│   ├── Header.js
│   └── Navigation.js
├── pages/           # Page components
│   ├── Login.js
│   ├── PerformanceCommandCenter.js
│   ├── PopulationRisk.js
│   ├── QualityAccess.js
│   ├── CostUtilization.js
│   └── Benchmarks.js
├── App.js           # Main app component
├── api.js           # API client
└── index.js         # Entry point
```

---

## Adding New Features

### 1. Add Backend Endpoint

**Create model** in `models.py`:
```python
class NewModel(Base):
    __tablename__ = "new_table"
    id = Column(Integer, primary_key=True)
    name = Column(String)
```

**Create schema** in `schemas.py`:
```python
class NewModelSchema(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True
```

**Create router** in `routers/new_router.py`:
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_items():
    return {"items": []}
```

**Register router** in `main.py`:
```python
from routers import new_router
app.include_router(new_router.router, prefix="/api/new", tags=["New"])
```

### 2. Add Frontend Component

**Create API function** in `api.js`:
```javascript
export const newAPI = {
  getItems: () => api.get('/new/'),
};
```

**Create page component** in `pages/NewPage.js`:
```javascript
import React, { useState, useEffect } from 'react';
import { newAPI } from '../api';

function NewPage() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    const response = await newAPI.getItems();
    setData(response.data);
  };
  
  return <div>New Page</div>;
}

export default NewPage;
```

**Add route** in `App.js`:
```javascript
<Route path="/new" element={<ProtectedRoute><NewPage /></ProtectedRoute>} />
```

---

## Testing

### Backend Tests

```bash
cd backend
pytest
```

Create test file `test_api.py`:
```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## Environment Variables

### Backend (.env)

```bash
DATABASE_URL=postgresql://vbp_user:vbp_password@localhost:5432/vbp_database
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://localhost:80
```

### Frontend (.env.local)

```bash
REACT_APP_API_URL=http://localhost:8000
```

---

## Debugging

### Backend Debugging

Add breakpoints in VS Code:
1. Install Python extension
2. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload"],
      "jinja": true,
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

### Frontend Debugging

Use React DevTools browser extension

---

## Common Issues

### Database Connection Error

```bash
# Check if database is running
docker-compose ps

# Restart database
docker-compose restart db

# Check connection
psql postgresql://vbp_user:vbp_password@localhost:5432/vbp_database
```

### Port Already in Use

```bash
# Find process using port
# Linux/Mac:
lsof -i :8000
# Windows:
netstat -ano | findstr :8000

# Kill process
# Linux/Mac:
kill -9 <PID>
# Windows:
taskkill /PID <PID> /F
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request on GitHub
```

---

## Code Style

### Python (Backend)

Follow PEP 8:
```bash
# Install flake8
pip install flake8

# Check code
flake8 .
```

### JavaScript (Frontend)

Follow Airbnb style guide:
```bash
# Install ESLint
npm install --save-dev eslint

# Check code
npm run lint
```

---

## Performance Optimization

### Backend

1. Use async/await for I/O operations
2. Add database indexes
3. Use connection pooling
4. Cache frequently accessed data

### Frontend

1. Use React.memo for expensive components
2. Lazy load routes
3. Optimize images
4. Use production build

---

## Security Best Practices

1. Never commit secrets to Git
2. Always validate user input
3. Use parameterized queries
4. Implement rate limiting
5. Keep dependencies updated
6. Use HTTPS in production

---

For more information, see the main [README.md](README.md)
