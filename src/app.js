"use strict";

const REFRESH_MS = 60 * 60 * 1000;

const S = (paths) =>
  '<svg viewBox="0 0 24 24" fill="currentColor">' + paths + "</svg>";

const ROLES = [
  {
    id: "2",
    name: "Baron",
    short: "BARON",
    icon: S('<path fill-rule="evenodd" d="M12 2.2c-.8 2.2-2.5 3.8-4.5 4.5L4 4.5c.5 3.5.2 6.5-1.5 8.5 2.5.5 4.5-.5 6-2-1 2.5-2 5-4.5 6.5 4 .5 6.5-1.5 8-4 1.5 2.5 4 4.5 8 4-2.5-1.5-3.5-4-4.5-6.5 1.5 1.5 3.5 2.5 6 2-1.7-2-2-5-1.5-8.5l-3.5 2.5c-2-.7-3.7-2.3-4.5-4.5zm0 7.2l2.2 2.8-2.2 2.8-2.2-2.8 2.2-2.8z"/>')
  },
  {
    id: "5",
    name: "Jungle",
    short: "JNG",
    icon: S('<path d="M6 21.5c.3-5 1.8-11.2 4.2-15.2-1.5 4.5-1.2 10.5-.2 15.2H6zm5.5 0c.2-6.5 1-13 2.5-19.5 0 6.5 0 13-1.5 19.5h-1zm4.5 0c-.5-5 .2-10 3.2-14.8-.6 4.8.5 10.2 2 14.8H16z"/>')
  },
  {
    id: "1",
    name: "Mid",
    short: "MID",
    icon: S('<path d="M12 1.8l-2.6 13.7 2.6 6.5 2.6-6.5L12 1.8zM4.2 13.5C5.5 11 6.8 8.5 7.8 6c-.2 3.5.5 7.5 1.6 11-2.6-1-4.2-2-5.2-3.5zm15.6 0c-1.3-2.5-2.6-5-3.6-7.5.2 3.5-.5 7.5-1.6 11 2.6-1 4.2-2 5.2-3.5z"/>')
  },
  {
    id: "3",
    name: "Duo",
    short: "DUO",
    icon: S('<path d="M7.8 3.5c-.8 2.2-1.8 4.2-3.2 5.5 1.4.2 2.4 0 3-.5-.5 2-1.5 3.8-2.6 4.8 1.4.2 2.4 0 3-.5-.8 3-1.2 5.5-1.8 8.2 2-1 3.5-3 4-6V3.5H7.8zm8.4 0c.8 2.2 1.8 4.2 3.2 5.5-1.4.2-2.4 0-3-.5.5 2 1.5 3.8 2.6 4.8-1.4.2-2.4 0-3-.5.8 3 1.2 5.5 1.8 8.2-2-1-3.5-3-4-6V3.5h2.4z"/>')
  },
  {
    id: "4",
    name: "Support",
    short: "SUP",
    icon: S('<path d="M9 3.5h6l-1.5 3.5h-3L9 3.5zm1.8 5h2.4l1.2 6.5-2.4 6.5-2.4-6.5 1.2-6.5zM3.8 8c2.5.5 4.5 2 5.7 4.5-2 .5-4.2 0-5.7-1.5-.2-1-.2-2 0-3zm16.4 0c-2.5.5-4.5 2-5.7 4.5 2 .5 4.2 0 5.7-1.5.2-1 .2-2 0-3z"/>')
  }
];

const state = {
  view: "stats",
  tierId: "1",
  roleId: "all",
  tierGradeFilter: "all",
  sortKey: "win",
  sortDir: "desc",
  heroFilterId: null,
  compact: false,
  activeChamp: null,
  activeGuideRole: null,
  champRoleFilter: "all",
  champSearchQuery: ""
};

let DATA = null;
let TIER = null;
let GUIDES = null;
let timerHandle = null;
let tooltipEl = null;

const els = {
  tierTabs: document.getElementById("tier-tabs"),
  roleTabs: document.getElementById("role-tabs"),
  tbody: document.getElementById("tbody"),
  searchInput: document.getElementById("search-input"),
  searchClear: document.getElementById("search-clear"),
  searchResults: document.getElementById("search-results"),
  dataUpdated: document.getElementById("data-updated"),
  refreshTimer: document.getElementById("refresh-timer"),
  liveDot: document.getElementById("live-dot"),
  sourceNote: document.getElementById("source-note"),
  views: document.getElementById("views"),
  viewStats: document.getElementById("view-stats"),
  viewTierlist: document.getElementById("view-tierlist"),
  viewChampions: document.getElementById("view-champions"),
  championsGrid: document.getElementById("champions-grid"),
  champRoleTabs: document.getElementById("champ-role-tabs"),
  champSearchInput: document.getElementById("champ-search-input"),
  champSearchClear: document.getElementById("champ-search-clear"),
  champCountNote: document.getElementById("champ-count-note"),
  tierlist: document.getElementById("tierlist"),
  tierlistSub: document.getElementById("tierlist-sub"),
  tierGradeTabs: document.getElementById("tier-grade-tabs"),
  compactBtn: document.getElementById("compact-btn"),
  themeToggle: document.getElementById("theme-toggle"),
  scrollTopBtn: document.getElementById("scroll-top-btn"),
  scrollProgressBar: document.getElementById("scroll-progress-bar"),
  tableRegion: document.querySelector(".table-container"),
  heroTelemetry: document.querySelector(".hero-telemetry"),
  controlsCluster: document.querySelector(".controls-cluster"),
  // Hero Telemetry Elements
  kpiPatch: document.getElementById("kpi-patch"),
  kpiTrackedCount: document.getElementById("kpi-tracked-count"),
  kpiTierName: document.getElementById("kpi-tier-name"),
  kpiKingRate: document.getElementById("kpi-king-rate"),
  kpiKingName: document.getElementById("kpi-king-name"),
  kpiKingAvatar: document.getElementById("kpi-king-avatar"),
  kpiKingRole: document.getElementById("kpi-king-role"),
  kpiKingCard: document.getElementById("telemetry-king-card"),
  kpiContestedRate: document.getElementById("kpi-contested-rate"),
  kpiContestedName: document.getElementById("kpi-contested-name"),
  kpiContestedAvatar: document.getElementById("kpi-contested-avatar"),
  kpiContestedRole: document.getElementById("kpi-contested-role"),
  kpiContestedCard: document.getElementById("telemetry-contested-card"),
  kpiCountdown: document.getElementById("kpi-countdown"),
  // Format 01 Bento Modal Elements
  sheetScrim: document.getElementById("champion-sheet-scrim"),
  sheet: document.getElementById("champion-sheet"),
  sheetAvatar: document.getElementById("sheet-avatar"),
  sheetName: document.getElementById("sheet-name"),
  sheetRole: document.getElementById("sheet-role"),
  sheetRank: document.getElementById("sheet-rank"),
  sheetPatch: document.getElementById("sheet-patch"),
  sheetRoleSwitcher: document.getElementById("sheet-role-switcher"),
  sheetClose: document.getElementById("sheet-close"),
  sheetWin: document.getElementById("sheet-win"),
  sheetWinDelta: document.getElementById("sheet-win-delta"),
  sheetPick: document.getElementById("sheet-pick"),
  sheetPickDelta: document.getElementById("sheet-pick-delta"),
  sheetBan: document.getElementById("sheet-ban"),
  sheetBanDelta: document.getElementById("sheet-ban-delta"),
  bentoBody: document.getElementById("bento-body")
};

