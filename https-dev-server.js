// https-dev-server.js — Simple HTTPS→HTTP proxy for Next.js dev server
// Required for camera (getUserMedia) on non-localhost IP addresses
// Usage: node https-dev-server.js

const https = require('https');
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const net = require('net');

const HTTPS_PORT = 8473;
const HTTP_PORT = 8472;
const HOST = '0.0.0.0';

const key = fs.readFileSync('./certs/key.pem');
const cert = fs.readFileSync('./certs/cert.pem');

console.log(`🚀 Starting Next.js dev server on http://${HOST}:${HTTP_PORT}...`);
const nextDev = spawn('npx', ['next', 'dev', '-p', String(HTTP_PORT), '--hostname', HOST], {
  stdio: 'inherit',
  shell: true,
});

function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error('Timed out waiting for Next.js'));
        } else {
          setTimeout(tryConnect, 500);
        }
      });
      socket.once('timeout', () => { socket.destroy(); setTimeout(tryConnect, 500); });
      socket.connect(port, 'localhost');
    };
    tryConnect();
  });
}

async function startHttpsProxy() {
  try {
    await waitForPort(HTTP_PORT, 30000);
  } catch {
    console.error('❌ Next.js dev server did not start');
    process.exit(1);
  }

  const httpsServer = https.createServer({ key, cert }, (req, res) => {
    const originalHost = req.headers.host || `192.168.1.4:${HTTPS_PORT}`
    const proxyReq = http.request({
      hostname: 'localhost',
      port: HTTP_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${HTTP_PORT}`,
        'x-forwarded-host': originalHost,
        'x-forwarded-proto': 'https',
        'x-forwarded-for': req.socket.remoteAddress || '',
      },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(502);
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
  });

  // Handle WebSocket upgrade for HMR
  httpsServer.on('upgrade', (req, socket, head) => {
    const proxySocket = net.connect(HTTP_PORT, 'localhost', () => {
      proxySocket.write(
        `${req.method} ${req.url} HTTP/1.1\r\n` +
        Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
        '\r\n\r\n'
      );
      proxySocket.write(head);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });
    proxySocket.on('error', () => socket.destroy());
  });

  httpsServer.listen(HTTPS_PORT, HOST, () => {
    console.log(`\n🔒 HTTPS proxy running:`);
    console.log(`   https://192.168.1.4:${HTTPS_PORT}`);
    console.log(`   https://localhost:${HTTPS_PORT}`);
    console.log(`\n📱 Open https://192.168.1.4:${HTTPS_PORT} on your phone`);
    console.log(`⚠️  You will see a certificate warning — tap "Advanced" → "Proceed anyway"`);
    console.log(`   (This is normal for self-signed certificates)\n`);
  });
}

startHttpsProxy();

// Cleanup
process.on('SIGINT', () => { console.log('\n🛑 Shutting down...'); nextDev.kill('SIGTERM'); process.exit(0); });
process.on('SIGTERM', () => { nextDev.kill('SIGTERM'); process.exit(0); });
