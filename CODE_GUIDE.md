# Daylight code guide

## Project files

- `index.html` — sign-in UI, dashboard, graphs, navigation, agent directory, and browser-side API calls.
- `server.js` — Express server, sample data, Google credential verification, application token issuance, and REST endpoints.
- `package.json` — server scripts and dependencies.
- `.env.example` — local configuration template. Copy it to `.env` before running.
- `AGENT_API_LINKS.md` — local route list plus official Google integration references.

## Google sign-in: how it works

1. The browser loads the Google Identity Services client and requests `/api/config` to get the public Web client ID.
2. The user selects a starting agent and signs in with Google.
3. Google returns an ID credential to `handleGoogleCredential()` in `index.html`.
4. The browser sends that credential to `POST /api/auth/google`.
5. `server.js` calls `OAuth2Client.verifyIdToken()` with the configured client ID as the expected audience. It rejects unverified email claims and requests from an unexpected origin.
6. The backend returns a Daylight-signed token with an eight-hour expiry. Authenticated browser requests send it as `Authorization: Bearer …`.
7. `requireAuth()` verifies that token before the dashboard APIs return personal workspace data.

The UI stores the short-lived Daylight token in `sessionStorage`; it does not store Google's raw ID credential. The user identity and selected agent ID are separate: Google authenticates the person, and the agent selector chooses the working role.

## Agent roles and work ownership

| Agent | Responsibility | Main API route |
| --- | --- | --- |
| Task Management Agent | Creates tasks, tracks completion, highlights due dates and follow-ups. | `/api/tasks` |
| Finance Agent | Summarizes expenses, budget usage, and remaining funds. | `/api/finance/summary`, `/api/finance/expenses` |
| Document Agent | Tracks document records and renewal/expiry reminders. | `/api/documents` |
| Shopping Agent | Maintains a shopping list; live product recommendations need a store integration. | `/api/shopping` |
| Scheduling Agent | Lists and adds appointments and time blocks. | `/api/schedule` |
| Central Coordinator | Breaks a request into specialist steps and returns a suggested plan for review. | `/api/agents/central-coordinator/run` |

Agent plans are suggestions only. This first phase does not send emails, move money, book appointments, or make purchases.

## Useful code locations

- In `index.html`, find `handleGoogleCredential()` and `initGoogle()` for the sign-in browser flow.
- In `server.js`, find `POST /api/auth/google` for token verification and token issuance.
- In `server.js`, find `requireAuth()` for protecting application APIs.
- In `server.js`, find the `/api/agents/:id/run` route for the first multi-agent planning response.
- In `index.html`, find `runAgent()` for displaying the suggested steps in a review dialog.
- In `index.html`, find `loadApiData()` for loading authenticated dashboard data into the views and charts.

## Local setup notes

The Google Identity Services button needs a Google Cloud **Web application** OAuth client. Set its authorized JavaScript origin to `http://localhost:3000`, then put the client ID in `.env`. Keep `.env` private. This local prototype uses a memory-backed sample dataset, so its records reset when the server stops.

Google's recommended approach is to verify the ID token on the server using an official client library, matching the intended client ID audience. The current server does this with Google's Node auth library. For production, add persistent users and data, CSRF defenses for the chosen auth flow, rate limits, secure deployment configuration, and access controls for external API scopes.
