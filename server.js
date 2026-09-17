"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { getStats } = require("./lib/stats");
const { getTierlist } = require("./lib/tierlist");

const root = path.join(__dirname, "public");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT) || 5600;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

function sendJson(res, status, payload) {
  const now = Date.now();
  const secondsRemaining = Math.max(10, Math.floor((3600000 - (now % 3600000)) / 1000));
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": `public, max-age=${secondsRemaining}`,
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, "http://" + host + ":" + port);
  const urlPath = decodeURIComponent(parsed.pathname);

  if (urlPath === "/api/stats") {
    try {
      const data = await getStats(parsed.searchParams.get("force") === "1");
      sendJson(res, 200, data);
    } catch (err) {
      sendJson(res, 502, { error: err.message || "upstream failure" });
    }
    return;
  }

  if (urlPath === "/api/tierlist") {
    try {
      const data = await getTierlist(parsed.searchParams.get("force") === "1");
      sendJson(res, 200, data);
    } catch (err) {
      sendJson(res, 502, { error: err.message || "upstream failure" });
    }
    return;
  }

  if (urlPath === "/api/guides") {
    try {
      const guidesPath = path.join(__dirname, "lib", "guides.json");
      if (fs.existsSync(guidesPath)) {
        const raw = fs.readFileSync(guidesPath, "utf8");
        const json = JSON.parse(raw);
        sendJson(res, 200, json);
      } else {
        sendJson(res, 404, { error: "Guides not found" });
      }
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  let filePath = path.join(root, urlPath === "/" ? "index.html" : urlPath);
  const resolved = path.resolve(filePath);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<!DOCTYPE html><title>404</title><h1>404</h1>");
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    res.end(data);
  });
});

if (require.main === module) {
  server.listen(port, host, () => {
    console.log("Wild Rift stats running at http://" + host + ":" + port + "/");
  });
}

module.exports = server;
