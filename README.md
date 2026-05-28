# Reel Runner - Short-Form Video Generator

Reel Runner is a premium, glassmorphic short-form video generation dashboard. The application is designed as a streamlined, consumer-focused product using Indian Rupees (₹) for all pricing matrices, featuring a stateful database backend and a mobile responsive navigation system.

---

## Key Features

1. **Short Video Templates**: Choose from pre-configured video styles (Comedy & Meme, Cinematic Action, Spooky Horror, Facts & Curiosities, Vintage Historic, and Science & Universe) to generate short vertical videos instantly.
2. **Custom Video Creator**: Select custom duration parameters (from 15 to 120 seconds) and input custom topics/keywords to calculate dynamic generation fees.
3. **Pristine Consumer Phrasing**: All technical developer jargon (such as pipeline nodes, GPU rendering, and CORS protocols) has been fully removed, replaced by end-user terminology (such as cloud rendering, video generation servers, and receipts).
4. **INR Currency Integration**: Account balances, custom builder rates, and template cards are fully mapped to Rupees (₹) with realistic costs and automatic statistical chips.
5. **Persistent User Database**: Powered by an Express and SQLite backend server that securely manages user registration, login authentication, secure session tokens, wallet deductions, and persistent generation history logs.
6. **Native Mobile App Layout**: Fits seamlessly on mobile devices, automatically collapsing the desktop sidebar into a glassmorphic bottom navigation dock, scaling vertical vertical players, and exposing a mini account statistics widget in the header.

---

## File Structure

* `index.html` - Premium glassmorphic interface and modal layers.
* `styles.css` - Custom CSS styling sheets and responsive media queries.
* `app.js` - Global state machines, pricing engines, and server connectors.
* `server.js` - Express backend authentication routes, database setup, and transaction log APIs.
* `package.json` - Dependency lists and standard run scripts.

---

## Server Configuration

All server addresses and authorization keys are configured directly in the code, eliminating the need for settings panels in the user interface.

Open [app.js](file:///C:/Users/anmol/.gemini/antigravity/scratch/reel-runner-frontend/app.js) and configure the variables at the very top of the file:
```javascript
// --- Server & Credentials Configuration ---
const BACKEND_TUNNEL_URL = "https://your-server.com"; // Replace with your actual localtunnel URL
const GEMINI_API_KEY = ""; // Replace with your actual Gemini API Key (Optional)
```

---

## Running the Application Locally

Follow these instructions to run the entire stack on your local device:

### 1. Launch the Backend Server
The server manages user registration, logins, balance checks, and persistent history logs.

1. Open your terminal.
2. Navigate to the project directory:
   ```bash
   cd "C:\Users\anmol\.gemini\antigravity\scratch\reel-runner-frontend"
   ```
3. Install package dependencies:
   ```bash
   npm install
   ```
4. Start the database backend:
   ```bash
   npm start
   ```
   The terminal will output: `Connected to SQLite Database` and `Reel Runner Backend listening at http://localhost:5000`.

### 2. Launch the Frontend Interface
1. Go to the project folder `C:\Users\anmol\.gemini\antigravity\scratch\reel-runner-frontend` in your file explorer.
2. Double-click **index.html** to open the dashboard directly in your web browser.
3. To view or register users, use the login card. To bypass database setup, click **Enter as Demo Guest** to instantly receive a credit balance of ₹5000.00.

### 3. Test Mobile App Viewports
1. Right-click anywhere on the dashboard page in Chrome or Edge and click **Inspect** (or press F12).
2. Toggle the device toolbar icon in the inspector panel.
3. Select any standard phone model to preview the fixed bottom glassmorphic dock, header balance chip, stacked forms, and responsive video scaling.
