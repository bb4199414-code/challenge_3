// Climatica Production-Ready Static Dev Server
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Root project directory definition for absolute safety enforcement
const PUBLIC_ROOT = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  // Reject non-GET requests instantly to secure backend boundaries
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    return res.end('Method Not Allowed');
  }

  console.log(`${req.method} ${req.url}`);

  // Normalize and parse requested target paths safely
  const safeUrlPath = req.url.split('?')[0];
  let targetPath = safeUrlPath === '/' 
    ? path.join(PUBLIC_ROOT, 'index.html') 
    : path.join(PUBLIC_ROOT, safeUrlPath);

  // FIXED: STRICT PATH TRAVERSAL GUARD - Prevent directory breakout exploits
  const resolvedPath = path.resolve(targetPath);
  if (!resolvedPath.startsWith(PUBLIC_ROOT)) {
    console.error(`Security Warning: Unauthorized access attempt blocked -> ${req.url}`);
    res.writeHead(403, { 'Content-Type': 'text/html' });
    return res.end('<h1>403 Forbidden</h1><p>Access Denied.</p>', 'utf-8');
  }

  const extname = String(path.extname(resolvedPath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(resolvedPath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.error(`404: Not Found - ${resolvedPath}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1><p>The requested file does not exist.</p>', 'utf-8');
      } else {
        console.error(`500: Server Error - ${error.code}`);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Internal Server Error: ${error.code}\n`);
      }
    } else {
      // Return 200 payload data cleanly
      res.writeHead(200, { 
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff', // Extra protection guard header against MIME sniffing exploits
        'X-Frame-Options': 'DENY'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Climatica Secured Dev Server running at:`);
  console.log(` http://localhost:${PORT}/`);
  console.log(` Press Ctrl+C to stop the server`);
  console.log(`==================================================`);
});
