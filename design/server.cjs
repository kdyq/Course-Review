const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT) || 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = path.resolve(ROOT, "." + decoded);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    return null;
  }
  return target;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = requestUrl.pathname;

  if (pathname === "/") {
    pathname = "/design/index.html";
  }

  let filePath = resolveFile(pathname);
  if (!filePath) {
    send(res, 403, "403 Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError) {
      send(res, 404, "404 Not Found");
      return;
    }

    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.stat(filePath, (indexError, indexStat) => {
      if (indexError || !indexStat.isFile()) {
        send(res, 404, "404 Not Found");
        return;
      }

      const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      fs.createReadStream(filePath).pipe(res);
    });
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Course review prototypes: http://127.0.0.1:${PORT}/`);
});
