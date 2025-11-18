# Login System (Supabase + HTML/JS)

This is a minimal demo of a login/register flow using Supabase (SQL) with a static frontend (HTML, CSS, vanilla JS).

Features
- Email/password sign up
- Email/password sign in
- Simple dashboard page that shows the authenticated user's email
- Uses the supabase-js ESM CDN (no build step required)

Prerequisites
- Node.js (for running the static server) — optional if you serve files another way
- A Supabase project (https://app.supabase.com)

Quick start
1. Create a Supabase project and note your Project URL and anon/public API key.
2. Open `login-system/supabaseConfig.js` and replace the placeholders with your values.
3. Choose one of the following ways to run:

**Option A: Using npm + serve (requires Node.js)**
```powershell
npm install
npm run start
```
Then open http://localhost:3000

**Option B: Using Live Server extension (VS Code)**
- Right-click on `index.html` and select "Open with Live Server"
- Live Server will open the page in your default browser (usually http://127.0.0.1:5500)

Notes
- Signup uses `supabase.auth.signUp({ email, password })`. Supabase may require email confirmation depending on your project auth settings.
- Sign in uses `supabase.auth.signInWithPassword({ email, password })`.
- After login the client redirects to `dashboard.html`, which checks the session with Supabase and displays the user's email.
- Keys are now stored in environment variables for security (not in the repo).

## Deploy to Vercel

1. **Push your code to GitHub:**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/login-system.git
   git branch -M main
   git push -u origin main
   ```

2. **Go to https://vercel.com and sign up (or log in)**

3. **Import your GitHub repo:**
   - Click "Add New..." > "Project"
   - Select your GitHub repo
   - Click "Import"

4. **Set environment variables in Vercel dashboard:**
   - In the project settings, go to "Settings" > "Environment Variables"
   - Add two new variables:
     - `VITE_SUPABASE_URL` = `https://nqchsbvdsfvbwqkowyrx.supabase.co` (your URL)
     - `VITE_SUPABASE_ANON_KEY` = your anon key
   - Click "Save"

4. **Deploy:**
   - Vercel will auto-deploy when you push to `main`, or click "Redeploy" manually

Your site will be live at: `https://<your-project>.vercel.app` (or your custom domain)

## Notes about environment variables and runtime config

This project reads public Supabase keys at runtime from a serverless endpoint (`/api/config`) so the client never needs keys stored in source.

On Vercel (recommended):
1. In your Vercel project settings add Environment Variables (Settings → Environment Variables):
   - `SUPABASE_URL` = `https://...supabase.co`
   - `SUPABASE_ANON_KEY` = your anon/public key

2. Vercel serverless functions (the `api/` folder) can access `process.env` and will return these values to the client at `/api/config`.

Local development options:
- Option A: Copy `.env.local.example` to `.env.local` and fill values. If you use a local dev server that can proxy `/api/config` to return the values (or use a local dev adapter that supports serverless functions), the app will run the same as on Vercel.
- Option B (quick): For quick local testing with Live Server, edit `supabaseConfig.js` temporarily to set `window.__SUPABASE_URL` and `window.__SUPABASE_ANON_KEY` before your app code runs (only for local testing; do not commit those values).

## Local development with environment variables

1. Create `.env.local` from `.env.local.example`:
   ```powershell
   Copy-Item .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase keys

3. Run with Live Server or npm start as before
- If you want a stronger protection on the dashboard, create a server-side check or verify sessions on the server before returning sensitive data.

## Troubleshooting: Login Not Working on Live Server

If login doesn't work on your live Vercel deployment, follow these steps:

### Step 1: Check Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Verify these variables are set:
   - `SUPABASE_URL` = your Supabase project URL (e.g., `https://xxx.supabase.co`)
   - `SUPABASE_ANON_KEY` = your public anon key

**❌ If missing:** Add them and redeploy

### Step 2: Check Browser Console for Errors
1. Open your deployed site on Vercel
2. Press **F12** to open Developer Tools
3. Click the **Debug Info** button on the login page
4. Look for error messages in:
   - The debug panel
   - The **Console** tab

**Common errors:**
- `❌ Supabase configuration not found` → Environment variables not set on Vercel
- `Failed to fetch /api/config` → API endpoint not working
- `Invalid login credentials` → Wrong email/password or user doesn't exist

### Step 3: Verify Supabase Project Settings
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy your Project URL and Anon Key
5. Verify they match what's in your Vercel environment variables

### Step 4: Test the API Endpoint
1. In your browser, visit: `https://your-vercel-app.vercel.app/api/config`
2. You should see JSON with your Supabase credentials:
   ```json
   {
     "SUPABASE_URL": "https://xxx.supabase.co",
     "SUPABASE_ANON_KEY": "your-key-here"
   }
   ```

**❌ If you see an error:** The API function is not accessible. This usually means environment variables aren't set.

### Step 5: Check User Exists in Supabase
1. Go to https://app.supabase.com → Your Project
2. Click **Authentication** → **Users**
3. Verify the user you're trying to log in with exists
4. If not, use the login page to sign up a new user first

### Step 6: Redeploy After Changes
After setting environment variables, you **must redeploy**:
1. Go to your Vercel project
2. Click **Deployments**
3. Find your latest deployment
4. Click **...** → **Redeploy**

Or simply push a new commit to trigger auto-deploy.

### Step 7: Check CORS and Auth Settings
In your Supabase project:
1. Go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, make sure your Vercel URL is listed:
   ```
   https://your-project.vercel.app
   https://your-project.vercel.app/dashboard.html
   ```
3. Under **Site URL**, set it to: `https://your-project.vercel.app`

Files of interest
- `index.html` — login & signup UI
- `dashboard.html` — protected UI after login
- `style.css` — styles
- `script.js` — client-side auth logic
- `supabaseConfig.js` — Supabase initialization with fallback strategies
- `api/config.js` — Vercel API endpoint for runtime config


