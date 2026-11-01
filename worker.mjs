/** Cloudflare backend foundation. Frontend stays on GitHub Pages. */
const DEFAULT_ORIGIN = 'https://nikki0radz.github.io';
export default {
  async fetch(request, env = {}) {
    const origin = request.headers.get('Origin');
    const allowedOrigin = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Origin'
    });
    if (origin === allowedOrigin) {
      headers.set('Access-Control-Allow-Origin', allowedOrigin);
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers});
    if (origin && origin !== allowedOrigin) return json({error: 'Origin not allowed'}, 403);
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers});
    if (request.method !== 'GET') {
      headers.set('Allow', 'GET, OPTIONS');
      return json({error: 'Method not allowed'}, 405);
    }
    const path = new URL(request.url).pathname;
    if (path === '/' || path === '/health' || path === '/api/health') {
      return json({
        service: 'nudge-api',
        status: 'ok',
        stage: 'backend-foundation',
        aiConnected: false,
        message: 'Nudge backend is deployed. AI endpoints and authentication are not connected yet.'
      });
    }
    return json({error: 'Not found'}, 404);
  }
};
