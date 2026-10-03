# Public Deployment

This repository is configured for a Vercel frontend and a Render API. The app is globally reachable after both services are deployed and configured; local development URLs such as `localhost` are not public URLs.

## 1. Deploy the API to Render

1. Push this repository to a Git provider and create a Render Blueprint from it. Render will read `render.yaml` and create the `pinlearn-api` web service.
2. Set the prompted environment values in Render. `MONGODB_URI` must point to a publicly reachable MongoDB deployment such as MongoDB Atlas, not a database running on your PC. Set `JWT_SECRET`, `GITHUB_TOKEN`, `YOUTUBE_API_KEY`, and `QUIZ_API_KEY` to the existing backend secrets. Never commit those values.
3. After the service is live, verify `https://<render-service>.onrender.com/api/health` returns `{"status":"ok"}`.

## 2. Deploy the frontend to Vercel

1. Import the same repository into Vercel and set the project root directory to `Pinterest`.
2. Add the build environment variable `REACT_APP_API_URL` with the Render API origin, for example `https://pinlearn-api.onrender.com` (no trailing slash).
3. Deploy the project. `Pinterest/vercel.json` routes React Router paths back to the app, so direct links work too.

## 3. Restrict API access to the frontend

Set Render's `CORS_ORIGINS` to the exact Vercel production origin, for example `https://pinlearn.vercel.app`. Include any custom domain and any local development origins you still use, separated by commas. Redeploy/restart the API after changing it.

Once configured, open the Vercel URL from any device with internet access. Both services use HTTPS, and devices do not need to share a Wi-Fi network.