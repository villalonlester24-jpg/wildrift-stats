"use strict";

const HERO_MAP = require("./heroes.en.json");

const HERO_URL =
  "https://game.gtimg.cn/images/lgamem/act/lrlib/js/heroList/hero_list.js";
const RANK_URL =
  "https://mlol.qt.qq.com/go/lgame_battle_info/hero_rank_list_v2";

const CACHE_TTL_MS = 60 * 60 * 1000;

const TIERS = [
  { id: "1", name: "Diamond+" },
  { id: "2", name: "Master+" },
  { id: "3", name: "Challenger" },
  { id: "4", name: "Legendary" }
];

const ROLES = [
  { id: "2", name: "Baron" },
  { id: "5", name: "Jungle" },
  { id: "1", name: "Mid" },
  { id: "3", name: "Duo" },
  { id: "4", name: "Support" }
];

const POSITION_NAMES = {
  "1": "Mid",
  "2": "Baron",
  "3": "Duo",
  "4": "Support",
  "5": "Jungle"
};

const GRADES = ["SS", "S", "A", "B", "C", "D"];

const ROLE_WORDS = {
  "\u6218\u58eb": "Fighter",
  "\u6cd5\u5e08": "Mage",
  "\u5766\u514b": "Tank",
  "\u523a\u5ba2": "Assassin",
  "\u5c04\u624b": "Marksman",
  "\u8f85\u52a9": "Support"
};

const LANE_WORDS = {
  "\u5355\u4eba\u8def": "Baron",
  "\u6253\u91ce": "Jungle",
  "\u4e2d\u8def": "Mid",
  "\u5c04\u624b": "Dragon",
  "\u8f85\u52a9": "Support"
};

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Referer: "https://lolm.qq.com/act/a20220818raider/index.html",
  Accept: "application/json,text/plain,*/*"
};

let cache = { data: null, ts: 0 };

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) {
    throw new Error("Upstream " + res.status + " for " + url);
  }
  return res.json();
}

function englishName(id) {
  return HERO_MAP[String(id)] || "Hero " + id;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function buildHeroIndex(heroList) {
  const index = {};
  for (const id of Object.keys(heroList)) {
    const hero = heroList[id];
    index[id] = {
      heroId: String(id),
      name: englishName(id),
      avatar: hero.avatar,
      card: hero.card,
      roles: (hero.roles || []).map((r) => ROLE_WORDS[r] || r),
      lane: (hero.lane || "")
        .split(";")
        .map((l) => LANE_WORDS[l] || l)
        .filter(Boolean)
    };
  }
  return index;
}

function formatDate(raw) {
  if (!raw || String(raw).length < 8) return null;
  const s = String(raw);
  return s.slice(0, 4) + "-" + s.slice(4, 6) + "-" + s.slice(6, 8);
}

function attachGrades(rows) {
  const n = rows.length;
  if (!n) return;

  const percentileGetter = (key) => {
    const order = rows.slice().sort((a, b) => b[key] - a[key]);
    const rankOf = new Map();
    order.forEach((row, i) => rankOf.set(row, i));
    return (row) => (n === 1 ? 1 : 1 - rankOf.get(row) / (n - 1));
  };

  const winPct = percentileGetter("win");
  const pickPct = percentileGetter("pick");
  const banPct = percentileGetter("ban");

  rows.forEach((row) => {
    const score = 0.4 * winPct(row) + 0.25 * pickPct(row) + 0.35 * banPct(row);
    row.score = round2(score);
  });

  const byScore = rows.slice().sort((a, b) => b.score - a.score);
  byScore.forEach((row, i) => {
    const pos = n === 1 ? 0 : i / (n - 1);
    row.grade =
      pos <= 0.1 ? "SS" :
      pos <= 0.25 ? "S" :
      pos <= 0.45 ? "A" :
      pos <= 0.65 ? "B" :
      pos <= 0.85 ? "C" : "D";
  });
}

function buildRoleRows(rows, heroes) {
  const mapped = (rows || []).map((row) => {
    const heroId = String(row.hero_id);
    const meta = heroes[heroId] || {};
    return {
      heroId,
      name: meta.name || englishName(heroId),
      avatar: meta.avatar || "",
      roles: meta.roles || [],
      posId: String(row.position || ""),
      posName: POSITION_NAMES[String(row.position)] || "",
      win: toNumber(row.win_rate_percent),
      pick: toNumber(row.appear_rate_percent),
      ban: toNumber(row.forbid_rate_percent),
      winDelta: toNumber(row.win_rate_float),
      pickDelta: toNumber(row.appear_rate_float),
      banDelta: toNumber(row.forbid_rate_float)
    };
  });

  mapped.sort((a, b) => b.win - a.win || b.pick - a.pick);
  mapped.forEach((row, i) => {
    row.rank = i + 1;
  });

  attachGrades(mapped);
  return mapped;
}

function buildStats(heroJson, rankJson) {
  const heroes = buildHeroIndex(heroJson.heroList || {});
  const raw = rankJson.data || {};

  const tiers = TIERS.map((tier) => {
    const tierRaw = raw[tier.id] || {};
    const roles = ROLES.map((role) => ({
      id: role.id,
      name: role.name,
      rows: buildRoleRows(tierRaw[role.id], heroes)
    }));
    return { id: tier.id, name: tier.name, roles };
  });

  let updated = null;
  for (const tierId of Object.keys(raw)) {
    const tierRaw = raw[tierId] || {};
    for (const roleId of Object.keys(tierRaw)) {
      const list = tierRaw[roleId];
      if (Array.isArray(list) && list.length && list[0].dtstatdate) {
        updated = formatDate(list[0].dtstatdate);
        break;
      }
    }
    if (updated) break;
  }

  return {
    source: "Wild Rift Ranked Ladder",
    updated,
    generatedAt: new Date().toISOString(),
    tiers,
    heroes
  };
}

function isSameHourCycle(ts1, ts2) {
  return Math.floor(ts1 / CACHE_TTL_MS) === Math.floor(ts2 / CACHE_TTL_MS);
}

async function getStats(force) {
  const now = Date.now();
  if (!force && cache.data && isSameHourCycle(cache.ts, now)) {
    return { ...cache.data, cached: true, cacheAgeMs: now - cache.ts };
  }

  const [heroJson, rankJson] = await Promise.all([
    fetchJson(HERO_URL),
    fetchJson(RANK_URL)
  ]);

  const data = buildStats(heroJson, rankJson);
  cache = { data, ts: now };
  return { ...data, cached: false, cacheAgeMs: 0 };
}

module.exports = { getStats, TIERS, ROLES, POSITION_NAMES, GRADES, CACHE_TTL_MS, isSameHourCycle };
