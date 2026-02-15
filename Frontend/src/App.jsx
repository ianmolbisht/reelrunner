import { useMemo, useState } from "react";

const DEFAULT_ENDPOINT = "http://localhost:8000/generate";

function App() {
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState(30);
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseData, setResponseData] = useState(null);

  const payload = useMemo(
    () => ({
      genre: genre.trim(),
      duration_seconds: Number(duration),
      gemini_api_key: apiKey.trim(),
    }),
    [genre, duration, apiKey]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResponseData(null);

    if (!payload.genre) {
      setError("Keywords are required.");
      return;
    }

    if (!payload.gemini_api_key) {
      setError("Gemini API key is required.");
      return;
    }

    if (payload.duration_seconds < 1 || payload.duration_seconds > 30) {
      setError("Duration must be between 1 and 30 seconds.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";
      let body;
      if (contentType.includes("application/json")) {
        body = await response.json();
      } else {
        body = { raw: await response.text() };
      }

      if (!response.ok) {
        throw new Error(
          body?.message || body?.detail || `Request failed with status ${response.status}`
        );
      }

      setResponseData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card">
        <h1>ReelRunner</h1>
        <p className="subtitle">Create a backend-ready JSON request for reel generation.</p>

        <form onSubmit={handleSubmit} className="form">
          <label>
            Enter keywords for story generation
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Enter keywords for story generation"
              required
            />
          </label>

          <label>
            Duration (max 30 sec)
            <input
              type="number"
              min="1"
              max="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </label>

          <label>
            Gemini API Key
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your key"
              required
            />
          </label>

          <label>
            Backend Endpoint
            <input
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="http://localhost:8000/generate"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send JSON to Backend"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <div className="output-grid">
          <div>
            <h2>JSON Payload</h2>
            <pre>{JSON.stringify(payload, null, 2)}</pre>
          </div>

          <div>
            <h2>Backend Response</h2>
            <pre>{responseData ? JSON.stringify(responseData, null, 2) : "No response yet."}</pre>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;

