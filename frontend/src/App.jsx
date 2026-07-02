import { useState } from "react"

// Where the backend lives. Vite runs on 5173, backend on 8000.
const API_URL = "http://127.0.0.1:8000/routes"

function App() {
  // Form inputs
  const [origin, setOrigin] = useState("Cornell University, Ithaca NY")
  const [destination, setDestination] = useState("Ithaca Commons, Ithaca NY")

  // Request state
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
      if (!response.ok) {
        throw new Error(`Server responded ${response.status}`)
      }
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4">
      <h1 className="text-4xl font-bold text-emerald-400 mb-2">EcoRoute IQ</h1>
      <p className="text-slate-400 mb-8">Compare your trip's carbon footprint</p>

      {/* Input card */}
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">From</label>
          <input
            className="w-full rounded-lg bg-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">To</label>
          <input
            className="w-full rounded-lg bg-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-2 font-semibold text-slate-900 transition"
        >
          {loading ? "Calculating..." : "Compare Routes"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-md mt-6 bg-red-900/40 border border-red-500 rounded-lg p-4 text-red-200">
          Something went wrong: {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="w-full max-w-md mt-6 space-y-4">
          {/* Eco-coach summary */}
          {result.eco_summary && (
            <div className="bg-emerald-900/30 border border-emerald-500 rounded-xl p-4">
              <p className="text-sm font-semibold text-emerald-300 mb-1">
                🌱 Your Eco-Coach
              </p>
              <p className="text-slate-100">{result.eco_summary}</p>
            </div>
          )}

          {/* Ranked modes */}
          <div className="bg-slate-800 rounded-xl p-4 space-y-2">
            {result.routes.map((r) => (
              <div
                key={r.mode}
                className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0"
              >
                <span className="font-medium">{r.mode}</span>
                <span className="text-slate-400 text-sm">
                  {r.distance_km} km · {r.co2_grams} g CO₂
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App