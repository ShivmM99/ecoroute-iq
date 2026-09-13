# EcoRoute IQ

**Live app:** https://ecoroute-iq.vercel.app
**Source:** https://github.com/ShivmM99/ecoroute-iq

EcoRoute IQ compares the carbon footprint of every way to make a trip — driving, transit, biking, walking — and ranks them from greenest to worst, with an AI "eco-coach" that puts the savings in relatable terms.

> **Note on the first load:** the backend runs on a free tier that sleeps when idle, so the first comparison after a period of inactivity can take up to a minute. Subsequent requests are fast.

## What it does

1. You enter an origin and destination.
2. The backend fetches the real route for each travel mode (driving, transit, biking, walking) from the Google Routes API.
3. It computes the carbon footprint of each mode from its distance and a published per-kilometer emissions factor, then ranks them greenest-first.
4. A language model writes a short, personalized "eco-coach" summary that translates the CO₂ saved into a concrete comparison (e.g. phone charges), and the results render as a ranked comparison with a bar for each mode's relative footprint.

## How generative AI is used

The Anthropic API powers the eco-coach: given the trip, the ranked options, and the CO₂ saved, it writes a brief, encouraging summary with a relatable real-world comparison. It's built as an optional layer — if the AI call fails, the route data and rankings still return — which keeps the core tool reliable while the generative feature adds the human touch that makes the numbers land.

## How the carbon comparison works

For each mode, EcoRoute converts the route distance to kilometers and multiplies by a per-passenger-kilometer emissions factor (gas car ≈ 170 g/km, transit ≈ 100 g/km, biking and walking ≈ 0). It then ranks modes by total CO₂ and reports the savings of the greenest option versus driving. The emissions factors are published averages and vary by country, vehicle, and occupancy — a point worth noting rather than hiding.

A deliberate design finding surfaces here: transit is *not* automatically greenest on every route. A bus that takes a long, winding path can emit more than a short direct drive — EcoRoute shows this honestly rather than assuming "transit = green."

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Python, FastAPI
- **AI:** Anthropic API (eco-coach summaries)
- **Routing:** Google Routes API
- **Deployment:** Vercel (frontend), Render (backend)

## Running locally

Backend:

```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# add GOOGLE_MAPS_API_KEY and ANTHROPIC_API_KEY to a .env file
uvicorn main:app --reload
```

Frontend:

```
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://127.0.0.1:8000` by default, or set `VITE_API_URL` to point elsewhere.

## Known limitations & future work

- **Emissions factors are averages.** Real emissions depend on the specific vehicle, occupancy, and local grid. Letting users pick a vehicle type would sharpen the estimates.
- **Distance-based, not a true optimizer yet.** v1 ranks modes by a single factor (carbon). Adding time, cost, and calories as weighted objectives would make it a genuine multi-variable optimizer.
- **Transit data varies.** Transit routing depends on time of day and local feed coverage, so results can shift between runs.

## Author

Built solo by Shivm Mehta.