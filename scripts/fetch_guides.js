"use strict";

const fs = require("fs");
const path = require("path");

const BASE_URL = "https://www.wildriftguides.com";

// Known summoner spells map
const SPELLS_MAP = {
  flash: { name: "Flash", icon: "https://www.wildriftguides.com/assets/Summoner%20Spells/flash.png" },
  ignite: { name: "Ignite", icon: "https://www.wildriftguides.com/assets/Summoner%20Spells/ignite.png" },
  smite: { name: "Smite", icon: "https://www.wildriftguides.com/assets/Summoner%20Spells/smite.png" },
  ghost: { name: "Ghost", icon: "https://www.wildriftguides.com/assets/Summoner%20Spells/ghost.png" },
  heal: { name: "Heal", icon: "https://www.wildriftguides.com/assets/Summoner%20Spells/heal.png" },
  barrier: { name: "Barrier", icon: "https://www.wildriftguides.com/assets/Summoner%20Spells/barrier.png" },
  exhaust: { name: "Exhaust", icon: "https://www.wildriftguides.com/assets/Summoner%20Spells/exhaust.png" },
  teleport: { name: "Teleport", icon: "https://www.wildriftguides.com/assets/Summoner%20Spells/teleport.png" }
};

function cleanString(str) {
  if (!str) return "";
  return String(str).replace(/\r\n/g, "\n").trim();
}

