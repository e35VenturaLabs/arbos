// Arbos web: serves the chat app and forwards a short list of relay calls under the same
// origin. Each browser pairs once with a relay pairing code; its device token stays here
// (sessions.json, 0600) and the browser only holds an httpOnly cookie.
import http from 'node:http';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join, extname, normalize } from 'node:path';

const LISTEN_HOST = (process.env.ARBOS_WEB_HOST || process.env.AGENT_STORE_HOST) || '127.0.0.1';
const LISTEN_PORT = Number((process.env.ARBOS_WEB_PORT || process.env.AGENT_STORE_PORT) || 8481);
const RELAY = ((process.env.ARBOS_WEB_RELAY || process.env.AGENT_STORE_RELAY) || 'http://127.0.0.1:7711').replace(/\/$/, '');
const DATA = (process.env.ARBOS_WEB_DATA || process.env.AGENT_STORE_DATA) || '/root/agent-store';
const PUBLIC = new URL('./public/', import.meta.url).pathname;
const SESSIONS = join(DATA, 'sessions.json');
const DIRECTORY = join(DATA, 'agents.json');
const COOKIE = 'as_sid';

// The relay calls the app may make, and nothing else.
const ALLOWED = [
  ['GET', /^\/me$/],
  ['GET', /^\/chats$/],
  ['GET', /^\/chats\/[0-9A-Z]{26}\/export$/],
  ['POST', /^\/chats\/[0-9A-Z]{26}\/messages$/],
  ['PUT', /^\/chats\/[0-9A-Z]{26}\/read$/],
  ['GET', /^\/outside-agents$/],
  ['GET', /^\/avatar-colors$/],
];

let sessions = {};
try { sessions = JSON.parse(await readFile(SESSIONS, 'utf8')); } catch { sessions = {}; }
async function saveSessions() {
  const tmp = SESSIONS + '.tmp';
  await writeFile(tmp, JSON.stringify(sessions, null, 1), { mode: 0o600 });
  await rename(tmp, SESSIONS);
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };

function cookieOf(req) {
  const m = (req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]+)`));
  return m ? m[1] : null;
}
function session(req) { const id = cookieOf(req); return id && sessions[id] ? { id, ...sessions[id] } : null; }
function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers });
  res.end(data);
}
async function body(req, limit = 64_000) {
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > limit) throw new Error('too large'); chunks.push(c); }
  return Buffer.concat(chunks);
}
function secure(req) { return (req.headers['x-forwarded-proto'] || '') === 'https' || !/^(127\.0\.0\.1|localhost)(:|$)/.test(req.headers.host || ''); }

async function relay(method, path, token, payload) {
  const r = await fetch(RELAY + path, { method, headers: { ...(token ? { authorization: 'Bearer ' + token } : {}),
    ...(payload ? { 'content-type': 'application/json' } : {}) }, body: payload });
  return r;
}

async function app(req, res) {
  const url = new URL(req.url, 'http://x');
  const path = url.pathname;

  if (path === '/app/session' && req.method === 'GET') {
    const s = session(req);
    return send(res, 200, { paired: !!s, name: s?.name || null });
  }
  if (path === '/app/pair' && req.method === 'POST') {
    let code = '';
    try { code = String(JSON.parse(await body(req)).code || '').replace(/\D/g, ''); } catch {}
    if (!/^\d{6}$/.test(code)) return send(res, 400, { error: 'Enter the 6-digit code.' });
    const ua = req.headers['user-agent'] || '';
    const name = 'Web · ' + (/iPhone/.test(ua) ? 'iPhone' : /Mac/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android' : 'browser');
    const r = await relay('POST', '/pair', null, JSON.stringify({ code, name }));
    if (!r.ok) return send(res, 400, { error: 'That code did not work. It may have expired (codes last one hour) or already been used. Get a new one.' });
    const d = await r.json();
    const id = randomBytes(24).toString('base64url');
    sessions[id] = { token: d.device_token, device_id: d.device_id, name, created: Date.now() };
    await saveSessions();
    return send(res, 200, { paired: true }, { 'set-cookie': `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${secure(req) ? '; Secure' : ''}` });
  }
  if (path === '/app/logout' && req.method === 'POST') {
    const s = session(req);
    if (s) {
      try { await relay('DELETE', '/auth/devices/' + s.device_id, s.token); } catch {}
      delete sessions[s.id]; await saveSessions();
    }
    return send(res, 200, { ok: true }, { 'set-cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` });
  }
  if (path === '/app/palette' && req.method === 'GET') {
    // The avatar palette is public on the relay too; the sign-in screen draws its discs from it.
    const r = await relay('GET', '/avatar-colors');
    return send(res, r.status, Buffer.from(await r.arrayBuffer()), { 'cache-control': 'public, max-age=3600' });
  }
  if (path === '/app/directory' && req.method === 'GET') {
    if (!session(req)) return send(res, 401, { error: 'not paired' });
    let list = [];
    try { list = JSON.parse(await readFile(DIRECTORY, 'utf8')); } catch {}
    return send(res, 200, list.map(({ name, description, project_id, chat_id, kind, category }) =>
      ({ name, description, project_id, chat_id, kind: kind || 'outside', category: category || null })));
  }
  if (path.startsWith('/api/')) {
    const s = session(req);
    if (!s) return send(res, 401, { error: 'not paired' });
    const rp = path.slice(4);
    if (!ALLOWED.some(([m, re]) => m === req.method && re.test(rp))) return send(res, 404, { error: 'not here' });
    const payload = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await body(req) : undefined;
    const r = await relay(req.method, rp + url.search, s.token, payload);
    if (r.status === 401) { delete sessions[s.id]; await saveSessions(); }
    const out = Buffer.from(await r.arrayBuffer());
    return send(res, r.status, out, { 'content-type': r.headers.get('content-type') || 'application/json' });
  }
  if (path.startsWith('/export/blob/') && req.method === 'GET') {
    // Signed attachment links from an export; the signature is the credential.
    const r = await fetch(RELAY + path + url.search);
    res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'private, max-age=3600' });
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'method' });
  const file = normalize(join(PUBLIC, path === '/' || !extname(path) ? 'index.html' : path));
  if (!file.startsWith(PUBLIC)) return send(res, 404, { error: 'not found' });
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream',
      'cache-control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=300',
      'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' });
    res.end(data);
  } catch { send(res, 404, { error: 'not found' }); }
}

http.createServer((req, res) => app(req, res).catch(err => {
  console.error(new Date().toISOString(), req.method, req.url.split('?')[0], err.message);
  if (!res.headersSent) send(res, 502, { error: 'relay unavailable' }); else res.end();
})).listen(LISTEN_PORT, LISTEN_HOST, () => console.log(`agent-store web on http://${LISTEN_HOST}:${LISTEN_PORT} -> ${RELAY}`));
