# Artifice

Artifice is a learning and community platform for people who want to build software by doing. Read and share technology posts, choose a guided project, and track your learning progress.

**Live site:** [artifice.onrender.com](https://artifice.onrender.com)

## What you can do

- Browse community posts and publish, edit, or delete your own posts.
- Explore project guides before starting a project.
- Work through projects in ordered sprints with goals, hints, and completion checks.
- Build the Text Analyzer project in JavaScript or Python.
- View your profile, project progress, and code submission history.
- Sign in or create an account with Google. Existing password accounts can still sign in.

The HTTP server and Invisible Character Inspector projects are currently on hold. The Hello Server project is listed as coming soon.

## Tech stack

- Frontend: HTML, CSS, and JavaScript
- Backend: Node.js and Express
- Database: MongoDB with Mongoose
- Authentication: Google Identity Services with server-side ID-token verification; Artifice API sessions use JWTs
- Hosting: Render

## Run locally

Requirements: Node.js 20 or newer and a MongoDB connection.

1. Clone the repository and install backend dependencies:

   ```sh
   git clone https://github.com/waquar-zero/Artifice.git
   cd Artifice/backend
   npm ci
   ```

2. Copy `.env.example` to `.env` and set at least:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/artifice
   JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
   GOOGLE_CLIENT_ID=your-google-web-client-id
   ```

   Create a Google OAuth Web application client. Add `http://localhost:5000` as an authorized JavaScript origin and use its client ID for `GOOGLE_CLIENT_ID`. The client ID is public; never put a client secret in frontend code.

3. Start the backend and frontend (the backend serves both):

   ```sh
   npm run dev
   ```

4. Visit [http://localhost:5000](http://localhost:5000).

To initialize or update project data in your selected database, run `npm run seed` from `backend/`.

## Deployment

The Render Blueprint is defined in [`render.yaml`](render.yaml). Configure `MONGO_URI`, `JWT_SECRET` (at least 32 characters), and `GOOGLE_CLIENT_ID` in the Render service environment. The frontend and API are served from the same origin, so `CORS_ORIGINS` can stay unset for the standard deployment.

## Current execution limits

Code submission and execution are disabled in production and return HTTP 503 until an isolated execution sandbox is configured. The development runner starts submitted code as a host child process and is not safe for public, untrusted submissions.

## Backend tests

Run these from `backend/`:

```sh
npm test
npm run test:http
npm run test:tcp
npm run test:process
```

The integration suite requires `TEST_MONGO_URI` and uses a uniquely named test database:

```sh
TEST_MONGO_URI=mongodb://127.0.0.1:27017/artifice npm run test:integration
```

See [`backend/API.md`](backend/API.md) for the API contract and [`DEPLOYMENT.md`](DEPLOYMENT.md) for the Render deployment guide.
