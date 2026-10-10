# Backend API contract

Base URL: `http://localhost:5000/api`. JSON requests use `Content-Type: application/json`. Protected routes require `Authorization: Bearer <token>`. Errors use `{ success: false, message }`.

| Method and path | Auth | Request | Success |
| --- | --- | --- | --- |
| `POST /auth/register` | No | `{ name, email, password }` | `201 { success, message, data: { id, name, email } }` |
| `POST /auth/login` | No | `{ email, password }` | `200 { success, message, data: { token, user } }`; token lasts 7 days |
| `GET /auth/me` | Yes | — | `200 { success, data: user }` |
| `GET /projects` | No | — | `200 { success, count, data: Project[] }` |
| `GET /projects/:id` | No | — | `200 { success, data: Project }` |
| `GET /sprints/project/:projectId` | No | — | `200 { success, count, data: Sprint[] }`, ordered by `order` |
| `GET /sprints/:id` | No | — | `200 { success, data: Sprint }` |
| `GET /progress/:projectId` | Yes | — | `200 { success, data: Progress }`; creates initial progress on first request |
| `GET /sprints/:sprintId/hints?level=1` | Yes | — | `200 { success, data: { level, hints } }`; returns progressive hints for current or completed sprint |
| `POST /submissions/projects/:projectId/sprints/:sprintId` | Yes | `{ code, language }` | `201 { success, message, data: { submission, tests, progress } }` |
| `GET /submissions/projects/:projectId` | Yes | — | `200 { success, data: Submission[] }`; scoped to caller and omits `code` |
| `GET /health` | No | — | `200 { status, service }` |

Validation failures generally return `400`, missing records `404`, authentication failures `401`, and access/progress failures `403`. Duplicate registration returns `409`. Submission test details are in `data.tests` and persisted on `submission.testResults`; history omits submitted source code. A passing final sprint returns `progress.currentSprint: null` and all completed sprint IDs.

`GET /progress/:projectId` is the start/resume operation. There is intentionally no client-facing completion endpoint; only a passing submission advances progress. Project and sprint reads are public. The current CORS middleware permits all origins for local integration; restrict it before deployment.

## Current runner scope

The HTTP and TCP runners are registered. TCP checks cover the seeded connection, PING/PONG, raw HTTP request, multiple connection/request, malformed input, and process-survival cases. Sprint 2 now requires parsed method, path, and version values to appear in the raw response so those properties can be verified externally. HTTP header checks need a configured header name; response body checks need an expected body. The seeded sprint 3 specifies both.

The execution runner is development-only: student code runs as a host child process with a fixed project port, no sandbox/resource limits, and only one entrypoint file. Do not accept untrusted public code with this runner.

## Verification commands

- `npm test` — dispatcher validation checks.
- `npm run test:integration` — API workflow against MongoDB. Reads `TEST_MONGO_URI`, connects to a uniquely named `artifice_backend_test_<pid>` database, and removes only fixture records it creates.
- `npm run test:http` — HTTP runner smoke checks.
- `npm run test:tcp` — TCP runner smoke checks, including sequential requests.
- `npm run test:process` — process readiness and cleanup smoke check.

Submission and progress writes are separate MongoDB operations; no transaction is used. A database failure between them can leave a saved submission without an advanced progress record. The integration test covers the successful and failed paths, but not injected database failures or concurrent HTTP submissions.