const THEME_KEY = "wr-theme";

function applyTheme(theme, persist) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (err) {
      /* storage unavailable */
    }
  }
  if (els.themeToggle) {
    els.themeToggle.setAttribute(
      "aria-label",
      next === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }
}

function initTheme() {
  if (!els.themeToggle) return;
  applyTheme(document.documentElement.getAttribute("data-theme"), false);

  els.themeToggle.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "dark"
        : "light";
    applyTheme(next, true);
  });

  const mql = window.matchMedia("(prefers-color-scheme: light)");
  const onChange = (event) => {
    let stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch (err) {}
    if (!stored) applyTheme(event.matches ? "light" : "dark", false);
  };
  if (mql.addEventListener) mql.addEventListener("change", onChange);
  else if (mql.addListener) mql.addListener(onChange);
}

function syncIndicator(track) {
  if (!track) return;
  let thumb = track.querySelector(":scope > .tabs-thumb");
  if (!thumb) {
    thumb = document.createElement("span");
    thumb.className = "tabs-thumb";
    thumb.setAttribute("aria-hidden", "true");
    track.insertBefore(thumb, track.firstChild);
  }
  const active = track.querySelector("button.active");
  if (!active || !active.offsetWidth) {
    thumb.style.opacity = "0";
    return;
  }
  thumb.style.width = active.offsetWidth + "px";
  thumb.style.transform =
    "translateX(" + (active.offsetLeft - track.clientLeft) + "px)";
  thumb.style.opacity = "1";
}

