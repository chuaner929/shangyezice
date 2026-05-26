const http = require('http');
const https = require('https');

const PORT = 8765;
// 支援多個 API 目標，根據請求路徑自動選擇
const TARGETS = {
  '/deepseek': 'https://api.deepseek.com',
  '/anthropic': 'https://api.anthropic.com',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 找出匹配的目標
  const target = Object.entries(TARGETS).find(([prefix]) => req.url.startsWith(prefix));
  if (!target) {
    res.writeHead(404);
    res.end('Not Found. Available: /deepseek/v1/chat/completions, /anthropic/v1/messages');
    return;
  }

  const [prefix, baseUrl] = target;
  const apiPath = req.url.slice(prefix.length) || '/v1/chat/completions';

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    // 轉發請求頭（保留授權信息）
    const fwdHeaders = { 'Content-Type': 'application/json' };
    if (req.headers['authorization']) fwdHeaders['Authorization'] = req.headers['authorization'];
    if (req.headers['x-api-key']) fwdHeaders['x-api-key'] = req.headers['x-api-key'];
    if (req.headers['anthropic-version']) fwdHeaders['anthropic-version'] = req.headers['anthropic-version'];

    const proxy = https.request(baseUrl + apiPath, {
      method: 'POST',
      headers: fwdHeaders,
      timeout: 60000
    }, proxyRes => {
      const headers = { ...proxyRes.headers };
      headers['access-control-allow-origin'] = '*';
      headers['access-control-allow-methods'] = 'POST, OPTIONS';
      headers['access-control-allow-headers'] = 'Content-Type, Authorization, x-api-key, anthropic-version';
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    });

    proxy.on('error', err => {
      console.error('Proxy error:', err.message);
      res.writeHead(502);
      res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
    });

    proxy.write(body);
    proxy.end();
  });
});

server.listen(PORT, () => {
  console.log('API Proxy running at http://localhost:' + PORT);
  console.log('Routes:');
  Object.entries(TARGETS).forEach(([prefix, baseUrl]) => {
    console.log('  ' + prefix + ' → ' + baseUrl);
  });
});