function parseMarkdownMatchups(body) {
  const goodAgainst = [];
  const weakAgainst = [];

  const goodMatch = body.match(/###\s*(?:Good Against|Champions [^\n]+ Is Strong Against)\s*\n([\s\S]*?)(?=###|\n##|$)/i);
  if (goodMatch) {
    const lines = goodMatch[1].match(/[-*]\s*\*\*([^*]+)\*\*:\s*([^\n]+)/g) || [];
    for (const l of lines) {
      const m = l.match(/[-*]\s*\*\*([^*]+)\*\*:\s*([\s\S]+)/);
      if (m) {
        goodAgainst.push({
          champion: m[1].trim(),
          note: m[2].trim()
        });
      }
    }
  }

  const weakMatch = body.match(/###\s*(?:Weak Against|[^\n]+ Counters)\s*\n([\s\S]*?)(?=###|\n##|$)/i);
  if (weakMatch) {
    const lines = weakMatch[1].match(/[-*]\s*\*\*([^*]+)\*\*:\s*([^\n]+)/g) || [];
    for (const l of lines) {
      const m = l.match(/[-*]\s*\*\*([^*]+)\*\*:\s*([\s\S]+)/);
      if (m) {
        weakAgainst.push({
          champion: m[1].trim(),
          note: m[2].trim()
        });
      }
    }
  }

  return { goodAgainst, weakAgainst };
}

function parseGamePlan(body) {
  const getSection = (title) => {
    const re = new RegExp(`##?\\s*${title}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, "i");
    const m = body.match(re);
    return m ? m[1].replace(/<\/?[^>]+(>|$)/g, "").trim() : "";
  };

  return {
    overview: getSection("Overview") || getSection("Champion Overview"),
    earlyGame: getSection("Early Game"),
    midGame: getSection("Mid Game"),
    lateGame: getSection("Late Game"),
    teamfights: getSection("Teamfights")
  };
}

async function main() {
  console.log("[1/4] Fetching items catalog...");
  const itemsRes = await fetch("https://www.wildriftguides.com/assets/js/runtime-items-DbTprLkD.js");
  const itemsText = await itemsRes.text();
  const itemsMap = {};
  const itemJsonMatch = itemsText.match(/const\s+e\s*=\s*(\[[\s\S]*?\]);/);
  if (itemJsonMatch) {
    try {
      const itemsArr = eval(itemJsonMatch[1]);
      for (const it of itemsArr) {
        itemsMap[it.id] = {
          id: it.id,
          name: it.name,
          goldCost: it.goldCost,
          category: it.category,
          iconUrl: it.iconUrl ? BASE_URL + it.iconUrl : "",
          desc: it.shortDescription || it.buildGuide || ""
        };
      }
      console.log(` -> Loaded ${Object.keys(itemsMap).length} items.`);
    } catch (e) {
      console.error("Failed to parse items:", e.message);
    }
  }

  console.log("[2/4] Fetching runes catalog...");
  const runesRes = await fetch("https://www.wildriftguides.com/assets/js/fallbackRunes-BESoNa2_.js");
  const runesText = await runesRes.text();
  const runesMap = {};
  const runesMatches = [...runesText.matchAll(/id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*category:\s*"([^"]+)"/g)];
  for (const m of runesMatches) {
    const id = m[1];
    runesMap[id] = {
      id,
      name: m[2],
      desc: m[3],
      category: m[4],
      iconUrl: `${BASE_URL}/assets/Runes/${id.replace(/-/g, "_")}.png`
    };
  }
  console.log(` -> Loaded ${Object.keys(runesMap).length} runes.`);

  console.log("[3/4] Fetching guide chunk registry...");
  const guideBundleRes = await fetch("https://www.wildriftguides.com/assets/js/ChampionGuide-BcbPqfUC.js");
  const guideBundleText = await guideBundleRes.text();
  const guideMatches = [...guideBundleText.matchAll(/"\.\.\/\.\.\/content\/guides\/([^\/]+)\/([^\.]+)\.md":\(\)=>t\(\(\)=>import\("(\.\/[^"]+)"\)/g)];
  console.log(` -> Found ${guideMatches.length} total guide chunks.`);

  console.log("[4/4] Scraping guide details in batches...");
  const champions = {};
  const batchSize = 20;

  for (let i = 0; i < guideMatches.length; i += batchSize) {
    const batch = guideMatches.slice(i, i + batchSize);
    await Promise.all(batch.map(async (m) => {
      const champSlug = m[1];
      const role = m[2].toUpperCase();
      const jsFile = m[3].replace("./", "");
      const url = `${BASE_URL}/assets/js/${jsFile}`;
      try {
        const res = await fetch(url);
        const code = await res.text();
        
        // Extract content inside template backticks
        const backtickMatch = code.match(/const\s+e\s*=\s*`([\s\S]*?)`;/);
        if (!backtickMatch) return;
        
        const fullContent = backtickMatch[1];
        const fmMatch = fullContent.match(/---\s*(\{[\s\S]*?\})\s*---/);
        if (!fmMatch) return;
        
        // Safe JSON parse fixing double-escaped quotes inside string fields
        const fixedFm = fmMatch[1].replace(/\\{2,}"/g, "'");
        let fm = JSON.parse(fixedFm);

        const body = fullContent.replace(/[\s\S]*?---\s*\{[\s\S]*?\}\s*---\s*/, "");
        const matchups = parseMarkdownMatchups(body);
        const gamePlan = parseGamePlan(body);

        // Resolve Items
        const resolveItem = (id) => {
          if (!id) return null;
          const it = itemsMap[id] || { id, name: id.replace(/-/g, " "), iconUrl: "", goldCost: null };
          const note = (fm.item_notes && fm.item_notes[id]) || "";
          return { ...it, note };
        };

        // Resolve Runes
        const resolveRune = (id) => {
          if (!id) return null;
          const r = runesMap[id] || { id, name: id.replace(/_/g, " "), iconUrl: "", desc: "" };
          const note = (fm.rune_notes && fm.rune_notes[id]) || "";
          return { ...r, note };
        };

        // Resolve Spells
        const resolveSpell = (id) => {
          if (!id) return null;
          const s = SPELLS_MAP[id.toLowerCase()] || { name: id, icon: "" };
          const note = (fm.spell_notes && fm.spell_notes[id]) || "";
          return { id, name: s.name, iconUrl: s.icon, note };
        };

        const guideData = {
          champion: fm.champion || champSlug,
          role: role === "DRAGON" ? "DUO" : role,
          title: fm.title || `${champSlug} Guide`,
          patch: fm.patch || "7.2",
          startingItem: resolveItem(fm.starting_item_id),
          boots: resolveItem(fm.boots_item_id),
          coreItems: (fm.core_item_ids || []).map(resolveItem).filter(Boolean),
          situationalItems: (fm.situational_item_ids || []).map(resolveItem).filter(Boolean),
          keystoneRune: resolveRune(fm.keystone_rune_id),
          primaryRunes: (fm.primary_rune_ids || []).map(resolveRune).filter(Boolean),
          secondaryRunes: (fm.secondary_rune_ids || []).map(resolveRune).filter(Boolean),
          spells: (fm.summoner_spell_ids || ["flash", "ignite"]).map(resolveSpell).filter(Boolean),
          skillOrder: fm.skill_order || ["Q", "W", "E"],
          matchups,
          gamePlan
        };

        const normRole = guideData.role.toLowerCase();
        if (!champions[champSlug]) {
          champions[champSlug] = {
            slug: champSlug,
            name: (fm.champion || champSlug).toUpperCase(),
            roles: [],
            avatar: `${BASE_URL}/assets/champions/${champSlug}.png`,
            guides: {}
          };
        }
        if (!champions[champSlug].roles.includes(guideData.role)) {
          champions[champSlug].roles.push(guideData.role);
        }
        champions[champSlug].guides[normRole] = guideData;
      } catch (err) {
        console.error(`Error loading ${champSlug} ${role}:`, err.message);
      }
    }));
    process.stdout.write(` -> Scraped ${Math.min(i + batchSize, guideMatches.length)}/${guideMatches.length} guides\r`);
  }

  console.log("\nDone! Saving compiled guides to lib/guides.json...");
  const outPath = path.join(__dirname, "..", "lib", "guides.json");
  fs.writeFileSync(outPath, JSON.stringify(champions, null, 2));
  console.log(`Successfully written ${Object.keys(champions).length} champions to ${outPath}`);
}

main().catch(console.error);