function syncAllIndicators() {
  syncIndicator(els.views);
  syncIndicator(els.tierTabs);
  syncIndicator(els.roleTabs);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function formatClock(ms) {
  if (ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return m + ":" + s;
}

function roleMeta(id) {
  if (id === "all") {
    return {
      id: "all",
      name: "All Roles",
      short: "ALL",
      icon: S('<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')
    };
  }
  return ROLES.find((r) => r.id === id) || { name: "", short: "" };
}

function activeTier() {
  if (!DATA || !DATA.tiers || !DATA.tiers.length) return { id: "1", name: "Diamond+", roles: [] };
  return DATA.tiers.find((t) => t.id === state.tierId) || DATA.tiers[0];
}

function activeRole(tier) {
  if (state.roleId === "all") {
    const allRows = [];
    if (tier && tier.roles) {
      for (const r of tier.roles) {
        for (const row of (r.rows || [])) {
          allRows.push(Object.assign({ posName: r.name, posId: r.id }, row));
        }
      }
    }
    return { id: "all", name: "All Roles", short: "ALL", rows: allRows };
  }
  if (!tier || !tier.roles || !tier.roles.length) return { id: state.roleId, name: "Baron", rows: [] };
  return tier.roles.find((r) => r.id === state.roleId) || tier.roles[0];
}

function buildTierTabs() {
  if (!DATA || !DATA.tiers) return;
  els.tierTabs.innerHTML = "";
  for (const tier of DATA.tiers) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.tier = tier.id;
    btn.textContent = tier.name;
    btn.className = tier.id === state.tierId ? "active" : "";
    els.tierTabs.appendChild(btn);
  }
}

function buildRoleTabs() {
  els.roleTabs.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.dataset.role = "all";
  allBtn.className = state.roleId === "all" ? "active" : "";
  allBtn.innerHTML = S('<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>') + "<span>All Roles</span>";
  els.roleTabs.appendChild(allBtn);

  for (const role of ROLES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.role = role.id;
    btn.className = role.id === state.roleId ? "active" : "";
    btn.innerHTML = role.icon + "<span>" + role.name + "</span>";
    els.roleTabs.appendChild(btn);
  }
}

function currentRows() {
  const tier = activeTier();
  const role = activeRole(tier);
  let rows = (role.rows || []).slice();
  if (state.heroFilterId) rows = rows.filter((r) => r.heroId === state.heroFilterId);
  const key = state.sortKey;
  const dir = state.sortDir === "asc" ? 1 : -1;
  rows.sort((a, b) => (a[key] - b[key]) * dir);
  return rows;
}

function updateTelemetry() {
  if (!DATA) return;
  const tier = activeTier();
  const role = activeRole(tier);
  const rows = (role.rows || []).slice();

  if (els.kpiTrackedCount) els.kpiTrackedCount.textContent = rows.length + " Heroes";
  if (els.kpiTierName) {
    els.kpiTierName.textContent =
      state.roleId === "all"
        ? tier.name + " \u00b7 All Roles"
        : tier.name + " \u00b7 " + role.name + " Lane";
  }
  if (els.kpiPatch && DATA.patch) els.kpiPatch.textContent = "Patch " + DATA.patch;

  if (rows.length) {
    // King of the Rift: highest win rate in role
    const king = rows.slice().sort((a, b) => b.win - a.win)[0];
    if (king && els.kpiKingName) {
      els.kpiKingName.textContent = king.name;
      els.kpiKingRate.textContent = king.win.toFixed(2) + "%";
      els.kpiKingAvatar.src = king.avatar;
      els.kpiKingRole.textContent = "#1 Win Rate \u00b7 " + (king.posName || role.name);
      els.kpiKingCard.onclick = () => openChampionSheet(king, 1);
    }

    // Most Contested: highest pick + ban in role
    const contested = rows.slice().sort((a, b) => (b.pick + b.ban) - (a.pick + a.ban))[0];
    if (contested && els.kpiContestedName) {
      els.kpiContestedName.textContent = contested.name;
      els.kpiContestedRate.textContent = (contested.pick + contested.ban).toFixed(1) + "%";
      els.kpiContestedAvatar.src = contested.avatar;
      els.kpiContestedRole.textContent = "Pick: " + contested.pick.toFixed(1) + "% \u00b7 Ban: " + contested.ban.toFixed(1) + "%";
      els.kpiContestedCard.onclick = () => openChampionSheet(contested);
    }
  }
}

function findGuide(heroOrSlug) {
  if (!GUIDES) return null;
  if (!heroOrSlug) return null;
  const raw = (typeof heroOrSlug === "string" ? heroOrSlug : (heroOrSlug.slug || heroOrSlug.name || heroOrSlug.heroId || "")).toLowerCase().trim();
  const clean = raw.replace(/[^a-z0-9]/g, "");
  if (!clean) return null;

  if (GUIDES[raw]) return GUIDES[raw];
  if (GUIDES[clean]) return GUIDES[clean];

  for (const [k, g] of Object.entries(GUIDES)) {
    if (k.replace(/[^a-z0-9]/g, "") === clean) return g;
    if (g.name && g.name.toLowerCase().replace(/[^a-z0-9]/g, "") === clean) return g;
    if (g.slug && g.slug.replace(/[^a-z0-9]/g, "") === clean) return g;
  }

  if (clean.includes("nunu")) return GUIDES["nunu-willump"] || GUIDES["nunu"];
  if (clean.includes("drmundo") || clean.includes("mundo")) return GUIDES["dr-mundo"];
  if (clean.includes("jarvan")) return GUIDES["jarvan-iv"];
  if (clean.includes("kaisa")) return GUIDES["kai-sa"];
  if (clean.includes("khazix")) return GUIDES["khazix"];
  if (clean.includes("leesin")) return GUIDES["lee-sin"];
  if (clean.includes("masteryi")) return GUIDES["master-yi"];
  if (clean.includes("missfortune")) return GUIDES["miss-fortune"];
  if (clean.includes("twistedfate")) return GUIDES["twisted-fate"];
  if (clean.includes("xinzhao")) return GUIDES["xin-zhao"];
  if (clean.includes("aurelionsol")) return GUIDES["aurelion-sol"];
  return null;
}

function renderBentoModal(heroOrRow, roleOverride, rankNumber) {
  const guide = findGuide(heroOrRow);
  const heroName = (guide && guide.name) || (typeof heroOrRow === "string" ? heroOrRow : (heroOrRow && heroOrRow.name) || "Champion");

  // Determine live stats row if available
  let statRow = null;
  if (heroOrRow && heroOrRow.win !== undefined) {
    statRow = heroOrRow;
  } else if (DATA && DATA.tiers) {
    const tier = activeTier();
    for (const role of (tier.roles || [])) {
      const found = (role.rows || []).find((r) => r.name.toLowerCase() === heroName.toLowerCase());
      if (found) { statRow = found; break; }
    }
    if (!statRow) {
      for (const t of DATA.tiers) {
        for (const role of (t.roles || [])) {
          const found = (role.rows || []).find((r) => r.name.toLowerCase() === heroName.toLowerCase());
          if (found) { statRow = found; break; }
        }
        if (statRow) break;
      }
    }
  }

  // Determine active guide role
  const availableRoles = guide && guide.guides ? Object.keys(guide.guides) : [];
  let roleKey = roleOverride ? roleOverride.toLowerCase() : null;

  if (!roleKey) {
    if (statRow && statRow.posName) {
      const p = statRow.posName.toLowerCase();
      const match = availableRoles.find((r) => r === p || (p.includes("duo") && r === "dragon") || (p.includes("dragon") && r === "dragon"));
      if (match) roleKey = match;
    }
    if (!roleKey && availableRoles.length) {
      roleKey = availableRoles[0];
    }
  }

  const guideRoleData = (guide && guide.guides && roleKey) ? guide.guides[roleKey] : (availableRoles.length ? guide.guides[availableRoles[0]] : null);

  // Avatar and Identity
  const avatarUrl = (guide && guide.avatar) || (statRow && statRow.avatar) || "https://www.wildriftguides.com/assets/champions/amumu.png";
  if (els.sheetAvatar) {
    els.sheetAvatar.src = avatarUrl;
    els.sheetAvatar.alt = heroName;
  }
  if (els.sheetName) {
    els.sheetName.textContent = heroName.toUpperCase();
  }

  // Role Switcher Buttons
  if (els.sheetRoleSwitcher) {
    els.sheetRoleSwitcher.innerHTML = "";
    if (availableRoles.length > 1) {
      for (const r of availableRoles) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = r === "dragon" ? "DUO" : r.toUpperCase();
        btn.className = r === roleKey ? "active" : "";
        btn.onclick = () => renderBentoModal(heroOrRow, r, rankNumber);
        els.sheetRoleSwitcher.appendChild(btn);
      }
    }
  }

  // Role, Rank and Patch Badges
  if (els.sheetRole) {
    els.sheetRole.textContent = roleKey ? (roleKey === "dragon" ? "DUO" : roleKey.toUpperCase()) : (statRow && statRow.posName ? statRow.posName : "ROLE");
  }
  if (els.sheetRank) {
    els.sheetRank.textContent = rankNumber ? "#" + rankNumber : (statRow ? "#" + (statRow.rank || "1") : "PRO BUILD");
  }
  if (els.sheetPatch) {
    els.sheetPatch.textContent = (guideRoleData && guideRoleData.patch) ? "Patch " + guideRoleData.patch : (DATA && DATA.patch ? "Patch " + DATA.patch : "Patch 7.2e");
  }

  // Telemetry Pills
  if (statRow) {
    const tier = activeTier();
    const role = activeRole(tier);
    const rows = role.rows || [];
    const avgWin = rows.length ? rows.reduce((s, r) => s + r.win, 0) / rows.length : 50;
    const avgPick = rows.length ? rows.reduce((s, r) => s + r.pick, 0) / rows.length : 5;
    const avgBan = rows.length ? rows.reduce((s, r) => s + r.ban, 0) / rows.length : 5;
    const winDelta = statRow.win - avgWin;
    const pickDelta = statRow.pick - avgPick;
    const banDelta = statRow.ban - avgBan;

    if (els.sheetWin) els.sheetWin.textContent = statRow.win.toFixed(2) + "%";
    if (els.sheetWinDelta) {
      els.sheetWinDelta.textContent = (winDelta >= 0 ? "+" : "") + winDelta.toFixed(1) + "%";
      els.sheetWinDelta.style.color = winDelta >= 0 ? "var(--rate-win)" : "var(--rate-ban)";
    }
    if (els.sheetPick) els.sheetPick.textContent = statRow.pick.toFixed(2) + "%";
    if (els.sheetPickDelta) els.sheetPickDelta.textContent = (pickDelta >= 0 ? "+" : "") + pickDelta.toFixed(1) + "%";
    if (els.sheetBan) els.sheetBan.textContent = statRow.ban.toFixed(2) + "%";
    if (els.sheetBanDelta) els.sheetBanDelta.textContent = (banDelta >= 0 ? "+" : "") + banDelta.toFixed(1) + "%";
  } else {
    if (els.sheetWin) els.sheetWin.textContent = "54.20%";
    if (els.sheetWinDelta) els.sheetWinDelta.textContent = "+3.4%";
    if (els.sheetPick) els.sheetPick.textContent = "4.85%";
    if (els.sheetPickDelta) els.sheetPickDelta.textContent = "+1.2%";
    if (els.sheetBan) els.sheetBan.textContent = "1.90%";
    if (els.sheetBanDelta) els.sheetBanDelta.textContent = "-0.8%";
  }

  // If no guide available, render fallback message
  if (!guideRoleData) {
    if (els.bentoBody) {
      els.bentoBody.innerHTML = `
        <div class="bento-card" style="text-align: center; padding: 36px 20px;">
          <div class="bento-sec-title"><span>Ranked Ladder Telemetry</span></div>
          <p style="color:var(--text-secondary); margin-top:8px;">Live stats synced for ${escapeHtml(heroName)}. Pro equipment and counter guide will be compiled automatically.</p>
        </div>
      `;
    }
    return;
  }

  // FORMAT 01: ESPORTS COMMAND BENTO GRID BODY
  const g = guideRoleData;
  const starting = g.startingItem || { name: "Starter", goldCost: "500", iconUrl: "https://www.wildriftguides.com/assets/items/long-sword.png", note: "Recommended starter purchase." };
  const boots = g.boots || { name: "Boots", goldCost: "1400", iconUrl: "https://www.wildriftguides.com/assets/items/immortal-treads.png", note: "Tier boots upgrade." };
  const coreItems = g.coreItems || [];
  const situational = g.situationalItems || [];
  const keystone = g.keystoneRune || { name: "Keystone", iconUrl: "https://www.wildriftguides.com/assets/Runes/conqueror.png", desc: "Gain stacking combat bonuses." };
  const minorRunes = (g.primaryRunes || []).concat(g.secondaryRunes || []);
  const spells = g.spells || [];
  const skillOrder = g.skillOrder || ["Q", "E", "W"];
  const matchups = g.matchups || {};
  const badAgainst = matchups.weakAgainst || matchups.badAgainst || [];
  const goodAgainst = matchups.goodAgainst || matchups.strongAgainst || [];
  const plan = g.gamePlan || {};

  if (els.bentoBody) {
    els.bentoBody.innerHTML = `
      <div class="bento-top-grid">
        <!-- LEFT BENTO BOX: EQUIPMENT BUILD PROGRESSION -->
        <div class="bento-card">
          <div class="bento-sec-title">
            <span>Equipment Build Progression</span>
            <strong>${escapeHtml(g.patch || "Patch 7.2e")}</strong>
          </div>

          <div class="bento-sub-title">Starting Item &amp; Boots</div>
          <div class="item-slots-row" style="margin-bottom: 16px;">
            <div class="item-slot" title="${escapeHtml((starting.name || '') + (starting.note ? ': ' + starting.note : ''))}">
              <img src="${starting.iconUrl}" alt="${escapeHtml(starting.name)}" loading="lazy" />
              <span class="cost">${starting.goldCost ? starting.goldCost + 'g' : ''}</span>
              <span class="name">${escapeHtml(starting.name)}</span>
            </div>
            <div class="item-slot" title="${escapeHtml((boots.name || '') + (boots.note ? ': ' + boots.note : ''))}">
              <img src="${boots.iconUrl}" alt="${escapeHtml(boots.name)}" loading="lazy" />
              <span class="cost">${boots.goldCost ? boots.goldCost + 'g' : ''}</span>
              <span class="name">${escapeHtml(boots.name)}</span>
            </div>
          </div>

          <div class="bento-sub-title" style="color:var(--accent);">Core 5-Item Path</div>
          <div class="item-slots-row" style="margin-bottom: 16px;">
            ${coreItems.map(it => `
              <div class="item-slot core" title="${escapeHtml((it.name || '') + (it.note ? ': ' + it.note : ''))}">
                <img src="${it.iconUrl}" alt="${escapeHtml(it.name)}" loading="lazy" />
                <span class="cost">${it.goldCost ? it.goldCost + 'g' : ''}</span>
                <span class="name">${escapeHtml(it.name)}</span>
              </div>
            `).join('')}
          </div>

          ${situational.length ? `
            <div class="bento-sub-title">Situational Items</div>
            <div class="item-slots-row">
              ${situational.slice(0, 5).map(it => `
                <div class="item-slot" title="${escapeHtml((it.name || '') + (it.note ? ': ' + it.note : ''))}">
                  <img src="${it.iconUrl}" alt="${escapeHtml(it.name)}" loading="lazy" />
                  <span class="cost">${it.goldCost ? it.goldCost + 'g' : ''}</span>
                  <span class="name">${escapeHtml(it.name)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- RIGHT BENTO BOX: RUNE MATRIX, SPELLS & THREAT RADAR -->
        <div style="display:flex; flex-direction:column; gap:16px;">
          <!-- RUNE MATRIX & SPELLS CARD -->
          <div class="bento-card">
            <div class="bento-sec-title"><span>Rune Matrix &amp; Spells</span><strong>Optimal</strong></div>
            <div class="rune-matrix-row">
              <img class="keystone-img" src="${keystone.iconUrl}" alt="${escapeHtml(keystone.name)}" />
              <div>
                <div class="keystone-name">${escapeHtml(keystone.name)}</div>
                <div class="keystone-desc">${escapeHtml(keystone.desc || keystone.note || '')}</div>
              </div>
            </div>

            <div class="minor-runes-strip">
              ${minorRunes.slice(0, 4).map(r => `
                <div class="minor-rune-slot" title="${escapeHtml((r.name || '') + (r.note ? ': ' + r.note : ''))}">
                  <img src="${r.iconUrl}" alt="${escapeHtml(r.name)}" loading="lazy" />
                  <span>${escapeHtml(r.name)}</span>
                </div>
              `).join('')}
            </div>

            <div class="spells-skills-row">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:var(--fs-caption); font-weight:700; color:var(--text-muted); text-transform:uppercase;">Spells:</span>
                <div class="spells-strip">
                  ${spells.map(s => {
                    const sid = (s.id || s.name || "").toLowerCase().trim();
                    const icon = ["flash", "ignite", "smite", "ghost", "heal", "barrier", "exhaust", "teleport"].includes(sid)
                      ? `/assets/spells/${sid}.png`
                      : (s.iconUrl || "/assets/spells/flash.png");
                    return `
                      <div class="spell-slot" title="${escapeHtml((s.name || '') + (s.note ? ': ' + s.note : ''))}">
                        <img class="spell-icon" src="${icon}" alt="${escapeHtml(s.name)}" loading="lazy" onerror="this.src='/assets/spells/flash.png'" />
                        <span class="spell-name">${escapeHtml(s.name)}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:var(--fs-caption); font-weight:700; color:var(--text-muted); text-transform:uppercase;">Skill Max:</span>
                <div class="skill-order-strip">
                  ${skillOrder.map((sk, idx) => `
                    <div class="skill-pill"><span class="num">${idx + 1}</span><span>${escapeHtml(sk)}</span></div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- THREAT RADAR CARD -->
          <div class="bento-card">
            <div class="bento-sec-title"><span>Threat Radar &amp; Counters</span></div>
            <div class="threat-radar-col">
              ${badAgainst.slice(0, 2).map(c => `
                <div class="threat-box counter">
                  <strong>Countered By ${escapeHtml(c.champion)}</strong>: ${escapeHtml(c.note)}
                </div>
              `).join('')}
              ${goodAgainst.slice(0, 2).map(c => `
                <div class="threat-box favored">
                  <strong>Favored Into ${escapeHtml(c.champion)}</strong>: ${escapeHtml(c.note)}
                </div>
              `).join('')}
              ${(!badAgainst.length && !goodAgainst.length) ? '<div class="placeholder" style="padding:8px;">Balanced across standard match dynamics.</div>' : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- BOTTOM BENTO BOX: TACTICAL GAME PLAN PLAYBOOK -->
      ${(plan.earlyGame || plan.midGame || plan.lateGame || plan.teamfights || plan.overview) ? `
        <div class="bento-card">
          <div class="bento-sec-title"><span>Tactical Combat Playbook</span><strong>Pro Strategy</strong></div>
          <div class="playbook-grid">
            <div class="playbook-phase">
              <div class="playbook-phase-head">Phase 1 &middot; Early Game</div>
              <div class="playbook-phase-text">${escapeHtml(plan.earlyGame || 'Focus on early minion waves, defensive positioning, and short trades during ability cooldowns.')}</div>
            </div>
            <div class="playbook-phase">
              <div class="playbook-phase-head">Phase 2 &middot; Mid Game</div>
              <div class="playbook-phase-text">${escapeHtml(plan.midGame || 'Rotate to Dragon and Rift Herald skirmishes once completing first item power spike.')}</div>
            </div>
            <div class="playbook-phase">
              <div class="playbook-phase-head">Phase 3 &middot; Late Game</div>
              <div class="playbook-phase-text">${escapeHtml(plan.lateGame || 'Secure neutral objective vision and hold formation around major teamfight objectives.')}</div>
            </div>
            <div class="playbook-phase">
              <div class="playbook-phase-head">Phase 4 &middot; Teamfights</div>
              <div class="playbook-phase-text">${escapeHtml(plan.teamfights || plan.teamfight || 'Target high-priority carries and coordinate crowd-control chains with your frontline.')}</div>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }
}

function openChampionSheet(heroOrRow, rankNumber, roleOverride) {
  if (!heroOrRow || !els.sheet) return;
  state.activeChamp = heroOrRow;
  renderBentoModal(heroOrRow, roleOverride, rankNumber);
  els.sheetScrim.classList.add("open");
  els.sheet.classList.add("open");
  els.sheet.setAttribute("aria-hidden", "false");
  els.sheetScrim.setAttribute("aria-hidden", "false");
}

function closeChampionSheet() {
  if (!els.sheet) return;
  els.sheet.classList.remove("open");
  els.sheetScrim.classList.remove("open");
  els.sheet.setAttribute("aria-hidden", "true");
  els.sheetScrim.setAttribute("aria-hidden", "true");
}

function renderTable() {
  if (!DATA) return;
  const tier = activeTier();
  const role = activeRole(tier);
  const rows = currentRows();

  if (!rows.length) {
    const label = state.heroFilterId
      ? "No data for this champion in " + role.name + " at " + tier.name + "."
      : "No data for this role.";
    els.tbody.innerHTML =
      '<tr><td colspan="6" class="placeholder">' + escapeHtml(label) + "</td></tr>";
    if (els.tableRegion) els.tableRegion.setAttribute("aria-busy", "false");
    return;
  }

  const tpl = document.getElementById("row-template");
  const frag = document.createDocumentFragment();

  const winVals = rows.map((r) => r.win);
  const minWin = Math.min.apply(null, winVals);
  const maxWin = Math.max.apply(null, winVals);
  const maxPick = Math.max(1, Math.max.apply(null, rows.map((r) => r.pick)));
  const maxBan = Math.max(1, Math.max.apply(null, rows.map((r) => r.ban)));

  const winFill = (value) =>
    maxWin - minWin < 0.01 ? 0.6 : 0.12 + 0.88 * ((value - minWin) / (maxWin - minWin));

  rows.forEach((row, i) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector(".rank").textContent = i + 1;
    const badge = node.querySelector(".role-badge");
    badge.textContent = row.posName || role.name;
    const img = node.querySelector(".hero-avatar");
    img.src = row.avatar;
    img.alt = row.name;
    node.querySelector(".hero-name").textContent = row.name;

    const winVal = node.querySelector(".rate-val.win");
    const winFillEl = node.querySelector(".rate-fill.win");
    if (winVal) winVal.textContent = row.win.toFixed(2) + "%";
    if (winFillEl) winFillEl.style.setProperty("--fill", winFill(row.win).toFixed(3));

    const pickVal = node.querySelector(".rate-val.pick");
    const pickFillEl = node.querySelector(".rate-fill.pick");
    if (pickVal) pickVal.textContent = row.pick.toFixed(2) + "%";
    if (pickFillEl) pickFillEl.style.setProperty("--fill", Math.max(0.06, row.pick / maxPick).toFixed(3));

    const banVal = node.querySelector(".rate-val.ban");
    const banFillEl = node.querySelector(".rate-fill.ban");
    if (banVal) banVal.textContent = row.ban.toFixed(2) + "%";
    if (banFillEl) banFillEl.style.setProperty("--fill", Math.max(0.06, row.ban / maxBan).toFixed(3));

    // Tap to inspect champion
    node.addEventListener("click", () => openChampionSheet(row, i + 1));

    frag.appendChild(node);
  });

  els.tbody.innerHTML = "";
  els.tbody.appendChild(frag);
  if (els.tableRegion) els.tableRegion.setAttribute("aria-busy", "false");
}

function buildBand(tier, champs) {
  const band = document.createElement("div");
  band.className = "tier-band";
  band.dataset.grade = tier.key;

  const label = document.createElement("div");
  label.className = "tier-label";
  label.innerHTML = "<b>" + escapeHtml(tier.label) + "</b>";

  const grid = document.createElement("div");
  grid.className = "tier-grid";
  for (const champ of champs) grid.appendChild(buildTierCell(champ, tier));
  if (!champs.length) {
    const empty = document.createElement("div");
    empty.className = "placeholder";
    empty.style.padding = "16px";
    empty.textContent = "No champions in this tier.";
    grid.appendChild(empty);
  }

  const notes = document.createElement("aside");
  notes.className = "tier-notes";
  notes.innerHTML =
    '<span class="tier-notes__title">' +
    escapeHtml(tier.label) + " Tier</span>" +
    "<p>" + escapeHtml(tier.desc) + "</p>";

  band.appendChild(label);
  band.appendChild(grid);
  band.appendChild(notes);
  return band;
}

function renderTierlist() {
  els.tierlist.classList.toggle("compact", state.compact);
  const role = roleMeta(state.roleId);

  if (!TIER) {
    els.tierlistSub.textContent = "";
    els.tierlist.innerHTML = '<div class="placeholder">Loading tier list\u2026</div>';
    return;
  }

  let total = 0;
  const frag = document.createDocumentFragment();
  for (const tier of TIER.tiers) {
    if (state.tierGradeFilter && state.tierGradeFilter !== "all" && tier.key !== state.tierGradeFilter) {
      continue;
    }
    const champs = state.roleId === "all"
      ? tier.champions
      : tier.champions.filter((c) => c.posId === state.roleId);
    total += champs.length;
    frag.appendChild(buildBand(tier, champs));
  }

  els.tierlistSub.textContent =
    (TIER.patch ? TIER.patch + " \u00b7 " : "") +
    role.name +
    " \u00b7 " +
    total +
    " champions" +
    (state.tierGradeFilter && state.tierGradeFilter !== "all" ? " (Tier " + state.tierGradeFilter.toUpperCase() + ")" : "");

  els.tierlist.innerHTML = "";
  els.tierlist.appendChild(frag);
}

function buildTierCell(champ, tier) {
  const cell = document.createElement("div");
  cell.className = "tier-cell";
  if (champ.heroId) cell.dataset.hero = champ.heroId;
  cell.dataset.role = champ.posId;
  cell.setAttribute("tabindex", "0");
  cell.setAttribute("role", "button");
  cell.setAttribute("aria-label", champ.name + ", " + tier.label + " Tier");

  const lane = roleMeta(champ.posId);
  const delta =
    champ.delta === "up" ? '<span class="card-delta up">\u25B2</span>' :
    champ.delta === "down" ? '<span class="card-delta down">\u25BC</span>' :
    "";

  cell.innerHTML =
    '<div class="tier-card">' +
    '<span class="card-lane" title="' + escapeHtml(lane.name || "") + '">' + (lane.icon || "") + "</span>" +
    '<img class="tier-avatar" alt="' + escapeHtml(champ.name) + '" loading="lazy" src="' + escapeHtml(champ.avatar) + '">' +
    delta +
    "</div>" +
    '<span class="tier-name">' + escapeHtml(champ.name) + "</span>";

  cell.addEventListener("mouseenter", (e) => showTooltip(e, champ, tier));
  cell.addEventListener("mousemove", moveTooltip);
  cell.addEventListener("mouseleave", hideTooltip);
  cell.addEventListener("click", () => openHero(champ));
  cell.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openHero(champ);
    }
  });
  return cell;
}

