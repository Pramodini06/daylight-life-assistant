# Agent API links

The local Daylight API is served from `http://localhost:3000`. Except for health/config and Google sign-in, requests require `Authorization: Bearer <daylight-token>`. Send JSON request bodies with `Content-Type: application/json`.

## Local Daylight routes

| Agent or service | Method and path | Purpose |
| --- | --- | --- |
| Health | `GET /api/health` | Check that the server is running. |
| Sign-in configuration | `GET /api/config` | Get the public Google client ID configuration. |
| Google sign-in | `POST /api/auth/google` | Verify the Google ID credential and return a Daylight API token. Body: `{ "credential": "…" }`. |
| Dashboard | `GET /api/overview` | Return summary counts, sample schedule, finance totals, documents, and agent roles. |
| Agent directory | `GET /api/agents` | List all six agents and their capabilities. |
| Agent plan | `POST /api/agents/{agent-id}/run` | Request a suggested plan. Body: `{ "request": "…" }`. IDs: `task-management-agent`, `finance-agent`, `document-agent`, `shopping-agent`, `scheduling-agent`, `central-coordinator`. |
| Tasks | `GET /api/tasks` · `POST /api/tasks` · `PATCH /api/tasks/{id}` | List, add (`{ "title": "…" }`), or update a task (`{ "done": true }`). |
| Finance | `GET /api/finance/summary` · `POST /api/finance/expenses` | Get sample budget analysis or add an expense (`{ "category": "Food", "amount": 450 }`). |
| Documents | `GET /api/documents` · `POST /api/documents` · `DELETE /api/documents/{id}` | List reminders, add (`{ "name": "Passport", "date": "2027-03-12" }`), or remove one. |
| Schedule | `GET /api/schedule` · `POST /api/schedule` | List or add an event (`{ "title": "Call Sam", "time": "3:00 PM" }`). |
| Shopping | `GET /api/shopping` · `POST /api/shopping` · `DELETE /api/shopping/{item}` | List, add (`{ "name": "Oat milk" }`), or remove an item. |

Records are held in server memory for this first phase. These endpoints are local app APIs, not connected bank, calendar, email, or store-provider APIs.

## Official provider references for future integrations

- [Google Identity Services: get a Web client ID](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
- [Google Identity Services: display the sign-in button](https://developers.google.com/identity/gsi/web/guides/display-button)
- [Google Identity Services: verify ID tokens on your server](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Google Calendar API JavaScript quickstart](https://developers.google.com/workspace/calendar/api/quickstart/js)
- [Gmail API Node.js quickstart](https://developers.google.com/workspace/gmail/api/quickstart/nodejs)
- [Google Drive API client library downloads](https://developers.google.com/workspace/drive/api/guides/downloads)

The Google Calendar, Gmail, and Drive references are integration starting points. Their APIs are not enabled or called by this prototype yet; each requires OAuth consent, requested scopes, and user authorization.
