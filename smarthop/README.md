# SmartHop

SmartHop is a last-mile shared ride platform for Mumbai Metro commuters. It combines rider matching, driver coordination, fare splitting, live tracking, and ML-assisted routing into a single product.

Live demo: [https://smarthop.vercel.app](https://smarthop.vercel.app)

## What It Does

- Helps riders request shared rides from metro stations to their final destination.
- Lets drivers go online, accept ride groups, and track active trips.
- Gives admins visibility into product and model performance.
- Uses a Python ML service for fare prediction, clustering, ranking, and route optimization.
- Integrates Supabase for auth, database, and realtime updates.
- Uses Mapbox and interactive maps for route and station experiences.

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion
- UI: shadcn/ui, Radix primitives, Sonner, Lucide icons
- Backend services: Supabase, FastAPI, Uvicorn
- ML: scikit-learn, pandas, NumPy, Joblib
- Maps: Mapbox and React Map GL / Leaflet-based map components

## Project Structure

- `smarthop/` - Next.js application
- `ml-service/` - FastAPI ML service
- `ml/models/` - Pre-trained clustering, fare, and ranking artifacts
- `ml-service/migrations/` - Database and backend migration scripts

## Main User Flows

- Rider onboarding, login, dashboard, ride request, fare summary, and live tracking.
- Driver dashboard, online/offline control, ride acceptance, route guidance, and earnings.
- Admin overview and ML performance screens for operational insight.
- Landing page with metro coverage, product summary, and call to action.

## Local Setup

### Frontend

```bash
cd smarthop
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### ML Service

```bash
cd ml-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The service runs at [http://localhost:8000](http://localhost:8000).

## Environment Variables

Set these in `smarthop/.env.local` before running the frontend:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
NEXT_PUBLIC_ML_SERVICE_URL=
```

Optional feature flags used by the app:

```bash
NEXT_PUBLIC_ML_V2_FORCE=
NEXT_PUBLIC_ML_V1_FORCE=
NEXT_PUBLIC_ML_V2_CANARY_PERCENTAGE=
```

## Screenshots

Add your project screenshots here after uploading them to the repository.

- Landing page
- Rider dashboard
- Driver dashboard
- Admin analytics and ML performance

## Deployment

The frontend is deployed on Vercel and can be accessed at [smarthop.vercel.app](https://smarthop.vercel.app).

The ML service should be deployed separately and pointed to by `NEXT_PUBLIC_ML_SERVICE_URL`.

## Notes

- The ML service loads pre-trained `.joblib` models on startup.
- The frontend expects Supabase and Mapbox credentials to be present.
- If you change the ML service URL or database schema, update the frontend environment values accordingly.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
