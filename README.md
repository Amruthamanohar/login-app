# Login App

A signup/login/home-page app with a real shared backend, so accounts work
for anyone who visits it — not just in one browser.

## What's inside

- `server.js` — a plain Node.js server (no npm install needed). Handles
  signup, login, and session checks. Passwords are hashed with scrypt
  (never stored in plain text).
- `users.json` — where accounts are stored. Created automatically on first
  signup.
- `public/signup.html`, `public/login.html`, `public/home.html` — the
  pages your visitors see.

## Run it locally

```
node server.js
```

Then open `http://localhost:3000` in a browser. Sign up, then log in —
you'll land on the home page with "Welcome, [your username]!".

## Making it a real shared website (a link you can send anyone)

Right now this only runs on your own computer. To get a public link that
anyone can open and use, you need to put it on a hosting service. Here's
the simplest free option:

**Render.com (free tier)**
1. Create a free account at render.com (you'll do this yourself — sign-ups
   aren't something I can do on your behalf).
2. Put this `login-app` folder in a GitHub repository (Render deploys from
   GitHub).
3. In Render, choose "New Web Service", connect the repo, and set:
   - Build command: (leave blank — no dependencies to install)
   - Start command: `node server.js`
4. Deploy. Render gives you a public URL like
   `https://your-app-name.onrender.com` — that's the link you share.

Other similar free options: Railway.app, Cyclic.sh, Glitch.com.

## One important limitation to know

`users.json` is a plain file on the server's disk. On most free hosting
tiers (including Render's free plan), the disk resets whenever the app
restarts or redeploys — so accounts can get wiped periodically. This is
fine for a demo or for sharing with a few friends to try out. If you want
accounts to persist permanently and reliably, the next step up would be a
proper database (e.g. a free-tier Postgres or MongoDB instance) instead of
`users.json` — happy to build that version if you want to go that route.
