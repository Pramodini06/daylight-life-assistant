# Daylight — Intelligent Personal Life Assistant

Phase 1 is a local full-stack prototype: a responsive dashboard, six named agents, a Node/Express API, and Google Identity Services sign-in with server-side ID-token verification.

## Run locally (Command Prompt)

1. Open Command Prompt and enter the output folder:

   ```cmd
   cd /d "C:\Users\pramo\Documents\Codex\2026-11-12\agentic-ai-intelligent-personal-life-assistant\outputs"
   ```

2. Install the server dependencies and make a local environment file:

   ```cmd
   npm install
   copy .env.example .env
   notepad .env
   ```

3. Create a **Web application** OAuth client in Google Cloud. Add `http://localhost:3000` as an authorized JavaScript origin. Copy its client ID into `GOOGLE_CLIENT_ID` in `.env`; set `APP_ORIGIN=http://localhost:3000` and replace `APP_JWT_SECRET` with a long random secret.

4. Start the app and open the local address:

   ```cmd
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000). Use the Google button to authenticate, then choose which agent workspace to start in. The demo-mode button opens the sample dashboard without Google.

Google's web client ID is public configuration; do not put a Google client secret in the browser. Sign-in uses the Google Identity Services button and posts its credential to the backend. The backend verifies the token and audience before issuing a short-lived Daylight API token. See [CODE_GUIDE.md](CODE_GUIDE.md) for the flow and code map.

## Dashboard and API

- Overview: daily priorities, upcoming appointments, spending trend, and agent responsibilities.
- Specialist views: tasks, schedule, finances, documents, shopping, and agent directory.
- Supported API actions: list and add tasks, mark tasks complete, track expenses, add/remove document reminders, manage shopping items, add schedule entries, and request a suggested agent plan.
- API endpoint list: [AGENT_API_LINKS.md](AGENT_API_LINKS.md).

The financial chart and example records are illustrative. The backend keeps a separate in-memory workspace per Google account, so changes reset when its process restarts. Email, bank, calendar, shopping-store, and cloud-drive accounts are not connected yet. Production deployment needs a persistent database, secure session/token handling, CSRF protections, rate limiting, and review of each external API's permissions.
