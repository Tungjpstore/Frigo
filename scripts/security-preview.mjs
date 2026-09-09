import { createServer as createHttpServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import { createPreviewCache, createPreviewControls, seedPlannerPreview } from './planner-preview-fixtures.mjs';

// Isolated preview only: no Cloudflare bindings, provider credentials, or external requests.
const port = Number(process.env.PORT || 3000);
const apiPort = Number(process.env.PREVIEW_API_PORT || 8787);
const vite = await createViteServer({
  define: {
    'import.meta.env.VITE_MEAL_PLANNER_ENABLED': JSON.stringify('true'),
  },
  plugins: [{ name: 'isolated-email', enforce: 'pre',
    resolveId(id) { if (id === 'cloudflare:email') return '\0isolated-email'; },
    load(id) { if (id === '\0isolated-email') return 'export class EmailMessage {}'; },
  }],
  server: { host: '0.0.0.0', port, strictPort: true,
    proxy: {
      '/api': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: false },
      '/__preview': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: false },
    } },
});
const { SqliteD1 } = await vite.ssrLoadModule('/tests/helpers/sqlite-d1.ts');
const { default: worker } = await vite.ssrLoadModule('/src/worker/index.ts');
let db = new SqliteD1();
seedPlannerPreview(db);
const env = { DB: db, CACHE: createPreviewCache(), ENVIRONMENT: 'development', APP_URL: process.env.PREVIEW_APP_URL || `http://127.0.0.1:${port}`,
  JWT_SECRET: 'isolated-local-preview-jwt-secret-no-production-use',
  OTP_HASH_SECRET: 'isolated-local-preview-otp-secret-no-production-use',
  AI_MOCK_MODE: 'true', SCAN_QUEUE_MODE: 'sync', MEAL_PLANNER_ENABLED: 'true' };
const controls = createPreviewControls({ getDatabase: () => db, resetDatabase: () => {
  const fresh = new SqliteD1();
  seedPlannerPreview(fresh);
  const previous = db;
  db = fresh;
  env.DB = fresh;
  env.CACHE = createPreviewCache();
  previous.close();
} });
globalThis.fetch = async () => { throw new Error('External network disabled in isolated preview'); };
let requests = Promise.resolve();
const api = createHttpServer((req, res) => {
  // Serialize only this preview host so reset cannot close an in-flight database.
  requests = requests.then(async () => {
  try {
    const body = [];
    for await (const chunk of req) body.push(chunk);
    // The local proxy may be reached through the HTTPS managed-preview tunnel.
    const origin = req.headers.origin;
    const sameHostOrigin = origin && new URL(origin).host === req.headers.host ? new URL(origin).origin : null;
    const requestOrigin = sameHostOrigin || env.APP_URL;
    const request = new Request(`${requestOrigin}${req.url}`, {
      method: req.method, headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(body),
    });
    const response = await controls(request) || await worker.fetch(request, { ...env, APP_URL: requestOrigin }, {
      waitUntil(p) { p.catch(console.error); }, passThroughOnException() {},
    });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { console.error(error); res.writeHead(500); res.end('Isolated preview error'); }
  });
});
await new Promise((resolve, reject) => { api.once('error', reject); api.listen(apiPort, '127.0.0.1', resolve); });
await vite.listen();
console.log(`Isolated security preview: Vite ${port}, in-memory SQLite API ${apiPort}, external API fetch disabled; /__preview for synthetic login/reset`);
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  await vite.close();
  api.close();
  db.close();
  process.exit(0);
});
