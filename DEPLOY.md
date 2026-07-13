# Getting a real link to share with friends

Follow these steps yourself — account creation and sign-ups aren't
something I can do on your behalf. This uses GitHub's web uploader, so no
command-line tools are needed.

## Step 1: Create a GitHub account (skip if you already have one)

Go to https://github.com/signup and create a free account.

## Step 2: Create a new repository

1. Once logged in, click the "+" icon top-right → "New repository".
2. Name it something like `login-app`.
3. Leave it Public, don't add a README (you already have one).
4. Click "Create repository".

## Step 3: Upload your files

1. On the new repo's page, click "uploading an existing file".
2. From your computer, drag in everything from the `login-app` folder
   I gave you: `server.js`, `package.json`, `README.md`, and the whole
   `public` folder (with `signup.html`, `login.html`, `home.html` inside).
   - Skip any hidden `.git` folder if you see one — that's leftover
     clutter from my side and isn't needed.
   - Skip `users.json` and `server.log` if present — those get created
     automatically when the app runs.
3. Scroll down and click "Commit changes".

## Step 4: Create a Render account

Go to https://render.com and sign up (the free tier works fine for this).

## Step 5: Deploy

1. In Render, click "New +" → "Web Service".
2. Connect your GitHub account, then select the `login-app` repo you just
   created.
3. Fill in:
   - **Build command:** leave blank
   - **Start command:** `node server.js`
   - **Instance type:** Free
4. Click "Create Web Service".

Render will build and start it — takes a couple of minutes. When it's
done, you'll get a public URL like:

```
https://login-app-xxxx.onrender.com
```

That's the link you send your friends. They go to
`https://login-app-xxxx.onrender.com/signup.html` to create an account,
then log in from `https://login-app-xxxx.onrender.com/login.html`.

## Heads-up on the free tier

- Render's free web services "sleep" after 15 minutes of no traffic — the
  first visit after that takes ~30 seconds to wake back up. Normal for
  free hosting, not a bug.
- Accounts are stored in a file on the server. On the free tier, that file
  can get wiped when the service restarts or redeploys. Fine for casual
  sharing with friends; if you want accounts to survive long-term, the
  next step is swapping in a real database — let me know if you want that
  built.
