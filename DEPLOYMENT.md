# Deploy Artifice on Render

Artifice is deployed as one Node.js web service. It serves the frontend and `/api` from the same origin, so no separate frontend service is needed.

## Create the service

1. Open the Render Dashboard and choose **New → Blueprint**.
2. Connect `waquar-zero/Artifice` and select the `main` branch.
3. Render reads `render.yaml`. Add the required environment values when prompted:
   - `MONGO_URI`: the production MongoDB connection string.
   - `JWT_SECRET`: the production secret (at least 32 characters).
4. Review the service and create it. Render builds and starts the Node service.

The Blueprint uses `cd backend && npm ci --omit=dev` to install server dependencies, `cd backend && npm start` to start Express, and `/api/health` for health checks. Render supplies the listening `PORT`. `CORS_ORIGINS` can remain unset because the frontend and API share an origin.

## After the first deploy

- Wait for the Render deploy to complete, then open the generated `onrender.com` URL.
- Confirm `/api/health` returns `{"status":"ok","service":"build-platform-api"}`.
- Check account creation, sign-in, project pages, community posts, and profiles.
- This app uses the configured existing MongoDB database. The project seeder has already been run for that database; do not run it again unless the database contents need to be initialized.
- Code execution and submissions intentionally return HTTP 503 in production until an isolated execution sandbox is added.

## MongoDB network access

Allow connections from the Render service to the MongoDB deployment. Prefer a narrow allowlist or private networking if available; avoid opening the database broadly unless necessary. Render lists the service's outbound IP ranges in its dashboard under **Connect → Outbound**.

The Blueprint uses Render's free web service plan, which can spin down after inactivity. Its first request after a spin-down may take longer. A paid plan can be selected in Render if you want an always-on service.
