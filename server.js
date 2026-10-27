// Portfolio server: serves public/ and /api/repos (cjpsms repos from GitHub, merged with data/projects.json).
// Node stdlib only, no npm install needed.
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3265;
const HOST = process.env.HOST || '127.0.0.1';
const GH_USER = process.env.GH_USER || 'cjpsms';
const CACHE_MS = 10 * 60 * 1000;

const PUBLIC_DIR = path.join(__dirname, 'public');
const curated = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'projects.json'), 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

let cache = { at: 0, payload: null };

function fetchGitHubRepos() {
  const url = `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`;
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': `${GH_USER}-portfolio`,
        'Accept': 'application/vnd.github+json',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      timeout: 8000,
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`GitHub ${res.statusCode}`));
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('GitHub timeout')));
    req.on('error', reject);
  });
}

// Curated entries keep their Thai text/tags; GitHub adds language, dates.
// Public repos that aren't curated still show up, with their English description.
function merge(ghRepos) {
  const byName = new Map(ghRepos.filter((r) => !r.fork && !r.private).map((r) => [r.name.toLowerCase(), r]));
  const out = curated.repos.map((c) => {
    const gh = byName.get(c.name.toLowerCase());
    if (gh) byName.delete(c.name.toLowerCase());
    return {
      ...c,
      url: gh ? gh.html_url : `https://github.com/${GH_USER}/${c.name}`,
      homepage: (gh && gh.homepage) || c.homepage || null,
      language: (gh && gh.language) || c.language || null,
      updated: gh ? gh.pushed_at : null,
      live: Boolean(gh),
    };
  });
  for (const gh of byName.values()) {
    out.push({
      name: gh.name,
      th: gh.description || '',
      tags: ['อื่น ๆ'],
      url: gh.html_url,
      homepage: gh.homepage || null,
      language: gh.language,
      updated: gh.pushed_at,
      live: true,
    });
  }
  return out;
}

async function getRepos() {
  if (cache.payload && Date.now() - cache.at < CACHE_MS) return cache.payload;
  try {
    const gh = await fetchGitHubRepos();
    cache = { at: Date.now(), payload: { user: GH_USER, source: 'github', fetchedAt: new Date().toISOString(), repos: merge(gh) } };
  } catch (err) {
    console.error('[repos]', err.message);
    if (!cache.payload) {
      // No GitHub yet: serve the curated list so the page still works offline.
      cache = { at: Date.now() - CACHE_MS + 60 * 1000, payload: { user: GH_USER, source: 'local', fetchedAt: null, repos: merge([]) } };
    }
  }
  return cache.payload;
}

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': st.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/api/repos') {
    const data = await getRepos();
    return send(res, 200, JSON.stringify(data), MIME['.json']);
  }
  serveStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`portfolio on http://${HOST}:${PORT}`);
  getRepos();
});
