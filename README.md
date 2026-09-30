# AI SecureHost

## Setup and Run

### Backend
1. Open a terminal.
2. Run `run_backend.bat` (Windows) or:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate # or venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

### Frontend
1. Open a new terminal.
2. `cd frontend`
3. `npm install`
4. `npm run dev`

## Features
- Face Verification (Staff)
- Anomaly Detection
- Real-time Alerting
- Role-based Access (Admin, Student, Guard)
