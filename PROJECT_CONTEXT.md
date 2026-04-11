# SmartHop — Project Context

SmartHop is a last-mile shared ride platform designed for the Mumbai Metro ecosystem. It integrates real-time ride-sharing with fare splitting and automated coordination between metro stations and final destinations.

## Project Structure

- **`smarthop/`**: The frontend application built with Next.js.
- **`ml-service/`**: A Python-based FastAPI service that handles machine learning tasks like fare calculation, ride clustering, and driver ranking.
- **`steps/`**: Contains implementation guidelines and phase-wise development steps.

## Technology Stack

- **Frontend**: 
  - Next.js 15 (App Router)
  - TypeScript
  - Tailwind CSS v4 (Configuration via `globals.css`)
  - Shadcn/ui & Framer Motion for UI/Animations
  - Leaflet / React-Leaflet for mapping (OpenStreetMap)
- **Backend/Database**: 
  - Supabase (PostgreSQL, RLS, Realtime, Auth)
- **ML Service**: 
  - FastAPI (Python 3.10)
  - Scikit-learn, Pandas, NumPy, Joblib

## Commands to Run the Project

To run the full project, you need to start both the frontend and the ML service.

### 1. Run the Frontend (Next.js)
```bash
cd smarthop
npm install
npm run dev
```
The frontend will typically be available at `http://localhost:3000`.

### 2. Run the ML Service (FastAPI)
```bash
cd ml-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The ML service will typically be available at `http://localhost:8000`.

## Key Features & ML Models

- **Ride Matching**: Uses DBSCAN and KMeans for clustering rides based on station and destination.
- **Fare Prediction**: Dynamic fare estimation using Random Forest and Linear Regression models.
- **Driver Ranking**: Automated ranking of drivers based on performance metrics.
- **Navigation**: Custom interactive maps for Mumbai Metro stations and ride tracking.

## Development Workflow

- Always ensure the Supabase environment variables are set in `smarthop/.env.local`.
- ML models are pre-trained and loaded from `.joblib` files; do not retrain unless explicitly required.
- Maintain navigation consistency across Rider, Driver, and Admin dashboards as defined in the UI architecture.
