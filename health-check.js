import http from 'http';

/**
 * 🏥 Health Check Server
 * 
 * سيرفر بسيط للتأكد من أن البوت يعمل
 * يستخدم مع cron-job.org لمنع النوم
 */

const PORT = process.env.PORT || 3000;

let botStatus = {
  isRunning: false,
  lastActivity: null,
  startTime: Date.now()
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      bot: botStatus.isRunning ? 'running' : 'starting',
      uptime: Math.floor(process.uptime()),
      lastActivity: botStatus.lastActivity,
      timestamp: new Date().toISOString()
    }));
  } else if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🏥 Health Check Server running on port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}/health`);
});

// تحديث حالة البوت
export function updateBotStatus(isRunning, activity = null) {
  botStatus.isRunning = isRunning;
  if (activity) {
    botStatus.lastActivity = activity;
  }
}

export default server;
