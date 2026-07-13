// Zero-dependency Node server: no npm install needed, just `node server.js`.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// In a real production app this must come from an environment variable.
// Kept simple here for demo/learning purposes.
const SECRET = process.env.APP_SECRET || 'demo-secret-change-me';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------- storage helpers ----------
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '{}');
  } catch (e) {
    return {};
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ---------- password hashing (scrypt, built into Node) ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

// ---------- simple signed session token (HMAC, similar idea to a JWT) ----------
function issueToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// ---------- request body parsing ----------
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) req.destroy(); // basic guard against huge payloads
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

// ---------- static file serving ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
};

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/signup.html' : pathname;
  filePath = path.normalize(path.join(PUBLIC_DIR, filePath));

  // Prevent path traversal outside the public directory.
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---------- API handlers ----------
async function handleSignup(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return sendJson(res, 400, { error: 'Invalid request body.' });
  }

  const { username, email, password } = body;
  if (!username || !email || !password) {
    return sendJson(res, 400, { error: 'Please provide username, email and password.' });
  }
  if (password.length < 6) {
    return sendJson(res, 400, { error: 'Password must be at least 6 characters.' });
  }

  const key = String(email).trim().toLowerCase();
  const users = readUsers();

  if (users[key]) {
    return sendJson(res, 409, { error: 'An account with this email already exists. Please log in instead.' });
  }

  users[key] = { username: String(username).trim(), passwordHash: hashPassword(password) };
  writeUsers(users);

  sendJson(res, 201, { message: 'Account created successfully.' });
}

async function handleLogin(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return sendJson(res, 400, { error: 'Invalid request body.' });
  }

  const { email, password } = body;
  if (!email || !password) {
    return sendJson(res, 400, { error: 'Please enter both email and password.' });
  }

  const key = String(email).trim().toLowerCase();
  const users = readUsers();
  const account = users[key];

  if (!account) {
    return sendJson(res, 401, { error: 'Wrong username or email. No account found — please sign up first.' });
  }
  if (!verifyPassword(password, account.passwordHash)) {
    return sendJson(res, 401, { error: 'Wrong password. Please try again.' });
  }

  const token = issueToken({ email: key, username: account.username });
  sendJson(res, 200, { token, username: account.username });
}

function handleMe(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    return sendJson(res, 401, { error: 'Session expired or not logged in.' });
  }
  sendJson(res, 200, { username: payload.username, email: payload.email });
}

// ---------- router ----------
const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && pathname === '/api/signup') return handleSignup(req, res);
  if (req.method === 'POST' && pathname === '/api/login') return handleLogin(req, res);
  if (req.method === 'GET' && pathname === '/api/me') return handleMe(req, res);

  if (req.method === 'GET') return serveStatic(req, res, pathname);

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Login app running at http://localhost:${PORT}`);
});
