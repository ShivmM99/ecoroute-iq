import os
from dotenv import load_dotenv
import httpx
from anthropic import Anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()  # reads .env into environment variables
GOOGLE_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

anthropic_client = Anthropic()

app = FastAPI(title="EcoRoute IQ")

# Lets your React frontend (running on a different port) talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default dev port
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_methods=["*"],
    allow_headers=["*"],
)

# The shape of the request we expect from the frontend
class RouteRequest(BaseModel):
    origin: str       # e.g. "Cornell University, Ithaca NY"
    destination: str  # e.g. "Ithaca Commons"

# Google's Routes API travel modes we care about
TRAVEL_MODES = ["DRIVE", "TRANSIT", "BICYCLE", "WALK"]

EMISSIONS_G_PER_KM = {
    "DRIVE": 170,
    "TRANSIT": 100,
    "BICYCLE": 0,
    "WALK": 0,
}

ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"

async def fetch_one_mode(client, origin, destination, mode):
    """Ask Google for the distance/duration of a single travel mode."""
    body = {
        "origin": {"address": origin},
        "destination": {"address": destination},
        "travelMode": mode,
    }
    # Routes API uses a field mask to say which fields you want back
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
    }
    resp = await client.post(ROUTES_URL, json=body, headers=headers)
    if resp.status_code != 200:
        return {"mode": mode, "error": resp.text}

    data = resp.json()
    routes = data.get("routes", [])
    if not routes:
        return {"mode": mode, "available": False}

    route = routes[0]
    distance_meters = route.get("distanceMeters", 0)
    distance_km = distance_meters / 1000
    factor = EMISSIONS_G_PER_KM.get(mode, 0)
    co2_grams = round(distance_km * factor, 1)

    return {
        "mode": mode,
        "available": True,
        "distance_meters": distance_meters,
        "distance_km": round(distance_km, 2),
        "duration": route.get("duration"),
        "co2_grams": co2_grams,
    }

def generate_eco_summary(origin, destination, greenest_mode, co2_saved, routes):
    """Ask Claude to write a short, witty eco-coach summary of the trip."""
    # Build a plain-text description of the options for the prompt
    options_text = "\n".join(
        f"- {r['mode']}: {r['distance_km']} km, {r['co2_grams']} g CO2"
        for r in routes
    )

    prompt = f"""You are EcoRoute IQ's witty eco-coach.
The user is traveling from {origin} to {destination}.

Travel options and their carbon footprint:
{options_text}

The greenest option is {greenest_mode}, saving about {co2_saved} grams
of CO2 versus driving.

Write a short (2-3 sentence), upbeat, witty summary encouraging the
greener choice. Include one concrete, relatable comparison for the CO2
saved (e.g. phone charges, cups of coffee). Do not use hashtags."""

    message = anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    # The response text lives in the first content block
    return message.content[0].text

@app.post("/routes")
async def get_routes(req: RouteRequest):
    if not GOOGLE_KEY:
        raise HTTPException(500, "Missing Google Maps API key")

    async with httpx.AsyncClient(timeout=15) as client:
        results = []
        for mode in TRAVEL_MODES:
            result = await fetch_one_mode(client, req.origin, req.destination, mode)
            results.append(result)

    # Only consider modes that actually returned a route
    available = [r for r in results if r.get("available")]

    # Rank greenest first (lowest CO2)
    ranked = sorted(available, key=lambda r: r["co2_grams"])

    greenest = ranked[0] if ranked else None

    # How much CO2 does driving cost, for a savings comparison?
    drive = next((r for r in available if r["mode"] == "DRIVE"), None)
    savings = None
    if greenest and drive:
        savings = round(drive["co2_grams"] - greenest["co2_grams"], 1)

    summary = None
    if greenest and savings is not None:
        try:
            summary = generate_eco_summary(
                req.origin, req.destination,
                greenest["mode"], savings, ranked,
            )
        except Exception as e:
            summary = f"(Eco-coach unavailable: {e})"

    return {
        "origin": req.origin,
        "destination": req.destination,
        "routes": ranked,
        "greenest_mode": greenest["mode"] if greenest else None,
        "co2_saved_vs_driving_grams": savings,
        "eco_summary": summary,
    }

@app.get("/")
def health():
    return {"status": "ok"}