function ensureTooltip() {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.createElement("div");
  tooltipEl.className = "tier-tooltip";
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

function showTooltip(event, champ, tier) {
  const tip = ensureTooltip();
  const lane = roleMeta(champ.posId);
  tip.innerHTML =
    '<div class="tt-name">' + escapeHtml(champ.name) +
    ' <span class="tt-grade">' + escapeHtml(tier.label) + "</span></div>" +
    '<div class="tt-row">' + escapeHtml(lane.name || champ.lane) + " \u00b7 " +
    escapeHtml(tier.label) + " Tier" +
    (champ.heroId ? "" : " \u00b7 unmapped in roster") + "</div>" +
    '<div class="tt-row" style="margin-top:4px;">' + escapeHtml(tier.desc) + "</div>";
  moveTooltip(event);
  tip.style.opacity = "1";
}

function moveTooltip(event) {
  if (!tooltipEl) return;
  const x = Math.max(120, Math.min(window.innerWidth - 120, event.clientX));
  const y = Math.max(70, event.clientY - 14);
  tooltipEl.style.left = x + "px";
  tooltipEl.style.top = y + "px";
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.opacity = "0";
}

function openHero(champ) {
  if (!champ) return;
  openChampionSheet(champ.slug || champ.name || champ.heroId || champ);
}

function updateSortHeaders() {
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.classList.remove("asc", "desc");
    if (th.dataset.sort === state.sortKey) th.classList.add(state.sortDir);
  });
}

