import { createServer as createHttpServer } from 'node:http';
import { createServer as createViteServer } from 'vite';

// Isolated preview only: no Cloudflare bindings, provider credentials, or external requests.
const port = Number(process.env.PORT || 3000);
const vite = await createViteServer({
  plugins: [{ name: 'isolated-email', enforce: 'pre',
    resolveId(id) { if (id === 'cloudflare:email') return '\0isolated-email'; },
    load(id) { if (id === '\0isolated-email') return 'export class EmailMessage {}'; },
  }],
  server: { host: '0.0.0.0', port, strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } } },
});
const { SqliteD1 } = await vite.ssrLoadModule('/tests/helpers/sqlite-d1.ts');
const { default: worker } = await vite.ssrLoadModule('/src/worker/index.ts');
const db = new SqliteD1();
const env = { DB: db, ENVIRONMENT: 'development', APP_URL: process.env.PREVIEW_APP_URL || 'http://127.0.0.1:3000',
  JWT_SECRET: 'isolated-local-preview-jwt-secret-no-production-use',
  OTP_HASH_SECRET: 'isolated-local-preview-otp-secret-no-production-use',
  AI_MOCK_MODE: 'true', SCAN_QUEUE_MODE: 'sync' };
globalThis.fetch = async () => { throw new Error('External network disabled in isolated preview'); };
createHttpServer(async (req, res) => {
  try {
    const body = [];
    for await (const chunk of req) body.push(chunk);
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method, headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(body),
    });
    const response = await worker.fetch(request, env, { waitUntil(p) { p.catch(console.error); }, passThroughOnException() {} });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { console.error(error); res.writeHead(500); res.end('Isolated preview error'); }
}).listen(8787, '127.0.0.1');
await vite.listen();
console.log(`Isolated security preview: Vite ${port}, in-memory SQLite API 8787, external API fetch disabled`);
