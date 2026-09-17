"use strict";

const HERO_MAP = require("./heroes.en.json");

const URL = "https://www.wildriftfire.com/tier-list";
const ORIGIN = "https://www.wildriftfire.com";
const CACHE_TTL_MS = 60 * 60 * 1000;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml"
};

const LANE_TO_POS = {
  Solo: "2",
  Baron: "2",
  Jungle: "5",
  Mid: "1",
  Duo: "3",
  Bot: "3",
  Support: "4"
};

const TIER_ORDER = ["splus", "s", "a", "b", "c"];
const TIER_LABELS = { splus: "S+", s: "S", a: "A", b: "B", c: "C" };

const NAME_ALIASES = {
  norra: "10166"
};

const NAME_TO_HERO = {};
for (const id of Object.keys(HERO_MAP)) {
  NAME_TO_HERO[normalize(HERO_MAP[id])] = { heroId: id, name: HERO_MAP[id] };
}
for (const alias of Object.keys(NAME_ALIASES)) {
  const id = NAME_ALIASES[alias];
  if (HERO_MAP[id]) NAME_TO_HERO[alias] = { heroId: id, name: HERO_MAP[id] };
}

let cache = { data: null, ts: 0 };

function decode(value) {
  return String(value)
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return decode(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function absolutize(src) {
  if (/^https?:\/\//i.test(src)) return src;
  return ORIGIN + (src.startsWith("/") ? src : "/" + src);
}

function parse(html) {
  const markers = [];
  const tierRe = /<div class="tier (splus|s|a|b|c)">/g;
  let m;
  while ((m = tierRe.exec(html))) markers.push({ key: m[1], index: m.index });

  const notes = {};
  const noteRe = /<span class="title (splus|s|a|b|c)">([\s\S]*?)<\/span>\s*<span>([\s\S]*?)<\/span>/g;
  while ((m = noteRe.exec(html))) {
    notes[m[1]] = decode(m[3]);
  }

  const byTier = {};
  for (const key of TIER_ORDER) byTier[key] = [];

  const champRe = /<a[^>]*class="ico-holder"[^>]*data-role="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  while ((m = champRe.exec(html))) {
    const index = m.index;
    const role = decode(m[1]);
    const inner = m[2];

    let tierKey = null;
    for (const marker of markers) {
      if (marker.index < index) tierKey = marker.key;
      else break;
    }
    if (!tierKey) continue;

    let lastName = null;
    const nameRe = /<span>([^<]+)<\/span>/g;
    let n;
    while ((n = nameRe.exec(inner))) lastName = n[1];
    if (!lastName) continue;

    const name = decode(lastName);
    const imgM = /<div class="item-holder">\s*<img[^>]*src="([^"]+)"/.exec(inner);
    const deltaM = /class="tier-delta (up|down)"/.exec(inner);
    const hero = NAME_TO_HERO[normalize(name)];

    byTier[tierKey].push({
      name,
      lane: role,
      posId: LANE_TO_POS[role] || "",
      heroId: hero ? hero.heroId : null,
      avatar: imgM ? absolutize(decode(imgM[1])) : "",
      delta: deltaM ? deltaM[1] : null
    });
  }

  const patchM = /<span class="patch">([\s\S]*?)<\/span>/.exec(html);

  const tiers = TIER_ORDER.map((key) => ({
    key,
    label: TIER_LABELS[key],
    desc: notes[key] || "",
    champions: byTier[key]
  })).filter((tier) => tier.champions.length);

  return {
    source: "WildRiftFire tier list",
    patch: patchM ? decode(patchM[1]) : "",
    tiers
  };
}

async function fetchHtml() {
  const res = await fetch(URL, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error("Upstream " + res.status + " for " + URL);
  return res.text();
}

function isSameHourCycle(ts1, ts2) {
  return Math.floor(ts1 / CACHE_TTL_MS) === Math.floor(ts2 / CACHE_TTL_MS);
}

async function getTierlist(force) {
  const now = Date.now();
  if (!force && cache.data && isSameHourCycle(cache.ts, now)) {
    return { ...cache.data, cached: true, cacheAgeMs: now - cache.ts };
  }

  const html = await fetchHtml();
  const data = parse(html);
  data.generatedAt = new Date().toISOString();
  cache = { data, ts: now };
  return { ...data, cached: false, cacheAgeMs: 0 };
}

module.exports = { getTierlist, parse, CACHE_TTL_MS, isSameHourCycle };