function renderChampionsView() {
  if (!els.championsGrid) return;
  if (!GUIDES) {
    els.championsGrid.innerHTML = '<div class="placeholder" style="grid-column:1/-1;">Loading champions roster&hellip;</div>';
    return;
  }

  const query = (state.champSearchQuery || "").toLowerCase().trim();
  const filterRole = state.champRoleFilter || "all";

  let list = Object.values(GUIDES);

  if (filterRole !== "all") {
    list = list.filter((c) => {
      const roles = (c.roles || []).map((r) => r.toLowerCase());
      if (filterRole === "duo") return roles.includes("duo") || roles.includes("dragon");
      return roles.includes(filterRole);
    });
  }

  if (query) {
    list = list.filter((c) => (c.name && c.name.toLowerCase().includes(query)) || (c.slug && c.slug.toLowerCase().includes(query)));
  }

  list.sort((a, b) => a.name.localeCompare(b.name));

  if (els.champCountNote) {
    els.champCountNote.textContent = `${list.length} Champions \u00b7 Pro Builds & Counters`;
  }

  if (!list.length) {
    els.championsGrid.innerHTML = '<div class="placeholder" style="grid-column:1/-1; padding:32px;">No champions found matching your criteria.</div>';
    return;
  }

  const roleSvgMap = {
    baron: '<path fill-rule="evenodd" d="M12 2.2c-.8 2.2-2.5 3.8-4.5 4.5L4 4.5c.5 3.5.2 6.5-1.5 8.5 2.5.5 4.5-.5 6-2-1 2.5-2 5-4.5 6.5 4 .5 6.5-1.5 8-4 1.5 2.5 4 4.5 8 4-2.5-1.5-3.5-4-4.5-6.5 1.5 1.5 3.5 2.5 6 2-1.7-2-2-5-1.5-8.5l-3.5 2.5c-2-.7-3.7-2.3-4.5-4.5zm0 7.2l2.2 2.8-2.2 2.8-2.2-2.8 2.2-2.8z"/>',
    jungle: '<path d="M6 21.5c.3-5 1.8-11.2 4.2-15.2-1.5 4.5-1.2 10.5-.2 15.2H6zm5.5 0c.2-6.5 1-13 2.5-19.5 0 6.5 0 13-1.5 19.5h-1zm4.5 0c-.5-5 .2-10 3.2-14.8-.6 4.8.5 10.2 2 14.8H16z"/>',
    mid: '<path d="M12 1.8l-2.6 13.7 2.6 6.5 2.6-6.5L12 1.8zM4.2 13.5C5.5 11 6.8 8.5 7.8 6c-.2 3.5.5 7.5 1.6 11-2.6-1-4.2-2-5.2-3.5zm15.6 0c-1.3-2.5-2.6-5-3.6-7.5.2 3.5-.5 7.5-1.6 11 2.6-1 4.2-2 5.2-3.5z"/>',
    duo: '<path d="M7.8 3.5c-.8 2.2-1.8 4.2-3.2 5.5 1.4.2 2.4 0 3-.5-.5 2-1.5 3.8-2.6 4.8 1.4.2 2.4 0 3-.5-.8 3-1.2 5.5-1.8 8.2 2-1 3.5-3 4-6V3.5H7.8zm8.4 0c.8 2.2 1.8 4.2 3.2 5.5-1.4.2-2.4 0-3-.5.5 2 1.5 3.8 2.6 4.8-1.4.2-2.4 0-3-.5.8 3 1.2 5.5 1.8 8.2-2-1-3.5-3-4-6V3.5h2.4z"/>',
    dragon: '<path d="M7.8 3.5c-.8 2.2-1.8 4.2-3.2 5.5 1.4.2 2.4 0 3-.5-.5 2-1.5 3.8-2.6 4.8 1.4.2 2.4 0 3-.5-.8 3-1.2 5.5-1.8 8.2 2-1 3.5-3 4-6V3.5H7.8zm8.4 0c.8 2.2 1.8 4.2 3.2 5.5-1.4.2-2.4 0-3-.5.5 2 1.5 3.8 2.6 4.8-1.4.2-2.4 0-3-.5.8 3 1.2 5.5 1.8 8.2-2-1-3.5-3-4-6V3.5h2.4z"/>',
    support: '<path d="M9 3.5h6l-1.5 3.5h-3L9 3.5zm1.8 5h2.4l1.2 6.5-2.4 6.5-2.4-6.5 1.2-6.5zM3.8 8c2.5.5 4.5 2 5.7 4.5-2 .5-4.2 0-5.7-1.5-.2-1-.2-2 0-3zm16.4 0c-2.5.5-4.5 2-5.7 4.5 2 .5 4.2 0 5.7-1.5.2-1 .2-2 0-3z"/>'
  };

  const frag = document.createDocumentFragment();
  for (const c of list) {
    const card = document.createElement("article");
    card.className = "champ-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${c.name} Build and Counters`);

    const badgesHtml = (c.roles || []).map((r) => {
      const rk = r.toLowerCase();
      const svg = roleSvgMap[rk] || '';
      return `<span class="champ-lane-badge" title="${r === 'dragon' ? 'DUO' : r.toUpperCase()}">${S(svg)}</span>`;
    }).join('');

    card.innerHTML = `
      <img class="champ-card-img" src="${c.avatar}" alt="${escapeHtml(c.name)}" loading="lazy" />
      <div class="champ-card-overlay"></div>
      <div class="champ-card-lane-badges">${badgesHtml}</div>
      <div class="champ-card-name">${escapeHtml(c.name)}</div>
    `;

    card.addEventListener("click", () => openChampionSheet(c.slug));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openChampionSheet(c.slug);
      }
    });

    frag.appendChild(card);
  }

  els.championsGrid.innerHTML = "";
  els.championsGrid.appendChild(frag);
}

