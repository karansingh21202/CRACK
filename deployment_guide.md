# Deployment Guide

## 1. Git Repository Structure (Monorepo)
You asked if you should use two repos or one. **Using one repo (the existing one) is best.**
Your project structure already supports this:
```
/ (Root)       -> Frontend Code (React/Vite)
/server        -> Backend Code (Node/Express)
```
You can push this entire folder to GitHub as a single repository.

### How to Push
1.  Open your terminal in `d:\Crack`.
2.  Run these commands:
    ```bash
    git add .
    git commit -m "Added backend server and multiplayer features"
    git push origin main
    ```

---

## 2. Deploying the Backend (Server)
Since your backend is in a subfolder (`/server`), you need to tell the hosting provider where to look.

**Recommended Host: Render.com (Free Tier)**
1.  Create a new **Web Service**.
2.  Connect your GitHub repository.
3.  **Settings**:
    *   **Root Directory**: `server` (Important! This tells it to look in the server folder)
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
4.  Click **Deploy**.
5.  Once finished, Render will give you a URL (e.g., `https://crack-backend.onrender.com`). **Copy this URL.**

---

## 3. Deploying the Frontend (Client)
You likely already have this on Vercel or Netlify. You just need to update it to talk to your new backend.

**On Vercel/Netlify:**
1.  Go to your project settings.
2.  Find **Environment Variables**.
3.  Add a new variable:
    *   **Name**: `VITE_SERVER_URL`
    *   **Value**: The URL you copied from Render (e.g., `https://crack-backend.onrender.com`)
4.  **Redeploy** the frontend (or push a small change to trigger a rebuild).

---

## FAQ
**Q: Why fallback to localhost?**
A: The code `import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'` means:
-   "If I am on the live website, use the `VITE_SERVER_URL` setting."
-   "If I am on Karan's laptop (where no setting exists), just use `localhost:4000`."
This lets you code locally without breaking the live site.

**Q: Can I have multiple server URLs?**
A: You only need one active server URL at a time. By using the Environment Variable (`VITE_SERVER_URL`), you can change which server your frontend talks to just by changing the setting in Vercel, without touching the code!
