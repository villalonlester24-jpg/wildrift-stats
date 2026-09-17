"use strict";

const guides = require("../lib/guides.json");

module.exports = async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(guides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
