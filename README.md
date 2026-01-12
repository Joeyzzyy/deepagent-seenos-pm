# DeepAgent

Monorepo for DeepAgent - AI-powered SEO competitor analysis platform.

## Structure

```
deepagent-monorepo/
├── frontend/          # Next.js frontend (port 3003)
├── backend/           # LangGraph backend (port 2024)
└── scripts/           # Utility scripts
```

## Quick Start

### 1. Setup Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Setup Frontend
```bash
cd frontend
npm install
```

### 3. Start Services
```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && langgraph dev --port 2024

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 4. Access
- Frontend: http://localhost:3003
- Backend API: http://localhost:2024

## Development

### Commit Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `style:` UI/styling changes

## License
Private