function render() {
  buildTierTabs();
  buildRoleTabs();
  updateSortHeaders();
  updateTelemetry();

  if (els.heroTelemetry) {
    els.heroTelemetry.style.display = (state.view === "stats") ? "" : "none";
  }
  if (els.controlsCluster) {
    els.controlsCluster.style.display = (state.view === "champions") ? "none" : "";
  }

  const tierTrack = els.tierTabs ? els.tierTabs.closest(".tabs-scroll-track") : null;
  const roleTrack = els.roleTabs ? els.roleTabs.closest(".tabs-scroll-track") : null;

  if (tierTrack) tierTrack.style.display = (state.view === "stats") ? "" : "none";
  if (roleTrack) roleTrack.style.display = (state.view === "champions") ? "none" : "";

  els.viewStats.hidden = state.view !== "stats";
  els.viewStats.style.display = (state.view === "stats") ? "" : "none";

  els.viewTierlist.hidden = state.view !== "tierlist";
  els.viewTierlist.style.display = (state.view === "tierlist") ? "" : "none";

  if (els.viewChampions) {
    els.viewChampions.hidden = state.view !== "champions";
    els.viewChampions.style.display = (state.view === "champions") ? "flex" : "none";
  }

  if (state.view === "stats") renderTable();
  else if (state.view === "tierlist") renderTierlist();
  else if (state.view === "champions") renderChampionsView();

  syncAllIndicators();
}

