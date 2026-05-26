// Cloudflare Worker — 代理 DeepSeek API（解決 CORS）
// 部署：npx wrangler deploy 或貼到 Cloudflare Dashboard Workers 頁面
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // Only proxy /deepseek/* → api.deepseek.com/*
    if (request.method === 'POST' && url.pathname.startsWith('/deepseek')) {
      const apiPath = url.pathname.replace('/deepseek', '') || '/v1/chat/completions';
      const deepseekReq = new Request('https://api.deepseek.com' + apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: request.body,
      });

      const resp = await fetch(deepseekReq);
      const headers = new Headers(resp.headers);
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(resp.body, {
        status: resp.status,
        headers,
      });
    }

    return new Response('Not Found. Use POST /deepseek/v1/chat/completions', { status: 404 });
  }
};
