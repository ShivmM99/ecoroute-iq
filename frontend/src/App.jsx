import { useState } from "react"

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/routes"

// Friendly labels + icons for each mode
const MODE_LABEL = {
  BICYCLE: "Bike",
  WALK: "Walk",
  TRANSIT: "Transit",
  DRIVE: "Drive",
}

function App() {
  const [origin, setOrigin] = useState("Cornell University, Ithaca NY")
  const [destination, setDestination] = useState("Ithaca Commons, Ithaca NY")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
      })
      if (!response.ok) throw new Error("The service is waking up — please try again in a moment.")
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Max CO2 among available routes, for the comparison bars
  const maxCo2 = result
    ? Math.max(...result.routes.map((r) => r.co2_grams), 1)
    : 1

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#14532D] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <span className="font-semibold tracking-tight">EcoRoute IQ</span>
          </div>
          <span className="text-sm text-zinc-500">Carbon-aware routing</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          See the greenest way there.
        </h1>
        <p className="text-zinc-500 mb-8">
          Compare the carbon footprint of every way to make your trip.
        </p>

        {/* Form */}
        <div className="space-y-3 mb-4">
          <input
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#14532D] transition"
            placeholder="From"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#14532D] transition"
            placeholder="To"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-lg bg-[#14532D] text-white text-sm font-medium px-5 py-2.5 hover:bg-[#0f3d21] disabled:opacity-40 transition"
        >
          {loading ? "Comparing…" : "Compare routes"}
        </button>

        {error && (
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        )}

        {!result && !loading && !error && (
          <div className="mt-16 border-t border-zinc-200 pt-16 text-center">
            <p className="text-zinc-400 text-sm">
              Your carbon comparison will appear here.
            </p>
          </div>
        )}

        {result && (
          <div className="mt-12">
            {/* Eco-coach */}
            {result.eco_summary && (
              <div className="rounded-xl border border-[#14532D]/15 bg-white p-5 mb-8">
                <div className="text-xs font-medium text-[#14532D] mb-2">
                  Eco-coach
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {result.eco_summary}
                </p>
              </div>
            )}

            {/* Ranked comparison */}
            <div className="space-y-1">
              {result.routes.map((r, i) => {
                const pct = (r.co2_grams / maxCo2) * 100
                const isGreenest = i === 0
                return (
                  <div key={r.mode} className="py-3 border-t border-zinc-100 first:border-t-0">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="font-medium">
                        {MODE_LABEL[r.mode] || r.mode}
                        {isGreenest && (
                          <span className="ml-2 text-xs font-medium text-[#14532D]">
                            greenest
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {r.co2_grams} g CO₂
                        <span className="text-zinc-300"> · {r.distance_km} km</span>
                      </span>
                    </div>
                    {/* comparison bar */}
                    <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          background: isGreenest ? "#14532D" : "#a1a1aa",
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {result.co2_saved_vs_driving_grams != null && (
              <p className="mt-6 text-sm text-zinc-500">
                Choosing the greenest option saves{" "}
                <span className="font-semibold text-[#14532D]">
                  {result.co2_saved_vs_driving_grams} g CO₂
                </span>{" "}
                versus driving.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App