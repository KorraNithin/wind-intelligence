# Deployment checklist

The generated source files do not automatically create public hosting accounts or publish a GitHub repository. Complete these steps using your own accounts.

## 1. GitHub

1. Create a **public** repository with a random anonymous name, for example `kjhwr`.
2. Extract the zip and push the contents of the `wind-intelligence/` folder to the repository root.
3. Check that `.env`, secrets, `node_modules`, and virtual environments are not committed.
4. Confirm the README is visible without signing in.

Example commands:

```bash
git init
git add .
git commit -m "Build wind forecast analysis pilot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_RANDOM_REPO.git
git push -u origin main
```

## 2. Backend deployment

Use a Docker-capable web service such as Render.

- Root directory: `backend`
- Dockerfile: `Dockerfile`
- Health check path: `/api/health`
- Environment variables:
  - `ELEXON_BASE_URL=https://data.elexon.co.uk/bmrs/api/v1`
  - `DEMO_FALLBACK=true` during initial demo setup; change to `false` only after live API retrieval is verified
  - `CORS_ORIGINS=https://YOUR-FRONTEND-DOMAIN.vercel.app`

After deployment, open `https://YOUR-BACKEND-DOMAIN/api/health` and `https://YOUR-BACKEND-DOMAIN/docs`.

## 3. Frontend deployment

Deploy `frontend` as a Vercel project.

- Root directory: `frontend`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN` (no trailing slash)

Redeploy after setting environment variables. Test the dashboard and browser console.

## 4. Verify access

Open all of the following in a private/incognito window:
- Public GitHub repository
- Deployed frontend
- Backend `/api/health`
- Video set to **Unlisted** on YouTube

Confirm the app loads without authentication, API calls succeed, no localhost URL is used in production, and synthetic demo data is visibly labelled.

## 5. Before submission

Update README with real public URLs. Do not invent or submit placeholder URLs. Record the demo script in `VIDEO_SCRIPT.md`, keep the total video under 10 minutes, and include both customer and technical sections.