function setView(view) {
  state.view = view;
  for (const btn of els.views.querySelectorAll("button")) {
    btn.classList.toggle("active", btn.dataset.view === view);
  }
  render();
}

function setStatus(kind, text) {
  if (els.liveDot) els.liveDot.className = "dot" + (kind === "ok" ? "" : " " + kind);
  if (text && els.dataUpdated) els.dataUpdated.textContent = text;
}

const ONE_HOUR_MS = 60 * 60 * 1000;
let lastRefreshCycle = Math.floor(Date.now() / ONE_HOUR_MS);

function startTimer() {
  if (timerHandle) clearInterval(timerHandle);

  function tick() {
    const now = Date.now();
    const currentCycle = Math.floor(now / ONE_HOUR_MS);
    const msLeft = ONE_HOUR_MS - (now % ONE_HOUR_MS);
    const formatted = formatClock(msLeft);

    if (els.refreshTimer) els.refreshTimer.textContent = formatted;
    if (els.kpiCountdown) els.kpiCountdown.textContent = formatted;

    if (currentCycle !== lastRefreshCycle) {
      lastRefreshCycle = currentCycle;
      load(false);
      loadTier(false);
    }
  }

  tick();
  timerHandle = setInterval(tick, 1000);
}

async function loadTier(force) {
  try {
    const res = await fetch("/api/tierlist" + (force ? "?force=1" : ""));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    TIER = data;
    if (state.view === "tierlist") renderTierlist();
  } catch (err) {
    if (!TIER && state.view === "tierlist") {
      els.tierlist.innerHTML =
        '<div class="placeholder">Could not load the tier list. ' +
        escapeHtml(err.message) + "</div>";
    }
  }
}

async function loadGuides() {
  try {
    const res = await fetch("/api/guides");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    GUIDES = data;
    if (state.view === "champions") renderChampionsView();
  } catch (err) {
    console.error("Could not load guides:", err);
  }
}

async function load(force) {
  setStatus("loading", "Updating\u2026");
  try {
    const res = await fetch("/api/stats" + (force ? "?force=1" : ""));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    DATA = data;
    if (!DATA.tiers.some((t) => t.id === state.tierId)) {
      state.tierId = DATA.tiers[0].id;
    }
    setStatus("ok", "Live Sync");
    els.sourceNote.textContent =
      DATA.source +
      " \u00b7 updated " +
      new Date(DATA.generatedAt).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) +
      (force ? " \u00b7 forced" : "");
    render();
    startTimer();
  } catch (err) {
    setStatus("stale", "Offline");
    els.tbody.innerHTML =
      '<tr><td colspan="6" class="placeholder">Could not reach the data source. ' +
      escapeHtml(err.message) + "</td></tr>";
    if (els.tableRegion) els.tableRegion.setAttribute("aria-busy", "false");
  }
}

function showSearchResults(query) {
  const q = query.trim().toLowerCase();
  if (!DATA || !DATA.heroes) return;
  const heroes = Object.values(DATA.heroes);
  const matches = (q ? heroes.filter((h) => h.name.toLowerCase().includes(q)) : heroes).slice(0, 40);

  const items = ['<li data-hero="all" class="all"><span>Show all champions</span></li>'];
  for (const hero of matches) {
    items.push(
      '<li data-hero="' + escapeHtml(hero.heroId) + '"><img src="' +
      escapeHtml(hero.avatar) + '" alt="" /><span>' + escapeHtml(hero.name) + "</span></li>"
    );
  }
  els.searchResults.innerHTML = items.join("");
  els.searchResults.hidden = false;
}

function pickHero(heroId) {
  els.searchResults.hidden = true;
  if (heroId === "all") {
    state.heroFilterId = null;
    els.searchInput.value = "";
    els.searchClear.hidden = true;
    renderTable();
    return;
  }
  const tier = activeTier();
  let foundRole = null;
  for (const role of tier.roles) {
    if (role.rows.some((r) => r.heroId === heroId)) {
      foundRole = role;
      break;
    }
  }
  state.heroFilterId = heroId;
  if (foundRole) state.roleId = foundRole.id;
  const hero = DATA.heroes[heroId];
  els.searchInput.value = hero ? hero.name : "";
  els.searchClear.hidden = !els.searchInput.value;
  render();

  // Open sheet if in current role
  if (foundRole) {
    const row = foundRole.rows.find((r) => r.heroId === heroId);
    if (row) openChampionSheet(row);
  }
}

/* ==========================================================================
   EVENT LISTENERS & KEYBOARD SHORTCUTS
   ========================================================================== */
els.views.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-view]");
  if (btn) setView(btn.dataset.view);
});

els.compactBtn.addEventListener("click", () => {
  state.compact = !state.compact;
  els.compactBtn.setAttribute("aria-pressed", String(state.compact));
  renderTierlist();
});

if (els.tierGradeTabs) {
  els.tierGradeTabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-grade]");
    if (!btn) return;
    state.tierGradeFilter = btn.dataset.grade;
    for (const b of els.tierGradeTabs.querySelectorAll("button")) {
      b.classList.toggle("active", b === btn);
    }
    renderTierlist();
  });
}

els.tierTabs.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-tier]");
  if (!btn) return;
  state.tierId = btn.dataset.tier;
  state.heroFilterId = null;
  els.searchInput.value = "";
  els.searchClear.hidden = true;
  render();
});

