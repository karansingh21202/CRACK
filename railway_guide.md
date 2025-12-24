# Railway Deployment Guide (Backend)

Railway is great because it automatically detects your code, but since your server is in a subfolder (`/server`), we need to tell it where to look.

## Step 1: Create Project
1.  Go to [Railway.app](https://railway.app/) and Login (GitHub se login karein).
2.  Click **"New Project"** -> **"Deploy from GitHub repo"**.
3.  Select your repository (`CRACK`).
4.  Click **"Deploy Now"**.

## Step 2: Configure Root Directory (Important!)
*Abhi deployment fail ho sakta hai kyuki usse server code nahi milega. Ye fix karein:*

1.  Railway dashboard par apne project pe click karein.
2.  **"Settings"** tab mein jayein.
3.  Scroll down karke **"Root Directory"** dhoondhein.
4.  Wahan `/server` likhein aur Save karein.
    *   *Note: Sirf `server` ya `/server` try karein.*

## Step 3: Verify Build Command
Railway usually `package.json` padh leta hai, par agar issue aaye toh **"Settings"** -> **"Build"** mein check karein:
*   **Build Command:** `npm install && npm run build`
*   **Start Command:** `npm start`

## Step 4: Get the URL
1.  Jab deployment "Active" (Green) ho jaye.
2.  **"Settings"** -> **"Networking"** mein jayein.
3.  **"Generate Domain"** par click karein.
4.  Aapko ek link milega (e.g., `crack-production.up.railway.app`).
5.  **Ye link copy karein.**

## Final Step: Connect Frontend
Ab Vercel/Netlify par jayein aur Environment Variable update karein:
*   **Key:** `VITE_SERVER_URL`
*   **Value:** (Railway wala naya link)

Redeploy Frontend, and done! 🚂
