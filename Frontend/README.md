# ReelRunner Frontend

Vite + React frontend that collects:
- video genre
- duration (1 to 30 seconds)
- Gemini API key

It builds a JSON payload and POSTs it to a backend endpoint.

## Run

```bash
cd Frontend
npm install
npm run dev
```

Default backend endpoint is `http://localhost:8000/generate` and can be changed from the UI.