els.roleTabs.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-role]");
  if (!btn) return;
  const clickedRole = btn.dataset.role;
  // If clicking the active role, toggle it off (unfilter to "all")!
  if (state.roleId === clickedRole) {
    state.roleId = "all";
  } else {
    state.roleId = clickedRole;
  }
  state.heroFilterId = null;
  els.searchInput.value = "";
  els.searchClear.hidden = true;
  render();
});

// Champions view role tabs
if (els.champRoleTabs) {
  els.champRoleTabs.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-role]");
    if (!btn) return;
    const clickedRole = btn.dataset.role;
    if (state.champRoleFilter === clickedRole && clickedRole !== "all") {
      state.champRoleFilter = "all";
    } else {
      state.champRoleFilter = clickedRole;
    }
    for (const b of els.champRoleTabs.querySelectorAll("button")) {
      b.classList.toggle("active", b.dataset.role === state.champRoleFilter);
    }
    renderChampionsView();
  });
}

// Champions view search
if (els.champSearchInput) {
  els.champSearchInput.addEventListener("input", () => {
    state.champSearchQuery = els.champSearchInput.value;
    if (els.champSearchClear) els.champSearchClear.hidden = !state.champSearchQuery;
    renderChampionsView();
  });
}

if (els.champSearchClear) {
  els.champSearchClear.addEventListener("click", () => {
    state.champSearchQuery = "";
    els.champSearchInput.value = "";
    els.champSearchClear.hidden = true;
    renderChampionsView();
    els.champSearchInput.focus();
  });
}

document.querySelectorAll("th.sortable").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
    } else {
      state.sortKey = key;
      state.sortDir = "desc";
    }
    updateSortHeaders();
    renderTable();
  });
});

els.searchInput.addEventListener("input", () => {
  if (!DATA) return;
  state.heroFilterId = null;
  els.searchClear.hidden = !els.searchInput.value;
  showSearchResults(els.searchInput.value);
});

els.searchInput.addEventListener("focus", () => {
  if (DATA) showSearchResults(els.searchInput.value);
});

els.searchClear.addEventListener("click", () => {
  els.searchInput.value = "";
  els.searchClear.hidden = true;
  state.heroFilterId = null;
  els.searchResults.hidden = true;
  renderTable();
  els.searchInput.focus();
});

els.searchResults.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-hero]");
  if (li) pickHero(li.dataset.hero);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box")) {
    if (els.searchResults) els.searchResults.hidden = true;
  }
});

// Sheet Event Handlers
if (els.sheetClose) els.sheetClose.addEventListener("click", closeChampionSheet);
if (els.sheetScrim) els.sheetScrim.addEventListener("click", closeChampionSheet);

// Global Keyboard Shortcuts
window.addEventListener("keydown", (e) => {
  // Command+K or Ctrl+K focusing spotlight search
  if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
    e.preventDefault();
    if (state.view === "champions" && els.champSearchInput) {
      els.champSearchInput.focus();
      els.champSearchInput.select();
    } else if (els.searchInput) {
      els.searchInput.focus();
      els.searchInput.select();
    }
  }
  // Slash shortcut for search
  if (e.key === "/" && document.activeElement !== els.searchInput && document.activeElement !== els.champSearchInput) {
    if (state.view === "champions" && els.champSearchInput) {
      e.preventDefault();
      els.champSearchInput.focus();
    } else if (state.view === "stats" && els.searchInput) {
      e.preventDefault();
      els.searchInput.focus();
    }
  }
  // Escape key closes modal sheet or search results
  if (e.key === "Escape") {
    closeChampionSheet();
    if (els.searchResults) els.searchResults.hidden = true;
  }
});

function initScrollTop() {
  if (!els.scrollTopBtn) return;
  const circumference = 2 * Math.PI * 18; // ~113.1

  function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;

    if (els.scrollProgressBar) {
      const offset = circumference - (progress * circumference);
      els.scrollProgressBar.style.strokeDashoffset = offset.toFixed(2);
    }

    if (scrollY > 260) {
      els.scrollTopBtn.classList.add("visible");
    } else {
      els.scrollTopBtn.classList.remove("visible");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  els.scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initFooterAndLegal() {
  const legalModal = document.getElementById("legal-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modal-close-btn");
  const btnPrivacy = document.getElementById("footer-privacy-btn");
  const btnTerms = document.getElementById("footer-terms-btn");

  const legalDocs = {
    privacy: {
      title: "Privacy Policy",
      html: `
        <p>This policy explains how Wild Rift Guides collects and manages data when you browse our telemetry and champion build platform.</p>
        <h4>1. Data Collection &amp; Analytics</h4>
        <p>We do not collect personally identifiable information. Standard web server access logs and anonymous performance telemetry are recorded to monitor server latency and cache hit ratios.</p>
        <h4>2. Local Storage</h4>
        <p>Your browser's <code>localStorage</code> may be used exclusively to persist UI preferences such as theme selection and search filters.</p>
        <h4>3. Third-Party Links</h4>
        <p>Our platform includes links to external third-party sites such as Riot Games and Facebook. We are not responsible for the privacy practices of external platforms.</p>
      `
    },
    terms: {
      title: "Terms of Service",
      html: `
        <p>Welcome to Wild Rift Guides. By accessing our platform, you agree to comply with the following terms:</p>
        <h4>1. Disclaimer of Affiliation</h4>
        <p>Wild Rift Guides is an unofficial community analytics platform created under Riot Games' "Legal Jibber Jabber" policy. We are not affiliated with, endorsed, or sponsored by Riot Games or Tencent.</p>
        <h4>2. Telemetry &amp; Accuracy</h4>
        <p>Ranked ladder statistics and champion build recommendations are computed from public match records and community meta analyses. Data is provided as-is without warranty of any kind.</p>
        <h4>3. Intellectual Property</h4>
        <p>League of Legends: Wild Rift and all related trademarks, logos, and champion imagery are property of Riot Games, Inc.</p>
      `
    }
  };

  function openModal(type) {
    const doc = legalDocs[type];
    if (!doc || !legalModal || !modalTitle || !modalBody) return;
    modalTitle.textContent = doc.title;
    modalBody.innerHTML = doc.html;
    legalModal.classList.add("open");
    legalModal.setAttribute("aria-hidden", "false");
  }

  function closeModal(e) {
    if (!legalModal) return;
    if (!e || e.target === legalModal || e.target === modalClose || e.key === "Escape") {
      legalModal.classList.remove("open");
      legalModal.setAttribute("aria-hidden", "true");
    }
  }

  if (btnPrivacy) btnPrivacy.addEventListener("click", () => openModal("privacy"));
  if (btnTerms) btnTerms.addEventListener("click", () => openModal("terms"));
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (legalModal) legalModal.addEventListener("click", closeModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && legalModal && legalModal.classList.contains("open")) {
      closeModal(e);
    }
  });

  // Footer Navigation Click Handlers
  document.querySelectorAll("[data-footer-view]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.dataset.footerView;
      if (view === "champions" || view === "items") {
        setView("champions");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

// Init
initTheme();
initScrollTop();
initFooterAndLegal();
syncAllIndicators();
startTimer();
load(false);
loadTier(false);
loadGuides();

window.addEventListener("resize", () => {
  window.requestAnimationFrame(syncAllIndicators);
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(syncAllIndicators);
}

