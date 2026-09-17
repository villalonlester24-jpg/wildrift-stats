"use strict";

const { getTierlist } = require("../lib/tierlist");

module.exports = async (req, res) => {
  try {
    const force =
      req.query && (req.query.force === "1" || req.query.force === true);
    const data = await getTierlist(Boolean(force));
    const now = Date.now();
    const secondsRemaining = Math.max(10, Math.floor((3600000 - (now % 3600000)) / 1000));
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", `public, max-age=${secondsRemaining}, s-maxage=${secondsRemaining}`);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(JSON.stringify(data));
  } catch (err) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(502).send(JSON.stringify({ error: err.message || "upstream failure" }));
  }
};
