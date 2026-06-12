import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { SKILLS, TOTAL_TOOLS, SKILL_TASKS, TIERS, ACH_GROUPS, ACHIEVEMENTS, DEFAULT_SKILL_DATA, DEFAULT_PROJECTS, DEFAULT_SESSIONS, STORAGE_KEY, APP_START_DATE, ACTIVITY_DEFS, ACTIVITY_XP, GOAL_CATEGORIES, PLAN_TYPES, PROJECT_CATEGORIES, PROJECT_STATUSES, PLAN_URGENCIES, DEFAULT_GOALS, TASK_PRIORITIES, MONTH_NAMES_UA, LEAGUES, DEFAULT_INCOME_CATS, DEFAULT_EXPENSE_CATS, DEFAULT_LONG_GOALS, DEFAULT_PLAN, YT_CHANNELS, DEFAULT_RADIO } from "./constants.js";

const getItemPeriod = (completedAt) => {
  if (!completedAt) return { key: "p9_old", label: "Раніше" };
  const d = new Date(completedAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today - itemDay) / 86400000);
  if (diff === 0) return { key: "p0_today",  label: "Сьогодні" };
  if (diff === 1) return { key: "p1_yesterday", label: "Вчора" };
  if (diff <= 7)  return { key: "p2_week",   label: "Цей тиждень" };
  if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
    return { key: "p3_month", label: "Цей місяць" };
  if (d.getFullYear() === now.getFullYear())
    return { key: "p4_year",  label: String(now.getFullYear()) };
  return { key: `p5_${d.getFullYear()}`, label: String(d.getFullYear()) };
};

function getWeekMonday(date = new Date()) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function fmtShort(d) {
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`;
}

function getGoalPeriods(refDate = new Date()) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const mon = getWeekMonday(refDate);
  const sun = new Date(mon); sun.setDate(sun.getDate() + 6);
  const nextMon = new Date(mon); nextMon.setDate(nextMon.getDate() + 7);
  const nextSun = new Date(nextMon); nextSun.setDate(nextSun.getDate() + 6);
  const nextMo = (m + 1) % 12;
  const nextMoY = m === 11 ? y + 1 : y;
  return [
    { id: "week_cur",   label: `Цей тиждень (${fmtShort(mon)}–${fmtShort(sun)})`,           color: "#06b6d4", icon: "📅", kind: "week" },
    { id: "week_next",  label: `Наст. тиждень (${fmtShort(nextMon)}–${fmtShort(nextSun)})`, color: "#22d3ee", icon: "📅", kind: "week" },
    { id: "month_cur",  label: `${MONTH_NAMES_UA[m]} ${y}`,                                  color: "#00ff88", icon: "📅", kind: "month" },
    { id: "month_next", label: `${MONTH_NAMES_UA[nextMo]} ${nextMoY}`,                       color: "#10b981", icon: "📅", kind: "month" },
    { id: "year_cur",   label: `${y}`,                                                        color: "#f59e0b", icon: "📆", kind: "year" },
    { id: "year_next",  label: `${y + 1}`,                                                    color: "#c9a84c", icon: "📆", kind: "year" },
    { id: "longterm",   label: "Довгострокова",                                               color: "#a855f7", icon: "🌟", kind: "longterm" },
  ];
}

const GOAL_PERIODS = getGoalPeriods();

function getLeague(level) {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (level >= LEAGUES[i].minLevel) return LEAGUES[i];
  }
  return LEAGUES[0];
}

function LeagueBadge({ level, size = 36 }) {
  const lg = getLeague(level);
  const isLegendary = lg.id === "legendary";
  const fs = Math.round(size * 0.33);
  return (
    <div title={`${lg.name} ліга`} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 36 36" style={{ display: "block" }}>
        <defs>
          <linearGradient id={`lg-${lg.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={lg.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={lg.color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {isLegendary ? (
          <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" fill={`url(#lg-${lg.id})`} stroke={lg.color} strokeWidth="1.5" strokeOpacity="0.9" />
        ) : (
          <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" fill="rgba(8,5,2,0.85)" stroke={lg.color} strokeWidth="1.5" strokeOpacity="0.8" />
        )}
        {isLegendary && <polygon points="18,7 30,13 30,23 18,29 6,23 6,13" fill="rgba(120,0,0,0.5)" />}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isLegendary
          ? <span style={{ fontSize: fs + 2, lineHeight: 1 }}>⭐</span>
          : <span style={{ fontSize: fs, fontWeight: 800, color: lg.color, fontFamily: "'Exo 2',sans-serif", lineHeight: 1 }}>{level}</span>}
      </div>
    </div>
  );
}

function monthLabel(ym) {
  const m = parseInt(ym.split("-")[1]) - 1;
  return ["Січ","Лют","Бер","Кві","Тра","Чер","Лип","Сер","Вер","Жов","Лис","Гру"][m];
}

function getLastMonths(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(1); // prevent month overflow on day 29/30/31
    d.setMonth(d.getMonth() - (n - 1 - i));
    return d.toISOString().slice(0, 7);
  });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Розгортувані періоди для метрики: Сьогодні / Місяць / Рік + повна розбивка.
// entries: [{ date: "YYYY-MM-DD", delta: number }] — лише для цієї метрики.
function MetricPeriods({ entries = [], color = "#c9a84c", fmt = (n) => n.toLocaleString(), align = "center", children, cardStyle, className }) {
  const [open, setOpen] = useState(false);
  const today = todayStr();
  const curMonth = today.slice(0, 7);
  const curYear = today.slice(0, 4);
  const sum = (pred) => entries.reduce((s, e) => (pred(e) ? s + e.delta : s), 0);
  const tToday = sum((e) => e.date === today);
  const tMonth = sum((e) => e.date.slice(0, 7) === curMonth);
  const tYear = sum((e) => e.date.slice(0, 4) === curYear);

  const byMonth = {}, byYear = {};
  entries.forEach((e) => {
    const mk = e.date.slice(0, 7), yk = e.date.slice(0, 4);
    byMonth[mk] = (byMonth[mk] ?? 0) + e.delta;
    byYear[yk] = (byYear[yk] ?? 0) + e.delta;
  });
  const monthRows = Object.entries(byMonth).filter(([, v]) => v).sort((a, b) => b[0].localeCompare(a[0]));
  const yearRows = Object.entries(byYear).filter(([, v]) => v).sort((a, b) => b[0].localeCompare(a[0]));
  const hasHist = entries.length > 0;

  const monthName = (mk) => { const [y, m] = mk.split("-"); return `${MONTH_NAMES_UA[+m - 1]} ${y}`; };
  const Cell = ({ lbl, val }) => (
    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, whiteSpace: "nowrap" }}>
      <span style={{ color: "#6a5f40" }}>{lbl} </span>
      <span style={{ color: val ? color : "#4a4030", fontWeight: 700 }}>{val ? fmt(val) : "0"}</span>
    </span>
  );
  const listBox = { maxHeight: 132, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3, paddingRight: 4 };
  const colTitle = { fontSize: 9, color: "#6a5f40", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, fontFamily: "'Exo 2',sans-serif" };

  const toggle = () => { if (hasHist) setOpen((o) => !o); };
  return (
    <div
      onClick={toggle}
      className={className}
      style={{ ...cardStyle, cursor: hasHist ? "pointer" : "default" }}
    >
      {children}
      <div style={{ marginTop: 6, width: "100%", display: "flex", gap: 10, justifyContent: align, alignItems: "center", flexWrap: "wrap" }}>
        <Cell lbl="Сьог:" val={tToday} />
        <Cell lbl="Міс:" val={tMonth} />
        <Cell lbl="Рік:" val={tYear} />
        {hasHist && (
          <span style={{ color: "#8a7850", fontSize: 10, fontFamily: "'Space Mono',monospace" }}>{open ? "▲" : "▼"}</span>
        )}
      </div>
      {open && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "left", background: "rgba(0,0,0,0.25)", borderRadius: 4, padding: "8px 10px", cursor: "default" }}>
          <div>
            <div style={colTitle}>По місяцях</div>
            <div style={listBox}>
              {monthRows.length === 0 ? <span style={{ fontSize: 10, color: "#4a4030" }}>—</span> :
                monthRows.map(([mk, v]) => (
                  <div key={mk} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10, fontFamily: "'Space Mono',monospace" }}>
                    <span style={{ color: mk === curMonth ? color : "#8a7850" }}>{monthName(mk)}</span>
                    <b style={{ color }}>{fmt(v)}</b>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <div style={colTitle}>По роках</div>
            <div style={listBox}>
              {yearRows.length === 0 ? <span style={{ fontSize: 10, color: "#4a4030" }}>—</span> :
                yearRows.map(([yk, v]) => (
                  <div key={yk} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10, fontFamily: "'Space Mono',monospace" }}>
                    <span style={{ color: yk === curYear ? color : "#8a7850" }}>{yk}</span>
                    <b style={{ color }}>{fmt(v)}</b>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function calcStreak(dates) {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const s = d.toISOString().slice(0, 10);
    if (set.has(s)) streak++;
    else if (i > 0) break; // gap found (skip today if not done yet)
  }
  // If today not done, streak counts from yesterday
  if (!set.has(todayStr()) && streak > 0) return streak;
  return streak;
}

function sessionsThisMonth(dates) {
  const ym = new Date().toISOString().slice(0, 7);
  return dates.filter(d => d.startsWith(ym)).length;
}

function calcLongestStreak(dates) {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort();
  let max = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000;
    if (diff === 1) { cur++; if (cur > max) max = cur; }
    else cur = 1;
  }
  return max;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Локальний бекап даних (як в Oxford_1000) ────────────────────────────────
// Усі ключі localStorage, які треба зберігати у файл копії.
const BACKUP_KEYS = ["ai_tracker_v1", "ai_tracker_today_act"];
const BACKUP_AT_KEY = "ai_tracker_backup_at";
const BACKUP_FILENAME = "ai-tracker-backup.json";

// Міні-сховище для FileSystemFileHandle в IndexedDB (handle не серіалізується в localStorage).
const HANDLE_DB = "ai_tracker_fs";
const HANDLE_STORE = "handles";
function openHandleDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(HANDLE_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key) {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readonly");
    const r = tx.objectStore(HANDLE_STORE).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function idbSet(key, val) {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, "readwrite");
    tx.objectStore(HANDLE_STORE).put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Зібрати всі дані у JSON-рядок.
function collectBackupData() {
  const data = { _app: "ai-tracker", _exportedAt: new Date().toISOString(), keys: {} };
  for (const k of BACKUP_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) data.keys[k] = v;
  }
  return JSON.stringify(data, null, 2);
}

// Залити дані назад у localStorage.
function applyBackupData(json) {
  const parsed = JSON.parse(json);
  const keys = parsed.keys ?? parsed; // підтримка простого формату
  if (!keys || typeof keys !== "object") throw new Error("Некоректний файл копії");
  // Мінімальна валідація: має бути хоча б головний ключ.
  if (!(BACKUP_KEYS[0] in keys)) throw new Error("У файлі немає даних ai-tracker");
  for (const k of BACKUP_KEYS) {
    if (k in keys && keys[k] != null) localStorage.setItem(k, keys[k]);
  }
}

async function verifyPermission(handle, write) {
  const opts = { mode: write ? "readwrite" : "read" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  if ((await handle.requestPermission(opts)) === "granted") return true;
  return false;
}

// Зробити копію: перший раз — діалог вибору файлу, далі — тихий перезапис того ж файлу.
// Повертає "saved" | "downloaded".
async function backupToDisk() {
  const json = collectBackupData();
  if (window.showSaveFilePicker) {
    let handle = await idbGet("backup").catch(() => null);
    if (!handle) {
      handle = await window.showSaveFilePicker({
        suggestedName: BACKUP_FILENAME,
        types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
      });
      await idbSet("backup", handle).catch(() => {});
    }
    if (!(await verifyPermission(handle, true))) throw new Error("Немає доступу до файлу");
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    return "saved";
  }
  // Fallback (Safari/Firefox): звичайне завантаження.
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = BACKUP_FILENAME;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}

// Тихий авто-запис у вже прив'язаний файл. Нічого не питає у користувача:
// якщо файлу немає або дозвіл не наданий — просто нічого не робить.
// Повертає true, якщо запис відбувся.
async function silentBackupToDisk() {
  if (!window.showSaveFilePicker) return false;
  const handle = await idbGet("backup").catch(() => null);
  if (!handle) return false;
  // Тільки query (без request) — request потребує жесту користувача.
  if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted") return false;
  const writable = await handle.createWritable();
  await writable.write(collectBackupData());
  await writable.close();
  return true;
}

// ─── YouTube-канали (останнє відео через RSS) ───────────────────────────────
// Запити йдуть з браузера користувача через CORS-проксі.
// Два проксі з автоматичним fallback для надійності.
const YT_IDS_KEY = "ai_tracker_yt_ids";
const YT_VIDEOS_KEY = "ai_tracker_yt_videos";
const YT_TTL_MS = 30 * 60 * 1000;

const YT_PROXIES = [
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

async function ytFetch(url) {
  let lastErr;
  for (const proxy of YT_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(10000) });
      if (res.ok) return res;
    } catch (e) { lastErr = e; }
  }
  throw lastErr ?? new Error("Усі проксі недоступні");
}

// @handle -> channelId (UC...). Дістаємо з HTML сторінки каналу.
async function resolveChannelId(handle) {
  const res = await ytFetch(`https://www.youtube.com/@${handle}`);
  const html = await res.text();
  const patterns = [
    /"externalId":"(UC[\w-]{22})"/,
    /"channelId":"(UC[\w-]{22})"/,
    /"browseId":"(UC[\w-]{22})"/,
    /\/channel\/(UC[\w-]{22})/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  throw new Error("channelId не знайдено для @" + handle);
}

// Останнє відео каналу через RSS-стрічку YouTube.
async function fetchLatestVideo(channelId) {
  const res = await ytFetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const entry = doc.querySelector("entry");
  if (!entry) throw new Error("немає відео");
  return {
    title: entry.querySelector("title")?.textContent ?? "",
    link: entry.querySelector("link")?.getAttribute("href") ?? "",
    published: entry.querySelector("published")?.textContent ?? "",
  };
}

// Чи активна авто-копія прямо зараз: файл прив'язаний І дозвіл уже наданий.
// Після перезавантаження дозвіл може бути "prompt" — тоді авто-копія поки неактивна,
// поки користувач знову не натисне «Зробити копію» (це поновлює дозвіл через жест).
async function autoBackupActive() {
  if (!window.showSaveFilePicker) return false;
  const handle = await idbGet("backup").catch(() => null);
  if (!handle) return false;
  return (await handle.queryPermission({ mode: "readwrite" })) === "granted";
}

// Скинути прив'язаний файл (щоб наступна копія знову спитала, куди зберігати).
async function clearBackupHandle() {
  await idbSet("backup", undefined).catch(() => {});
}

// Відновити: вибрати файл і прочитати його вміст.
async function readBackupFromDisk() {
  if (window.showOpenFilePicker) {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
    });
    const file = await handle.getFile();
    return await file.text();
  }
  // Fallback: прихований input[type=file].
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("Файл не обрано"));
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}

// Level model (Ulives-style): LVL 1-3 base 400+100/lvl, LVL 4-100 base 700+200/lvl
// Cumulative XP at LVL 100 = exactly 1,000,000
function xpForLevel(lvl) {
  if (lvl <= 1) return 0;
  if (lvl === 2) return 400;
  if (lvl === 3) return 900;
  const n = lvl - 3; // levels above 3
  return 900 + n * 700 + 100 * (n - 1) * n;
}

function calcLevel(xp) {
  if (xp < 400) return 1;
  if (xp < 900) return 2;
  const n = Math.floor((-600 + Math.sqrt(360000 + 400 * (xp - 900))) / 200);
  return Math.min(100, n + 3);
}

// Last N days as array of date strings (oldest first)
function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// ── Animated deep-space background — lit clouds + detailed planets ───────────

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top:  Math.random() * 100,
  size: Math.random() < 0.82 ? 1.4 : 2.4,
  delay: Math.random() * 4,
  dur:  2.6 + Math.random() * 3.4,
}));

// Shimmering lit cloud patches spread across the full viewport.
// cA = base colour, cB = bright "lit" highlight (top-left light source), cC = shadow-side tint
const CLOUDS = [
  { id:"cl1",  left:5,   top:22, w:55,h:22, cA:"rgba(20,80,210,0.55)",  cB:"rgba(65,165,255,0.32)", cC:"rgba(55,15,145,0.2)",  blur:58, depth:0.04, phase:0.5, dur:19, anim:"A" },
  { id:"cl2",  left:88,  top:14, w:48,h:18, cA:"rgba(80,20,180,0.50)",  cB:"rgba(205,82,255,0.30)", cC:"rgba(30,62,205,0.15)", blur:52, depth:0.06, phase:1.8, dur:24, anim:"B" },
  { id:"cl3",  left:46,  top:6,  w:62,h:22, cA:"rgba(15,70,165,0.45)",  cB:"rgba(42,148,228,0.26)", cC:"rgba(62,26,162,0.18)", blur:64, depth:0.03, phase:3.1, dur:28, anim:"C" },
  { id:"cl4",  left:72,  top:47, w:44,h:17, cA:"rgba(60,10,150,0.48)",  cB:"rgba(168,46,228,0.28)", cC:"rgba(22,82,202,0.16)", blur:50, depth:0.07, phase:0.9, dur:21, anim:"A" },
  { id:"cl5",  left:16,  top:72, w:54,h:23, cA:"rgba(10,65,155,0.50)",  cB:"rgba(32,128,208,0.28)", cC:"rgba(82,20,172,0.18)", blur:60, depth:0.05, phase:2.4, dur:26, anim:"B" },
  { id:"cl6",  left:57,  top:84, w:48,h:19, cA:"rgba(90,20,165,0.46)",  cB:"rgba(188,64,248,0.26)", cC:"rgba(16,76,188,0.16)", blur:56, depth:0.04, phase:4.2, dur:30, anim:"C" },
  { id:"cl7",  left:32,  top:56, w:36,h:15, cA:"rgba(10,80,175,0.42)",  cB:"rgba(52,158,238,0.23)", cC:"rgba(72,16,162,0.15)", blur:46, depth:0.08, phase:1.5, dur:22, anim:"A" },
  { id:"cl8",  left:80,  top:77, w:42,h:17, cA:"rgba(70,15,155,0.48)",  cB:"rgba(208,54,252,0.26)", cC:"rgba(22,92,202,0.17)", blur:54, depth:0.05, phase:3.6, dur:25, anim:"B" },
  { id:"cl9",  left:93,  top:52, w:34,h:14, cA:"rgba(20,90,195,0.44)",  cB:"rgba(62,174,252,0.25)", cC:"rgba(78,20,168,0.16)", blur:45, depth:0.06, phase:0.3, dur:20, anim:"C" },
  { id:"cl10", left:22,  top:92, w:56,h:21, cA:"rgba(15,65,158,0.48)",  cB:"rgba(40,134,218,0.27)", cC:"rgba(66,19,158,0.17)", blur:62, depth:0.04, phase:2.0, dur:27, anim:"A" },
  { id:"cl11", left:62,  top:32, w:40,h:16, cA:"rgba(100,25,185,0.44)", cB:"rgba(228,84,252,0.23)", cC:"rgba(19,80,198,0.15)", blur:50, depth:0.07, phase:4.8, dur:23, anim:"B" },
  { id:"cl12", left:3,   top:47, w:32,h:13, cA:"rgba(10,72,165,0.42)",  cB:"rgba(34,144,228,0.21)", cC:"rgba(74,20,160,0.14)", blur:43, depth:0.05, phase:1.1, dur:29, anim:"C" },
  { id:"cl13", left:42,  top:97, w:58,h:20, cA:"rgba(12,75,168,0.46)",  cB:"rgba(37,150,220,0.25)", cC:"rgba(70,21,160,0.16)", blur:58, depth:0.03, phase:3.3, dur:31, anim:"A" },
  { id:"cl14", left:83,  top:32, w:38,h:14, cA:"rgba(85,18,168,0.43)",  cB:"rgba(194,58,250,0.23)", cC:"rgba(16,76,198,0.15)", blur:47, depth:0.06, phase:5.0, dur:18, anim:"B" },
  { id:"cl15", left:50,  top:62, w:44,h:17, cA:"rgba(18,78,178,0.44)",  cB:"rgba(47,152,230,0.24)", cC:"rgba(80,21,172,0.16)", blur:53, depth:0.05, phase:2.7, dur:24, anim:"C" },
  { id:"cl16", left:25,  top:35, w:40,h:15, cA:"rgba(25,90,185,0.40)",  cB:"rgba(57,162,238,0.22)", cC:"rgba(57,14,148,0.14)", blur:49, depth:0.04, phase:0.7, dur:27, anim:"A" },
  { id:"cl17", left:68,  top:18, w:34,h:13, cA:"rgba(70,12,155,0.40)",  cB:"rgba(178,50,238,0.22)", cC:"rgba(13,66,178,0.14)", blur:43, depth:0.06, phase:3.9, dur:22, anim:"B" },
];

// Detailed planet definitions inspired by reference images.
// proc variants (palette+bands) render swirling gas-giant structure via SVG
// turbulence displacement; simple variants (sphere) are lightweight gradient moons.
const PLANET_DEFS = {
  // Blue/violet gas giant (ref): turbulent horizontal bands + intense cyan rim glow
  a: {
    glow: { color:"#2f86ff", scale:1.5, op:0.55 }, rim: { color:"#a6dbff", op:0.95 }, shade:0.58,
    base:"#0a1340",
    palette:["#0b1850","#26408c","#3a62b4","#6488d4","#9fb4e6","#cdb9e0","#6a4fa8"],
    bands:[
      { c:0, y:-0.92, h:0.60, op:0.95 }, { c:2, y:-0.60, h:0.16, op:0.72 },
      { c:4, y:-0.46, h:0.09, op:0.58 }, { c:1, y:-0.30, h:0.22, op:0.86 },
      { c:5, y:-0.13, h:0.07, op:0.50 }, { c:3, y: 0.00, h:0.20, op:0.80 },
      { c:6, y: 0.16, h:0.12, op:0.60 }, { c:1, y: 0.33, h:0.22, op:0.86 },
      { c:4, y: 0.50, h:0.08, op:0.50 }, { c:0, y: 0.90, h:0.60, op:0.95 },
    ],
    warp:0.15, freq:"0.011 0.026", seed:7,
    spec:{ ox:-0.34, oy:-0.40, rx:0.30, ry:0.16, rot:-28, op:0.22 },
  },
  // Saturn-like: warm banded body, purple haze + wide golden rings
  c: {
    glow: { color:"#6f54d8", scale:1.5, op:0.50 }, rim: { color:"#c3a8ff", op:0.82 }, shade:0.58,
    base:"#160e34",
    palette:["#19103e","#372c68","#5e4f96","#9384c4","#cbb892","#ffe1a3","#7c6cba"],
    bands:[
      { c:0, y:-0.92, h:0.60, op:0.95 }, { c:5, y:-0.58, h:0.14, op:0.66 },
      { c:3, y:-0.42, h:0.10, op:0.58 }, { c:1, y:-0.26, h:0.22, op:0.84 },
      { c:4, y:-0.10, h:0.08, op:0.55 }, { c:2, y: 0.04, h:0.20, op:0.78 },
      { c:6, y: 0.20, h:0.12, op:0.58 }, { c:1, y: 0.36, h:0.22, op:0.84 },
      { c:5, y: 0.54, h:0.08, op:0.52 }, { c:0, y: 0.92, h:0.60, op:0.95 },
    ],
    warp:0.13, freq:"0.010 0.024", seed:5,
    rings:[
      { rx:2.16, ry:0.58, color:"#a08040", op:0.32, wf:0.080 },
      { rx:1.84, ry:0.50, color:"#d0b060", op:0.74, wf:0.062 },
      { rx:1.48, ry:0.40, color:"#ffd080", op:0.56, wf:0.046 },
    ],
    ringAngle:-18,
    spec:{ ox:-0.32, oy:-0.36, rx:0.30, ry:0.16, rot:-25, op:0.22 },
  },
  // Purple neon planet with magenta rings (ref)
  b: {
    glow: { color:"#c22dff", scale:1.7, op:0.60 }, rim: { color:"#ff8cff", op:0.90 }, shade:0.66,
    base:"#0a0326",
    palette:["#0c0430","#2a0c5e","#471596","#6e2bbe","#9d52dd","#d98cff","#5a1a8a"],
    bands:[
      { c:0, y:-0.92, h:0.60, op:0.95 }, { c:4, y:-0.58, h:0.14, op:0.66 },
      { c:2, y:-0.42, h:0.10, op:0.58 }, { c:1, y:-0.26, h:0.22, op:0.86 },
      { c:5, y:-0.10, h:0.07, op:0.52 }, { c:3, y: 0.04, h:0.20, op:0.80 },
      { c:6, y: 0.20, h:0.12, op:0.60 }, { c:1, y: 0.36, h:0.22, op:0.86 },
      { c:4, y: 0.54, h:0.08, op:0.52 }, { c:0, y: 0.92, h:0.60, op:0.95 },
    ],
    warp:0.14, freq:"0.012 0.030", seed:3,
    rings:[
      { rx:1.92, ry:0.56, color:"#9920cc", op:0.30, wf:0.050 },
      { rx:1.70, ry:0.50, color:"#dd80ff", op:0.66, wf:0.034 },
      { rx:1.42, ry:0.42, color:"#ff5cff", op:0.42, wf:0.024 },
    ],
    ringAngle:-20,
    spec:{ ox:-0.36, oy:-0.40, rx:0.27, ry:0.14, rot:-30, op:0.24 },
  },
  // Ice-slate distant moon (simple gradient sphere)
  d: {
    sphere:{ cx:"36%", cy:"32%", stops:[["0%","#c8d8f0"],["50%","#5a6c96"],["100%","#121828"]] },
    glow: { color:"#4060a0", scale:1.34, op:0.40 }, rim: { color:"#9fb6d8", op:0.60 }, shade:0.60,
    spec:{ ox:-0.33, oy:-0.37, rx:0.28, ry:0.16, rot:-26, op:0.16 },
  },
  // Pale moon (simple gradient sphere)
  e: {
    sphere:{ cx:"38%", cy:"34%", stops:[["0%","#e8eef8"],["55%","#8898b8"],["100%","#202838"]] },
    glow: { color:"#506080", scale:1.26, op:0.30 }, rim: { color:"#b0c0d8", op:0.50 }, shade:0.58,
    spec:{ ox:-0.30, oy:-0.35, rx:0.26, ry:0.14, rot:-22, op:0.13 },
  },
};

// Planets: 3 large procedural gas giants (a/c/b) + small gradient moons (d/e)
const PLANETS = [
  { id:"p1", left:6,  top:60, size:240, depth:0.10, phase:0.0, v:"a" },
  { id:"p2", left:75, top:10, size:160, depth:0.18, phase:1.6, v:"c" },
  { id:"p3", left:56, top:67, size:100, depth:0.30, phase:3.1, v:"b" },
  { id:"p4", left:87, top:64, size:62,  depth:0.44, phase:0.8, v:"d" },
  { id:"p5", left:27, top:15, size:50,  depth:0.52, phase:2.3, v:"e" },
  { id:"p6", left:45, top:41, size:36,  depth:0.62, phase:4.0, v:"d" },
  { id:"p7", left:15, top:31, size:24,  depth:0.74, phase:5.1, v:"e" },
];

function PlanetSvg({ s, v }) {
  const def = PLANET_DEFS[v] || PLANET_DEFS.e;
  const hasRings = !!def.rings;
  const proc = !!def.palette;
  const S = Math.round(s * (hasRings ? 2.5 : 2.05));
  const cx = S / 2, cy = S / 2, r = s / 2;
  const uid = `plx_${v}_${s}`;
  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ display:"block", overflow:"visible" }}>
      <defs>
        {/* outer glow halo */}
        <radialGradient id={`${uid}g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={def.glow.color} stopOpacity={def.glow.op}/>
          <stop offset="46%"  stopColor={def.glow.color} stopOpacity={def.glow.op * 0.22}/>
          <stop offset="100%" stopColor={def.glow.color} stopOpacity="0"/>
        </radialGradient>
        {/* bright atmospheric rim near the limb */}
        <radialGradient id={`${uid}rim`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"    stopColor={def.rim.color} stopOpacity="0"/>
          <stop offset="84%"   stopColor={def.rim.color} stopOpacity="0"/>
          <stop offset="93%"   stopColor={def.rim.color} stopOpacity={def.rim.op * 0.55}/>
          <stop offset="98.5%" stopColor={def.rim.color} stopOpacity={def.rim.op}/>
          <stop offset="100%"  stopColor={def.rim.color} stopOpacity="0"/>
        </radialGradient>
        {/* top-left directional light */}
        <radialGradient id={`${uid}lt`} cx="30%" cy="26%" r="58%">
          <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.42"/>
          <stop offset="34%" stopColor="#ffffff" stopOpacity="0.12"/>
          <stop offset="62%" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
        {/* terminator shade bottom-right */}
        <radialGradient id={`${uid}sh`} cx="72%" cy="76%" r="78%">
          <stop offset="30%"  stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor={`rgba(2,2,14,${def.shade})`}/>
        </radialGradient>
        {proc && (
          <filter id={`${uid}w`} x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency={def.freq} numOctaves="3" seed={def.seed} stitchTiles="stitch" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale={Math.max(6, s * def.warp)} xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        )}
        {proc && (
          <radialGradient id={`${uid}sb`} cx="34%" cy="30%" r="80%">
            <stop offset="0%"   stopColor={def.palette[def.palette.length - 3]}/>
            <stop offset="58%"  stopColor={def.base}/>
            <stop offset="100%" stopColor={def.base}/>
          </radialGradient>
        )}
        {!proc && (
          <radialGradient id={`${uid}sp`} cx={def.sphere.cx} cy={def.sphere.cy} r="78%">
            {def.sphere.stops.map(([off,col],i) => <stop key={i} offset={off} stopColor={col}/>)}
          </radialGradient>
        )}
        <clipPath id={`${uid}clip`}><circle cx={cx} cy={cy} r={r}/></clipPath>
      </defs>

      {/* outer glow halo */}
      <circle cx={cx} cy={cy} r={r * def.glow.scale} fill={`url(#${uid}g)`}/>

      {/* rings drawn behind the sphere */}
      {hasRings && (
        <g transform={`rotate(${def.ringAngle} ${cx} ${cy})`}>
          {def.rings.map((rg, i) => (
            <ellipse key={i} cx={cx} cy={cy} rx={r * rg.rx} ry={r * rg.ry}
              fill="none" stroke={rg.color} strokeOpacity={rg.op} strokeWidth={Math.max(1, s * rg.wf)}/>
          ))}
        </g>
      )}

      {/* sphere body */}
      <g clipPath={`url(#${uid}clip)`}>
        {proc ? (
          <>
            <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}sb)`}/>
            {/* horizontal colour bands warped into swirls by turbulence displacement */}
            <g filter={`url(#${uid}w)`}>
              {def.bands.map((b, i) => (
                <rect key={i} x={cx - r * 1.25} y={cy + b.y * r - (b.h * r) / 2}
                  width={r * 2.5} height={b.h * r} fill={def.palette[b.c]} fillOpacity={b.op}/>
              ))}
            </g>
          </>
        ) : (
          <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}sp)`}/>
        )}
        {/* spherical shading */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}lt)`}/>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}sh)`}/>
      </g>

      {/* bright atmospheric rim */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}rim)`}/>

      {/* specular highlight */}
      <ellipse
        cx={cx + r * def.spec.ox} cy={cy + r * def.spec.oy}
        rx={r * def.spec.rx} ry={r * def.spec.ry}
        fill="#ffffff" fillOpacity={def.spec.op}
        transform={`rotate(${def.spec.rot} ${cx + r * def.spec.ox} ${cy + r * def.spec.oy})`}/>
    </svg>
  );
}

function FloatingBg() {
  const wrapRef = useRef(null);
  const tgtRef  = useRef({ x: 0, y: 0 });
  const curRef  = useRef({ x: 0, y: 0 });
  const rafRef  = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      tgtRef.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      tgtRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      curRef.current.x += (tgtRef.current.x - curRef.current.x) * 0.035;
      curRef.current.y += (tgtRef.current.y - curRef.current.y) * 0.035;
      const t = Date.now() / 1000;
      wrapRef.current?.querySelectorAll("[data-bg]").forEach(el => {
        const depth = +el.dataset.depth, phase = +el.dataset.phase;
        const amp = +(el.dataset.amp ?? 1);
        const tx = curRef.current.x * depth * -46;
        const ty = curRef.current.y * depth * -46;
        const fy = Math.sin(t * 0.32 + phase) * 10 * amp;
        const fx = Math.cos(t * 0.24 + phase) *  6 * amp;
        const cen = el.dataset.center ? "translate(-50%,-50%) " : "";
        el.style.transform = `${cen}translate(${tx + fx}px,${ty + fy}px)`;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    tick();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div ref={wrapRef} style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0, isolation:"isolate" }}>
      <style>{`
        @keyframes bgTwinkle  { 0%,100%{opacity:0.15} 50%{opacity:1} }
        @keyframes bgCloudA   { 0%,100%{opacity:0.55} 35%{opacity:0.88} 65%{opacity:0.62} }
        @keyframes bgCloudB   { 0%,100%{opacity:0.45} 45%{opacity:0.82} 70%{opacity:0.52} }
        @keyframes bgCloudC   { 0%,100%{opacity:0.50} 30%{opacity:0.84} 60%{opacity:0.58} 80%{opacity:0.44} }
      `}</style>

      {/* deep-space base */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 72% 28%, #0c2350 0%, #061427 42%, #02060f 100%)" }}/>

      {/* lit shimmering clouds — three-layer gradient simulates directional lighting */}
      {CLOUDS.map(c => (
        <div key={c.id} data-bg data-depth={c.depth} data-phase={c.phase} data-amp="0.5" data-center="1"
          style={{
            position:"absolute", left:`${c.left}%`, top:`${c.top}%`,
            width:`${c.w}vmax`, height:`${c.h}vmax`,
            borderRadius:"50%",
            background:`
              radial-gradient(ellipse at 28% 25%, ${c.cB} 0%, transparent 50%),
              radial-gradient(ellipse at 62% 62%, ${c.cA} 0%, transparent 66%),
              radial-gradient(ellipse at 82% 80%, ${c.cC} 0%, transparent 54%)
            `,
            filter:`blur(${c.blur}px)`,
            transform:"translate(-50%,-50%)",
            animation:`bgCloud${c.anim} ${c.dur}s ease-in-out infinite`,
            willChange:"transform, opacity",
            mixBlendMode:"screen",
          }}/>
      ))}

      {/* starfield */}
      {STARS.map(st => (
        <div key={st.id} style={{
          position:"absolute", left:`${st.left}%`, top:`${st.top}%`,
          width:st.size, height:st.size, borderRadius:"50%",
          background:"#d4e8ff", boxShadow:"0 0 4px #9cc8ff",
          animation:`bgTwinkle ${st.dur}s ease-in-out ${st.delay}s infinite`}}/>
      ))}

      {/* parallax planets */}
      {PLANETS.map(p => (
        <div key={p.id} data-bg data-depth={p.depth} data-phase={p.phase}
          style={{ position:"absolute", left:`${p.left}%`, top:`${p.top}%`, willChange:"transform" }}>
          <PlanetSvg s={p.size} v={p.v}/>
        </div>
      ))}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AITracker() {
  const saved = loadState();

  const [skillData, setSkillData] = useState(saved?.skillData ?? DEFAULT_SKILL_DATA);
  const [totalXP, setTotalXP] = useState(saved?.totalXP ?? 300);
  const [levelUpAt, setLevelUpAt] = useState(saved?.levelUpAt ?? 0);
  const [activityXP, setActivityXP] = useState(saved?.activityXP);
  const [xpLog, setXpLog] = useState(saved?.xpLog ?? []);
  // Finance v2 — entries + categories
  const [incomeEntries, setIncomeEntries] = useState(() => {
    if (saved?.incomeEntries) return saved.incomeEntries;
    // migrate legacy income number
    if (saved?.income > 0) return [{ id: "legacy_inc", catId: "inc_other", amount: saved.income, currency: "USD", date: new Date().toISOString().slice(0,10), note: "Перенесено" }];
    return [];
  });
  const [expenseEntries, setExpenseEntries] = useState(() => {
    if (saved?.expenseEntries) return saved.expenseEntries;
    if (saved?.expenses > 0) return [{ id: "legacy_exp", catId: "exp_other", amount: saved.expenses, currency: "USD", date: new Date().toISOString().slice(0,10), note: "Перенесено", recurring: false }];
    return [];
  });
  const [incomeCats, setIncomeCats] = useState(saved?.incomeCats ?? DEFAULT_INCOME_CATS);
  const [expenseCats, setExpenseCats] = useState(saved?.expenseCats ?? DEFAULT_EXPENSE_CATS);
  const [uahRate, setUahRate] = useState(saved?.uahRate ?? 44.29);
  const [uahRateUpdatedAt, setUahRateUpdatedAt] = useState(saved?.uahRateUpdatedAt ?? null);
  const [rateFetching, setRateFetching] = useState(false);
  const [incForm, setIncForm] = useState({ amount: "", currency: "USD", catId: "inc_other", note: "", date: todayStr() });
  const [expForm, setExpForm] = useState({ amount: "", currency: "USD", catId: "exp_other", note: "", date: todayStr() });
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(null); // "income" | "expense" | null
  const [pendingDelete, setPendingDelete] = useState(null); // { id, type, entry, xpPaid, timerId }
  const [expandedCatRows, setExpandedCatRows] = useState({});
  const [analyticsYear, setAnalyticsYear] = useState(new Date().getFullYear());
  const [chartTooltip, setChartTooltip] = useState(null);
  const [subscriptions, setSubscriptions] = useState(saved?.subscriptions ?? []);
  const [subCheckedMonth, setSubCheckedMonth] = useState(saved?.subCheckedMonth ?? null);
  const [subPrompt, setSubPrompt] = useState(null); // { items: [{...sub, checked: bool}] }
  const [subForm, setSubForm] = useState({ name: "", catId: "exp_other", amount: "", currency: "USD", startDate: todayStr() });
  const [showSubForm, setShowSubForm] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [showAllSubs, setShowAllSubs] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState(null); // { id, name, xp }
  const [toolRevokeConfirm, setToolRevokeConfirm] = useState(null); // { skillId, tool }
  const [projectDeleteConfirm, setProjectDeleteConfirm] = useState(null); // index
  const [projects, setProjects] = useState(saved?.projects ?? DEFAULT_PROJECTS);
  const [projectCategory, setProjectCategory] = useState("ai");
  const [tasksDoneOpen, setTasksDoneOpen] = useState(false);
  const [goalsDoneOpen, setGoalsDoneOpen] = useState(false);
  const [planDoneOpen, setPlanDoneOpen] = useState(false);
  const [donePeriodsCollapsed, setDonePeriodsCollapsed] = useState({});
  const [projectInput, setProjectInput] = useState("");
  const [projectCompletionXP, setProjectCompletionXP] = useState(200);
  const [sessions, setSessions] = useState(saved?.sessions ?? DEFAULT_SESSIONS);
  const [activeDays, setActiveDays] = useState(saved?.activeDays ?? []);
  const [goals, setGoals] = useState(saved?.goals ?? DEFAULT_GOALS);
  const [plan, setPlan] = useState(() => {
    const raw = saved?.plan ?? DEFAULT_PLAN;
    // migrate old priority-based tasks to type+urgency
    const urgencyMap = { now: "now", soon: "soon", later: "later", scale: "later" };
    return raw.map(t => t.type ? t : { ...t, type: "other", urgency: urgencyMap[t.priority] ?? "later" });
  });
  const [progressLog, setProgressLog] = useState(saved?.progressLog ?? []);
  const [metricLog, setMetricLog] = useState(saved?.metricLog ?? []);
  const [progressInput, setProgressInput] = useState("");
  const [progressDate, setProgressDate] = useState(todayStr());
  const [progressTags, setProgressTags] = useState([]);
  const [progressShowAll, setProgressShowAll] = useState(false);
  const [progressEditId, setProgressEditId] = useState(null);
  const [progressEditText, setProgressEditText] = useState("");
  const [todayXP, setTodayXP] = useState(() => {
    const s = saved?.todayXP;
    if (s?.date === todayStr()) {
      const maxPossible = saved?.totalXP ?? 0;
      return { ...s, total: Math.min(s.total, maxPossible) };
    }
    return { date: todayStr(), total: 0 };
  });
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem("ai_tracker_tab") ?? "dashboard");
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedSkillTask, setSelectedSkillTask] = useState(null);
  const [skillTasksData, setSkillTasksData] = useState(saved?.skillTasksData ?? {});
  const [skillTaskInputs, setSkillTaskInputs] = useState({});
  const [learnTime, setLearnTime] = useState(saved?.learnTime ?? { education: 0, business: 0, edu_videos: 0 });
  const [learnTimeInputs, setLearnTimeInputs] = useState({ education: "", business: "", edu_videos: "" });
  const [notification, setNotification] = useState(null);
  const [achieveToasts, setAchieveToasts] = useState([]);
  const [floats, setFloats] = useState([]);
  const [packInputs, setPackInputs] = useState({});
  const [todayActivity, setTodayActivity] = useState(() => {
    const saved_ta = (() => { try { return JSON.parse(localStorage.getItem("ai_tracker_today_act") ?? "null"); } catch { return null; } })();
    if (saved_ta?.date !== todayStr() || !saved_ta?.data) return {};
    // Перехресна перевірка з xpLog: збережений блок міг отримати сьогоднішню
    // дату зі старими даними (вкладка відкрита через північ). Якщо XP, що
    // випливає з лічильників, не збігається з реальними записами активності
    // за сьогодні — блок застарілий, скидаємо.
    const today = todayStr();
    const logActXp = (saved?.xpLog ?? []).filter(e => e.date === today && e.source === "activity").reduce((s, e) => s + e.amount, 0);
    const impliedXp = ACTIVITY_DEFS.reduce((s, d) => s + (saved_ta.data[d.key] ?? 0) * d.xp, 0);
    return impliedXp === logActXp ? saved_ta.data : {};
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState(saved?.unlockedAchievements ?? ["oxford_dev"]);
  const [achievementDates, setAchievementDates] = useState(saved?.achievementDates ?? { oxford_dev: "2026-01-01" });
  const [goalInput, setGoalInput] = useState("");
  const [goalPriority, setGoalPriority] = useState("important");
  const [goalEditId, setGoalEditId] = useState(null);
  const [goalEditText, setGoalEditText] = useState("");
  const [goalXP, setGoalXP] = useState(100);
  const [goalEditXP, setGoalEditXP] = useState(100);
  const [longGoals, setLongGoals] = useState(saved?.longGoals ?? DEFAULT_LONG_GOALS);
  const [longGoalEpoch, setLongGoalEpoch] = useState(() => {
    const s = saved?.longGoalEpoch;
    if (s) return s;
    const now = new Date();
    return {
      weekStart: fmtShort(getWeekMonday(now)),
      monthKey: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`,
      yearKey: `${now.getFullYear()}`,
    };
  });
  const [longGoalInput, setLongGoalInput] = useState("");
  const [longGoalPeriod, setLongGoalPeriod] = useState("month_cur");
  const [longGoalXP, setLongGoalXP] = useState(200);
  const [longGoalEditId, setLongGoalEditId] = useState(null);
  const [longGoalEditText, setLongGoalEditText] = useState("");
  const [longGoalEditXP, setLongGoalEditXP] = useState(200);
  const [planInput, setPlanInput] = useState("");
  const [planType, setPlanType] = useState("other");
  const [planUrgency, setPlanUrgency] = useState("now");
  const [planEditId, setPlanEditId] = useState(null);
  const [planEditText, setPlanEditText] = useState("");
  const [planXP, setPlanXP] = useState(75);
  const [planEditXP, setPlanEditXP] = useState(75);
  const [goalsSubTab, setGoalsSubTab] = useState("tasks");
  const [focusFilter, setFocusFilter] = useState("pinned");
  const [expandGP, setExpandGP] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ai_tracker_gp_exp") ?? "{}"); } catch { return {}; }
  });
  const [gpDoneGoalsOpen, setGpDoneGoalsOpen] = useState(false);
  const [gpDelOpen, setGpDelOpen] = useState(false);
  const [gpAddType, setGpAddType] = useState("goal");
  const [gpAddText, setGpAddText] = useState("");
  const [gpAddXP, setGpAddXP] = useState(500);
  const [gpInlineAdd, setGpInlineAdd] = useState(null);
  const [gpInlineText, setGpInlineText] = useState("");
  const [gpInlineXP, setGpInlineXP] = useState(75);
  const [gpStreamFilter, setGpStreamFilter] = useState(null);
  const [inbox, setInbox] = useState(saved?.inbox ?? []);
  const [gpInboxOpen, setGpInboxOpen] = useState(true);
  const [gpInboxText, setGpInboxText] = useState("");
  const [gpInboxType, setGpInboxType] = useState("task");
  const [gpInboxConvert, setGpInboxConvert] = useState(null);
  const [dragItem, setDragItem] = useState(null); // { id, fromType, source: "list"|"inbox" }
  const [dragOver, setDragOver] = useState(null);  // ключ цілі під курсором для підсвітки

  // Радіо (YouTube live-стріми)
  const [radioStations, setRadioStations] = useState(saved?.radioStations ?? DEFAULT_RADIO);
  const [radioActive, setRadioActive] = useState(null); // videoId, що зараз грає (не зберігається — без автоплею при завантаженні)
  const [radioAddOpen, setRadioAddOpen] = useState(false);
  const [radioUrl, setRadioUrl] = useState("");
  const [radioTitle, setRadioTitle] = useState("");
  const [radioGenre, setRadioGenre] = useState("");

  // AI Chat Widget state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState(saved?.aiMessages ?? []);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModel, setAiModel] = useState(saved?.aiModel ?? "gpt-4o-mini");
  const [aiApiKeys, setAiApiKeys] = useState(saved?.aiApiKeys ?? { openai: "", anthropic: "", gemini: "" });
  const [githubSync, setGithubSync] = useState(saved?.githubSync ?? { user: "", token: "", lastSync: null, totalLines: 0, repos: [] });
  const [ghPanelOpen, setGhPanelOpen] = useState(false);
  const [ghSyncing, setGhSyncing] = useState(false);
  const [ghSyncMsg, setGhSyncMsg] = useState("");
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [aiAttachments, setAiAttachments] = useState([]);
  const [aiModelOpen, setAiModelOpen] = useState(false);
  const [aiDropPos, setAiDropPos] = useState(null);
  const [aiAvailModels, setAiAvailModels] = useState(null);
  const aiMsgsRef = useRef(null);
  const dragRef = useRef({});
  const progressEditRef = useRef(null);

  const TAB_IDS = ["dashboard", "goalsplan", "projects", "tools", "skillstasks", "achievements", "finances", "sessions", "progress", "stats", "radio"];

  useEffect(() => {
    const now = new Date();
    const curWeekStart = fmtShort(getWeekMonday(now));
    const curMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const curYearKey = `${now.getFullYear()}`;

    setLongGoals(prev => prev.map(g => {
      // migrate old format
      let p = g.period;
      if (p === "year") p = "year_cur";
      if (p === "month") p = "month_cur";
      return p !== g.period ? { ...g, period: p } : g;
    }));

    setLongGoalEpoch(prev => {
      const updates = {};
      if (prev.weekStart < curWeekStart) {
        updates.weekStart = curWeekStart;
        setLongGoals(gs => gs.map(g =>
          g.period === "week_next" ? { ...g, period: "week_cur" } : g
        ));
      }
      if (prev.monthKey < curMonthKey) {
        updates.monthKey = curMonthKey;
        setLongGoals(gs => gs.map(g =>
          g.period === "month_next" ? { ...g, period: "month_cur" } : g
        ));
      }
      if (prev.yearKey < curYearKey) {
        updates.yearKey = curYearKey;
        setLongGoals(gs => gs.map(g =>
          g.period === "year_next" ? { ...g, period: "year_cur" } : g
        ));
      }
      return Object.keys(updates).length ? { ...prev, ...updates } : prev;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const state = { skillData, totalXP, levelUpAt, activityXP, xpLog, incomeEntries, expenseEntries, incomeCats, expenseCats, uahRate, uahRateUpdatedAt, subscriptions, subCheckedMonth, projects, unlockedAchievements, achievementDates, sessions, activeDays, goals, longGoals, longGoalEpoch, plan, aiMessages, aiModel, aiApiKeys, githubSync, progressLog, metricLog, todayXP, skillTasksData, learnTime, inbox, radioStations };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSaveTick(t => t + 1);
  }, [skillData, totalXP, levelUpAt, activityXP, xpLog, incomeEntries, expenseEntries, incomeCats, expenseCats, uahRate, uahRateUpdatedAt, subscriptions, subCheckedMonth, projects, unlockedAchievements, achievementDates, sessions, activeDays, goals, longGoals, longGoalEpoch, plan, aiMessages, aiModel, aiApiKeys, githubSync, progressLog, metricLog, todayXP, skillTasksData, learnTime, inbox, radioStations]);

  useEffect(() => {
    localStorage.setItem("ai_tracker_today_act", JSON.stringify({ date: todayStr(), data: todayActivity }));
    setSaveTick(t => t + 1);
  }, [todayActivity]);

  useEffect(() => {
    localStorage.setItem("ai_tracker_gp_exp", JSON.stringify(expandGP));
  }, [expandGP]);

  // Авто-сесія: будь-яка змістовна дія (XP, фінанси, задачі, цілі, план, проекти,
  // навички, активність) автоматично зараховує сьогоднішній день у стрік.
  // Стартовий гард пропускає нормалізацію даних при завантаженні застосунку.
  const sessionAutoRef = useRef(Date.now());
  useEffect(() => {
    if (Date.now() - sessionAutoRef.current < 2500) return;
    const today = todayStr();
    setSessions(prev => prev.dates.includes(today) ? prev : { ...prev, dates: [...prev.dates, today] });
  }, [incomeEntries, expenseEntries, subscriptions, projects, goals, longGoals, plan, skillData, skillTasksData, learnTime, todayActivity]);

  // Зміна доби, поки вкладка відкрита: скидаємо сьогоднішні лічильники,
  // щоб опівночі бейджі "+N сьогодні" обнулялися без перезавантаження.
  useEffect(() => {
    let curDay = todayStr();
    const iv = setInterval(() => {
      const now = todayStr();
      if (now !== curDay) {
        curDay = now;
        setTodayActivity({});
        setTodayXP({ date: now, total: 0 });
      }
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  // Перевірка стрік-досягнень при кожній зміні sessions.dates (в тому числі при завантаженні)
  const sessionCheckDoneRef = useRef(false);
  useEffect(() => {
    // При першому запуску: затримка, щоб дати час cleanup-ефекту (APP_START_DATE) відпрацювати.
    // Потім і при кожній наступній зміні — перевіряємо одразу.
    const delay = sessionCheckDoneRef.current ? 0 : 600;
    const t = setTimeout(() => {
      sessionCheckDoneRef.current = true;
      const newStreak = calcStreak(sessions.dates);
      setUnlockedAchievements(ua => {
        checkAchievements(totalTools, totalIncome, projects.length, skillData, ua, newStreak, sessions.dates.length);
        return ua;
      });
    }, delay);
    return () => clearTimeout(t);
  }, [sessions.dates]); // eslint-disable-line react-hooks/exhaustive-deps

  // Computed totals in USD
  const toUSD = useCallback((amount, currency) => currency === "UAH" ? amount / uahRate : amount, [uahRate]);
  const totalIncome = useMemo(() => incomeEntries.reduce((s, e) => s + toUSD(e.amount, e.currency), 0), [incomeEntries, toUSD]);
  const totalExpenses = useMemo(() => expenseEntries.reduce((s, e) => s + toUSD(e.amount, e.currency), 0), [expenseEntries, toUSD]);

  // Auto-fetch UAH rate from PrivatBank when opening Finances tab (if stale > 1h)
  const fetchRate = useCallback(async () => {
    setRateFetching(true);
    try {
      // Primary: open.er-api.com (free, no auth, CORS-friendly)
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data?.rates?.UAH) {
        setUahRate(+data.rates.UAH.toFixed(2));
        setUahRateUpdatedAt(new Date().toISOString());
        setRateFetching(false);
        return;
      }
    } catch (_) {}
    try {
      // Fallback: frankfurter.app
      const res2 = await fetch("https://api.frankfurter.app/latest?to=UAH");
      const data2 = await res2.json();
      if (data2?.rates?.UAH) {
        setUahRate(+data2.rates.UAH.toFixed(2));
        setUahRateUpdatedAt(new Date().toISOString());
      }
    } catch (_) {}
    setRateFetching(false);
  }, []);

  useEffect(() => {
    if (activeTab !== "finances") return;
    const isStale = !uahRateUpdatedAt || (Date.now() - new Date(uahRateUpdatedAt).getTime()) > 60 * 60 * 1000;
    if (isStale) fetchRate();
    // Prompt for subscriptions whose billing day has arrived this month
    const now = new Date();
    const currentYM = now.toISOString().slice(0, 7);
    const todayDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const subsToPrompt = subscriptions.filter(s => {
      if (s.active === false || s.lastBilledYM === currentYM) return false;
      // if billing day exceeds days in this month, treat as last day of month
      const effectiveDay = Math.min(s.billingDay ?? 1, daysInMonth);
      return todayDay >= effectiveDay;
    });
    if (subsToPrompt.length > 0) {
      setSubPrompt({ items: subsToPrompt.map(s => ({ ...s, checked: true })) });
    }
  }, [activeTab]); // eslint-disable-line

  // Tab key cycles through navigation tabs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "Tab" || e.target.matches("input, textarea, button")) return;
      e.preventDefault();
      setActiveTab(prev => {
        const idx = TAB_IDS.indexOf(prev);
        const next = e.shiftKey
          ? (idx - 1 + TAB_IDS.length) % TAB_IDS.length
          : (idx + 1) % TAB_IDS.length;
        return TAB_IDS[next];
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => { sessionStorage.setItem("ai_tracker_tab", activeTab); }, [activeTab]);

  useEffect(() => {
    if (aiOpen && aiMsgsRef.current) {
      aiMsgsRef.current.scrollTop = aiMsgsRef.current.scrollHeight;
    }
  }, [aiOpen, aiMessages]);

  // On mount: clean up any data before APP_START_DATE (reset to fresh start)
  useEffect(() => {
    setSessions(prev => ({ ...prev, dates: prev.dates.filter(d => d >= APP_START_DATE) }));
    setActiveDays(prev => prev.filter(d => d >= APP_START_DATE));
  }, []);

  const totalLevel = calcLevel(totalXP);
  const LEVELUP_GLOW_MS = 3600000; // рамка світиться 1 годину після підвищення рівня
  const prevLevelRef = useRef(null);
  const [levelGlow, setLevelGlow] = useState(false);
  useEffect(() => {
    if (prevLevelRef.current === null) { prevLevelRef.current = totalLevel; return; }
    if (totalLevel > prevLevelRef.current) {
      setLevelUpAt(Date.now());
      showNotif(`🎉 Новий рівень — ${totalLevel}!`, "xp");
    }
    prevLevelRef.current = totalLevel;
  }, [totalLevel]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!levelUpAt) { setLevelGlow(false); return; }
    const remaining = LEVELUP_GLOW_MS - (Date.now() - levelUpAt);
    if (remaining <= 0) { setLevelGlow(false); return; }
    setLevelGlow(true);
    const t = setTimeout(() => setLevelGlow(false), remaining);
    return () => clearTimeout(t);
  }, [levelUpAt]);
  const curLevelXP = xpForLevel(totalLevel);
  const nextLevelXP = xpForLevel(totalLevel + 1);
  const xpProgress = ((totalXP - curLevelXP) / (nextLevelXP - curLevelXP)) * 100;
  const totalTools = Object.values(skillData).flatMap(s => s.unlockedTools).length;

  const streak = useMemo(() => calcStreak(sessions.dates), [sessions.dates]);
  const longestStreak = useMemo(() => calcLongestStreak(sessions.dates), [sessions.dates]);
  const monthSessions = useMemo(() => sessionsThisMonth(sessions.dates), [sessions.dates]);
  const doneToday = sessions.dates.includes(todayStr());

  // XP за сьогодні — рахуємо з журналу XP + активності (єдине джерело правди),
  // щоб верхня панель не розходилася з «Джерелами XP».
  const todayXpTotal = useMemo(() => {
    const today = todayStr();
    const actToday = ACTIVITY_DEFS.reduce((s, d) => s + (todayActivity[d.key] ?? 0) * d.xp, 0);
    const logToday = xpLog.filter(e => e.date === today && e.source !== "activity").reduce((s, e) => s + e.amount, 0);
    return Math.max(0, actToday + logToday);
  }, [xpLog, todayActivity]);
  const heatmapDays = useMemo(() => lastNDays(56), []);
  const sessionSet = useMemo(() => new Set(sessions.dates), [sessions.dates]);
  const totalActiveDays = activeDays.length;
  const daysSinceStart = useMemo(() => {
    const diff = new Date(todayStr()) - new Date(APP_START_DATE);
    return Math.max(1, Math.floor(diff / 86400000) + 1);
  }, []);
  const daysPassedThisMonth = new Date().getDate();
  const daysInCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const showNotif = useCallback((msg, type = "xp") => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 2800);
  }, []);

  // ─── Бекап даних ───────────────────────────────────────────────────────────
  const [backupAt, setBackupAt] = useState(() => localStorage.getItem(BACKUP_AT_KEY) || null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [autoBackupOn, setAutoBackupOn] = useState(false); // чи прив'язано файл для авто-копії
  const [saveTick, setSaveTick] = useState(0);             // сигнал «дані змінились»

  // На старті перевіряємо, чи авто-копія активна (файл прив'язаний + дозвіл наданий).
  useEffect(() => { autoBackupActive().then(setAutoBackupOn).catch(() => {}); }, []);

  const handleBackup = useCallback(async () => {
    setBackupBusy(true);
    try {
      const res = await backupToDisk();
      const now = new Date().toISOString();
      localStorage.setItem(BACKUP_AT_KEY, now);
      setBackupAt(now);
      if (res === "saved") setAutoBackupOn(true);
      showNotif(res === "saved" ? "💾 Копію збережено — далі оновлюється авто" : "💾 Копію завантажено", "xp");
    } catch (e) {
      if (e?.name !== "AbortError") showNotif("⚠️ " + (e?.message || "Не вдалося зберегти"), "warn");
    } finally {
      setBackupBusy(false);
    }
  }, [showNotif]);

  const handleRebindBackup = useCallback(async () => {
    await clearBackupHandle();
    setAutoBackupOn(false);
    showNotif("📍 Обери файл при наступній копії", "xp");
  }, [showNotif]);

  // Авто-копія: коли дані змінились і файл прив'язаний — тихо перезаписуємо
  // його з невеликою затримкою (debounce), щоб не смикати диск щосекунди.
  useEffect(() => {
    if (!autoBackupOn) return;
    const id = setTimeout(async () => {
      const ok = await silentBackupToDisk().catch(() => false);
      if (ok) {
        const now = new Date().toISOString();
        localStorage.setItem(BACKUP_AT_KEY, now);
        setBackupAt(now);
      }
    }, 3000);
    return () => clearTimeout(id);
  }, [saveTick, autoBackupOn]);

  const handleRestore = useCallback(async () => {
    setBackupBusy(true);
    try {
      const json = await readBackupFromDisk();
      applyBackupData(json);
      showNotif("✅ Дані відновлено — перезавантаження…", "xp");
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      if (e?.name !== "AbortError") showNotif("⚠️ " + (e?.message || "Не вдалося відновити"), "warn");
      setBackupBusy(false);
    }
  }, [showNotif]);

  // ─── YouTube AI-канали ───────────────────────────────────────────────────────
  const [ytData, setYtData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(YT_VIDEOS_KEY) ?? "{}"); } catch { return {}; }
  });
  const [ytLoading, setYtLoading] = useState(false);

  const refreshYouTube = useCallback(async (force = false) => {
    setYtLoading(true);
    let ids = {};
    try { ids = JSON.parse(localStorage.getItem(YT_IDS_KEY) ?? "{}"); } catch {}
    // Підставляємо захардкожені channelId в кеш, якщо їх ще немає
    YT_CHANNELS.forEach(ch => { if (ch.channelId && !ids[ch.handle]) ids[ch.handle] = ch.channelId; });
    const next = { ...ytData };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (const ch of YT_CHANNELS) {
      const prev = ytData[ch.handle];
      const fresh = prev?.fetchedAt && (Date.now() - prev.fetchedAt < YT_TTL_MS) && prev?.video;
      if (!force && fresh) { next[ch.handle] = prev; continue; }

      let done = false;
      for (let attempt = 0; attempt < 2 && !done; attempt++) {
        try {
          let id = ids[ch.handle] ?? ch.channelId;
          if (!id) {
            id = await resolveChannelId(ch.handle);
            ids[ch.handle] = id;
            localStorage.setItem(YT_IDS_KEY, JSON.stringify(ids));
          }
          const video = await fetchLatestVideo(id);
          next[ch.handle] = { channelId: id, video, fetchedAt: Date.now() };
          done = true;
        } catch (e) {
          if (attempt === 0) { await sleep(800); continue; }
          next[ch.handle] = prev?.video ? prev : { error: true };
        }
      }
      setYtData({ ...next });
      await sleep(200);
    }

    localStorage.setItem(YT_IDS_KEY, JSON.stringify(ids));
    localStorage.setItem(YT_VIDEOS_KEY, JSON.stringify(next));
    setYtData({ ...next });
    setYtLoading(false);
  }, [ytData]);

  // Підтягуємо свіжі відео при відкритті дашборду (з кешем на 30 хв).
  useEffect(() => { refreshYouTube(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openAllChannels = useCallback(() => {
    // Відкриваємо кожен канал у новій вкладці. Клік по якорю проходить
    // popup-блокування краще за window.open у циклі. Якщо браузер усе ж
    // блокує — підкажемо дозволити спливаючі вікна.
    let blocked = false;
    YT_CHANNELS.forEach(ch => {
      const w = window.open(`https://www.youtube.com/@${ch.handle}/videos`, "_blank", "noopener");
      if (!w) blocked = true;
    });
    if (blocked) showNotif("⚠️ Дозволь спливаючі вікна для сайту, щоб відкрити всі канали", "warn");
  }, [showNotif]);

  const showAchievementToast = useCallback((ach) => {
    const tid = Date.now() + Math.random();
    setAchieveToasts(prev => [...prev.slice(-3), { id: tid, dying: false, ...ach }]);
    setTimeout(() => setAchieveToasts(prev => prev.map(t => t.id === tid ? { ...t, dying: true } : t)), 3800);
    setTimeout(() => setAchieveToasts(prev => prev.filter(t => t.id !== tid)), 4300);
    // Звук досягнення через Web Audio API
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.11);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.11);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.11 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.11 + 0.38);
        osc.start(ctx.currentTime + i * 0.11);
        osc.stop(ctx.currentTime + i * 0.11 + 0.38);
      });
    } catch (_) {}
  }, []);

  const addFloat = useCallback((key, text, color) => {
    const fid = Date.now() + Math.random();
    setFloats(prev => [...prev.slice(-8), { id: fid, key, text, color }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== fid)), 900);
  }, []);

  const recordTodayActivity = useCallback((key, delta) => {
    setTodayActivity(prev => ({ ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) }));
  }, []);

  const learnTimeRef = useRef(learnTime);
  useEffect(() => { learnTimeRef.current = learnTime; }, [learnTime]);

  const skillTasksRef = useRef(skillTasksData);
  useEffect(() => { skillTasksRef.current = skillTasksData; }, [skillTasksData]);

  // Скільки XP МАЄ давати активність прямо зараз (рахунок × ставка).
  const computeCorrectActivityXP = useCallback(() => {
    return ACTIVITY_DEFS.reduce((sum, d) => {
      const cnt = d.kind === "learn"
        ? (learnTimeRef.current[d.key] ?? 0)
        : (skillTasksRef.current[d.key]?.count ?? 0);
      return sum + cnt * d.xp;
    }, 0);
  }, []);

  // Узгодження: тут — після computeCorrectActivityXP, щоб уникнути TDZ.
  const reconciledRef = useRef(false);
  useEffect(() => {
    if (reconciledRef.current) return;
    reconciledRef.current = true;
    const correct = computeCorrectActivityXP();
    if (activityXP == null) {
      setActivityXP(correct);
    } else if (activityXP !== correct) {
      setTotalXP(t => Math.max(0, t + (correct - activityXP)));
      setActivityXP(correct);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Журнал XP: записує кожну зміну з джерелом, щоб у статистиці було видно «що і скільки».
  const logXP = useCallback((amount, source, label = "") => {
    if (!amount) return;
    setXpLog(prev => [{ id: Date.now() + Math.random(), ts: Date.now(), date: todayStr(), amount, source, label }, ...prev].slice(0, 600));
  }, []);

  const checkAchievements = useCallback((tools, inc, proj, sd, currentUnlocked, currentStreak, totalSessions) => {
    const lt = learnTimeRef.current;
    const learnHours = ((lt.education ?? 0) + (lt.business ?? 0)) * 0.5;
    const codeLines = skillTasksRef.current["code_lines_written"]?.count ?? 0;
    const newlyUnlocked = [];
    let bonusXP = 0;
    ACHIEVEMENTS.forEach(a => {
      if (currentUnlocked.includes(a.id)) return;
      if (a.check(tools, inc, proj, sd, currentStreak, totalSessions, learnHours, codeLines)) {
        newlyUnlocked.push(a.id);
        bonusXP += a.xp;
      }
    });
    if (newlyUnlocked.length > 0) {
      const today = todayStr();
      setUnlockedAchievements(prev => [...prev, ...newlyUnlocked]);
      setAchievementDates(prev => {
        const next = { ...prev };
        newlyUnlocked.forEach(id => { next[id] = today; });
        return next;
      });
      setTotalXP(prev => prev + bonusXP);
      logXP(bonusXP, "achievement", "досягнення");
      newlyUnlocked.forEach((id, idx) => {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        setTimeout(() => showAchievementToast(a), 500 + idx * 1000);
      });
    }
  }, [showAchievementToast, logXP]);

  const renderDoneSection = (items, { sectionKey, open, setOpen, onUndo, onDelete, labelFn, xpFn }) => {
    if (!items.length) return null;
    const groups = {};
    const groupOrder = [];
    items.forEach(item => {
      const p = getItemPeriod(item.completedAt);
      if (!groups[p.key]) { groups[p.key] = { label: p.label, key: p.key, items: [] }; groupOrder.push(p.key); }
      groups[p.key].items.push(item);
    });
    groupOrder.sort();
    return (
      <div style={{ background: "rgba(5,3,1,0.82)", border: "1px solid rgba(0,255,136,0.22)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", background: open ? "rgba(0,255,136,0.07)" : "rgba(0,255,136,0.03)", userSelect: "none" }} onClick={() => setOpen(v => !v)}>
          <span style={{ fontSize: 12, color: "#00ff88", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>✓ Досягнуто</span>
          <span style={{ fontSize: 11, background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88", padding: "1px 8px", borderRadius: 20, fontFamily: "'Space Mono',monospace" }}>{items.length}</span>
          <span style={{ marginLeft: "auto", color: "#00aa55", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
        </div>
        {open && (
          <div style={{ maxHeight: 420, overflowY: "auto", paddingBottom: 6 }}>
            {groupOrder.map(gk => {
              const g = groups[gk];
              const collapsed = donePeriodsCollapsed[`${sectionKey}_${gk}`];
              return (
                <div key={gk}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 16px 5px", cursor: "pointer", borderTop: "1px solid rgba(0,255,136,0.07)" }}
                    onClick={() => setDonePeriodsCollapsed(prev => ({ ...prev, [`${sectionKey}_${gk}`]: !collapsed }))}>
                    <span style={{ fontSize: 10, color: "#3a6a3a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2 }}>{g.label}</span>
                    <span style={{ fontSize: 10, color: "#2a4a2a" }}>· {g.items.length}</span>
                    <span style={{ color: "#2a4a2a", fontSize: 10, marginLeft: "auto" }}>{collapsed ? "▶" : "▼"}</span>
                  </div>
                  {!collapsed && g.items.map((item, ii) => {
                    const xp = xpFn?.(item);
                    return (
                      <div key={item.id ?? `${sectionKey}_${ii}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 16px 6px 28px" }}>
                        <button onClick={() => onUndo(item)}
                          style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #00ff88", background: "#00ff88", cursor: "pointer", flexShrink: 0, fontSize: 9, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✓</button>
                        <span style={{ flex: 1, color: "#5a6a50", fontSize: 12, textDecoration: "line-through", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{labelFn(item)}</span>
                        {xp > 0 && <span style={{ fontSize: 10, color: "#3a5030", fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>+{xp} XP</span>}
                        <button onClick={() => onDelete(item)}
                          style={{ background: "none", border: "none", color: "#4a4030", cursor: "pointer", fontSize: 15, padding: "0 2px", flexShrink: 0 }}>×</button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const gainXP = useCallback((amount, label = "", source = "other") => {
    setTotalXP(prev => prev + amount);
    setTodayXP(prev => prev.date === todayStr() ? { ...prev, total: prev.total + amount } : { date: todayStr(), total: amount });
    logXP(amount, source, label);
    showNotif(`+${amount} XP ${label}`, "xp");
  }, [showNotif, logXP]);

  const loseXP = useCallback((amount, source = "other", label = "") => {
    setTotalXP(prev => Math.max(0, prev - amount));
    setTodayXP(prev => prev.date === todayStr() ? { ...prev, total: Math.max(0, prev.total - amount) } : prev);
    logXP(-amount, source, label);
  }, [logXP]);

  const recordActiveDay = useCallback(() => {
    const today = todayStr();
    setActiveDays(prev => prev.includes(today) ? prev : [...prev, today]);
  }, []);

  const claimProgressiveMilestone = useCallback((catId, taskId, milestoneIdx, xp) => {
    const key = `${catId}_${taskId}`;
    setSkillTasksData(prev => {
      const existing = prev[key] || { count: 0, claimed: [] };
      if (existing.claimed.includes(milestoneIdx)) return prev;
      return { ...prev, [key]: { ...existing, claimed: [...existing.claimed, milestoneIdx] } };
    });
    gainXP(xp, "навичка", "skill");
    recordActiveDay();
  }, [gainXP, recordActiveDay]);

  const revokeProgressiveMilestone = useCallback((catId, taskId, milestoneIdx, xp) => {
    const key = `${catId}_${taskId}`;
    setSkillTasksData(prev => {
      const existing = prev[key] || { count: 0, claimed: [] };
      return { ...prev, [key]: { ...existing, claimed: existing.claimed.filter(i => i !== milestoneIdx) } };
    });
    loseXP(xp, "skill", "навичка");
  }, [loseXP]);

  // Центральне нарахування XP за активність: рахує фактичну (після клампінгу) зміну
  // лічильника й симетрично нараховує/знімає XP. Тримає activityXP = рахунок × ставка.
  const applyActivityXP = useCallback((key, effectiveDelta) => {
    if (effectiveDelta === 0) return;
    const xp = (ACTIVITY_XP[key] ?? 0) * effectiveDelta;
    if (xp > 0) gainXP(xp, "активність", "activity");
    else if (xp < 0) loseXP(-xp, "activity", "активність");
    setActivityXP(prev => Math.max(0, (prev ?? 0) + xp));
    if (effectiveDelta > 0) recordActiveDay();
    recordTodayActivity(key, effectiveDelta);
  }, [gainXP, loseXP, recordActiveDay, recordTodayActivity]);

  const addProgressiveCount = useCallback((catId, taskId, delta) => {
    const key = `${catId}_${taskId}`;
    const cur = skillTasksRef.current[key]?.count ?? 0;
    const newCount = Math.max(0, cur + delta);
    const eff = newCount - cur;
    if (eff === 0) return;
    const existing = skillTasksRef.current[key] || { count: 0, claimed: [] };
    const updated = { ...skillTasksRef.current, [key]: { ...existing, count: newCount } };
    skillTasksRef.current = updated;
    setSkillTasksData(updated);
    setMetricLog(prev => [{ ts: Date.now(), date: todayStr(), key, delta: eff }, ...prev].slice(0, 3000));
    applyActivityXP(key, eff);
  }, [applyActivityXP]);

  const addLearnTime = useCallback((kind, delta) => {
    const cur = learnTimeRef.current[kind] ?? 0;
    const newVal = Math.max(0, cur + delta);
    const eff = newVal - cur;
    if (eff === 0) return;
    const next = { ...learnTimeRef.current, [kind]: newVal };
    learnTimeRef.current = next;
    setLearnTime(next);
    setMetricLog(prev => [{ ts: Date.now(), date: todayStr(), key: kind, delta: eff }, ...prev].slice(0, 3000));
    applyActivityXP(kind, eff);
    if (eff > 0) {
      setUnlockedAchievements(ua => {
        const learnHours = ((next.education ?? 0) + (next.business ?? 0)) * 0.5;
        const toUnlock = [];
        let bonus = 0;
        ACHIEVEMENTS.forEach(a => {
          if (a.group !== "learning" || ua.includes(a.id)) return;
          if (a.check(0, 0, 0, {}, 0, 0, learnHours)) { toUnlock.push(a.id); bonus += a.xp; }
        });
        if (toUnlock.length) {
          setTotalXP(p => p + bonus);
          logXP(bonus, "achievement", "досягнення");
          toUnlock.forEach((id, idx) => {
            const a = ACHIEVEMENTS.find(x => x.id === id);
            setTimeout(() => showAchievementToast(a), 500 + idx * 1000);
          });
          return [...ua, ...toUnlock];
        }
        return ua;
      });
    }
  }, [applyActivityXP, showAchievementToast, logXP]);

  const setProgressiveCount = useCallback((catId, taskId, value) => {
    const key = `${catId}_${taskId}`;
    const n = Math.max(0, parseInt(value) || 0);
    const cur = skillTasksRef.current[key]?.count ?? 0;
    const eff = n - cur;
    if (eff === 0) return;
    const existing = skillTasksRef.current[key] || { count: 0, claimed: [] };
    const updated = { ...skillTasksRef.current, [key]: { ...existing, count: n } };
    skillTasksRef.current = updated;
    setSkillTasksData(updated);
    // Лише активні трекери дають XP (image/video/music). Решта — просто лічильники.
    if (ACTIVITY_XP[key] != null) applyActivityXP(key, eff);
  }, [applyActivityXP]);

  const claimOneTimeTask = useCallback((catId, taskId, xp) => {
    const key = `${catId}_${taskId}`;
    setSkillTasksData(prev => {
      if (prev[key] === true) return prev;
      return { ...prev, [key]: true };
    });
    gainXP(xp, "навичка", "skill");
    recordActiveDay();
  }, [gainXP, recordActiveDay]);

  const revokeOneTimeTask = useCallback((catId, taskId, xp) => {
    const key = `${catId}_${taskId}`;
    setSkillTasksData(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    loseXP(xp, "skill", "навичка");
  }, [loseXP]);

  const learnTool = useCallback((skillId, tool) => {
    setSkillData(prev => {
      const current = prev[skillId].unlockedTools;
      if (current.includes(tool)) return prev;
      const updated = { ...prev, [skillId]: { unlockedTools: [...current, tool] } };
      const newTotal = Object.values(updated).flatMap(s => s.unlockedTools).length;
      gainXP(100, `(${tool})`, "skill");
      recordActiveDay();
      setUnlockedAchievements(ua => {
        checkAchievements(newTotal, totalIncome, projects.length, updated, ua, streak, sessions.dates.length);
        return ua;
      });
      return updated;
    });
  }, [gainXP, recordActiveDay, checkAchievements, totalIncome, projects, streak, sessions.dates.length]);

  const addIncomeEntry = useCallback(() => {
    const amt = parseFloat(incForm.amount);
    if (!amt || amt <= 0) return;
    const amtUSD = incForm.currency === "UAH" ? amt / uahRate : amt;
    const xpPaid = Math.ceil(amtUSD * 3);
    const entry = { id: `inc_${Date.now()}`, catId: incForm.catId, amount: amt, currency: incForm.currency, date: incForm.date || todayStr(), note: incForm.note, xpPaid };
    setIncomeEntries(prev => {
      const next = [...prev, entry];
      const newTotal = next.reduce((s, e) => s + toUSD(e.amount, e.currency), 0);
      gainXP(xpPaid, `(+$${amtUSD.toFixed(2)})`, "income");
      recordActiveDay();
      setUnlockedAchievements(ua => {
        checkAchievements(totalTools, newTotal, projects.length, skillData, ua, streak, sessions.dates.length);
        return ua;
      });
      return next;
    });
    setIncForm(f => ({ ...f, amount: "", note: "", date: todayStr() }));
  }, [incForm, uahRate, toUSD, gainXP, recordActiveDay, checkAchievements, totalTools, projects, skillData, streak, sessions.dates.length]);

  // Delete entry with 5s undo window
  const startDelete = useCallback((id, type) => {
    const entries = type === "income" ? incomeEntries : expenseEntries;
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    if (type === "income") setIncomeEntries(prev => prev.filter(e => e.id !== id));
    else setExpenseEntries(prev => prev.filter(e => e.id !== id));
    setPendingDelete(prev => {
      if (prev?.timerId) clearTimeout(prev.timerId);
      const timerId = setTimeout(() => setPendingDelete(null), 5000);
      return { id, type, entry, xpPaid: 0, timerId };
    });
  }, [incomeEntries, expenseEntries]);

  // Refund income entry: remove it + deduct XP
  const refundIncomeEntry = useCallback((id) => {
    const entry = incomeEntries.find(e => e.id === id);
    if (!entry) return;
    setIncomeEntries(prev => prev.filter(e => e.id !== id));
    const xp = entry.xpPaid ?? 0;
    if (xp > 0) {
      loseXP(xp, "income", "↩ повернення доходу");
      showNotif(`↩ Повернуто −${xp} XP`, "xp");
    }
    setPendingDelete(prev => {
      if (prev?.timerId) clearTimeout(prev.timerId);
      const timerId = setTimeout(() => setPendingDelete(null), 5000);
      return { id, type: "income", entry, xpPaid: xp, refund: true, timerId };
    });
  }, [incomeEntries, loseXP, showNotif]);

  const undoDelete = useCallback(() => {
    if (!pendingDelete) return;
    if (pendingDelete.timerId) clearTimeout(pendingDelete.timerId);
    if (pendingDelete.type === "income") {
      setIncomeEntries(prev => [...prev, pendingDelete.entry]);
      if (pendingDelete.refund && pendingDelete.xpPaid > 0) {
        gainXP(pendingDelete.xpPaid, "↩ повернено", "income");
      }
    } else {
      setExpenseEntries(prev => [...prev, pendingDelete.entry]);
    }
    setPendingDelete(null);
  }, [pendingDelete, gainXP, showNotif]);

  const addExpenseEntry = useCallback(() => {
    const amt = parseFloat(expForm.amount);
    if (!amt || amt <= 0) return;
    const entry = { id: `exp_${Date.now()}`, catId: expForm.catId, amount: amt, currency: expForm.currency, date: expForm.date || todayStr(), note: expForm.note };
    setExpenseEntries(prev => [...prev, entry]);
    setExpForm(f => ({ ...f, amount: "", note: "", date: todayStr() }));
  }, [expForm]);

  const addProject = useCallback(() => {
    if (!projectInput.trim()) return;
    const cxp = Math.max(0, parseInt(projectCompletionXP) || 0);
    const newProjects = [...projects, { name: projectInput.trim(), date: new Date().toLocaleDateString("uk-UA"), status: "in_progress", creationXP: 0, completionXP: cxp, completionXPPaid: false, category: projectCategory }];
    setProjects(newProjects);
    recordActiveDay();
    setProjectCompletionXP(200);
    setProjectInput("");
    setUnlockedAchievements(ua => {
      checkAchievements(totalTools, totalIncome, newProjects.length, skillData, ua, streak, sessions.dates.length);
      return ua;
    });
  }, [projectInput, projects, gainXP, recordActiveDay, checkAchievements, totalTools, totalIncome, skillData, streak, sessions.dates.length]);

  // Синхронізація рядків коду з GitHub (усі репозиторії користувача).
  // Рахуємо фактичні рядки у файлах кожного репо (дерево гілки + raw-вміст).
  const syncGithubLines = useCallback(async () => {
    const user = githubSync.user.trim();
    const token = githubSync.token.trim();
    if (!user) { setGhSyncMsg("⚠ Вкажи GitHub username"); return; }
    setGhSyncing(true);
    setGhSyncMsg("Отримую список репозиторіїв…");
    const headers = { Accept: "application/vnd.github+json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      // 1. Список репозиторіїв (з пагінацією)
      let repos = [];
      for (let page = 1; page <= 10; page++) {
        const url = token
          ? `https://api.github.com/user/repos?per_page=100&affiliation=owner&sort=pushed&page=${page}`
          : `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed&page=${page}`;
        const r = await fetch(url, { headers });
        if (!r.ok) {
          if (r.status === 401) throw new Error("Невірний токен (401)");
          if (r.status === 403) throw new Error("Ліміт запитів GitHub (403) — додай токен");
          if (r.status === 404) throw new Error("Користувача не знайдено (404)");
          throw new Error(`GitHub помилка ${r.status}`);
        }
        const batch = await r.json();
        repos = repos.concat(batch);
        if (batch.length < 100) break;
      }
      repos = repos.filter(repo => !repo.fork);
      if (!repos.length) { setGhSyncMsg("Репозиторіїв не знайдено"); setGhSyncing(false); return; }

      // 2. По кожному репо — рахуємо фактичні рядки у файлах (як показує GitHub),
      //    через дерево гілки + raw-вміст. Це швидко й детерміновано (без лінивої статистики).
      //    Кешуємо результат: повторні синки чіпають лише репо, що змінились (pushed_at).
      const TEXT_EXT = new Set(["js","jsx","ts","tsx","mjs","cjs","html","htm","css","scss","sass","less","py","java","c","cc","cpp","cxx","h","hpp","cs","go","rs","rb","php","swift","kt","kts","json","md","markdown","yml","yaml","xml","toml","ini","cfg","conf","sh","bash","zsh","sql","vue","svelte","astro","txt","r","lua","dart","ex","exs","pl","pm","scala","clj","hs","elm","gradle","properties","gitignore","dockerfile","makefile"]);
      const SKIP_FILE = new Set(["package-lock.json","yarn.lock","pnpm-lock.yaml","composer.lock","poetry.lock","gemfile.lock","cargo.lock"]);
      const isTextFile = (path) => {
        const base = path.split("/").pop().toLowerCase();
        if (SKIP_FILE.has(base)) return false;
        if (base.includes(".min.")) return false;
        const ext = base.includes(".") ? base.split(".").pop() : base;
        return TEXT_EXT.has(ext);
      };
      const countLines = (content) => {
        const nl = (content.match(/\n/g) || []).length;
        return content.endsWith("\n") ? nl : nl + (content.length ? 1 : 0);
      };

      const cache = {};
      (githubSync.repos || []).forEach(r => { if (r.name) cache[r.name] = { lines: r.lines, pushedAt: r.pushedAt }; });
      const keepCached = (repo) => {
        const c = cache[repo.name];
        if (c && c.lines > 0) { perRepo.push({ name: repo.name, lines: c.lines, pushedAt: c.pushedAt }); totalNet += c.lines; }
      };

      const perRepo = [];
      let totalNet = 0;
      let cachedCount = 0;      // взято з кешу без запиту
      let rateLimited = false;  // натрапили на 403

      const fetchRaw = async (repo, path) => {
        const enc = path.split("/").map(encodeURIComponent).join("/");
        if (repo.private && token) {
          const r = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/${enc}?ref=${encodeURIComponent(repo.default_branch)}`, { headers: { ...headers, Accept: "application/vnd.github.raw" } });
          if (r.status === 403) { rateLimited = true; return null; }
          if (!r.ok) return null;
          return await r.text();
        }
        const r = await fetch(`https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${encodeURIComponent(repo.default_branch)}/${enc}`);
        if (!r.ok) return null;
        return await r.text();
      };

      for (let i = 0; i < repos.length; i++) {
        const repo = repos[i];
        const c = cache[repo.name];
        // репо не змінилось з минулого синку → беремо з кешу, без запиту
        if (c && c.pushedAt && c.pushedAt === repo.pushed_at && typeof c.lines === "number") {
          if (c.lines > 0) { perRepo.push({ name: repo.name, lines: c.lines, pushedAt: repo.pushed_at }); totalNet += c.lines; }
          cachedCount++;
          continue;
        }
        if (rateLimited) { keepCached(repo); continue; }
        setGhSyncMsg(`Аналізую ${i + 1}/${repos.length}: ${repo.name}…`);

        // дерево гілки за замовчуванням (1 запит) → список файлів
        const tr = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/git/trees/${encodeURIComponent(repo.default_branch || "main")}?recursive=1`, { headers });
        if (tr.status === 403) { rateLimited = true; keepCached(repo); continue; }
        if (!tr.ok) { keepCached(repo); continue; }
        const tree = await tr.json();
        const blobs = (tree.tree || []).filter(t => t.type === "blob" && isTextFile(t.path) && (t.size ?? 0) < 1_500_000);

        // рахуємо рядки у файлах з обмеженою паралельністю
        let repoLines = 0;
        const queue = [...blobs];
        const worker = async () => {
          while (queue.length && !rateLimited) {
            const b = queue.shift();
            const content = await fetchRaw(repo, b.path);
            if (content != null) repoLines += countLines(content);
          }
        };
        await Promise.all(Array.from({ length: Math.min(8, blobs.length) || 1 }, worker));

        if (rateLimited) { keepCached(repo); continue; }
        if (repoLines > 0) { perRepo.push({ name: repo.name, lines: repoLines, pushedAt: repo.pushed_at }); totalNet += repoLines; }
      }
      perRepo.sort((a, b) => b.lines - a.lines);

      // 3. Зберігаємо все, що маємо (включно з кешем), щоб прогрес не губився
      const haveData = perRepo.length > 0 || cachedCount > 0;
      if (haveData) {
        setProgressiveCount("code", "lines_written", totalNet);
        setGithubSync(prev => ({ ...prev, user, token, lastSync: Date.now(), totalLines: totalNet, repos: perRepo }));
        setUnlockedAchievements(ua => {
          checkAchievements(totalTools, totalIncome, projects.length, skillData, ua, streak, sessions.dates.length);
          return ua;
        });
      }

      // 4. Підсумкове повідомлення
      if (rateLimited) {
        const hint = token ? "Спробуй ще раз за кілька хвилин." : "Додай Personal Access Token, щоб зняти ліміт.";
        setGhSyncMsg(`⚠ Ліміт запитів GitHub (403). ${haveData ? `Збережено ${totalNet.toLocaleString()} рядків. ` : ""}${hint}`);
        setGhSyncing(false);
        return;
      }
      if (!haveData) {
        setGhSyncMsg(`Не знайшов файлів з кодом у ${repos.length} репо`);
        setGhSyncing(false);
        return;
      }
      const cacheNote = cachedCount > 0 ? ` · ${cachedCount} з кешу` : "";
      setGhSyncMsg(`✓ ${totalNet.toLocaleString()} рядків з ${perRepo.length} репо${cacheNote}`);
    } catch (e) {
      setGhSyncMsg(`⚠ ${e.message}`);
    } finally {
      setGhSyncing(false);
    }
  }, [githubSync.user, githubSync.token, githubSync.repos, setProgressiveCount, checkAchievements, totalTools, totalIncome, projects, skillData, streak, sessions.dates]);

  const updateMonthlyTarget = useCallback((val) => {
    const t = parseInt(val);
    if (t > 0 && t <= 31) setSessions(prev => ({ ...prev, monthlyTarget: t }));
  }, []);

  const tabs = [
    { id: "dashboard",    label: "🏠 Головна" },
    { id: "goalsplan",    label: "🎯 Цілі & план" },
    { id: "projects",     label: "🚀 Проекти" },
    { id: "tools",        label: "🛠️ Інструменти" },
    { id: "skillstasks",  label: "💪 Навички" },
    { id: "achievements", label: "🏆 Досягнення" },
    { id: "finances",     label: "💸 Фінанси" },
    { id: "sessions",     label: "🔥 Сесії" },
    { id: "progress",     label: "📝 Прогрес" },
    { id: "stats",        label: "📊 Статистика" },
    { id: "radio",        label: "🎵 Радіо" },
  ];

  // Витягує videoId з YouTube-посилання (watch?v=, youtu.be/, /embed/, /live/) або з сирого ID
  const parseYtId = (raw) => {
    const s = (raw || "").trim();
    if (!s) return null;
    if (/^[\w-]{11}$/.test(s)) return s;
    try {
      const u = new URL(s.includes("://") ? s : "https://" + s);
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/\/(embed|live|shorts)\/([\w-]{11})/) || u.pathname.match(/^\/([\w-]{11})$/);
      if (m) return m[m.length - 1];
    } catch (_) {}
    const m2 = s.match(/[\w-]{11}/);
    return m2 ? m2[0] : null;
  };

  const addRadioStation = () => {
    const videoId = parseYtId(radioUrl);
    if (!videoId) { showNotif("Не вдалося розпізнати YouTube-посилання", "error"); return; }
    if (radioStations.some(s => s.videoId === videoId)) { showNotif("Ця станція вже є у списку", "error"); return; }
    const COLORS = ["#00ff88", "#ff6b35", "#a855f7", "#06b6d4", "#ec4899", "#f59e0b", "#6366f1", "#10b981"];
    const station = {
      id: "r_" + Date.now(),
      title: radioTitle.trim() || "Моя станція",
      channel: "",
      videoId,
      genre: radioGenre.trim() || "Custom",
      color: COLORS[radioStations.length % COLORS.length],
      custom: true,
    };
    setRadioStations(prev => [...prev, station]);
    setRadioUrl(""); setRadioTitle(""); setRadioGenre(""); setRadioAddOpen(false);
    showNotif("Станцію додано 🎵", "success");
  };

  const removeRadioStation = (id) => {
    setRadioStations(prev => {
      const st = prev.find(s => s.id === id);
      if (st && st.videoId === radioActive) setRadioActive(null);
      return prev.filter(s => s.id !== id);
    });
  };

  // Heatmap: group days into weeks
  const heatmapWeeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < heatmapDays.length; i += 7) {
      weeks.push(heatmapDays.slice(i, i + 7));
    }
    return weeks;
  }, [heatmapDays]);

  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: "transparent", minHeight: "100vh", color: "#e0d8c0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;800&family=Space+Mono:wght@400;700&display=swap');

        .tab-btn { transition: color 0.18s, border-color 0.18s; }
        .skill-card { transition: all 0.18s; }
        .skill-card:hover { transform: translateY(-3px); }
        .tool-chip { transition: all 0.15s; }
        .tool-chip:hover:not(:disabled) { transform: scale(1.06); }
        .act-btn { transition: all 0.15s; }
        .act-btn:hover { transform: translateY(-1px); opacity: 0.9; }
        .checkin-btn { transition: all 0.2s; }
        .checkin-btn:not(:disabled):hover { transform: scale(1.03); box-shadow: 0 0 40px rgba(0,255,136,0.5) !important; }

        @keyframes slideIn { from { transform: translateX(120px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes wfPulse { 0%,100%{opacity:1;box-shadow:0 0 16px rgba(201,168,76,0.4)} 50%{opacity:0.85;box-shadow:0 0 28px rgba(201,168,76,0.7)} }
        @keyframes legendaryGlow { 0%,100%{box-shadow:0 0 28px rgba(255,183,0,0.55),0 0 60px rgba(255,140,0,0.20),inset 0 0 30px rgba(255,183,0,0.06)} 50%{box-shadow:0 0 48px rgba(255,183,0,0.80),0 0 90px rgba(255,140,0,0.35),inset 0 0 50px rgba(255,183,0,0.12)} }
        @keyframes legendaryShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes legendaryBorder { 0%,100%{border-color:rgba(255,183,0,0.60)} 33%{border-color:rgba(255,220,80,0.90)} 66%{border-color:rgba(255,140,0,0.70)} }
        @keyframes legendaryStar { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
        .legendary-card { animation: legendaryGlow 2.8s ease-in-out infinite, legendaryBorder 3.5s ease-in-out infinite !important; }
        .legendary-title { background: linear-gradient(90deg,#ffb700,#ffe566,#ff8c00,#ffb700); background-size:300% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation: legendaryShimmer 3s linear infinite; }
        .legendary-badge { background: linear-gradient(90deg,#7a4a00,#ffb700,#7a4a00) !important; background-size:200% auto !important; animation: legendaryShimmer 2s linear infinite !important; color:#000 !important; border:none !important; }

        input::placeholder { color: #5a4a30; }
        input:focus { outline: none; border-color: rgba(201,168,76,0.6) !important; box-shadow: 0 0 0 1px rgba(201,168,76,0.25) !important; }
        select option { background: #0e0a04; color: #e0d8c0; }

        /* Warframe panel chrome */
        .wf-panel {
          position: relative;
          background: rgba(5,3,1,0.82);
          border: 1px solid rgba(201,168,76,0.22);
          border-top: 2px solid rgba(201,168,76,0.7);
          border-radius: 4px;
        }
        .wf-panel::before, .wf-panel::after {
          content: '';
          position: absolute;
          width: 10px; height: 10px;
        }
        .wf-panel::before {
          bottom: -1px; right: -1px;
          border-bottom: 2px solid rgba(201,168,76,0.4);
          border-right: 2px solid rgba(201,168,76,0.4);
        }
        .wf-panel::after {
          bottom: -1px; left: -1px;
          border-bottom: 2px solid rgba(201,168,76,0.4);
          border-left: 2px solid rgba(201,168,76,0.4);
        }

        /* Warframe mod card style */
        .wf-card {
          position: relative;
          background: linear-gradient(160deg, rgba(12,9,3,0.95) 0%, rgba(8,6,2,0.92) 100%);
          border: 1px solid rgba(201,168,76,0.25);
          border-top: 2px solid rgba(201,168,76,0.6);
          border-radius: 4px;
          overflow: hidden;
        }
        .wf-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 40px;
          background: linear-gradient(180deg, rgba(201,168,76,0.06) 0%, transparent 100%);
          pointer-events: none;
        }

        /* Section title divider */
        .wf-sec {
          font-family: 'Exo 2',sans-serif;
          font-size: 11px; font-weight: 700;
          color: #c9a84c;
          text-transform: uppercase; letter-spacing: 3px;
          padding-bottom: 10px;
          margin-bottom: 14px;
          border-bottom: 1px solid rgba(201,168,76,0.25);
        }

        /* Warframe stat row */
        .wf-stat-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid rgba(201,168,76,0.08);
          font-size: 13px;
        }
        .wf-stat-row:last-child { border-bottom: none; }
        .wf-stat-label { color: #9a8a60; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; }
        .wf-stat-val { color: #e0d8c0; font-family: 'Exo 2',sans-serif; font-weight: 700; }

        /* Floating +N animation */
        @keyframes floatUp {
          0%   { opacity:1; transform: translateY(0) scale(1.1); }
          60%  { opacity:0.9; transform: translateY(-28px) scale(1.25); }
          100% { opacity:0; transform: translateY(-54px) scale(0.9); }
        }
        .float-text {
          position: absolute;
          pointer-events: none;
          font-family: 'Space Mono',monospace;
          font-weight: 800;
          font-size: 22px;
          animation: floatUp 0.85s ease-out forwards;
          z-index: 100;
          text-shadow: 0 0 12px currentColor;
          white-space: nowrap;
          left: 50%; transform: translateX(-50%);
          bottom: 48px;
        }

        /* Big + button Cookie-Clicker style */
        .act-plus {
          border: none;
          cursor: pointer;
          font-weight: 900;
          font-size: 28px;
          line-height: 1;
          transition: transform 0.08s, box-shadow 0.08s;
          user-select: none;
        }
        .act-plus:active { transform: scale(0.93) translateY(2px) !important; }

        /* Achievement toast (bottom-right) */
        @keyframes achIn  { from { opacity:0; transform: translateX(120px); } to { opacity:1; transform: translateX(0); } }
        @keyframes achOut { from { opacity:1; transform: translateX(0);      } to { opacity:0; transform: translateX(80px); } }
        .ach-toast        { animation: achIn 0.35s cubic-bezier(.22,.68,0,1.2) forwards; }
        .ach-toast.dying  { animation: achOut 0.4s ease-in forwards; }
      `}</style>

      <FloatingBg />

      {notification && (
        <div key={notification.id} style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, background: "linear-gradient(135deg,rgba(40,28,4,0.98),rgba(18,12,2,0.98))", color: "#c9a84c", padding: "12px 22px", borderRadius: 3, fontWeight: 700, fontSize: 12, border: "1px solid rgba(201,168,76,0.55)", borderTop: "2px solid #c9a84c", boxShadow: "0 0 30px rgba(201,168,76,0.30), 0 6px 24px rgba(0,0,0,0.7)", animation: "slideIn 0.3s ease", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 2 }}>{notification.msg}</div>
      )}

      {/* Achievement toasts — bottom-right, Cookie Clicker style */}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9998, display: "flex", flexDirection: "column-reverse", gap: 10, pointerEvents: "none" }}>
        {achieveToasts.map(t => {
          const tierColor = { common: "#9a8a60", uncommon: "#00cc66", rare: "#3b8ff5", epic: "#a855f7", legendary: "#f59e0b", prime: "#ff6b35" }[t.tier] ?? "#c9a84c";
          return (
            <div key={t.id} className={`ach-toast${t.dying ? " dying" : ""}`} style={{ width: 270, background: "linear-gradient(135deg,rgba(10,6,2,0.97),rgba(18,12,4,0.97))", border: `1px solid ${tierColor}55`, borderLeft: `3px solid ${tierColor}`, borderRadius: 4, padding: "12px 14px", boxShadow: `0 4px 24px rgba(0,0,0,0.8), 0 0 20px ${tierColor}22`, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 28, lineHeight: 1, filter: "drop-shadow(0 0 6px currentColor)" }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: tierColor, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 2, marginBottom: 2 }}>Досягнення розблоковано</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#e0d8c0", fontFamily: "'Exo 2',sans-serif", letterSpacing: 0.5 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: "#6a5f40", fontFamily: "'Space Mono',monospace", marginTop: 2 }}>{t.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "min(1300px, 91vw)", margin: "0 auto", padding: "20px 14px" }}>

        {/* Header */}
        {(() => {
          const lg = getLeague(totalLevel);
          const lc = lg.color;
          const lglow = lg.glow;
          const lbg = lg.bg.replace("135deg", "90deg");
          return (
        <div className={levelGlow ? "level-up-glow" : undefined} style={{ marginBottom: 24, padding: levelGlow ? 14 : 0, paddingBottom: 20, border: levelGlow ? `1px solid ${lc}44` : "none", borderBottom: `1px solid ${lc}44`, borderRadius: 6, transition: "padding 0.4s ease", "--lu-color": lc, "--lu-border": `${lc}80`, "--lu-bright": lc }}>

          {/* Top row: avatar + name + stats */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 58, height: 58, borderRadius: 4, background: "linear-gradient(145deg,#1a1210,#2a1e14)", border: `2px solid ${lc}`, boxShadow: `0 0 22px ${lglow}, inset 0 0 16px ${lc}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: lc, fontFamily: "'Exo 2',sans-serif", letterSpacing: -1 }}>Vi</div>
              <div style={{ position: "absolute", bottom: -8, right: -10 }}><LeagueBadge level={totalLevel} size={30} /></div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 22, fontWeight: 800, color: "#e0d8c0", letterSpacing: 3, textTransform: "uppercase" }}>ViFrim</span>
                <span style={{ background: `${lc}1a`, border: `1px solid ${lc}99`, color: lc, padding: "3px 10px", borderRadius: 3, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{lg.name} ліга</span>
              </div>
              <div style={{ fontSize: 11, color: `${lc}80`, marginTop: 4, textTransform: "uppercase", letterSpacing: 3 }}>AI Progress Tracker</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch" }}>
              {[
                { label: "Дохід", val: `$${totalIncome.toFixed(0)}`, color: lc },
                { label: "Проекти", val: projects.filter(p => (p.status ?? "done") === "done").length, color: lc },
                { label: "Клієнти", val: (skillTasksData["monetize_clients"]?.count ?? 0), color: "#fbbf24" },
                { label: "Досягнення", val: `${unlockedAchievements.length}/${ACHIEVEMENTS.length}`, color: "#00ff88" },
                { label: "Сесій/міс", val: `${monthSessions}/${daysInCurrentMonth}`, color: lc },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "10px 14px", minWidth: 84, background: "rgba(8,5,2,0.55)", border: `1px solid ${lc}28`, borderTop: `2px solid ${lc}60`, borderRadius: 4, boxShadow: `0 0 12px ${lglow}` }}>
                  <div style={{ fontSize: 11, color: `${lc}88`, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                </div>
              ))}
              {/* Streak badge — tier color matches streak achievements */}
              {(() => {
                const STREAK_TIERS = [
                  { min: 365, tier: "legendary" },
                  { min: 180, tier: "prime" },
                  { min: 90,  tier: "rare" },
                  { min: 30,  tier: "epic" },
                  { min: 7,   tier: "uncommon" },
                  { min: 3,   tier: "common" },
                ];
                const match = STREAK_TIERS.find(t => totalActiveDays >= t.min);
                const sc = match ? TIERS[match.tier].color : "#6a5f40";
                const sglow = match ? TIERS[match.tier].glow : "rgba(106,95,64,0.35)";
                return (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 14px", minWidth: 84, background: `${sc}12`, border: `1px solid ${sc}40`, borderTop: `2px solid ${sc}80`, borderRadius: 4, boxShadow: `0 0 12px ${sglow}` }}>
                    <div style={{ fontSize: 11, color: `${sc}aa`, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>🔥 Стрік</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: sc, fontFamily: "'Exo 2',sans-serif" }}>{streak} <span style={{ fontSize: 13 }}>дн.</span></div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* XP Bar */}
          <div className={levelGlow ? "level-up-glow" : undefined} style={{ padding: "12px 16px", background: "rgba(8,5,2,0.55)", border: `1px solid ${lc}28`, borderTop: `2px solid ${lc}60`, borderRadius: 4, boxShadow: `0 0 12px ${lglow}`, "--lu-color": lc, "--lu-border": `${lc}90`, "--lu-bright": lc }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: lbg, color: "#000", padding: "3px 12px", borderRadius: 3, fontSize: 12, fontWeight: 800, fontFamily: "'Exo 2',sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>RANK {totalLevel}</span>
                <span style={{ fontSize: 12, color: lc, fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{totalXP.toLocaleString()} XP</span>
                {todayXpTotal > 0 && (
                  <span style={{ background: "rgba(0,255,136,0.14)", border: "1px solid rgba(0,255,136,0.45)", color: "#00ff88", fontSize: 11, fontWeight: 800, fontFamily: "'Space Mono',monospace", padding: "2px 9px", borderRadius: 12, letterSpacing: 0.3, whiteSpace: "nowrap" }}>+{todayXpTotal} XP сьогодні</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: `${lc}99`, fontFamily: "'Space Mono',monospace" }}>
                {totalLevel >= 100
                  ? <span style={{ color: "#00ff88", fontWeight: 700 }}>+{(totalXP - nextLevelXP).toLocaleString()} XP</span>
                  : <>ще <span style={{ color: lc, fontWeight: 700 }}>{(nextLevelXP - totalXP).toLocaleString()}</span> XP</>
                }
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: `${lc}80`, fontFamily: "'Space Mono',monospace" }}>{nextLevelXP.toLocaleString()} XP</span>
                <span style={{ background: `${lc}18`, border: `1px solid ${lc}80`, color: lc, padding: "3px 12px", borderRadius: 3, fontSize: 12, fontWeight: 800, fontFamily: "'Exo 2',sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>RANK {totalLevel + 1}</span>
              </div>
            </div>
            <div style={{ position: "relative", height: 12, background: "rgba(20,14,4,0.80)", borderRadius: 2, overflow: "hidden", border: `1px solid ${lc}30` }}>
              <div style={{ width: `${Math.min(100, xpProgress)}%`, height: "100%", background: lbg, borderRadius: 2, transition: "width 0.7s ease", boxShadow: `0 0 10px ${lglow}, inset 0 1px 0 rgba(255,255,255,0.15)`, position: "relative" }}>
                <div style={{ position: "absolute", top: 1, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.2)", borderRadius: 2 }} />
              </div>
              {[10,20,30,40,50,60,70,80,90].map(p => (
                <div key={p} style={{ position: "absolute", top: 0, left: `${p}%`, width: 1, height: "100%", background: "rgba(0,0,0,0.50)", pointerEvents: "none" }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7, flexWrap: "wrap", gap: 6 }}>
              <div style={{ fontSize: 11, color: `${lc}88`, fontFamily: "'Space Mono',monospace" }}>{Math.round(xpProgress)}% до рівня {totalLevel + 1}</div>
              {(() => {
                const cur = getLeague(totalLevel);
                const nextLg = LEAGUES[LEAGUES.indexOf(cur) + 1];
                return (
                  <span style={{ fontSize: 11, color: cur.color, fontFamily: "'Exo 2',sans-serif", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                    {!nextLg ? "★ " : ""}{cur.name} ліга{!nextLg ? " — МАКС" : ""}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
          );
        })()}

        {/* Tabs — Warframe underline style (on its own panel) */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, flexWrap: "wrap", flexShrink: 0, background: "linear-gradient(180deg, rgba(10,12,22,0.82), rgba(6,8,16,0.86))", border: "1px solid rgba(201,168,76,0.20)", borderBottom: "2px solid rgba(201,168,76,0.30)", borderRadius: 8, padding: "3px 8px", backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)" }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)} style={{ padding: "11px 13px", borderRadius: 0, fontSize: 12, cursor: "pointer", background: "transparent", color: activeTab === t.id ? "#d4b040" : "#6a5f40", border: "none", borderBottom: activeTab === t.id ? "2px solid #d4b040" : "2px solid transparent", marginBottom: -4, fontWeight: activeTab === t.id ? 800 : 600, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: "1.5px", whiteSpace: "nowrap", outline: "none" }}>{t.label}</button>
          ))}
        </div>

        {/* ── Персистентний радіо-плеєр: рендериться поза вкладками, тому музика
            не переривається при перемиканні категорій. На вкладці «Радіо» —
            великий у потоці; на інших — компактний закріплений у кутку. ── */}
        {radioActive && (() => {
          const st = radioStations.find(s => s.videoId === radioActive);
          if (!st) return null;
          const isRadioTab = activeTab === "radio";
          return (
            isRadioTab ? (
              /* На вкладці Радіо — повний плеєр у потоці */
              <div style={{ marginBottom: 16, background: "rgba(8,5,2,0.6)", border: `1px solid ${st.color}55`, borderTop: `2px solid ${st.color}`, borderRadius: 8, overflow: "hidden", boxShadow: `0 0 24px ${st.color}22` }}>
                <div style={{ position: "relative", width: "100%", paddingTop: "56.25%" }}>
                  <iframe key={st.videoId} src={`https://www.youtube.com/embed/${st.videoId}?autoplay=1&rel=0`} title={st.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.color, boxShadow: `0 0 8px ${st.color}`, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e0d8c0", fontFamily: "'Exo 2',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.title}</span>
                    {st.channel && <span style={{ fontSize: 11, color: "#6a5f40", fontFamily: "'Space Mono',monospace" }}>· {st.channel}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <a href={`https://www.youtube.com/watch?v=${st.videoId}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#06b6d4", fontFamily: "'Space Mono',monospace", textDecoration: "none" }}>↗ YouTube</a>
                    <button onClick={() => setRadioActive(null)} style={{ fontSize: 11, color: "#f43f5e", background: "none", border: "none", cursor: "pointer", fontFamily: "'Space Mono',monospace" }}>■ Стоп</button>
                  </div>
                </div>
              </div>
            ) : (
              /* На інших вкладках — компактний плеєр без відео (44px) */
              <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 9000, width: "min(260px, calc(100vw - 32px))", background: "rgba(8,5,2,0.96)", border: `1px solid ${st.color}44`, borderLeft: `3px solid ${st.color}`, borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.65)", overflow: "hidden" }}>
                {/* Прихований iframe — зберігає аудіопотік живим */}
                <div style={{ position: "absolute", width: 2, height: 2, overflow: "hidden", top: 0, left: 0, pointerEvents: "none" }}>
                  <iframe key={st.videoId} src={`https://www.youtube.com/embed/${st.videoId}?autoplay=1&rel=0`} title={st.title} allow="autoplay; encrypted-media" style={{ width: 200, height: 112, border: "none" }} />
                </div>
                {/* Компактна панель */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.color, boxShadow: `0 0 6px ${st.color}`, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "#e0d8c0", fontFamily: "'Exo 2',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.title}</span>
                  <button onClick={() => setActiveTab("radio")} style={{ fontSize: 10, color: st.color, background: "none", border: "none", cursor: "pointer", fontFamily: "'Space Mono',monospace", padding: 0, flexShrink: 0 }}>⛶</button>
                  <button onClick={() => setRadioActive(null)} style={{ fontSize: 10, color: "#f43f5e", background: "none", border: "none", cursor: "pointer", fontFamily: "'Space Mono',monospace", padding: 0, flexShrink: 0 }}>■</button>
                </div>
              </div>
            )
          );
        })()}

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Two-column: Focus block + Activity */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              {/* LEFT: Focus block */}
              <div style={{ flex: "0 0 calc(50% - 8px)", minWidth: 260 }}>
                {(() => {
                  const FILTERS = [
                    { id: "pinned", label: "📌 Закріплені", color: "#c9a84c", bg: "rgba(201,168,76,0.14)" },
                    { id: "week",   label: "📅 Тиждень",   color: "#06b6d4", bg: "rgba(6,182,212,0.14)" },
                    { id: "month",  label: "🗓 Місяць",    color: "#a855f7", bg: "rgba(168,85,247,0.14)" },
                  ];
                  // What to show per filter
                  const aliveLongGoals = longGoals.filter(g => !g.done && !g.deletedAt);
                  const alivePlan = plan.filter(p => !p.done && !p.deletedAt);
                  const aliveTasks = goals.filter(g => !g.done && !g.deletedAt);
                  const focusLongGoals = focusFilter === "pinned"
                    ? aliveLongGoals.filter(g => g.pinned)
                    : focusFilter === "week"
                      ? aliveLongGoals.filter(g => g.period === "week_cur")
                      : aliveLongGoals.filter(g => g.period === "month_cur");
                  const focusPlanItems = focusFilter === "pinned"
                    ? alivePlan.filter(p => p.pinned)
                    : focusFilter === "week"
                      ? alivePlan.filter(p => p.urgency === "now" || p.urgency === "soon").slice(0, 5)
                      : alivePlan.slice(0, 5);
                  const focusTasks = focusFilter === "pinned"
                    ? aliveTasks.filter(g => g.pinned)
                    : focusFilter === "week"
                      ? aliveTasks.filter(g => g.priority === "urgent" || g.priority === "important").slice(0, 5)
                      : aliveTasks.filter(g => g.priority === "urgent").slice(0, 5);
                  const isEmpty = !focusLongGoals.length && !focusPlanItems.length && !focusTasks.length;
                  const completeTask = (id) => setGoals(prev => prev.map(x => {
                    if (x.id !== id) return x;
                    if (!x.done && !x.xpAwarded) { gainXP(x.xp ?? 50, "(задачу виконано)", "goal"); return { ...x, done: true, xpAwarded: true, completedAt: new Date().toISOString() }; }
                    return { ...x, done: !x.done };
                  }));
                  return (
                    <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                      {/* Header + filter */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2 }}>🎯 Фокус</div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {FILTERS.map(f => (
                            <button key={f.id} onClick={() => setFocusFilter(f.id)}
                              style={{ background: focusFilter === f.id ? f.bg : "rgba(8,5,2,0.5)", border: `1px solid ${focusFilter === f.id ? f.color + "88" : "rgba(201,168,76,0.12)"}`, borderRadius: 3, padding: "3px 8px", color: focusFilter === f.id ? f.color : "#5a5040", fontSize: 10, cursor: "pointer", fontFamily: "'Exo 2',sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {isEmpty && (
                        <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "#5a5040" }}>
                          {focusFilter === "pinned"
                            ? <>Натисни 📌 на цілі, план або задачу, щоб вони з'явились тут<br/><span onClick={() => { setActiveTab("goalsplan"); }} style={{ color: "#c9a84c", cursor: "pointer", marginTop: 6, display: "inline-block" }}>Відкрити Цілі & план →</span></>
                            : "Нічого на цей період"}
                        </div>
                      )}

                      {/* Long-term goals */}
                      {focusLongGoals.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: "#c084fc", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7 }}>🎯 Цілі</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {focusLongGoals.map(g => {
                              return (
                                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(20,10,30,0.85)", border: "1px solid rgba(168,85,247,0.30)", borderLeft: "3px solid #a855f7", borderRadius: 4, padding: "8px 11px" }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", flexShrink: 0 }} />
                                  <span style={{ flex: 1, fontSize: 12, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.text}</span>
                                  <button onClick={() => setLongGoals(prev => prev.map(x => x.id === g.id ? { ...x, pinned: !x.pinned } : x))}
                                    title="Закріплено на головній"
                                    style={{ background: "none", border: "none", color: "#c9a84c", opacity: g.pinned ? 1 : 0.18, filter: g.pinned ? "drop-shadow(0 0 4px rgba(201,168,76,0.7))" : "none", cursor: "pointer", fontSize: 13, padding: "0 2px", flexShrink: 0, transition: "opacity 0.2s, filter 0.2s" }}>📌</button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Plan items */}
                      {focusPlanItems.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: "#22d3ee", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7 }}>📋 План дій</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {focusPlanItems.map(item => {
                              const pt = PLAN_TYPES.find(t => t.id === (item.type ?? "other")) ?? PLAN_TYPES[PLAN_TYPES.length - 1];
                              return (
                                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(4,18,24,0.85)", border: "1px solid rgba(6,182,212,0.30)", borderLeft: "3px solid #06b6d4", borderRadius: 4, padding: "8px 11px" }}>
                                  <button onClick={() => setPlan(prev => prev.map(x => {
                                    if (x.id !== item.id) return x;
                                    if (!x.done && !x.xpAwarded) { gainXP(x.xp ?? 150, "(план дій)", "plan"); return { ...x, done: true, xpAwarded: true, completedAt: new Date().toISOString() }; }
                                    return { ...x, done: !x.done };
                                  }))}
                                    style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(6,182,212,0.7)", background: "transparent", cursor: "pointer", flexShrink: 0, fontSize: 9, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }} />
                                  <span style={{ flex: 1, fontSize: 12, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</span>
                                  <span style={{ fontSize: 9, color: pt.color, background: pt.bg, border: `1px solid ${pt.color}33`, padding: "2px 6px", borderRadius: 3, flexShrink: 0 }}>{pt.label}</span>
                                  <button onClick={() => setPlan(prev => prev.map(x => x.id === item.id ? { ...x, pinned: !x.pinned } : x))}
                                    title="Закріплено на головній"
                                    style={{ background: "none", border: "none", color: "#c9a84c", opacity: item.pinned ? 1 : 0.18, filter: item.pinned ? "drop-shadow(0 0 4px rgba(201,168,76,0.7))" : "none", cursor: "pointer", fontSize: 13, padding: "0 2px", flexShrink: 0, transition: "opacity 0.2s, filter 0.2s" }}>📌</button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tasks */}
                      {focusTasks.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: "#00ff88", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7 }}>✅ Задачі</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {focusTasks.map(g => {
                              const pr = TASK_PRIORITIES.find(p => p.id === g.priority) ?? TASK_PRIORITIES[2];
                              return (
                                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(5,14,10,0.85)", border: "1px solid rgba(0,255,136,0.30)", borderLeft: "3px solid #00ff88", borderRadius: 4, padding: "7px 10px" }}>
                                  <button onClick={() => completeTask(g.id)}
                                    style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(0,255,136,0.7)", background: "transparent", cursor: "pointer", flexShrink: 0 }} />
                                  <span style={{ flex: 1, fontSize: 12, color: "#e0d8c0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.text}</span>
                                  <span style={{ fontSize: 9, color: pr.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>{pr.label}</span>
                                  <button onClick={() => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, pinned: !x.pinned } : x))}
                                    title="Закріплено на головній"
                                    style={{ background: "none", border: "none", color: "#c9a84c", opacity: g.pinned ? 1 : 0.18, filter: g.pinned ? "drop-shadow(0 0 4px rgba(201,168,76,0.7))" : "none", cursor: "pointer", fontSize: 13, padding: "0 2px", flexShrink: 0, transition: "opacity 0.2s, filter 0.2s" }}>📌</button>
                                </div>
                              );
                            })}
                          </div>
                          <button onClick={() => setActiveTab("goalsplan")} style={{ marginTop: 8, background: "none", border: "none", color: "#6a5f40", fontSize: 11, cursor: "pointer", fontFamily: "'Space Mono',monospace", padding: 0 }}>
                            Всі задачі ({goals.filter(g => !g.done).length}) →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* RIGHT: Activity */}
              <div style={{ flex: 1, minWidth: 300 }}>
                {(() => {
                  const ACTIVITY_TRACKERS = ACTIVITY_DEFS;
                  const todayRows = ACTIVITY_TRACKERS
                    .map(tr => ({ tr, n: todayActivity[tr.key] ?? 0 }))
                    .filter(r => r.n > 0);
                  const todayTotalXP = todayRows.reduce((s, r) => s + r.n * r.tr.xp, 0);
                  return (
                    <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18 }}>
                      <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>⚡ Активність</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {ACTIVITY_TRACKERS.map(tr => {
                          const count = tr.kind === "learn"
                            ? (learnTime[tr.key] ?? 0)
                            : (skillTasksData[tr.key]?.count ?? 0);
                          const packVal = packInputs[tr.key] ?? "";
                          const packN = parseInt(packVal) || 0;
                          const todayCount = todayActivity[tr.key] ?? 0;
                          const doInc = (delta) => {
                            if (tr.kind === "learn") addLearnTime(tr.key, delta);
                            else {
                              const sep = tr.key.indexOf("_");
                              addProgressiveCount(tr.key.slice(0, sep), tr.key.slice(sep + 1), delta);
                            }
                            addFloat(tr.key, delta > 0 ? `+${delta}` : `${delta}`, delta > 0 ? tr.color : "#f43f5e");
                          };
                          const cardFloats = floats.filter(f => f.key === tr.key);
                          const xpLabel = `+${tr.xp} XP/${tr.unit ?? "шт"}`;
                          return (
                            <div key={tr.key} style={{ position: "relative", background: `${tr.color}0d`, border: `1px solid ${tr.color}35`, borderRadius: 8, padding: "12px 10px 10px", display: "flex", flexDirection: "column", gap: 8, overflow: "visible" }}>
                              {cardFloats.map(f => (
                                <span key={f.id} className="float-text" style={{ color: f.color }}>{f.text}</span>
                              ))}

                              {/* Header: emoji · name · xp rate | total count */}
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{tr.emoji}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 11, fontWeight: 800, color: "#c8b89a", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tr.label}</div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: `${tr.color}cc`, fontFamily: "'Space Mono',monospace", lineHeight: 1.3 }}>{xpLabel}</div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, minHeight: 42, justifyContent: "flex-start" }}>
                                  <div style={{ fontSize: 20, fontWeight: 900, color: tr.color, fontFamily: "'Space Mono',monospace", textShadow: `0 0 8px ${tr.color}55`, lineHeight: 1 }}>{count}</div>
                                  <span style={{ display: "inline-block", visibility: todayCount > 0 ? "visible" : "hidden", background: `${tr.color}18`, border: `1px solid ${tr.color}66`, color: tr.color, fontSize: 10, fontWeight: 800, fontFamily: "'Space Mono',monospace", padding: "1px 6px", borderRadius: 10, marginTop: 3, whiteSpace: "nowrap" }}>+{todayCount || 0}</span>
                                </div>
                              </div>

                              {/* Big + button — now shows emoji + label + hint */}
                              <button
                                className="act-plus"
                                onClick={() => doInc(1)}
                                style={{
                                  width: "100%", padding: "12px 8px",
                                  borderRadius: 6,
                                  background: `linear-gradient(180deg, ${tr.color}3a 0%, ${tr.color}1a 60%, ${tr.color}28 100%)`,
                                  border: `2px solid ${tr.color}77`,
                                  color: tr.color,
                                  boxShadow: `0 4px 0 ${tr.color}33, 0 0 14px ${tr.color}22, inset 0 1px 0 ${tr.color}44`,
                                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                                }}
                              >
                                <span style={{ fontSize: 22, lineHeight: 1 }}>{tr.emoji}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "'Exo 2',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>{tr.label}</span>
                                <span style={{ fontSize: 10, opacity: 0.6, fontFamily: "'Space Mono',monospace" }}>+ {tr.note ?? "1 шт"}</span>
                              </button>

                              {/* − / N / +N row */}
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <button
                                  onClick={() => { const n = packN > 0 ? packN : 1; doInc(-n); if (packN > 0) setPackInputs(prev => ({ ...prev, [tr.key]: "" })); }}
                                  style={{ padding: "4px 8px", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", color: "#c04050", lineHeight: 1, letterSpacing: 1, whiteSpace: "nowrap" }}>
                                  {packN > 0 ? `−${packN}` : "−"}
                                </button>
                                <input
                                  type="number"
                                  placeholder="N"
                                  value={packVal}
                                  onChange={e => setPackInputs(prev => ({ ...prev, [tr.key]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === "Enter" && packN !== 0) {
                                      doInc(packN);
                                      setPackInputs(prev => ({ ...prev, [tr.key]: "" }));
                                    }
                                  }}
                                  style={{ width: 38, background: "rgba(0,0,0,0.45)", border: `1px solid ${tr.color}28`, color: "#b0a080", padding: "4px 4px", borderRadius: 4, fontFamily: "'Space Mono',monospace", fontSize: 11, textAlign: "center" }}
                                />
                                <button
                                  onClick={() => { if (packN > 0) { doInc(packN); setPackInputs(prev => ({ ...prev, [tr.key]: "" })); } }}
                                  style={{ flex: 1, padding: "4px 0", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer", background: `${tr.color}14`, border: `1px solid ${tr.color}33`, color: `${tr.color}bb`, fontFamily: "'Space Mono',monospace" }}
                                >+N</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Розбивка XP за сьогодні */}
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed rgba(201,168,76,0.20)" }}>
                        {todayRows.length === 0 ? (
                          <div style={{ fontSize: 11, color: "#5a5040", fontFamily: "'Space Mono',monospace", textAlign: "center" }}>
                            Сьогодні активності ще не додано
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 14px" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#9a8a60", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1.5 }}>XP за сьогодні:</span>
                            {todayRows.map(({ tr, n }) => (
                              <span key={tr.key} style={{ fontSize: 11, color: "#b0a080", fontFamily: "'Space Mono',monospace" }}>
                                <span style={{ marginRight: 3 }}>{tr.emoji}</span>
                                {n} × {tr.xp} = <b style={{ color: tr.color }}>{n * tr.xp}</b>
                              </span>
                            ))}
                            <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: "#00ff88", fontFamily: "'Space Mono',monospace", textShadow: "0 0 10px rgba(0,255,136,0.4)" }}>
                              = +{todayTotalXP} XP
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* AI-канали на YouTube */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2 }}>📺 AI Канали</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="act-btn" onClick={() => refreshYouTube(true)} disabled={ytLoading}
                    style={{ background: "rgba(138,120,80,0.08)", border: "1px solid rgba(138,120,80,0.4)", color: "#9a8a60", padding: "6px 12px", borderRadius: 4, cursor: ytLoading ? "default" : "pointer", fontSize: 11, fontFamily: "'Space Mono',monospace", fontWeight: 700, opacity: ytLoading ? 0.5 : 1 }}>
                    {ytLoading ? "↻ …" : "↻ Оновити"}
                  </button>
                  <button className="act-btn" onClick={openAllChannels}
                    style={{ background: "rgba(255,0,0,0.1)", border: "1px solid #ff4444", color: "#ff6666", padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>
                    ▶ Відкрити всі
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {YT_CHANNELS.map(ch => {
                  const d = ytData[ch.handle];
                  const v = d?.video;
                  const hrs = v?.published ? Math.floor((Date.now() - new Date(v.published).getTime()) / 3600000) : null;
                  const isNew = hrs !== null && hrs < 24;
                  const ago = hrs === null ? "" : hrs < 1 ? "щойно" : hrs < 24 ? `${hrs} год тому` : `${Math.floor(hrs / 24)} дн тому`;
                  // Колір бейджа за свіжістю: <24г зелений, 1–3д жовтий, 3–7д оранж, >7д червоний
                  const agoStyle = hrs === null ? null
                    : hrs < 24       ? { color: "#00ff88", bg: "rgba(0,255,136,0.14)",  bd: "rgba(0,255,136,0.45)" }
                    : hrs < 24 * 3   ? { color: "#fbbf24", bg: "rgba(251,191,36,0.14)", bd: "rgba(251,191,36,0.45)" }
                    : hrs < 24 * 7   ? { color: "#ff8c00", bg: "rgba(255,140,0,0.14)",  bd: "rgba(255,140,0,0.45)" }
                    :                  { color: "#ff4444", bg: "rgba(255,68,68,0.14)",  bd: "rgba(255,68,68,0.45)" };
                  return (
                    <div key={ch.handle}
                      onClick={() => window.open(`https://www.youtube.com/@${ch.handle}/videos`, "_blank", "noopener")}
                      style={{ background: isNew ? "rgba(255,0,0,0.06)" : "rgba(3,2,0,0.5)", border: `1px solid ${isNew ? "rgba(255,68,68,0.35)" : "rgba(201,168,76,0.12)"}`, borderRadius: 4, padding: "10px 12px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                      <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#ff0000,#cc0000)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }} title={ch.name}>▶</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#e0d8c0", fontFamily: "'Exo 2',sans-serif", display: "flex", alignItems: "center", gap: 7 }}>
                          {ch.name}
                          {isNew && <span style={{ background: "#ff0000", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 8, fontFamily: "'Space Mono',monospace", letterSpacing: 0.5 }}>NEW</span>}
                        </div>
                        {v?.title ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, maxWidth: "100%" }}>
                            <a href={v.link} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", background: "rgba(255,80,0,0.13)", border: "1px solid rgba(255,80,0,0.30)", borderRadius: 3, textDecoration: "none", minWidth: 0, overflow: "hidden" }} title={`Відкрити відео: ${v.title}`}>
                              <span style={{ fontSize: 9, color: "#ff6633", flexShrink: 0 }}>▶</span>
                              <span style={{ fontSize: 11, color: "#c8a070", fontFamily: "'Exo 2',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.title}</span>
                            </a>
                            {ago && agoStyle && (
                              <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: agoStyle.color, background: agoStyle.bg, border: `1px solid ${agoStyle.bd}`, padding: "2px 7px", borderRadius: 10, fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap" }}>
                                {ago}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "#6a5f40", fontFamily: "'Exo 2',sans-serif", marginTop: 3 }}>
                            {d?.error ? "не вдалося завантажити" : ytLoading ? "завантаження…" : "—"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Збереження даних */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>💾 Збереження даних</div>
              <div style={{ fontSize: 11, color: "#8a7850", marginBottom: 14, fontFamily: "'Exo 2',sans-serif", lineHeight: 1.5 }}>
                Локальна копія всього прогресу у файл на диску. Обери файл один раз — далі він оновлюється <b style={{ color: "#00ff88" }}>автоматично</b> при кожній зміні.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="act-btn" onClick={handleBackup} disabled={backupBusy}
                  style={{ background: "rgba(0,255,136,0.1)", border: "1px solid #00ff88", color: "#00ff88", padding: "10px 16px", borderRadius: 4, cursor: backupBusy ? "default" : "pointer", fontSize: 12, fontFamily: "'Space Mono',monospace", fontWeight: 700, opacity: backupBusy ? 0.5 : 1 }}>
                  💾 Зробити копію
                </button>
                <button className="act-btn" onClick={handleRestore} disabled={backupBusy}
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b", color: "#f59e0b", padding: "10px 16px", borderRadius: 4, cursor: backupBusy ? "default" : "pointer", fontSize: 12, fontFamily: "'Space Mono',monospace", fontWeight: 700, opacity: backupBusy ? 0.5 : 1 }}>
                  📂 Відновити
                </button>
                {typeof window !== "undefined" && window.showSaveFilePicker && (
                  <button className="act-btn" onClick={handleRebindBackup} disabled={backupBusy}
                    style={{ background: "rgba(138,120,80,0.08)", border: "1px solid rgba(138,120,80,0.4)", color: "#9a8a60", padding: "10px 16px", borderRadius: 4, cursor: backupBusy ? "default" : "pointer", fontSize: 12, fontFamily: "'Space Mono',monospace", fontWeight: 700, opacity: backupBusy ? 0.5 : 1 }}>
                    📍 Змінити файл
                  </button>
                )}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: backupAt ? "#00ff88" : "#8a7850", fontFamily: "'Space Mono',monospace" }}>
                {backupAt
                  ? `Остання копія: ${new Date(backupAt).toLocaleString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} ✓`
                  : "Копій ще не було — зроби першу 👆"}
              </div>
              {autoBackupOn && (
                <div style={{ marginTop: 6, fontSize: 11, color: "#00ff88", fontFamily: "'Space Mono',monospace" }}>
                  🟢 Авто-оновлення увімкнено
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Big check-in button */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#8a7850", marginBottom: 6, fontFamily: "'Space Mono',monospace" }}>
                {new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              {doneToday ? (
                <div>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#00ff88", fontFamily: "'Exo 2',sans-serif" }}>День зараховано!</div>
                  <div style={{ fontSize: 12, color: "#9a8a60", marginTop: 6 }}>Сьогодні вже була активність — стрік триває 🔥</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 48, marginBottom: 10, opacity: 0.5 }}>🕓</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#c9a84c", fontFamily: "'Exo 2',sans-serif", marginBottom: 6 }}>Сьогодні ще немає активності</div>
                  <div style={{ fontSize: 12, color: "#9a8a60", maxWidth: 360, margin: "0 auto" }}>Зроби будь-яку дію — додай активність, дохід/витрату, задачу чи ціль — і день зарахується у стрік автоматично.</div>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
              {[
                { label: "Стрік", val: `${streak} дн.`, icon: "🔥", color: "#f59e0b", sub: streak >= 7 ? "Топ!" : "Тримай!" },
                { label: "Цього місяця", val: `${monthSessions}/${daysInCurrentMonth}`, icon: "📅", color: "#00ff88", sub: `${daysPassedThisMonth} дн. пройшло` },
                { label: "Активних днів", val: totalActiveDays, icon: "📆", color: "#6366f1", sub: `з ${daysSinceStart} дн.` },
                { label: "Найдовший стрік", val: `${longestStreak} дн.`, icon: "🏅", color: "#ec4899", sub: "особистий рекорд" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(5,3,1,0.76)", border: `1px solid ${s.color}22`, borderRadius: 4, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "#9a8a60", marginTop: 3, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: s.color, marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Monthly progress bar */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>📅 Ціль місяця</div>
                <div style={{ fontSize: 12, color: "#6a5f40" }}>ціль: <span style={{ color: "#c9a84c", fontWeight: 700 }}>{daysInCurrentMonth} сесій</span></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                <span style={{ color: "#6a5f40" }}>{monthSessions} виконано</span>
                <span style={{ color: "#00ff88", fontWeight: 700 }}>{Math.min(100, Math.round(monthSessions / daysInCurrentMonth * 100))}%</span>
              </div>
              <div style={{ height: 10, background: "rgba(201,168,76,0.12)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (monthSessions / daysInCurrentMonth) * 100)}%`, height: "100%", background: monthSessions >= daysInCurrentMonth ? "#c9a84c" : "linear-gradient(90deg,#f43f5e,#f59e0b)", borderRadius: 5, transition: "width 0.5s" }} />
              </div>
            </div>

            {/* Heatmap */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>🗓 Активність (останні 56 днів)</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 4 }}>
                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {week.map(day => {
                      const done = sessionSet.has(day);
                      const isToday = day === todayStr();
                      return (
                        <div key={day} title={day} style={{ width: 14, height: 14, borderRadius: 3, background: done ? "#c9a84c" : "rgba(201,168,76,0.10)", border: isToday ? "1px solid #c9a84c" : "none", transition: "background 0.2s" }} />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: "rgba(201,168,76,0.10)" }} />
                <span style={{ fontSize: 12, color: "#9a8a60" }}>Пропущено</span>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: "#c9a84c" }} />
                <span style={{ fontSize: 12, color: "#9a8a60" }}>Є сесія</span>
              </div>
            </div>
          </div>
        )}

        {/* Skills */}
        {activeTab === "tools" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, color: "#5a5040", fontFamily: "'Space Mono',monospace", marginBottom: 2 }}>
              Натисни — відкриється сайт.&nbsp;
              <span style={{ color: "#9a8a60" }}>Кольорові</span> — ті що вже використовуєш;&nbsp;
              <span style={{ color: "#3a3028" }}>сірі</span> — можна спробувати.
            </div>
            {SKILLS.map(sk => {
              const activeCount = sk.tools.filter(t => t.active).length;
              return (
                <div key={sk.id} style={{ background: "rgba(10,8,4,0.55)", border: `1px solid ${sk.color}30`, borderTop: `2px solid ${sk.color}88`, borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 18 }}>{sk.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#e0d8c0", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'Exo 2',sans-serif" }}>{sk.name}</span>
                    {activeCount > 0 && <span style={{ fontSize: 10, color: sk.color, background: `${sk.color}18`, border: `1px solid ${sk.color}40`, borderRadius: 3, padding: "1px 7px", fontFamily: "'Space Mono',monospace" }}>використовую: {activeCount}</span>}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {sk.tools.map(tool => (
                      <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer"
                        style={{ padding: "6px 13px", borderRadius: 4, fontSize: 12, fontFamily: "'Space Mono',monospace", textDecoration: "none", cursor: "pointer", transition: "all 0.15s",
                          background:   tool.active ? `${sk.color}20` : "rgba(20,16,8,0.6)",
                          border:       tool.active ? `1px solid ${sk.color}70` : "1px dashed rgba(80,65,40,0.35)",
                          color:        tool.active ? sk.color : "#4a3f2a",
                          fontWeight:   tool.active ? 700 : 400,
                        }}>
                        {tool.active && <span style={{ marginRight: 4, fontSize: 9 }}>▶</span>}{tool.name}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Revoke achievement confirmation modal */}
        {revokeConfirm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", zIndex: 9995, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div className="wf-panel" style={{ maxWidth: 380, width: "100%", padding: 24 }}>
              <div style={{ fontSize: 22, marginBottom: 12, textAlign: "center" }}>🔓</div>
              <div className="wf-sec" style={{ textAlign: "center", marginBottom: 8 }}>Скасувати досягнення?</div>
              <div style={{ fontSize: 13, color: "#e0d8c0", textAlign: "center", marginBottom: 6, fontFamily: "'Exo 2',sans-serif", fontWeight: 700 }}>«{revokeConfirm.name}»</div>
              <div style={{ fontSize: 12, color: "#f43f5e", textAlign: "center", marginBottom: 20, fontFamily: "'Space Mono',monospace" }}>−{revokeConfirm.xp} XP</div>
              <div style={{ fontSize: 11, color: "#6a5a40", textAlign: "center", marginBottom: 20 }}>Досягнення буде знято, XP відніметься. Його можна отримати знову, якщо умова буде виконана повторно.</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => {
                  setUnlockedAchievements(prev => prev.filter(id => id !== revokeConfirm.id));
                  loseXP(revokeConfirm.xp, "achievement", "↩ досягнення");
                  setRevokeConfirm(null);
                }} style={{ flex: 1, background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.5)", color: "#f43f5e", padding: "10px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>Так, скасувати</button>
                <button onClick={() => setRevokeConfirm(null)} style={{ flex: 1, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", padding: "10px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Залишити</button>
              </div>
            </div>
          </div>
        )}

        {/* Skills Tasks */}
        {activeTab === "skillstasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SKILL_TASKS.map(cat => {
              const isOpen = selectedSkillTask === cat.id;
              const hasContent = cat.progressive.length > 0 || cat.oneTime.length > 0;
              const totalTasks = cat.oneTime.length + cat.progressive.reduce((s, t) => s + t.milestones.length, 0);
              const doneTasks = cat.oneTime.filter(t => skillTasksData[`${cat.id}_${t.id}`] === true).length
                + cat.progressive.reduce((s, t) => s + t.milestones.filter((_, i) => (skillTasksData[`${cat.id}_${t.id}`]?.claimed ?? []).includes(i)).length, 0);
              return (
                <div key={cat.id} className="skill-card wf-card" style={{ border: `1px solid ${isOpen ? cat.color + "80" : doneTasks > 0 ? cat.color + "44" : "rgba(201,168,76,0.18)"}`, borderTop: `2px solid ${isOpen ? cat.color : doneTasks > 0 ? cat.color + "88" : "rgba(201,168,76,0.35)"}`, overflow: "hidden", opacity: hasContent ? 1 : 0.45 }}>
                  <div onClick={() => hasContent && setSelectedSkillTask(isOpen ? null : cat.id)} style={{ padding: "14px 16px", cursor: hasContent ? "pointer" : "default", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#e0d8c0", textTransform: "uppercase", letterSpacing: 2, fontFamily: "'Exo 2',sans-serif" }}>{cat.name}</div>
                      <div style={{ fontSize: 13, color: hasContent ? cat.color : "#6a5f40", marginTop: 4, letterSpacing: 1, fontWeight: 600 }}>
                        {hasContent ? `${doneTasks}/${totalTasks} завдань виконано` : "Скоро буде додано"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {hasContent && totalTasks > 0 && (
                        <div style={{ width: 80, height: 5, background: "rgba(201,168,76,0.18)", borderRadius: 3 }}>
                          <div style={{ width: `${(doneTasks / totalTasks) * 100}%`, height: "100%", background: cat.color, borderRadius: 3 }} />
                        </div>
                      )}
                      {hasContent && <span style={{ color: "#9a8a60", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>}
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
                      {cat.progressive.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#9a8a60", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Exo 2',sans-serif", marginBottom: 12 }}>Прогресивні</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {cat.progressive.map(task => {
                              const key = `${cat.id}_${task.id}`;
                              const taskState = skillTasksData[key] || { count: 0, claimed: [] };
                              const inputKey = `${cat.id}_${task.id}`;
                              const inputVal = skillTaskInputs[inputKey] ?? "";
                              const handleAdd = (sign) => {
                                const n = parseInt(inputVal) || 1;
                                addProgressiveCount(cat.id, task.id, sign * n);
                                setSkillTaskInputs(prev => ({ ...prev, [inputKey]: "" }));
                              };
                              return (
                                <div key={task.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  <div style={{ fontSize: 13, color: "#c8b89a", fontFamily: "'Space Mono',monospace" }}>{task.label}</div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                    <button onClick={() => addProgressiveCount(cat.id, task.id, 1)} style={{ padding: "4px 12px", borderRadius: 4, fontSize: 16, fontWeight: 800, cursor: "pointer", background: `${cat.color}18`, border: `1px solid ${cat.color}66`, color: cat.color, lineHeight: 1 }}>+</button>
                                    <button onClick={() => addProgressiveCount(cat.id, task.id, -1)} style={{ padding: "4px 12px", borderRadius: 4, fontSize: 16, fontWeight: 800, cursor: "pointer", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.4)", color: "#f43f5e", lineHeight: 1 }}>−</button>
                                    <input
                                      type="number"
                                      placeholder="N"
                                      value={inputVal}
                                      onChange={e => setSkillTaskInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                                      onKeyDown={e => e.key === "Enter" && handleAdd(1)}
                                      style={{ width: 52, background: "rgba(0,0,0,0.4)", border: `1px solid ${cat.color}33`, color: "#c8b89a", padding: "4px 6px", borderRadius: 4, fontFamily: "'Space Mono',monospace", fontSize: 12, textAlign: "center" }}
                                    />
                                    <button onClick={() => handleAdd(1)} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer", background: `${cat.color}18`, border: `1px solid ${cat.color}44`, color: `${cat.color}cc` }}>+N</button>
                                    <button onClick={() => handleAdd(-1)} style={{ padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e" }}>−N</button>
                                    <span style={{ fontSize: 12, color: cat.color, fontFamily: "'Space Mono',monospace", fontWeight: 700, marginLeft: 2 }}>Всього: {taskState.count}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {task.milestones.map((m, idx) => {
                                      const claimed = taskState.claimed.includes(idx);
                                      const reached = taskState.count >= m.count;
                                      const canClaim = reached && !claimed;
                                      return (
                                        <button key={idx} onClick={() => claimed ? revokeProgressiveMilestone(cat.id, task.id, idx, m.xp) : canClaim ? claimProgressiveMilestone(cat.id, task.id, idx, m.xp) : null} style={{ padding: "4px 10px", borderRadius: 3, fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono',monospace", cursor: claimed || canClaim ? "pointer" : "default", background: claimed ? `${cat.color}22` : canClaim ? `${cat.color}18` : "rgba(0,0,0,0.3)", border: `1px solid ${claimed ? cat.color : canClaim ? cat.color + "88" : "rgba(201,168,76,0.2)"}`, color: claimed ? cat.color : canClaim ? cat.color + "cc" : "#6a5f40", textDecoration: claimed ? "line-through" : "none", opacity: claimed ? 0.7 : 1 }}>
                                          {claimed ? "✓ " : canClaim ? "▶ " : ""}×{m.count}<span style={{ color: "rgba(201,168,76,0.35)", margin: "0 4px" }}>/</span><span style={{ color: claimed ? cat.color + "99" : canClaim ? "#00ff88" : "#6a5f40" }}>+{m.xp} XP</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {cat.id === "code" && task.id === "lines_written" && (
                                    <div style={{ marginTop: 6, border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, background: "rgba(99,102,241,0.05)", overflow: "hidden" }}>
                                      <div onClick={() => setGhPanelOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", cursor: "pointer" }}>
                                        <span style={{ fontSize: 14 }}>🔄</span>
                                        <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#8b8fef", fontFamily: "'Exo 2',sans-serif", letterSpacing: 0.5 }}>Синхронізувати з GitHub</span>
                                        {githubSync.lastSync && (
                                          <span style={{ fontSize: 10, color: "#5a5f8a", fontFamily: "'Space Mono',monospace" }}>
                                            {githubSync.totalLines.toLocaleString()} рядків · {new Date(githubSync.lastSync).toLocaleDateString("uk-UA")}
                                          </span>
                                        )}
                                        <span style={{ color: "#6366f1", fontSize: 12 }}>{ghPanelOpen ? "▲" : "▼"}</span>
                                      </div>
                                      {ghPanelOpen && (
                                        <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                                          <div style={{ fontSize: 10, color: "#6a6a8a", lineHeight: 1.5, fontFamily: "'Space Mono',monospace" }}>
                                            Рахує фактичну кількість рядків у файлах усіх твоїх репозиторіїв (так само, як показує GitHub). Без токена видно лише публічні репо та діє ліміт ~60 запитів/год — для приватних репо й зняття ліміту додай Personal Access Token.
                                          </div>
                                          <input
                                            value={githubSync.user}
                                            onChange={e => setGithubSync(p => ({ ...p, user: e.target.value }))}
                                            placeholder="GitHub username (напр. v1frim)"
                                            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(99,102,241,0.3)", color: "#c8c8f0", padding: "7px 10px", borderRadius: 4, fontSize: 12, fontFamily: "'Space Mono',monospace" }}
                                          />
                                          <input
                                            type="password"
                                            value={githubSync.token}
                                            onChange={e => setGithubSync(p => ({ ...p, token: e.target.value }))}
                                            placeholder="Personal Access Token (необов'язково)"
                                            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(99,102,241,0.3)", color: "#c8c8f0", padding: "7px 10px", borderRadius: 4, fontSize: 12, fontFamily: "'Space Mono',monospace" }}
                                          />
                                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                            <button onClick={syncGithubLines} disabled={ghSyncing}
                                              style={{ padding: "7px 16px", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: ghSyncing ? "default" : "pointer", background: ghSyncing ? "rgba(99,102,241,0.2)" : "#6366f1", border: "none", color: "#fff", opacity: ghSyncing ? 0.6 : 1 }}>
                                              {ghSyncing ? "Синхронізую…" : "Синхронізувати"}
                                            </button>
                                            {ghSyncMsg && <span style={{ fontSize: 11, color: ghSyncMsg.startsWith("⚠") ? "#f43f5e" : ghSyncMsg.startsWith("✓") ? "#00ff88" : "#8b8fef", fontFamily: "'Space Mono',monospace" }}>{ghSyncMsg}</span>}
                                          </div>
                                          {githubSync.repos?.length > 0 && (
                                            <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 3, maxHeight: 160, overflowY: "auto" }}>
                                              {githubSync.repos.map(r => (
                                                <div key={r.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#9a9ac0", padding: "3px 8px", background: "rgba(0,0,0,0.25)", borderRadius: 3 }}>
                                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                                                  <span style={{ color: "#8b8fef", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{r.lines.toLocaleString()}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {cat.oneTime.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#9a8a60", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Exo 2',sans-serif", marginBottom: 12 }}>Разові</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {cat.oneTime.map(task => {
                              const key = `${cat.id}_${task.id}`;
                              const done = skillTasksData[key] === true;
                              return (
                                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <button onClick={() => done ? revokeOneTimeTask(cat.id, task.id, task.xp) : claimOneTimeTask(cat.id, task.id, task.xp)} style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 4, border: `1px solid ${done ? cat.color : "rgba(201,168,76,0.3)"}`, background: done ? `${cat.color}22` : "transparent", color: done ? cat.color : "#6a5f40", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {done ? "✓" : ""}
                                  </button>
                                  <span style={{ flex: 1, fontSize: 13, color: done ? "#9a8a60" : "#c8b89a", fontFamily: "'Space Mono',monospace", textDecoration: done ? "line-through" : "none" }}>{task.label}</span>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: done ? "#6a5f40" : "#00ff88", fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap" }}>+{task.xp} XP</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Achievements */}
        {activeTab === "achievements" && (() => {
          const lt = learnTime;
          const learnHours = ((lt.education ?? 0) + (lt.business ?? 0)) * 0.5;
          const codeLines = skillTasksData["code_lines_written"]?.count ?? 0;
          const achArgs = [totalTools, totalIncome, projects.length, skillData, streak, sessions.dates.length, learnHours, codeLines];
          return (
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            {ACH_GROUPS.map(g => {
              const items = ACHIEVEMENTS.filter(a => a.group === g.id);
              if (!items.length) return null;
              const doneCount = items.filter(a => unlockedAchievements.includes(a.id)).length;
              return (
                <div key={g.id}>
                  <div className="wf-sec" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span>{g.label}</span>
                    <span style={{ color: doneCount === items.length ? "#c9a84c" : "#9a8a60", fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}>{doneCount}/{items.length}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13 }}>
                    {items.map(a => {
                      const done = unlockedAchievements.includes(a.id);
                      const tier = TIERS[a.tier];
                      const isLeg = a.tier === "legendary" && done;
                      return (
                        <div key={a.id} className={isLeg ? "legendary-card" : done ? "wf-card" : ""}
                          style={{ position: "relative", overflow: "hidden",
                            background: isLeg
                              ? "linear-gradient(160deg,rgba(80,40,0,0.55),rgba(8,5,0,0.96),rgba(60,30,0,0.40))"
                              : done ? `linear-gradient(160deg, ${tier.color}30, rgba(10,7,2,0.92))` : "rgba(14,10,4,0.88)",
                            border: `1px solid ${done ? tier.color + "70" : "rgba(201,168,76,0.22)"}`,
                            borderTop: `2px solid ${done ? tier.color : "rgba(201,168,76,0.30)"}`,
                            borderRadius: 4, padding: 16,
                            boxShadow: !isLeg && done ? `0 0 24px ${tier.glow}, inset 0 0 40px ${tier.color}08` : "none" }}>
                          {isLeg && (
                            <>
                              {[0,1,2,3].map(i => (
                                <div key={i} style={{ position:"absolute", width:3, height:3, borderRadius:"50%", background:"#ffb700",
                                  top: i<2 ? 6 : "auto", bottom: i>=2 ? 6 : "auto",
                                  left: i===0||i===2 ? 8 : "auto", right: i===1||i===3 ? 8 : "auto",
                                  animation:`legendaryStar ${1.8+i*0.4}s ease-in-out ${i*0.5}s infinite`,
                                  boxShadow:"0 0 6px #ffb700" }} />
                              ))}
                              <div style={{ position:"absolute", inset:0, background:"linear-gradient(105deg,transparent 40%,rgba(255,220,100,0.07) 50%,transparent 60%)", backgroundSize:"200% 100%", animation:"legendaryShimmer 2.5s linear infinite", pointerEvents:"none" }} />
                            </>
                          )}
                          {done && (
                            <button onClick={() => setRevokeConfirm({ id: a.id, name: a.name, xp: a.xp })} title="Скасувати досягнення" style={{ position: "absolute", top: 8, right: 8, background: "rgba(244,63,94,0.0)", border: "none", color: "rgba(244,63,94,0.25)", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "2px 4px", borderRadius: 3, transition: "all 0.15s", zIndex: 2 }} onMouseEnter={e => { e.currentTarget.style.background="rgba(244,63,94,0.15)"; e.currentTarget.style.color="#f43f5e"; }} onMouseLeave={e => { e.currentTarget.style.background="rgba(244,63,94,0)"; e.currentTarget.style.color="rgba(244,63,94,0.25)"; }}>🔓</button>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div style={{ fontSize: done ? (isLeg ? 40 : 36) : 28, filter: done ? `drop-shadow(0 0 ${isLeg ? 14 : 8}px ${tier.color}bb)` : "grayscale(1) brightness(0.45)", transition: "font-size 0.2s" }}>{a.icon}</div>
                            <span className={isLeg ? "legendary-badge" : ""} style={{ fontSize: 9, fontWeight: 800, color: done ? tier.color : "#6a5a38", border: `1px solid ${done ? tier.color + "66" : "rgba(201,168,76,0.22)"}`, borderRadius: 2, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'Exo 2',sans-serif", whiteSpace: "nowrap" }}>{tier.label}</span>
                          </div>
                          <div className={isLeg ? "legendary-title" : ""} style={{ fontSize: 14, fontWeight: 800, color: isLeg ? undefined : done ? tier.color : "#9a8a60", marginBottom: 6, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{a.name}</div>
                          <div style={{ fontSize: 12, color: done ? "#b0a080" : "#7a6a48", marginBottom: 10, lineHeight: 1.5 }}>{a.desc}</div>
                          <div style={{ fontSize: 12, color: done ? tier.color : "#6a5a38", fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}>+{a.xp} XP {done ? "✓" : "🔒"}</div>
                          {done && achievementDates[a.id] && (
                            <div style={{ fontSize: 10, color: "#5a4a30", fontFamily: "'Space Mono',monospace", marginTop: 5 }}>
                              📅 {achievementDates[a.id]}
                            </div>
                          )}
                          {!done && a.progress && (() => {
                            const { cur, max } = a.progress(...achArgs);
                            const pct = Math.min(1, cur / max);
                            const pctLabel = pct >= 0.01 ? `${Math.floor(pct * 100)}%` : "0%";
                            return (
                              <div style={{ marginTop: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 10, fontFamily: "'Space Mono',monospace" }}>
                                  <span style={{ color: "#6a5a38" }}>{cur > 0 ? (Number.isInteger(cur) ? cur : cur.toFixed(1)) : 0} / {max}</span>
                                  <span style={{ color: pct > 0.5 ? tier.color : "#6a5a38", fontWeight: 700 }}>{pctLabel}</span>
                                </div>
                                <div style={{ height: 4, background: "rgba(201,168,76,0.12)", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct * 100}%`, background: pct >= 1 ? tier.color : `linear-gradient(90deg, ${tier.color}88, ${tier.color})`, borderRadius: 2, transition: "width 0.4s" }} />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}

        {/* Combined Goals & Plan tab */}
        {activeTab === "goalsplan" && (() => {
          const GP_STREAMS = [
            { id: "dev",     label: "📚 Розвиток", color: "#6366f1", bg: "rgba(99,102,241,0.14)" },
            { id: "content", label: "🎬 Контент",  color: "#ec4899", bg: "rgba(236,72,153,0.14)" },
            { id: "work",    label: "🚀 Проекти",  color: "#f59e0b", bg: "rgba(245,158,11,0.14)" },
          ];
          const streamMap = Object.fromEntries(GP_STREAMS.map(s => [s.id, s]));

          const toggleExp = (key) => setExpandGP(prev => ({ ...prev, [key]: !prev[key] }));
          const isExp = (key) => !!expandGP[key];

          const sf = gpStreamFilter;
          const allActiveGoals = longGoals.filter(g => !g.done && !g.deletedAt);
          const allActivePlans = plan.filter(p => !p.done && !p.deletedAt);
          const allActiveTasks = goals.filter(g => !g.done && !g.deletedAt);
          const activeGoals = sf ? allActiveGoals.filter(g => g.stream === sf) : allActiveGoals;
          const activePlans = sf ? allActivePlans.filter(p => p.stream === sf || allActiveGoals.some(g => g.id === p.goalId && g.stream === sf)) : allActivePlans;
          const activeTasks = sf ? allActiveTasks.filter(t => t.stream === sf || allActivePlans.some(p => p.id === t.planId && p.stream === sf)) : allActiveTasks;
          const standalonePlans = activePlans.filter(p => !p.goalId);
          const standaloneTasks = activeTasks.filter(t => !t.planId);

          const softDelete = (type, id) => {
            const deletedAt = new Date().toISOString();
            const trim10 = (arr) => {
              const del = arr.filter(x => x.deletedAt);
              if (del.length <= 10) return arr;
              const oldest = del.sort((a, b) => a.deletedAt.localeCompare(b.deletedAt)).slice(0, del.length - 10).map(x => x.id);
              return arr.filter(x => !oldest.includes(x.id));
            };
            if (type === "goal") setLongGoals(prev => trim10(prev.map(x => x.id === id ? { ...x, deletedAt } : x)));
            if (type === "plan") setPlan(prev => trim10(prev.map(x => x.id === id ? { ...x, deletedAt } : x)));
            if (type === "task") setGoals(prev => trim10(prev.map(x => x.id === id ? { ...x, deletedAt } : x)));
            setExpandGP(prev => { const n = { ...prev }; delete n[`${type}_${id}`]; return n; });
          };

          const restoreItem = (type, id) => {
            if (type === "goal") setLongGoals(prev => prev.map(x => x.id === id ? { ...x, deletedAt: null } : x));
            if (type === "plan") setPlan(prev => prev.map(x => x.id === id ? { ...x, deletedAt: null } : x));
            if (type === "task") setGoals(prev => prev.map(x => x.id === id ? { ...x, deletedAt: null } : x));
          };

          const permanentDelete = (type, id) => {
            if (type === "goal") setLongGoals(prev => prev.filter(x => x.id !== id));
            if (type === "plan") setPlan(prev => prev.filter(x => x.id !== id));
            if (type === "task") setGoals(prev => prev.filter(x => x.id !== id));
          };

          const doCompleteGoal = (g) => setLongGoals(prev => prev.map(x => {
            if (x.id !== g.id) return x;
            if (!x.done) {
              if (!x.xpAwarded) { gainXP(x.customXP ?? 200, "(ціль досягнута)", "goal"); return { ...x, done: true, xpAwarded: true, completedAt: new Date().toISOString() }; }
              return { ...x, done: true, completedAt: new Date().toISOString() };
            }
            if (x.xpAwarded) loseXP(x.customXP ?? 200, "goal", "↩ ціль скасовано");
            return { ...x, done: false, xpAwarded: false, completedAt: null };
          }));

          const doCompletePlan = (p) => setPlan(prev => prev.map(x => {
            if (x.id !== p.id) return x;
            if (!x.done) {
              if (!x.xpAwarded) { gainXP(x.xp ?? 75, "(план дій)", "plan"); return { ...x, done: true, xpAwarded: true, completedAt: new Date().toISOString() }; }
              return { ...x, done: true, completedAt: new Date().toISOString() };
            }
            if (x.xpAwarded) loseXP(x.xp ?? 75, "plan", "↩ план скасовано");
            return { ...x, done: false, xpAwarded: false, completedAt: null };
          }));

          const doCompleteTask = (t) => setGoals(prev => prev.map(x => {
            if (x.id !== t.id) return x;
            if (!x.done) {
              if (!x.xpAwarded) { gainXP(x.xp ?? 100, "(задачу виконано)", "goal"); return { ...x, done: true, xpAwarded: true, completedAt: new Date().toISOString() }; }
              return { ...x, done: true, completedAt: new Date().toISOString() };
            }
            if (x.xpAwarded) loseXP(x.xp ?? 100, "goal", "↩ задачу скасовано");
            return { ...x, done: false, xpAwarded: false, completedAt: null };
          }));

          const doAddItem = () => {
            if (!gpAddText.trim()) return;
            const streamProp = gpStreamFilter ? { stream: gpStreamFilter } : {};
            if (gpAddType === "goal") {
              setLongGoals(prev => [...prev, { id: `lg${Date.now()}`, text: gpAddText.trim(), period: "month_cur", customXP: gpAddXP, done: false, createdAt: new Date().toISOString(), ...streamProp }]);
            } else if (gpAddType === "plan") {
              setPlan(prev => [...prev, { id: `p${Date.now()}`, text: gpAddText.trim(), type: "other", urgency: "now", xp: gpAddXP, done: false, createdAt: new Date().toISOString(), ...streamProp }]);
            } else {
              setGoals(prev => [...prev, { id: `g${Date.now()}`, text: gpAddText.trim(), priority: "important", xp: gpAddXP, done: false, createdAt: new Date().toISOString(), ...streamProp }]);
            }
            setGpAddText("");
          };

          const doAddInlineItem = () => {
            if (!gpInlineText.trim() || !gpInlineAdd) return;
            const { parentId, type, parentStream } = gpInlineAdd;
            const streamProp = parentStream ? { stream: parentStream } : {};
            if (type === "plan") {
              setPlan(prev => [...prev, { id: `p${Date.now()}`, text: gpInlineText.trim(), type: "other", urgency: "now", xp: gpInlineXP, done: false, goalId: parentId, createdAt: new Date().toISOString(), ...streamProp }]);
            } else if (type === "task") {
              setGoals(prev => [...prev, { id: `g${Date.now()}`, text: gpInlineText.trim(), priority: "important", xp: gpInlineXP, done: false, planId: parentId, createdAt: new Date().toISOString(), ...streamProp }]);
            }
            setGpInlineText("");
            setGpInlineAdd(null);
          };

          const fmtDate = (iso) => {
            if (!iso) return "";
            const d = new Date(iso);
            return `${d.getDate()}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
          };

          const StreamTag = ({ stream, onClick }) => {
            const s = streamMap[stream];
            if (!s) return null;
            return (
              <span onClick={e => { e.stopPropagation(); if (onClick) onClick(); }}
                style={{ fontSize: 9, color: s.color, background: s.bg, border: `1px solid ${s.color}55`, padding: "1px 6px", borderRadius: 8, flexShrink: 0, whiteSpace: "nowrap", cursor: onClick ? "pointer" : "default", fontWeight: 700, letterSpacing: 0.5 }}>
                {s.label}
              </span>
            );
          };

          const cycleStream = (item, setter) => {
            const ids = [null, ...GP_STREAMS.map(s => s.id)];
            const cur = item.stream ?? null;
            const next = ids[(ids.indexOf(cur) + 1) % ids.length];
            setter(prev => prev.map(x => x.id === item.id ? { ...x, stream: next } : x));
          };

          const renderTaskRow = (t) => (
            <div key={t.id} {...rowDropProps("task", t.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(5,14,10,0.95)", border: "1px solid rgba(0,255,136,0.35)", borderLeft: "3px solid #00ff88", borderRadius: 4, padding: "9px 12px", userSelect: "none", opacity: dragItem?.id === t.id ? 0.4 : 1 }}>
              <span {...dragHandlers(t.id, "task", "list")} onClick={e => e.stopPropagation()} style={{ color: "#2a4a2a", fontSize: 13, cursor: "grab", flexShrink: 0, lineHeight: 1, padding: "0 2px" }} title="Перетягнути">⠿</span>
              <button onClick={() => doCompleteTask(t)}
                style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(0,255,136,0.7)", background: "transparent", cursor: "pointer", flexShrink: 0 }} />
              <span style={{ flex: 1, color: "#d8f8e8", fontSize: 12 }}>{t.text}</span>
              {t.stream ? <StreamTag stream={t.stream} onClick={() => cycleStream(t, setGoals)} /> : (
                <button onClick={e => { e.stopPropagation(); cycleStream(t, setGoals); }}
                  style={{ background: "none", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 8, color: "#3a4030", fontSize: 9, padding: "1px 6px", cursor: "pointer", flexShrink: 0 }}>＋напрям</button>
              )}
              <span style={{ fontSize: 10, fontWeight: 700, color: "#00ff88", background: "rgba(0,255,136,0.18)", border: "1px solid rgba(0,255,136,0.60)", padding: "2px 7px", borderRadius: 4, flexShrink: 0, whiteSpace: "nowrap", boxShadow: "0 0 6px rgba(0,255,136,0.18)" }}>+{t.xp ?? 50} XP</span>
              <button onClick={() => setGoals(prev => prev.map(x => x.id === t.id ? { ...x, pinned: !x.pinned } : x))}
                style={{ background: "none", border: "none", color: "#c9a84c", opacity: t.pinned ? 1 : 0.18, filter: t.pinned ? "drop-shadow(0 0 4px rgba(201,168,76,0.7))" : "none", cursor: "pointer", fontSize: 11, padding: "0 2px", transition: "opacity 0.2s, filter 0.2s" }} title={t.pinned ? "Прибрати з Головної" : "Закріпити"}>📌</button>
              <button onClick={() => softDelete("task", t.id)}
                style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 15, padding: "0 2px", lineHeight: 1 }}>×</button>
            </div>
          );

          const renderPlanRow = (p) => {
            const exp = isExp(`plan_${p.id}`);
            const planTasks = activeTasks.filter(t => t.planId === p.id);
            const isInlining = gpInlineAdd?.parentId === p.id && gpInlineAdd?.type === "task";
            return (
              <div key={p.id}>
                <div onClick={() => toggleExp(`plan_${p.id}`)} {...rowDropProps("plan", p.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(4,18,24,0.95)", border: "1px solid rgba(6,182,212,0.35)", borderLeft: "3px solid #06b6d4", borderRadius: 4, padding: "10px 12px", userSelect: "none", opacity: dragItem?.id === p.id ? 0.4 : 1 }}>
                  <span {...dragHandlers(p.id, "plan", "list")} onClick={e => e.stopPropagation()} style={{ color: "#1a4a5a", fontSize: 13, cursor: "grab", flexShrink: 0, lineHeight: 1, padding: "0 2px" }} title="Перетягнути">⠿</span>
                  <span style={{ color: "#06b6d4", fontSize: 10, flexShrink: 0, width: 14, opacity: planTasks.length ? 1 : 0.3 }}>
                    {exp ? "▼" : "▶"}
                  </span>
                  <button onClick={e => { e.stopPropagation(); doCompletePlan(p); }}
                    style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(6,182,212,0.7)", background: "transparent", cursor: "pointer", flexShrink: 0 }} />
                  <span style={{ flex: 1, color: "#d0f0fa", fontSize: 12, fontWeight: 500 }}>{p.text}</span>
                  {planTasks.length > 0 && <span style={{ fontSize: 10, color: "#3a7a90" }}>{planTasks.length} задач</span>}
                  {p.stream ? <StreamTag stream={p.stream} onClick={() => cycleStream(p, setPlan)} /> : (
                    <button onClick={e => { e.stopPropagation(); cycleStream(p, setPlan); }}
                      style={{ background: "none", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 8, color: "#3a4050", fontSize: 9, padding: "1px 6px", cursor: "pointer", flexShrink: 0 }}>＋напрям</button>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#22d3ee", background: "rgba(6,182,212,0.18)", border: "1px solid rgba(6,182,212,0.60)", padding: "2px 7px", borderRadius: 4, flexShrink: 0, whiteSpace: "nowrap", boxShadow: "0 0 6px rgba(6,182,212,0.18)" }}>+{p.xp ?? 150} XP</span>
                  <button onClick={e => { e.stopPropagation(); setPlan(prev => prev.map(x => x.id === p.id ? { ...x, pinned: !x.pinned } : x)); }}
                    style={{ background: "none", border: "none", color: "#c9a84c", opacity: p.pinned ? 1 : 0.18, filter: p.pinned ? "drop-shadow(0 0 4px rgba(201,168,76,0.7))" : "none", cursor: "pointer", fontSize: 11, padding: "0 2px", transition: "opacity 0.2s, filter 0.2s" }} title={p.pinned ? "Прибрати з Головної" : "Закріпити"}>📌</button>
                  <button onClick={e => { e.stopPropagation(); softDelete("plan", p.id); }}
                    style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 15, padding: "0 2px", lineHeight: 1 }}>×</button>
                </div>
                {exp && (
                  <div style={{ marginLeft: 22, marginTop: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                    {planTasks.map(t => renderTaskRow(t))}
                    {isInlining ? (
                      <div style={{ display: "flex", gap: 6, padding: "7px 10px", background: "rgba(5,14,10,0.9)", border: "1px dashed rgba(0,255,136,0.5)", borderRadius: 4, alignItems: "center" }}>
                        <input autoFocus value={gpInlineText} onChange={e => setGpInlineText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") doAddInlineItem(); if (e.key === "Escape") { setGpInlineAdd(null); setGpInlineText(""); } }}
                          placeholder="Назва задачі..."
                          style={{ flex: 1, background: "transparent", border: "none", color: "#d8f8e8", fontSize: 12, fontFamily: "'Space Mono',monospace", outline: "none" }} />
                        <span style={{ fontSize: 10, color: "#3a7a5a" }}>XP</span>
                        <input type="number" value={gpInlineXP} onChange={e => setGpInlineXP(Math.max(0, parseInt(e.target.value) || 0))}
                          style={{ width: 40, background: "transparent", border: "none", color: "#00ff88", fontSize: 11, textAlign: "center", outline: "none" }} />
                        <button onClick={doAddInlineItem} style={{ background: "rgba(0,255,136,0.2)", border: "1px solid rgba(0,255,136,0.5)", color: "#00ff88", borderRadius: 3, padding: "2px 9px", fontSize: 11, cursor: "pointer" }}>+</button>
                        <button onClick={() => { setGpInlineAdd(null); setGpInlineText(""); }} style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
                      </div>
                    ) : (
                      <button onClick={() => { setGpInlineAdd({ parentId: p.id, type: "task", parentStream: p.stream }); setGpInlineText(""); setGpInlineXP(50); }}
                        style={{ alignSelf: "flex-start", background: "rgba(0,255,136,0.08)", border: "1px dashed rgba(0,255,136,0.45)", borderRadius: 3, padding: "4px 12px", color: "#00ff88", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        + задача
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          };

          const renderGoalRow = (g) => {
            const exp = isExp(`goal_${g.id}`);
            const goalPlans = allActivePlans.filter(p => p.goalId === g.id);
            const donePlanCount = plan.filter(p => p.goalId === g.id && p.done && !p.deletedAt).length;
            const totalPlanCount = goalPlans.length + donePlanCount;
            const isInlining = gpInlineAdd?.parentId === g.id && gpInlineAdd?.type === "plan";
            const progressPct = totalPlanCount > 0 ? Math.round((donePlanCount / totalPlanCount) * 100) : 0;
            return (
              <div key={g.id}>
                <div onClick={() => toggleExp(`goal_${g.id}`)} {...rowDropProps("goal", g.id)}
                  style={{ display: "flex", flexDirection: "column", background: "rgba(20,10,30,0.95)", border: "1px solid rgba(168,85,247,0.35)", borderLeft: "3px solid #a855f7", borderRadius: 4, padding: "10px 12px", userSelect: "none", opacity: dragItem?.id === g.id ? 0.4 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span {...dragHandlers(g.id, "goal", "list")} onClick={e => e.stopPropagation()} style={{ color: "#3a1a5a", fontSize: 13, cursor: "grab", flexShrink: 0, lineHeight: 1, padding: "0 2px" }} title="Перетягнути">⠿</span>
                    <span style={{ color: "#c084fc", fontSize: 10, flexShrink: 0, width: 14, opacity: goalPlans.length ? 1 : 0.3 }}>
                      {exp ? "▼" : "▶"}
                    </span>
                    <button onClick={e => { e.stopPropagation(); doCompleteGoal(g); }}
                      style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(168,85,247,0.7)", background: "transparent", cursor: "pointer", flexShrink: 0 }} />
                    <span style={{ flex: 1, color: "#f0e8fa", fontSize: 13, fontWeight: 600 }}>{g.text}</span>
                    {g.stream ? <StreamTag stream={g.stream} onClick={() => cycleStream(g, setLongGoals)} /> : (
                      <button onClick={e => { e.stopPropagation(); cycleStream(g, setLongGoals); }}
                        style={{ background: "none", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 8, color: "#3a3040", fontSize: 9, padding: "1px 6px", cursor: "pointer", flexShrink: 0 }}>＋напрям</button>
                    )}
                    {totalPlanCount > 0 && <span style={{ fontSize: 10, color: "#7a6a90", flexShrink: 0 }}>{donePlanCount}/{totalPlanCount}</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#c084fc", background: "rgba(168,85,247,0.20)", border: "1px solid rgba(168,85,247,0.65)", padding: "2px 7px", borderRadius: 4, flexShrink: 0, whiteSpace: "nowrap", boxShadow: "0 0 6px rgba(168,85,247,0.20)" }}>+{g.customXP ?? 500} XP</span>
                    <button onClick={e => { e.stopPropagation(); setLongGoals(prev => prev.map(x => x.id === g.id ? { ...x, pinned: !x.pinned } : x)); }}
                      style={{ background: "none", border: "none", color: "#c9a84c", opacity: g.pinned ? 1 : 0.18, filter: g.pinned ? "drop-shadow(0 0 4px rgba(201,168,76,0.7))" : "none", cursor: "pointer", fontSize: 12, padding: "0 2px", transition: "opacity 0.2s, filter 0.2s" }} title={g.pinned ? "Прибрати з Головної" : "Закріпити"}>📌</button>
                    <button onClick={e => { e.stopPropagation(); softDelete("goal", g.id); }}
                      style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1 }}>×</button>
                  </div>
                  {totalPlanCount > 0 && (
                    <div style={{ marginTop: 7, marginLeft: 22, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 3, background: "rgba(168,85,247,0.15)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${progressPct}%`, height: "100%", background: progressPct === 100 ? "#a855f7" : "linear-gradient(90deg, #a855f7, #c084fc)", borderRadius: 2, transition: "width 0.3s" }} />
                      </div>
                      <span style={{ fontSize: 9, color: progressPct === 100 ? "#a855f7" : "#5a4a70", flexShrink: 0 }}>{progressPct}%</span>
                    </div>
                  )}
                </div>
                {exp && (
                  <div style={{ marginLeft: 22, marginTop: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                    {goalPlans.map(p => renderPlanRow(p))}
                    {isInlining ? (
                      <div style={{ display: "flex", gap: 6, padding: "7px 10px", background: "rgba(4,18,24,0.9)", border: "1px dashed rgba(6,182,212,0.5)", borderRadius: 4, alignItems: "center" }}>
                        <input autoFocus value={gpInlineText} onChange={e => setGpInlineText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") doAddInlineItem(); if (e.key === "Escape") { setGpInlineAdd(null); setGpInlineText(""); } }}
                          placeholder="Назва плану дій..."
                          style={{ flex: 1, background: "transparent", border: "none", color: "#d0f0fa", fontSize: 12, fontFamily: "'Space Mono',monospace", outline: "none" }} />
                        <span style={{ fontSize: 10, color: "#3a6a80" }}>XP</span>
                        <input type="number" value={gpInlineXP} onChange={e => setGpInlineXP(Math.max(0, parseInt(e.target.value) || 0))}
                          style={{ width: 40, background: "transparent", border: "none", color: "#22d3ee", fontSize: 11, textAlign: "center", outline: "none" }} />
                        <button onClick={doAddInlineItem} style={{ background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.5)", color: "#22d3ee", borderRadius: 3, padding: "2px 9px", fontSize: 11, cursor: "pointer" }}>+</button>
                        <button onClick={() => { setGpInlineAdd(null); setGpInlineText(""); }} style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
                      </div>
                    ) : (
                      <button onClick={() => { setGpInlineAdd({ parentId: g.id, type: "plan", parentStream: g.stream }); setGpInlineText(""); setGpInlineXP(150); }}
                        style={{ alignSelf: "flex-start", background: "rgba(6,182,212,0.08)", border: "1px dashed rgba(6,182,212,0.45)", borderRadius: 3, padding: "4px 12px", color: "#22d3ee", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        + план дій
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          };

          const doneGoals = longGoals.filter(g => g.done && !g.deletedAt);
          const donePlans = plan.filter(p => p.done && !p.deletedAt);
          const doneTasks = goals.filter(g => g.done && !g.deletedAt);
          const deletedGoals = longGoals.filter(g => g.deletedAt);
          const deletedPlans = plan.filter(p => p.deletedAt);
          const deletedTasks = goals.filter(g => g.deletedAt);
          const hasDone = doneGoals.length + donePlans.length + doneTasks.length > 0;
          const hasDeleted = deletedGoals.length + deletedPlans.length + deletedTasks.length > 0;

          const renderDoneSub = (items, color, label, onUndo, xpFn, textFn) => {
            if (!items.length) return null;
            const capped = items.slice(-10).reverse();
            return (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 }}>{label}</div>
                <div style={{ maxHeight: 110, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                  {capped.map(item => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, background: `${color}08`, border: `1px solid ${color}25`, borderRadius: 4, padding: "6px 10px" }}>
                      <span style={{ fontSize: 10, color, flexShrink: 0 }}>✓</span>
                      <span style={{ flex: 1, color: "#7a7860", fontSize: 12, textDecoration: "line-through", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{textFn(item)}</span>
                      <span style={{ fontSize: 10, color, background: `${color}12`, padding: "1px 6px", borderRadius: 8, flexShrink: 0, whiteSpace: "nowrap" }}>+{xpFn(item)} XP</span>
                      {item.completedAt && <span style={{ fontSize: 9, color: "#4a4a30", flexShrink: 0 }}>{fmtDate(item.completedAt)}</span>}
                      <button onClick={() => onUndo(item)} style={{ background: "none", border: "none", color: "#6a5f40", cursor: "pointer", fontSize: 11, padding: "0 2px" }} title="Скасувати виконання">↩</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          };

          const renderDeletedSub = (items, color, label, type) => {
            if (!items.length) return null;
            const capped = items.slice(-10).reverse();
            return (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 }}>{label}</div>
                <div style={{ maxHeight: 110, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                  {capped.map(item => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(80,40,30,0.12)", border: "1px solid rgba(120,60,40,0.18)", borderRadius: 4, padding: "6px 10px" }}>
                      <span style={{ flex: 1, color: "#6a5a40", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</span>
                      {item.deletedAt && <span style={{ fontSize: 9, color: "#4a3a20", flexShrink: 0 }}>{fmtDate(item.deletedAt)}</span>}
                      <button onClick={() => restoreItem(type, item.id)} style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: "#c9a84c", borderRadius: 3, padding: "2px 7px", fontSize: 10, cursor: "pointer", whiteSpace: "nowrap" }}>↩ відновити</button>
                      <button onClick={() => permanentDelete(type, item.id)} style={{ background: "none", border: "none", color: "#5a3020", cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          };

          const doAddToInbox = () => {
            if (!gpInboxText.trim()) return;
            setInbox(prev => [...prev, { id: `ib${Date.now()}`, text: gpInboxText.trim(), type: gpInboxType, createdAt: new Date().toISOString() }]);
            setGpInboxText("");
          };

          // ─── Drag & drop: спільна логіка для інбоксу і головного списку ───
          // Типи: goal (longGoals) · plan (plan) · task (goals). Перетягування
          // між секціями міняє тип елемента (текст/XP/напрям зберігаються).
          const TYPE_META = {
            goal: { setter: setLongGoals, arr: longGoals, prefix: "lg", color: "#c084fc", label: "🎯 Ціль",   defXP: 500 },
            plan: { setter: setPlan,      arr: plan,      prefix: "p",  color: "#22d3ee", label: "📋 План",   defXP: 150 },
            task: { setter: setGoals,     arr: goals,     prefix: "g",  color: "#00ff88", label: "✅ Задача", defXP: 50  },
          };
          const inboxType = (it) => TYPE_META[it.type] ? it.type : "task";

          const insertBefore = (arr, item, beforeId) => {
            if (!beforeId) return [...arr, item];
            const idx = arr.findIndex(x => x.id === beforeId);
            return idx < 0 ? [...arr, item] : [...arr.slice(0, idx), item, ...arr.slice(idx)];
          };

          // Створює елемент типу toType з будь-якого джерела (елемент списку або ідея з інбоксу)
          const buildTyped = (src, toType, keepProgress) => {
            const m = TYPE_META[toType];
            const xp = m.defXP; // XP скидається на стандартний для типу (ціль 500 / план 150 / задача 50)
            const base = { id: `${m.prefix}${Date.now()}${Math.floor(Math.random()*1000)}`, text: src.text, createdAt: src.createdAt ?? new Date().toISOString() };
            if (src.stream) base.stream = src.stream;
            if (src.pinned) base.pinned = true;
            if (keepProgress && src.done) { base.done = true; base.xpAwarded = src.xpAwarded ?? false; base.completedAt = src.completedAt ?? null; }
            else base.done = false;
            if (toType === "goal") return { ...base, period: src.period ?? "month_cur", customXP: xp };
            if (toType === "plan") return { ...base, type: src.type ?? "other", urgency: src.urgency ?? "now", xp };
            return { ...base, priority: src.priority ?? "important", xp };
          };

          // Drop у секцію головного списку (toType). beforeId — вставити перед цим елементом (для перевпорядкування)
          const dropToType = (toType, beforeId = null) => {
            const di = dragItem;
            if (!di) { setDragOver(null); return; }
            if (di.source === "inbox") {
              const it = inbox.find(x => x.id === di.id);
              if (it) {
                const typed = buildTyped(it, toType, false);
                setInbox(prev => prev.filter(x => x.id !== di.id));
                TYPE_META[toType].setter(prev => insertBefore(prev, typed, beforeId));
                showNotif(`→ ${TYPE_META[toType].label}`);
              }
            } else if (di.fromType === toType) {
              // Той самий тип → перевпорядкування (beforeId=null → в кінець секції)
              if (beforeId !== di.id) {
                TYPE_META[toType].setter(prev => {
                  const it = prev.find(x => x.id === di.id);
                  if (!it) return prev;
                  return insertBefore(prev.filter(x => x.id !== di.id), it, beforeId);
                });
              }
            } else {
              const it = TYPE_META[di.fromType].arr.find(x => x.id === di.id);
              if (it) {
                const typed = buildTyped(it, toType, true);
                TYPE_META[di.fromType].setter(prev => prev.filter(x => x.id !== di.id));
                TYPE_META[toType].setter(prev => insertBefore(prev, typed, beforeId));
                showNotif(`→ ${TYPE_META[toType].label}`);
              }
            }
            setDragItem(null); setDragOver(null);
          };

          // Drop в інбокс під певним типом (toType). Працює і для елементів інбоксу, і для елементів списку.
          const dropToInboxType = (toType, beforeId = null) => {
            const di = dragItem;
            if (!di) { setDragOver(null); return; }
            if (di.source === "inbox") {
              setInbox(prev => {
                const it = prev.find(x => x.id === di.id);
                if (!it) return prev;
                return insertBefore(prev.filter(x => x.id !== di.id), { ...it, type: toType }, beforeId);
              });
            } else {
              const it = TYPE_META[di.fromType].arr.find(x => x.id === di.id);
              if (it) {
                TYPE_META[di.fromType].setter(prev => prev.filter(x => x.id !== di.id));
                setInbox(prev => insertBefore(prev, { id: `ib${Date.now()}`, text: it.text, type: toType, createdAt: new Date().toISOString() }, beforeId));
              }
            }
            setDragItem(null); setDragOver(null);
          };

          // Пропси для draggable-рядка
          const dragHandlers = (id, fromType, source) => ({
            draggable: true,
            onDragStart: (e) => { setDragItem({ id, fromType, source }); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", id); } catch (_) {} },
            onDragEnd: () => { setDragItem(null); setDragOver(null); },
          });

          // Пропси-цілі для рядка списку: при наведенні підсвічує проміжок НАД рядком (куди вставиться), приймає drop
          const rowDropProps = (type, id) => ({
            onDragOver: (e) => { e.preventDefault(); setDragOver(`gap_${type}_${id}`); },
            onDrop: (e) => { e.preventDefault(); dropToType(type, id); },
          });

          // Зона-проміжок між рядками — підсвічується, показуючи куди впадеться елемент
          const GapZone = ({ type, beforeId }) => {
            if (!dragItem) return null;
            const key = `gap_${type}_${beforeId ?? "end"}`;
            const hot = dragOver === key;
            const color = TYPE_META[type].color;
            return (
              <div onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                onDrop={e => { e.preventDefault(); dropToType(type, beforeId); }}
                style={{ height: hot ? 26 : 9, margin: "-2px 0", borderRadius: 5, transition: "height 0.1s, background 0.1s", background: hot ? `${color}26` : "transparent", border: hot ? `2px dashed ${color}` : "2px dashed transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {hot && <span style={{ fontSize: 9, color, fontFamily: "'Space Mono',monospace", letterSpacing: 1, whiteSpace: "nowrap" }}>↳ сюди</span>}
              </div>
            );
          };

          // Заголовок секції — також дропзона (скинути сюди = змінити тип і додати в кінець)
          const SECTION_META = {
            goal: { label: "🎯 Цілі",            color: "#c084fc", line: "rgba(168,85,247,0.35)", count: activeGoals.length },
            plan: { label: "📋 Плани без цілі",  color: "#22d3ee", line: "rgba(6,182,212,0.35)",  count: standalonePlans.length },
            task: { label: "✅ Задачі без плану", color: "#00ff88", line: "rgba(0,255,136,0.35)",  count: standaloneTasks.length },
          };
          const SectionHeader = ({ type, marginTop }) => {
            const m = SECTION_META[type];
            const key = `header_${type}`;
            const hot = dragItem && dragOver === key;
            return (
              <div
                onDragOver={dragItem ? (e => { e.preventDefault(); setDragOver(key); }) : undefined}
                onDrop={dragItem ? (e => { e.preventDefault(); dropToType(type, null); }) : undefined}
                style={{ display: "flex", alignItems: "center", gap: 10, marginTop, marginBottom: 4, padding: hot ? "4px 6px" : 0, borderRadius: 4, background: hot ? `${m.color}1a` : "transparent", outline: hot ? `2px dashed ${m.color}` : "none", transition: "background 0.1s" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: m.color, background: `${m.color}1a`, border: `1px solid ${m.color}59`, borderRadius: 4, padding: "5px 14px", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'Exo 2',sans-serif", whiteSpace: "nowrap" }}>{m.label}</span>
                <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${m.line}, transparent)` }} />
                {dragItem
                  ? <span style={{ fontSize: 10, color: m.color, fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap" }}>скинь → {TYPE_META[type].defXP} XP</span>
                  : <span style={{ fontSize: 11, color: `${m.color}aa` }}>{m.count}</span>}
              </div>
            );
          };

          // Секція з рядками + зони-проміжки між ними
          const renderSection = (items, type, renderFn) => (
            <>
              {items.map(it => [
                <GapZone key={`gap_${it.id}`} type={type} beforeId={it.id} />,
                renderFn(it),
              ])}
              <GapZone type={type} beforeId={null} />
            </>
          );

          const doConvertInboxItem = (item) => {
            const { type, xp, stream } = gpInboxConvert;
            const streamProp = stream ? { stream } : {};
            if (type === "goal") {
              setLongGoals(prev => [...prev, { id: `lg${Date.now()}`, text: item.text, period: "month_cur", customXP: xp, done: false, createdAt: new Date().toISOString(), ...streamProp }]);
            } else if (type === "plan") {
              setPlan(prev => [...prev, { id: `p${Date.now()}`, text: item.text, type: "other", urgency: "now", xp, done: false, createdAt: new Date().toISOString(), ...streamProp }]);
            } else {
              setGoals(prev => [...prev, { id: `g${Date.now()}`, text: item.text, priority: "important", xp, done: false, createdAt: new Date().toISOString(), ...streamProp }]);
            }
            setInbox(prev => prev.filter(x => x.id !== item.id));
            setGpInboxConvert(null);
          };

          return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        {/* 💡 Inbox */}
            <div style={{ background: "rgba(8,6,2,0.80)", border: "1px solid rgba(251,191,36,0.22)", borderRadius: 4, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: gpInboxOpen ? 12 : 0, flexWrap: "wrap" }}>
                <button onClick={() => setGpInboxOpen(o => !o)}
                  style={{ background: "none", border: "none", color: "#fbbf24", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 140 }}>
                  <span style={{ fontSize: 10 }}>{gpInboxOpen ? "▼" : "▶"}</span>
                  💡 Інбокс ідей
                  {inbox.length > 0 && <span style={{ fontSize: 10, fontWeight: 400, color: "#9a7820", marginLeft: 2 }}>({inbox.length})</span>}
                </button>
                <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {["goal", "plan", "task"].map(tp => {
                      const m = TYPE_META[tp];
                      const on = gpInboxType === tp;
                      return (
                        <button key={tp} onClick={() => setGpInboxType(tp)}
                          style={{ background: on ? `${m.color}22` : "transparent", border: `1px solid ${on ? m.color + "66" : "rgba(201,168,76,0.15)"}`, borderRadius: 3, padding: "5px 9px", color: on ? m.color : "#6a5f40", fontSize: 11, cursor: "pointer", fontWeight: on ? 700 : 400 }}>
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                  <input value={gpInboxText} onChange={e => setGpInboxText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") doAddToInbox(); }}
                    placeholder="Кинь ідею сюди..."
                    style={{ width: 200, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(251,191,36,0.20)", borderRadius: 4, padding: "6px 10px", color: "#f0e0a0", fontSize: 12, fontFamily: "'Space Mono',monospace", outline: "none" }} />
                  <button onClick={doAddToInbox}
                    style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.35)", color: "#fbbf24", borderRadius: 4, padding: "6px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>+</button>
                </div>
              </div>
              {/* Drag-панель інбоксу: зони типів (при перетягуванні) */}
              {gpInboxOpen && dragItem && (
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {["goal", "plan", "task"].map(tp => {
                    const m = TYPE_META[tp];
                    const hot = dragOver === `ibzone_${tp}`;
                    return (
                      <div key={tp}
                        onDragOver={e => { e.preventDefault(); setDragOver(`ibzone_${tp}`); }}
                        onDragLeave={() => setDragOver(o => o === `ibzone_${tp}` ? null : o)}
                        onDrop={e => { e.preventDefault(); dropToInboxType(tp); }}
                        style={{ flex: 1, textAlign: "center", padding: "8px 6px", border: `2px dashed ${m.color}${hot ? "" : "44"}`, background: hot ? `${m.color}22` : "transparent", borderRadius: 5, color: m.color, fontSize: 11, fontWeight: 700, fontFamily: "'Exo 2',sans-serif", transition: "all 0.12s" }}>
                        {m.label}
                      </div>
                    );
                  })}
                </div>
              )}
              {gpInboxOpen && inbox.length === 0 && (
                <div style={{ textAlign: "center", padding: "14px 0", color: "#6a5820", fontSize: 12 }}>
                  Поки порожньо — кидай сюди ідеї з IndieHackers, YouTube, подкастів...
                </div>
              )}
              {gpInboxOpen && inbox.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {inbox.map(item => {
                    const isConverting = gpInboxConvert?.id === item.id;
                    return (
                      <div key={item.id} style={{ background: "rgba(12,9,2,0.85)", border: `1px solid ${isConverting ? "rgba(251,191,36,0.45)" : "rgba(251,191,36,0.15)"}`, borderLeft: `3px solid ${TYPE_META[inboxType(item)].color}99`, borderRadius: 4, overflow: "hidden", outline: dragOver === `ib_${item.id}` ? "2px dashed #fbbf24" : "none", opacity: dragItem?.id === item.id ? 0.4 : 1 }}>
                        <div {...dragHandlers(item.id, inboxType(item), "inbox")}
                          onDragOver={e => { e.preventDefault(); setDragOver(`ib_${item.id}`); }}
                          onDragLeave={() => setDragOver(o => o === `ib_${item.id}` ? null : o)}
                          onDrop={e => { e.preventDefault(); dropToInboxType(inboxType(item), item.id); }}
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "grab" }}>
                          {(() => {
                            const m = TYPE_META[inboxType(item)];
                            const order = ["goal", "plan", "task"];
                            const next = order[(order.indexOf(inboxType(item)) + 1) % 3];
                            return (
                              <button onClick={e => { e.stopPropagation(); setInbox(prev => prev.map(x => x.id === item.id ? { ...x, type: next } : x)); }}
                                title="Змінити тип (клік) або перетягни"
                                style={{ flexShrink: 0, background: `${m.color}1a`, border: `1px solid ${m.color}55`, borderRadius: 3, padding: "2px 7px", color: m.color, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                                {m.label}
                              </button>
                            );
                          })()}
                          <span style={{ flex: 1, color: "#e8d080", fontSize: 12 }}>{item.text}</span>
                          <span style={{ fontSize: 9, color: "#6a5820", flexShrink: 0 }}>{fmtDate(item.createdAt)}</span>
                          <button onClick={() => setGpInboxConvert(isConverting ? null : { id: item.id, type: inboxType(item), xp: TYPE_META[inboxType(item)].defXP, stream: gpStreamFilter ?? null })}
                            style={{ background: isConverting ? "rgba(251,191,36,0.2)" : "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.35)", color: "#fbbf24", borderRadius: 3, padding: "3px 9px", fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
                            {isConverting ? "▲ скасувати" : "→ перенести"}
                          </button>
                          <button onClick={() => setInbox(prev => prev.filter(x => x.id !== item.id))}
                            style={{ background: "none", border: "none", color: "#5a4010", cursor: "pointer", fontSize: 15, padding: "0 2px", lineHeight: 1 }}>×</button>
                        </div>
                        {isConverting && (
                          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(251,191,36,0.15)", background: "rgba(20,14,2,0.9)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: 3 }}>
                              {[
                                { id: "goal", label: "🎯 Ціль",     color: "#c084fc", xp: 500 },
                                { id: "plan", label: "📋 План",     color: "#22d3ee", xp: 150 },
                                { id: "task", label: "✅ Задача",   color: "#00ff88", xp: 50  },
                              ].map(tp => (
                                <button key={tp.id} onClick={() => setGpInboxConvert(c => ({ ...c, type: tp.id, xp: tp.xp }))}
                                  style={{ background: gpInboxConvert.type === tp.id ? `${tp.color}20` : "transparent", border: `1px solid ${gpInboxConvert.type === tp.id ? tp.color + "66" : "rgba(201,168,76,0.15)"}`, borderRadius: 3, padding: "4px 9px", color: gpInboxConvert.type === tp.id ? tp.color : "#6a5f40", fontSize: 11, cursor: "pointer", fontWeight: gpInboxConvert.type === tp.id ? 700 : 400 }}>
                                  {tp.label}
                                </button>
                              ))}
                            </div>
                            <div style={{ display: "flex", gap: 3 }}>
                              {GP_STREAMS.map(s => (
                                <button key={s.id} onClick={() => setGpInboxConvert(c => ({ ...c, stream: c.stream === s.id ? null : s.id }))}
                                  style={{ background: gpInboxConvert.stream === s.id ? s.bg : "transparent", border: `1px solid ${gpInboxConvert.stream === s.id ? s.color + "88" : s.color + "30"}`, borderRadius: 3, padding: "4px 8px", color: gpInboxConvert.stream === s.id ? s.color : s.color + "88", fontSize: 10, cursor: "pointer", fontWeight: gpInboxConvert.stream === s.id ? 700 : 400 }}>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(8,5,2,0.5)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 3, padding: "0 8px" }}>
                              <span style={{ fontSize: 10, color: "#6a5f40" }}>XP</span>
                              <input type="number" min="0" value={gpInboxConvert.xp} onChange={e => setGpInboxConvert(c => ({ ...c, xp: Math.max(0, parseInt(e.target.value) || 0) }))}
                                style={{ width: 44, background: "transparent", border: "none", color: "#00ff88", fontSize: 11, textAlign: "center", outline: "none", padding: "5px 0" }} />
                            </div>
                            <button onClick={() => doConvertInboxItem(item)}
                              style={{ background: gpInboxConvert.type === "goal" ? "#a855f7" : gpInboxConvert.type === "plan" ? "#22d3ee" : "#00ff88", color: gpInboxConvert.type === "goal" ? "#fff" : "#000", border: "none", padding: "6px 14px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "'Exo 2',sans-serif", marginLeft: "auto" }}>
                              ✓ Перенести
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

        {/* Add form */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.18)", borderRadius: 4, padding: 14 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 3 }}>
                  {[
                    { id: "goal", label: "🎯 Ціль",     color: "#c084fc" },
                    { id: "plan", label: "📋 План дій", color: "#22d3ee" },
                    { id: "task", label: "✅ Задача",   color: "#00ff88" },
                  ].map(tp => (
                    <button key={tp.id} onClick={() => { setGpAddType(tp.id); setGpAddXP(tp.id === "goal" ? 500 : tp.id === "plan" ? 150 : 50); }}
                      style={{ background: gpAddType === tp.id ? `${tp.color}18` : "transparent", border: `1px solid ${gpAddType === tp.id ? tp.color + "55" : "rgba(201,168,76,0.15)"}`, borderRadius: 3, padding: "5px 11px", color: gpAddType === tp.id ? tp.color : "#6a5f40", fontSize: 11, cursor: "pointer", fontWeight: gpAddType === tp.id ? 700 : 400, fontFamily: "'Exo 2',sans-serif" }}>
                      {tp.label}
                    </button>
                  ))}
                </div>
                <input value={gpAddText} onChange={e => setGpAddText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") doAddItem(); }}
                  placeholder={gpAddType === "goal" ? "Опиши ціль..." : gpAddType === "plan" ? "Опиши план дій..." : "Опиши задачу..."}
                  style={{ flex: 1, minWidth: 150, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.18)", borderRadius: 4, padding: "8px 12px", color: "#fff", fontSize: 12, fontFamily: "'Space Mono',monospace" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 4, padding: "0 9px" }}>
                  <span style={{ fontSize: 10, color: "#6a5f40" }}>XP</span>
                  <input type="number" min="0" max="99999" value={gpAddXP} onChange={e => setGpAddXP(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: 50, background: "transparent", border: "none", color: "#00ff88", fontSize: 12, fontFamily: "'Space Mono',monospace", textAlign: "center", padding: "8px 0" }} />
                </div>
                <button onClick={doAddItem}
                  style={{ background: gpAddType === "goal" ? "#a855f7" : gpAddType === "plan" ? "#22d3ee" : "#00ff88", color: gpAddType === "goal" ? "#fff" : "#000", border: "none", padding: "8px 16px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "'Exo 2',sans-serif" }}>
                  + Додати
                </button>
              </div>
            </div>

            {/* Stream filter bar */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={() => setGpStreamFilter(null)}
                style={{ background: !gpStreamFilter ? "rgba(201,168,76,0.18)" : "transparent", border: `1px solid ${!gpStreamFilter ? "rgba(201,168,76,0.55)" : "rgba(201,168,76,0.15)"}`, borderRadius: 3, padding: "4px 10px", color: !gpStreamFilter ? "#c9a84c" : "#6a5f40", fontSize: 11, fontWeight: !gpStreamFilter ? 700 : 400, cursor: "pointer", fontFamily: "'Exo 2',sans-serif" }}>
                Всі напрями
              </button>
              {GP_STREAMS.map(s => (
                <button key={s.id} onClick={() => setGpStreamFilter(gpStreamFilter === s.id ? null : s.id)}
                  style={{ background: gpStreamFilter === s.id ? s.bg : "transparent", border: `1px solid ${gpStreamFilter === s.id ? s.color + "88" : s.color + "30"}`, borderRadius: 3, padding: "4px 10px", color: gpStreamFilter === s.id ? s.color : s.color + "88", fontSize: 11, fontWeight: gpStreamFilter === s.id ? 700 : 400, cursor: "pointer", fontFamily: "'Exo 2',sans-serif" }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Active items — секції завжди присутні під час перетягування (щоб було куди скинути,
                навіть якщо секція порожня). Перетягування між секціями міняє тип + XP. */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {!dragItem && activeGoals.length === 0 && standalonePlans.length === 0 && standaloneTasks.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "#5a5040", fontSize: 13 }}>
                  Ще нічого немає. Додай першу ціль, план або задачу!
                </div>
              )}

              {(activeGoals.length > 0 || dragItem) && <SectionHeader type="goal" />}
              {(activeGoals.length > 0 || dragItem) && renderSection(activeGoals, "goal", renderGoalRow)}

              {(standalonePlans.length > 0 || dragItem) && <SectionHeader type="plan" marginTop={14} />}
              {(standalonePlans.length > 0 || dragItem) && renderSection(standalonePlans, "plan", renderPlanRow)}

              {/* «Задачі без плану» лишається завжди, поки є хоч щось — щоб завжди було куди скинути */}
              {(activeGoals.length > 0 || standalonePlans.length > 0 || standaloneTasks.length > 0 || dragItem) && <SectionHeader type="task" marginTop={14} />}
              {(activeGoals.length > 0 || standalonePlans.length > 0 || standaloneTasks.length > 0 || dragItem) && renderSection(standaloneTasks, "task", renderTaskRow)}
            </div>

            {/* Done section */}
            {hasDone && (
              <div style={{ background: "rgba(3,8,5,0.80)", border: "1px solid rgba(0,153,51,0.18)", borderRadius: 4, padding: 14 }}>
                <button onClick={() => setGpDoneGoalsOpen(o => !o)}
                  style={{ background: "none", border: "none", color: "rgba(0,153,51,0.6)", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                  <span style={{ fontSize: 10 }}>{gpDoneGoalsOpen ? "▼" : "▶"}</span>
                  ✓ Досягнуто
                  <span style={{ fontSize: 10, fontWeight: 400, color: "#4a6040", marginLeft: 4 }}>({doneGoals.length + donePlans.length + doneTasks.length})</span>
                </button>
                {gpDoneGoalsOpen && (
                  <div style={{ marginTop: 12 }}>
                    {renderDoneSub(doneGoals, "#c084fc", "🎯 Цілі",
                      (g) => setLongGoals(prev => prev.map(x => { if (x.id !== g.id) return x; if (x.xpAwarded) loseXP(x.customXP ?? 200, "goal", "↩ ціль скасовано"); return { ...x, done: false, xpAwarded: false, completedAt: null }; })),
                      g => g.customXP ?? 200, g => g.text)}
                    {renderDoneSub(donePlans, "#22d3ee", "📋 Плани дій",
                      (p) => setPlan(prev => prev.map(x => { if (x.id !== p.id) return x; if (x.xpAwarded) loseXP(x.xp ?? 150, "plan", "↩ план скасовано"); return { ...x, done: false, xpAwarded: false, completedAt: null }; })),
                      p => p.xp ?? 150, p => p.text)}
                    {renderDoneSub(doneTasks, "#00ff88", "✅ Задачі",
                      (t) => setGoals(prev => prev.map(x => { if (x.id !== t.id) return x; if (x.xpAwarded) loseXP(x.xp ?? 50, "goal", "↩ задачу скасовано"); return { ...x, done: false, xpAwarded: false, completedAt: null }; })),
                      t => t.xp ?? 50, t => t.text)}
                  </div>
                )}
              </div>
            )}

            {/* Deleted section */}
            {hasDeleted && (
              <div style={{ background: "rgba(8,3,3,0.80)", border: "1px solid rgba(120,50,30,0.18)", borderRadius: 4, padding: 14 }}>
                <button onClick={() => setGpDelOpen(o => !o)}
                  style={{ background: "none", border: "none", color: "rgba(106,74,48,0.5)", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: 0, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                  <span style={{ fontSize: 10 }}>{gpDelOpen ? "▼" : "▶"}</span>
                  ✗ Видалені
                  <span style={{ fontSize: 10, fontWeight: 400, color: "#4a3020", marginLeft: 4 }}>({deletedGoals.length + deletedPlans.length + deletedTasks.length})</span>
                </button>
                {gpDelOpen && (
                  <div style={{ marginTop: 12 }}>
                    {renderDeletedSub(deletedGoals, "#c96644", "🎯 Цілі", "goal")}
                    {renderDeletedSub(deletedPlans, "#c97744", "📋 Плани дій", "plan")}
                    {renderDeletedSub(deletedTasks, "#c98844", "✅ Задачі", "task")}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })()}


        {/* Finances */}
        {activeTab === "finances" && (() => {
          const net = totalIncome - totalExpenses;
          const months = getLastMonths(4);
          const MONTH_NAMES = ["Січ","Лют","Бер","Кві","Тра","Чер","Лип","Сер","Вер","Жов","Лис","Гру"];

          const rateColor = !uahRateUpdatedAt ? "#f43f5e"
            : (Date.now() - new Date(uahRateUpdatedAt)) < 86400000 ? "#10b981"
            : (Date.now() - new Date(uahRateUpdatedAt)) < 259200000 ? "#f59e0b" : "#f43f5e";
          const rateLabel = rateFetching ? "⏳ оновлення..."
            : !uahRateUpdatedAt ? "🔴 ще не отримано"
            : (() => {
                const mins = Math.round((Date.now() - new Date(uahRateUpdatedAt)) / 60000);
                if (mins < 2) return "🟢 щойно";
                if (mins < 60) return `🟢 ${mins} хв. тому`;
                const hrs = Math.round(mins / 60);
                if (hrs < 24) return `🟢 ${hrs} год. тому`;
                const days = Math.round(hrs / 24);
                return `${days > 3 ? "🔴" : "🟡"} ${days} дн. тому`;
              })();

          const inpStyle = { background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "8px 12px", color: "#e0d8c0", fontSize: 13, fontFamily: "'Space Mono',monospace" };
          const selStyle = { ...inpStyle, cursor: "pointer", color: "#9a8a60" };

          const thStyle = (color) => ({ textAlign: "right", color: color ?? "#9a8a60", padding: "6px 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: 10 });

          // SVG monthly chart for analytics
          const chartYear = analyticsYear;
          const chartMonths = Array.from({ length: 12 }, (_, i) => `${chartYear}-${String(i+1).padStart(2,"0")}`);
          const chartInc = chartMonths.map(m => incomeEntries.filter(e => e.date.startsWith(m)).reduce((s, e) => s + toUSD(e.amount, e.currency), 0));
          const chartExp = chartMonths.map(m => expenseEntries.filter(e => e.date.startsWith(m)).reduce((s, e) => s + toUSD(e.amount, e.currency), 0));
          const chartNet = chartMonths.map((_, i) => chartInc[i] - chartExp[i]);
          const W = 580, H = 130, PL = 46, PR = 8, PT = 10, PB = 22;
          const cW = W - PL - PR, cH = H - PT - PB;
          const px = (i) => PL + (i / 11) * cW;
          const minNet = Math.min(...chartNet, 0);
          const maxNet = Math.max(...chartNet, 0);
          const netRange = Math.max(maxNet - minNet, 1);
          const pyNet = (v) => PT + cH - ((v - minNet) / netRange) * cH;
          const zeroY = pyNet(0);
          const netLinePath = chartNet.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${pyNet(v).toFixed(1)}`).join(" ");
          const netAreaPath = `${netLinePath} L${px(11).toFixed(1)},${zeroY.toFixed(1)} L${PL},${zeroY.toFixed(1)} Z`;

          const yearInc = chartInc.reduce((s, v) => s + v, 0);
          const yearExp = chartExp.reduce((s, v) => s + v, 0);
          const yearNet = yearInc - yearExp;

          return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Subscription monthly prompt modal */}
            {subPrompt && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div className="wf-panel" style={{ maxWidth: 460, width: "100%", padding: 24 }}>
                  <div className="wf-sec" style={{ marginBottom: 16 }}>
                    📅 Щомісячні витрати — {monthLabel(new Date().toISOString().slice(0,7))} {new Date().getFullYear()}
                  </div>
                  <div style={{ fontSize: 12, color: "#9a8a60", marginBottom: 14 }}>Додати ці підписки за поточний місяць?</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {subPrompt.items.map((item, idx) => {
                      const amtUSD = item.currency === "UAH" ? item.amount / uahRate : item.amount;
                      return (
                        <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(8,5,2,0.6)", border: `1px solid ${item.checked ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.12)"}`, borderRadius: 4, padding: "10px 14px", cursor: "pointer" }}>
                          <input type="checkbox" checked={item.checked} onChange={e => setSubPrompt(p => ({ ...p, items: p.items.map((x,i) => i===idx ? {...x, checked: e.target.checked} : x) }))} style={{ accentColor: "#c9a84c", width: 16, height: 16 }} />
                          <span style={{ flex: 1, color: "#e0d8c0", fontFamily: "'Exo 2',sans-serif", fontWeight: 600 }}>{item.name}</span>
                          <span style={{ color: "#f43f5e", fontFamily: "'Space Mono',monospace", fontSize: 13, fontWeight: 700 }}>
                            {item.currency === "UAH" ? `${item.amount} грн` : `$${item.amount}`}
                            {item.currency === "UAH" && <span style={{ color: "#5a4a30", fontSize: 10, marginLeft: 4 }}>(${amtUSD.toFixed(2)})</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => {
                      const currentYM = new Date().toISOString().slice(0, 7);
                      const today = new Date().toISOString().slice(0, 10);
                      const checkedIds = new Set(subPrompt.items.filter(s => s.checked).map(s => s.id));
                      subPrompt.items.filter(s => s.checked).forEach(s => {
                        const entry = { id: `exp_${Date.now()}_${s.id}`, catId: s.catId, amount: s.amount, currency: s.currency, date: today, note: s.name, recurring: true, subId: s.id };
                        setExpenseEntries(prev => [...prev, entry]);
                      });
                      setSubscriptions(prev => prev.map(s =>
                        subPrompt.items.some(x => x.id === s.id) ? { ...s, lastBilledYM: currentYM } : s
                      ));
                      setSubPrompt(null);
                    }} style={{ flex: 1, background: "#c9a84c", color: "#000", border: "none", padding: "10px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "'Exo 2',sans-serif" }}>✓ Додати вибрані</button>
                    <button onClick={() => {
                      const currentYM = new Date().toISOString().slice(0, 7);
                      setSubscriptions(prev => prev.map(s =>
                        subPrompt.items.some(x => x.id === s.id) ? { ...s, lastBilledYM: currentYM } : s
                      ));
                      setSubPrompt(null);
                    }} style={{ background: "none", border: "1px solid rgba(201,168,76,0.3)", color: "#9a8a60", padding: "10px 16px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Пропустити</button>
                  </div>
                </div>
              </div>
            )}

            {/* Undo toast */}
            {pendingDelete && (
              <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9998, background: "linear-gradient(135deg,rgba(30,20,4,0.98),rgba(14,10,2,0.98))", border: "1px solid rgba(201,168,76,0.5)", borderTop: "2px solid #c9a84c", borderRadius: 4, padding: "12px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.7)", fontFamily: "'Exo 2',sans-serif" }}>
                <span style={{ fontSize: 12, color: "#e0d8c0" }}>{pendingDelete.refund ? "📤 Повернення скасовано" : "🗑 Запис видалено"}</span>
                <button onClick={undoDelete} style={{ background: "#c9a84c", border: "none", color: "#000", padding: "6px 14px", borderRadius: 3, fontWeight: 800, cursor: "pointer", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>↩ Скасувати</button>
              </div>
            )}

            {/* Rate bar */}
            <div className="wf-panel" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#9a8a60", textTransform: "uppercase", letterSpacing: 1 }}>Курс USD/UAH:</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#c9a84c", fontFamily: "'Exo 2',sans-serif" }}>1$ = {uahRate} грн</span>
              <span style={{ fontSize: 11, color: rateColor }}>{rateLabel}</span>
              <button onClick={fetchRate} disabled={rateFetching} className="act-btn" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.4)", color: "#c9a84c", padding: "5px 12px", borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: "pointer", marginLeft: "auto", fontFamily: "'Exo 2',sans-serif", letterSpacing: 1 }}>
                🔄 Оновити
              </button>
            </div>

            {/* 3-col summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                { label: "Дохід (всього)", val: `$${totalIncome.toFixed(2)}`, color: "#10b981", icon: "📈" },
                { label: "Витрати (всього)", val: `$${totalExpenses.toFixed(2)}`, color: "#f43f5e", icon: "📉" },
                { label: "Баланс", val: `${net >= 0 ? "+" : ""}$${net.toFixed(2)}`, color: net >= 0 ? "#00ff88" : "#f43f5e", icon: net >= 0 ? "💚" : "🔴" },
              ].map(s => (
                <div key={s.label} className="wf-panel" style={{ padding: "16px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "#9a8a60", marginTop: 4, textTransform: "uppercase", letterSpacing: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Transaction journal ── */}
            {(() => {
              const now2 = new Date();
              const todayStr2 = now2.toISOString().slice(0, 10);
              const yesterday2 = (() => { const d = new Date(now2); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
              const currentYM2 = now2.toISOString().slice(0, 7);
              const todayDay2 = now2.getDate();
              const daysInMonth2 = new Date(now2.getFullYear(), now2.getMonth() + 1, 0).getDate();

              const txDateLabel = (ds) => {
                if (ds === todayStr2) return "Сьогодні";
                if (ds === yesterday2) return "Вчора";
                const d = new Date(ds + "T00:00:00");
                const sameYear = d.getFullYear() === now2.getFullYear();
                const opts = sameYear ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" };
                // прибираємо хвостове «р.» від toLocaleDateString
                return d.toLocaleDateString("uk-UA", opts).replace(/\s*р\.?$/i, "");
              };

              // sort by date desc, then by numeric timestamp embedded in id
              const getTxTime = (id) => { const m = id.match(/\d{10,}/); return m ? parseInt(m[0]) : 0; };
              const allTx = [
                ...incomeEntries.map(e => ({ ...e, txType: "income" })),
                ...expenseEntries.map(e => ({ ...e, txType: "expense" })),
              ].sort((a, b) => b.date.localeCompare(a.date) || getTxTime(b.id) - getTxTime(a.id));

              const dateGroups = [];
              allTx.forEach(tx => {
                const last = dateGroups[dateGroups.length - 1];
                if (last && last.date === tx.date) last.items.push(tx);
                else dateGroups.push({ date: tx.date, items: [tx] });
              });

              const upcoming = subscriptions
                .filter(s => {
                  if (s.active === false) return false;
                  const effDay = Math.min(s.billingDay ?? 1, daysInMonth2);
                  return effDay >= todayDay2 && s.lastBilledYM !== currentYM2;
                })
                .sort((a, b) => (a.billingDay ?? 1) - (b.billingDay ?? 1));

              const upcomingLabel = (sub) => {
                const day = Math.min(sub.billingDay ?? 1, daysInMonth2);
                if (day === todayDay2) return "Сьогодні";
                if (day === todayDay2 + 1) return "Завтра";
                const d = new Date(now2.getFullYear(), now2.getMonth(), day);
                return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
              };

              const rowStyle = { display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: "1px solid rgba(201,168,76,0.08)" };
              const iconBox = (icon, bg) => (
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{icon}</div>
              );

              return (
                <div className="wf-panel" style={{ padding: 16, borderLeft: "3px solid #c9a84c", borderTop: "1px solid rgba(201,168,76,0.35)", background: "linear-gradient(rgba(201,168,76,0.05), rgba(201,168,76,0.05)), rgba(5,3,1,0.92)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 8px", margin: "-4px -8px", marginBottom: journalOpen ? 10 : -4, borderRadius: 4, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.30)", transition: "background 0.15s" }} onClick={() => setJournalOpen(v => !v)}>
                    <span className="wf-sec" style={{ marginBottom: 0, paddingBottom: 0, border: "none", color: "#c9a84c" }}>📋 Журнал операцій</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#e7d6a4", marginLeft: 6, background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.40)", padding: "2px 9px", borderRadius: 20, fontFamily: "'Space Mono',monospace" }}>{allTx.length} записів</span>
                    <span style={{ marginLeft: "auto", color: "#c9a84c", fontSize: 16, fontWeight: 700, width: 24, textAlign: "center" }}>{journalOpen ? "▲" : "▼"}</span>
                  </div>

                  {journalOpen && (
                    <div>
                      {/* Upcoming payments */}
                      {upcoming.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                            ⏰ Майбутні платежі
                            <span style={{ color: "#5a4a20", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· {upcoming.length} цього місяця</span>
                          </div>
                          {upcoming.map(sub => {
                            const cat = expenseCats.find(c => c.id === sub.catId);
                            const amtUSD = sub.currency === "UAH" ? sub.amount / uahRate : sub.amount;
                            return (
                              <div key={sub.id} style={{ ...rowStyle, opacity: 0.85 }}>
                                {iconBox(cat?.icon ?? "💸", "rgba(245,158,11,0.15)")}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ color: "#e0d8c0", fontFamily: "'Exo 2',sans-serif", fontWeight: 700, fontSize: 15 }}>{sub.name}</div>
                                  <div style={{ fontSize: 12, color: "#9a8a60", marginTop: 2 }}>
                                    {cat?.name} · 🗓 {upcomingLabel(sub)}
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ color: "#f43f5e", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 16 }}>
                                    −{sub.currency === "UAH" ? `${sub.amount} грн` : `$${sub.amount}`}
                                  </div>
                                  {sub.currency === "UAH" && <div style={{ display: "inline-block", marginTop: 3, fontSize: 11, fontWeight: 700, color: "#d8c89a", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.28)", borderRadius: 4, padding: "1px 6px", fontFamily: "'Space Mono',monospace" }}>≈ ${amtUSD.toFixed(2)}</div>}
                                </div>
                              </div>
                            );
                          })}
                          <div style={{ height: 1, background: "rgba(201,168,76,0.18)", margin: "12px 0" }} />
                        </div>
                      )}

                      {/* Date-grouped feed — scrollable, ~10 rows visible */}
                      {dateGroups.length === 0 && (
                        <div style={{ fontSize: 13, color: "#5a4a30", textAlign: "center", padding: "24px 0" }}>Ще немає записів</div>
                      )}
                      <div style={{ maxHeight: 580, overflowY: "auto", paddingRight: 4 }}>
                        {dateGroups.map(group => {
                          const isToday = group.date === todayStr2;
                          return (
                          <div key={group.date}>
                            <div style={{ padding: "12px 0 7px", position: "sticky", top: 0, background: "rgba(8,5,2,0.96)", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{
                                fontSize: 11.5, fontWeight: 700, fontFamily: "'Exo 2',sans-serif", letterSpacing: 0.6,
                                color: isToday ? "#0a0a0a" : "#d8c89a",
                                background: isToday ? "#c9a84c" : "rgba(201,168,76,0.14)",
                                border: `1px solid ${isToday ? "#c9a84c" : "rgba(201,168,76,0.30)"}`,
                                padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap",
                              }}>{txDateLabel(group.date)}</span>
                              <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(201,168,76,0.22), transparent)" }} />
                              <span style={{ fontSize: 11, color: "#6a5a40", fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>{group.items.length}</span>
                            </div>
                            {group.items.map(tx => {
                              const catList = tx.txType === "income" ? incomeCats : expenseCats;
                              const cat = catList.find(c => c.id === tx.catId);
                              const isInc = tx.txType === "income";
                              const amtUSD = toUSD(tx.amount, tx.currency);
                              const bg = isInc ? "rgba(16,185,129,0.13)" : "rgba(244,63,94,0.11)";
                              return (
                                <div key={tx.id} style={rowStyle}>
                                  {iconBox(cat?.icon ?? (isInc ? "📈" : "💸"), bg)}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: "#e0d8c0", fontFamily: "'Exo 2',sans-serif", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {tx.note || cat?.name || (isInc ? "Дохід" : "Витрата")}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#6a5a40", marginTop: 2 }}>
                                      {cat?.name}{tx.recurring && <span style={{ color: "#f59e0b", marginLeft: 6 }}>🔄</span>}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <div style={{ color: isInc ? "#10b981" : "#f43f5e", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 16 }}>
                                      {isInc ? "+" : "−"}{tx.currency === "UAH" ? `${tx.amount} грн` : `$${tx.amount}`}
                                    </div>
                                    {tx.currency === "UAH" && (
                                      <div style={{ display: "inline-block", marginTop: 3, fontSize: 11, fontWeight: 700, color: "#d8c89a", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.28)", borderRadius: 4, padding: "1px 6px", fontFamily: "'Space Mono',monospace" }}>≈ ${amtUSD.toFixed(2)}</div>
                                    )}
                                  </div>
                                  <button onClick={() => isInc ? refundIncomeEntry(tx.id) : startDelete(tx.id, "expense")} style={{ background: "none", border: "none", color: "#5a3a30", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "4px 6px", flexShrink: 0, transition: "color 0.15s" }} onMouseEnter={e => e.target.style.color="#f43f5e"} onMouseLeave={e => e.target.style.color="#5a3a30"}>×</button>
                                </div>
                              );
                            })}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Income table */}
            <div className="wf-panel" style={{ padding: 16, borderLeft: "3px solid #00ff88", borderTop: "1px solid rgba(0,255,136,0.25)", background: "linear-gradient(rgba(0,255,136,0.04), rgba(0,255,136,0.04)), rgba(5,3,1,0.92)" }}>
              <span className="wf-sec" style={{ display: "block", marginBottom: 12, color: "#00ff88", borderBottomColor: "rgba(0,255,136,0.25)" }}>📈 Дохід</span>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Space Mono',monospace" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.25)" }}>
                      <th style={{ ...thStyle("#9a8a60"), textAlign: "left" }}>Категорія</th>
                      {months.map(m => <th key={m} style={thStyle()}>{monthLabel(m)}</th>)}
                      <th style={thStyle("#c9a84c")}>Весь час</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeCats.map(cat => {
                      const catEntries = incomeEntries.filter(e => e.catId === cat.id);
                      const monthTotals = months.map(m => catEntries.filter(e => e.date.startsWith(m)).reduce((s, e) => s + toUSD(e.amount, e.currency), 0));
                      const total = catEntries.reduce((s, e) => s + toUSD(e.amount, e.currency), 0);
                      const isExpanded = expandedCatRows[`inc_${cat.id}`];
                      if (total === 0 && catEntries.length === 0) return null;
                      return (
                        <React.Fragment key={cat.id}>
                          <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.07)", cursor: "pointer" }} onClick={() => setExpandedCatRows(r => ({ ...r, [`inc_${cat.id}`]: !r[`inc_${cat.id}`] }))}>
                            <td style={{ padding: "8px 8px", color: cat.color, fontWeight: 700 }}>{cat.icon} {cat.name} <span style={{ fontSize: 9, color: "#5a4a30" }}>{isExpanded ? "▲" : "▼"}</span></td>
                            {monthTotals.map((v, i) => <td key={i} style={{ textAlign: "right", padding: "8px 8px", color: v > 0 ? "#e0d8c0" : "#3a3028" }}>{v > 0 ? `$${v.toFixed(0)}` : "—"}</td>)}
                            <td style={{ textAlign: "right", padding: "8px 8px", color: "#10b981", fontWeight: 700 }}>${total.toFixed(0)}</td>
                            <td style={{ textAlign: "right", padding: "4px" }}>
                              <button onClick={e => { e.stopPropagation(); setIncomeCats(prev => prev.filter(c => c.id !== cat.id)); }} title="Видалити категорію" style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 11, padding: 2 }}>× кат.</button>
                            </td>
                          </tr>
                          {isExpanded && catEntries.map(entry => (
                            <tr key={entry.id} style={{ background: "rgba(16,185,129,0.04)", borderBottom: "1px solid rgba(16,185,129,0.06)" }}>
                              <td style={{ padding: "6px 8px 6px 24px", color: "#9a8a60", fontSize: 11 }}>
                                {entry.date} {entry.note && <span style={{ color: "#7a6a48" }}>— {entry.note}</span>}
                              </td>
                              <td colSpan={months.length} />
                              <td style={{ textAlign: "right", padding: "6px 8px", color: "#10b981", fontSize: 11 }}>
                                {entry.currency === "UAH" ? `${entry.amount} грн` : `$${entry.amount}`}
                                {entry.currency === "UAH" && <span style={{ color: "#5a4a30", marginLeft: 4 }}>(${toUSD(entry.amount, entry.currency).toFixed(2)})</span>}
                              </td>
                              <td style={{ textAlign: "right", padding: "4px", whiteSpace: "nowrap" }}>
                                <button onClick={() => refundIncomeEntry(entry.id)} title="Повернути кошти (знімає XP)" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e", cursor: "pointer", fontSize: 10, padding: "3px 6px", borderRadius: 3, marginRight: 4 }}>📤 Повернути</button>
                                <button onClick={() => startDelete(entry.id, "income")} title="Видалити запис (без впливу на XP)" style={{ background: "none", border: "1px solid rgba(201,168,76,0.2)", color: "#5a4a30", cursor: "pointer", fontSize: 10, padding: "3px 6px", borderRadius: 3 }}>🗑</button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                    {incomeEntries.length === 0 && (
                      <tr><td colSpan={months.length + 3} style={{ color: "#5a4a30", padding: "12px 8px", textAlign: "center", fontStyle: "italic" }}>Ще немає записів</td></tr>
                    )}
                    {totalIncome > 0 && (
                      <tr style={{ borderTop: "2px solid rgba(16,185,129,0.55)", background: "rgba(16,185,129,0.10)" }}>
                        <td style={{ padding: "10px 8px", color: "#10b981", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Σ Всього</td>
                        {months.map(m => { const v = incomeEntries.filter(e => e.date.startsWith(m)).reduce((s, e) => s + toUSD(e.amount, e.currency), 0); return <td key={m} style={{ textAlign: "right", padding: "10px 8px", color: v > 0 ? "#10b981" : "#3a3028", fontWeight: 700 }}>{v > 0 ? `$${v.toFixed(0)}` : "—"}</td>; })}
                        <td style={{ textAlign: "right", padding: "10px 8px", color: "#10b981", fontWeight: 800, fontSize: 14 }}>${totalIncome.toFixed(0)}</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(201,168,76,0.15)" }}>
                <select value={incForm.catId} onChange={e => setIncForm(f => ({ ...f, catId: e.target.value }))} style={selStyle}>
                  {incomeCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                <input value={incForm.amount} onChange={e => setIncForm(f => ({ ...f, amount: e.target.value }))} onKeyDown={e => e.key === "Enter" && addIncomeEntry()} placeholder="Сума" type="number" min="0" style={{ ...inpStyle, width: 100 }} />
                <button onClick={() => setIncForm(f => ({ ...f, currency: f.currency === "USD" ? "UAH" : "USD" }))} style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", color: "#c9a84c", padding: "8px 12px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 12, minWidth: 52 }}>{incForm.currency}</button>
                <input value={incForm.note} onChange={e => setIncForm(f => ({ ...f, note: e.target.value }))} placeholder="Нотатка..." style={{ ...inpStyle, flex: 1, minWidth: 80 }} />
                <input type="date" value={incForm.date} onChange={e => setIncForm(f => ({ ...f, date: e.target.value }))} style={{ ...inpStyle, width: 130, colorScheme: "dark" }} />
                <button onClick={addIncomeEntry} className="act-btn" style={{ background: "#10b981", color: "#000", border: "none", padding: "8px 16px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>+ Записати</button>
                {addingCat !== "income" ? (
                  <button onClick={() => setAddingCat("income")} style={{ background: "none", border: "1px dashed rgba(201,168,76,0.3)", color: "#9a8a60", padding: "8px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>+ Категорія</button>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Назва..." style={{ ...inpStyle, width: 120 }} autoFocus />
                    <button onClick={() => { if (!newCatName.trim()) return; setIncomeCats(prev => [...prev, { id: `ic_${Date.now()}`, name: newCatName.trim(), color: "#c9a84c", icon: "💰" }]); setNewCatName(""); setAddingCat(null); }} style={{ background: "#c9a84c", border: "none", color: "#000", padding: "8px 10px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 11 }}>✓</button>
                    <button onClick={() => { setAddingCat(null); setNewCatName(""); }} style={{ background: "none", border: "none", color: "#9a8a60", cursor: "pointer", fontSize: 16 }}>×</button>
                  </div>
                )}
              </div>
            </div>

            {/* Expense table */}
            <div className="wf-panel" style={{ padding: 16, borderLeft: "3px solid #f43f5e", borderTop: "1px solid rgba(244,63,94,0.25)", background: "linear-gradient(rgba(244,63,94,0.04), rgba(244,63,94,0.04)), rgba(5,3,1,0.92)" }}>
              <span className="wf-sec" style={{ display: "block", marginBottom: 12, color: "#f43f5e", borderBottomColor: "rgba(244,63,94,0.25)" }}>📉 Витрати</span>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'Space Mono',monospace" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.25)" }}>
                      <th style={{ ...thStyle("#9a8a60"), textAlign: "left" }}>Категорія</th>
                      {months.map(m => <th key={m} style={thStyle()}>{monthLabel(m)}</th>)}
                      <th style={thStyle("#f43f5e")}>Весь час</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseCats.map(cat => {
                      const catEntries = expenseEntries.filter(e => e.catId === cat.id);
                      const monthTotals = months.map(m => catEntries.filter(e => e.date.startsWith(m)).reduce((s, e) => s + toUSD(e.amount, e.currency), 0));
                      const total = catEntries.reduce((s, e) => s + toUSD(e.amount, e.currency), 0);
                      const hasRecurring = catEntries.some(e => e.recurring);
                      const isExpanded = expandedCatRows[`exp_${cat.id}`];
                      if (total === 0 && catEntries.length === 0) return null;
                      return (
                        <React.Fragment key={cat.id}>
                          <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.07)", cursor: "pointer" }} onClick={() => setExpandedCatRows(r => ({ ...r, [`exp_${cat.id}`]: !r[`exp_${cat.id}`] }))}>
                            <td style={{ padding: "8px 8px", color: cat.color, fontWeight: 700 }}>
                              {cat.icon} {cat.name}
                              {hasRecurring && <span style={{ marginLeft: 6, fontSize: 9, color: "#f59e0b", border: "1px solid #f59e0b44", borderRadius: 2, padding: "1px 4px" }}>🔄</span>}
                              <span style={{ fontSize: 9, color: "#5a4a30", marginLeft: 4 }}>{isExpanded ? "▲" : "▼"}</span>
                            </td>
                            {monthTotals.map((v, i) => <td key={i} style={{ textAlign: "right", padding: "8px 8px", color: v > 0 ? "#f43f5e" : "#3a3028" }}>{v > 0 ? `$${v.toFixed(0)}` : "—"}</td>)}
                            <td style={{ textAlign: "right", padding: "8px 8px", color: "#f43f5e", fontWeight: 700 }}>${total.toFixed(0)}</td>
                            <td style={{ textAlign: "right", padding: "4px" }}>
                              <button onClick={e => { e.stopPropagation(); setExpenseCats(prev => prev.filter(c => c.id !== cat.id)); }} title="Видалити категорію" style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 11, padding: 2 }}>× кат.</button>
                            </td>
                          </tr>
                          {isExpanded && catEntries.map(entry => (
                            <tr key={entry.id} style={{ background: "rgba(244,63,94,0.03)", borderBottom: "1px solid rgba(244,63,94,0.06)" }}>
                              <td style={{ padding: "6px 8px 6px 24px", color: "#9a8a60", fontSize: 11 }}>
                                {entry.date} {entry.recurring && <span style={{ color: "#f59e0b", marginRight: 4 }}>🔄</span>}{entry.note && <span style={{ color: "#7a6a48" }}>— {entry.note}</span>}
                              </td>
                              <td colSpan={months.length} />
                              <td style={{ textAlign: "right", padding: "6px 8px", color: "#f43f5e", fontSize: 11 }}>
                                {entry.currency === "UAH" ? `${entry.amount} грн` : `$${entry.amount}`}
                                {entry.currency === "UAH" && <span style={{ color: "#5a4a30", marginLeft: 4 }}>(${toUSD(entry.amount, entry.currency).toFixed(2)})</span>}
                              </td>
                              <td style={{ textAlign: "right", padding: "4px" }}>
                                <button onClick={() => startDelete(entry.id, "expense")} title="Видалити запис" style={{ background: "none", border: "1px solid rgba(201,168,76,0.2)", color: "#5a4a30", cursor: "pointer", fontSize: 10, padding: "3px 6px", borderRadius: 3 }}>🗑</button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                    {expenseEntries.length === 0 && (
                      <tr><td colSpan={months.length + 3} style={{ color: "#5a4a30", padding: "12px 8px", textAlign: "center", fontStyle: "italic" }}>Ще немає записів</td></tr>
                    )}
                    {totalExpenses > 0 && (
                      <tr style={{ borderTop: "2px solid rgba(244,63,94,0.55)", background: "rgba(244,63,94,0.10)" }}>
                        <td style={{ padding: "10px 8px", color: "#f43f5e", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Σ Всього</td>
                        {months.map(m => { const v = expenseEntries.filter(e => e.date.startsWith(m)).reduce((s, e) => s + toUSD(e.amount, e.currency), 0); return <td key={m} style={{ textAlign: "right", padding: "10px 8px", color: v > 0 ? "#f43f5e" : "#3a3028", fontWeight: 700 }}>{v > 0 ? `$${v.toFixed(0)}` : "—"}</td>; })}
                        <td style={{ textAlign: "right", padding: "10px 8px", color: "#f43f5e", fontWeight: 800, fontSize: 14 }}>${totalExpenses.toFixed(0)}</td>
                        <td></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(201,168,76,0.15)" }}>
                <select value={expForm.catId} onChange={e => setExpForm(f => ({ ...f, catId: e.target.value }))} style={selStyle}>
                  {expenseCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
                <input value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} onKeyDown={e => e.key === "Enter" && addExpenseEntry()} placeholder="Сума" type="number" min="0" style={{ ...inpStyle, width: 100 }} />
                <button onClick={() => setExpForm(f => ({ ...f, currency: f.currency === "USD" ? "UAH" : "USD" }))} style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.35)", color: "#f43f5e", padding: "8px 12px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 12, minWidth: 52 }}>{expForm.currency}</button>
                <input value={expForm.note} onChange={e => setExpForm(f => ({ ...f, note: e.target.value }))} placeholder="Нотатка..." style={{ ...inpStyle, flex: 1, minWidth: 80 }} />
                <input type="date" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} style={{ ...inpStyle, width: 130, colorScheme: "dark" }} />
                <button onClick={addExpenseEntry} className="act-btn" style={{ background: "#f43f5e", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>− Записати</button>
                {addingCat !== "expense" ? (
                  <button onClick={() => setAddingCat("expense")} style={{ background: "none", border: "1px dashed rgba(244,63,94,0.3)", color: "#9a8a60", padding: "8px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>+ Категорія</button>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Назва..." style={{ ...inpStyle, width: 120 }} autoFocus />
                    <button onClick={() => { if (!newCatName.trim()) return; setExpenseCats(prev => [...prev, { id: `ec_${Date.now()}`, name: newCatName.trim(), color: "#f43f5e", icon: "💸" }]); setNewCatName(""); setAddingCat(null); }} style={{ background: "#f43f5e", border: "none", color: "#fff", padding: "8px 10px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 11 }}>✓</button>
                    <button onClick={() => { setAddingCat(null); setNewCatName(""); }} style={{ background: "none", border: "none", color: "#9a8a60", cursor: "pointer", fontSize: 16 }}>×</button>
                  </div>
                )}
              </div>
            </div>

            {/* Subscriptions management */}
            <div className="wf-panel" style={{ padding: 16, borderLeft: "3px solid #a855f7", borderTop: "1px solid rgba(168,85,247,0.25)", background: "linear-gradient(rgba(168,85,247,0.04), rgba(168,85,247,0.04)), rgba(5,3,1,0.92)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: subscriptions.length > 0 || showSubForm ? 14 : 0 }}>
                <span className="wf-sec" style={{ marginBottom: 0, paddingBottom: 0, border: "none", color: "#a855f7" }}>📅 Підписки</span>
                <span style={{ fontSize: 11, color: "#9a8a60", marginLeft: 4 }}>автоматично списуються щомісяця</span>
                <button onClick={() => setShowSubForm(v => !v)} style={{ marginLeft: "auto", background: showSubForm ? "rgba(244,63,94,0.12)" : "rgba(201,168,76,0.12)", border: `1px solid ${showSubForm ? "rgba(244,63,94,0.4)" : "rgba(201,168,76,0.4)"}`, color: showSubForm ? "#f43f5e" : "#c9a84c", padding: "5px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                  {showSubForm ? "× Скасувати" : "+ Нова"}
                </button>
              </div>

              {showSubForm && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14, padding: "12px 14px", background: "rgba(8,5,2,0.5)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 4 }}>
                  <select value={subForm.catId} onChange={e => {
                    const cat = expenseCats.find(c => c.id === e.target.value);
                    const prevCat = expenseCats.find(c => c.id === subForm.catId);
                    const autoName = !subForm.name || subForm.name === prevCat?.name;
                    setSubForm(f => ({ ...f, catId: e.target.value, name: autoName ? (cat?.name ?? f.name) : f.name }));
                  }} style={selStyle}>
                    {expenseCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                  <input
                    value={subForm.name}
                    onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Назва (якщо відрізняється від категорії)"
                    style={{ ...inpStyle, flex: 1, minWidth: 120 }}
                  />
                  <input
                    value={subForm.amount}
                    onChange={e => setSubForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="Сума"
                    type="number"
                    min="0"
                    style={{ ...inpStyle, width: 80 }}
                  />
                  <button onClick={() => setSubForm(f => ({ ...f, currency: f.currency === "USD" ? "UAH" : "USD" }))} style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.35)", color: "#f43f5e", padding: "8px 12px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 12, minWidth: 52 }}>{subForm.currency}</button>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 11, color: "#9a8a60", whiteSpace: "nowrap" }}>з дати:</span>
                    <input type="date" value={subForm.startDate} onChange={e => setSubForm(f => ({ ...f, startDate: e.target.value }))} style={{ ...inpStyle, width: 134, colorScheme: "dark" }} />
                  </div>
                  <button onClick={() => {
                    if (!parseFloat(subForm.amount) || !subForm.startDate) return;
                    const cat = expenseCats.find(c => c.id === subForm.catId);
                    const name = subForm.name.trim() || cat?.name || "Підписка";
                    const amt = parseFloat(subForm.amount);
                    const start = new Date(subForm.startDate + "T00:00:00");
                    const billingDay = start.getDate();
                    const now = new Date();
                    const newSubId = `sub_${Date.now()}`;
                    // Generate all past billing dates from start to today
                    const pastDates = [];
                    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
                    while (cur <= now) {
                      const daysInM = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
                      const effDay = Math.min(billingDay, daysInM);
                      const bd = new Date(cur.getFullYear(), cur.getMonth(), effDay);
                      if (bd >= start && bd <= now) pastDates.push(`${bd.getFullYear()}-${String(bd.getMonth()+1).padStart(2,'0')}-${String(bd.getDate()).padStart(2,'0')}`);
                      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
                    }
                    if (pastDates.length > 0) {
                      setExpenseEntries(prev => [...prev, ...pastDates.map((date, idx) => ({
                        id: `exp_${Date.now()}_sub${idx}`, catId: subForm.catId, amount: amt, currency: subForm.currency, date, note: name, recurring: true, subId: newSubId,
                      }))]);
                    }
                    const lastBilledYM = pastDates.length > 0 ? pastDates[pastDates.length - 1].slice(0, 7) : null;
                    setSubscriptions(prev => [...prev, { id: newSubId, name, catId: subForm.catId, amount: amt, currency: subForm.currency, billingDay, startDate: subForm.startDate, lastBilledYM, active: true }]);
                    setSubForm({ name: "", catId: "exp_other", amount: "", currency: "USD", startDate: todayStr() });
                    setShowSubForm(false);
                  }} style={{ background: "#c9a84c", color: "#000", border: "none", padding: "8px 16px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>✓ Додати</button>
                </div>
              )}

              {subscriptions.length === 0 ? (
                <div style={{ fontSize: 12, color: "#5a4a30", textAlign: "center", padding: "14px 0" }}>Немає активних підписок</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[...subscriptions].sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? "")).slice(0, showAllSubs ? undefined : 7).map(sub => {
                    const amtUSD = sub.currency === "UAH" ? sub.amount / uahRate : sub.amount;
                    const isActive = sub.active !== false;
                    const cat = expenseCats.find(c => c.id === sub.catId);
                    const lastEntry = [...expenseEntries]
                      .filter(e => e.subId === sub.id || (e.recurring && e.note === sub.name))
                      .sort((a, b) => b.date.localeCompare(a.date))[0];
                    const lastDate = lastEntry
                      ? new Date(lastEntry.date).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })
                      : null;
                    return (
                      <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 10, background: isActive ? "rgba(8,5,2,0.55)" : "rgba(20,15,5,0.4)", border: `1px solid ${isActive ? "rgba(201,168,76,0.22)" : "rgba(201,168,76,0.08)"}`, borderRadius: 4, padding: "9px 12px", opacity: isActive ? 1 : 0.55 }}>
                        {cat && <span style={{ fontSize: 14 }}>{cat.icon}</span>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: isActive ? "#e0d8c0" : "#9a8a60", fontFamily: "'Exo 2',sans-serif", fontWeight: 600, fontSize: 13 }}>{sub.name}</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                            {cat && <span style={{ fontSize: 10, color: "#5a4a30" }}>{cat.name}</span>}
                            <span style={{ fontSize: 10, color: "#6a5840", fontFamily: "'Space Mono',monospace" }}>
                              🗓 {sub.startDate
                                ? `з ${new Date(sub.startDate + "T00:00:00").toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" })}`
                                : `${sub.billingDay ?? 1}-го числа`}
                            </span>
                            {lastDate ? (
                              <span style={{ fontSize: 10, color: "#5a5030", fontFamily: "'Space Mono',monospace" }}>· списано {lastDate}</span>
                            ) : (
                              <span style={{ fontSize: 10, color: "#4a3a25", fontFamily: "'Space Mono',monospace" }}>· ще не списувалось</span>
                            )}
                          </div>
                        </div>
                        <span style={{ color: "#f43f5e", fontFamily: "'Space Mono',monospace", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {sub.currency === "UAH" ? `${sub.amount} грн` : `$${sub.amount}`}
                          {sub.currency === "UAH" && <span style={{ color: "#5a4a30", fontSize: 10, marginLeft: 4 }}>(~${amtUSD.toFixed(1)})</span>}
                        </span>
                        <span style={{ fontSize: 10, color: isActive ? "#10b981" : "#f59e0b", background: isActive ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", border: `1px solid ${isActive ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`, borderRadius: 10, padding: "2px 8px", fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap" }}>
                          {isActive ? "🟢 активна" : "⏸ пауза"}
                        </span>
                        <button onClick={() => setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, active: !isActive } : s))} style={{ background: isActive ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${isActive ? "rgba(245,158,11,0.35)" : "rgba(16,185,129,0.35)"}`, color: isActive ? "#f59e0b" : "#10b981", padding: "5px 10px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                          {isActive ? "⏸" : "▶"}
                        </button>
                        <button onClick={() => setSubscriptions(prev => prev.filter(s => s.id !== sub.id))} style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", color: "#f43f5e", padding: "5px 8px", borderRadius: 3, cursor: "pointer", fontSize: 13, lineHeight: 1 }}>×</button>
                      </div>
                    );
                  })}
                  {subscriptions.length > 7 && (
                    <button onClick={() => setShowAllSubs(v => !v)} style={{ background: "none", border: "1px solid rgba(201,168,76,0.2)", color: "#9a8a60", padding: "6px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono',monospace", letterSpacing: 0.5 }}>
                      {showAllSubs ? "▲ Сховати" : `▼ Ще ${subscriptions.length - 7} підписок`}
                    </button>
                  )}
                  <div style={{ fontSize: 11, color: "#5a4a60", textAlign: "right", paddingTop: 4, fontFamily: "'Space Mono',monospace" }}>
                    Щомісяця: <span style={{ color: "#f43f5e", fontWeight: 700 }}>${subscriptions.filter(s => s.active !== false).reduce((sum, s) => sum + (s.currency === "UAH" ? s.amount / uahRate : s.amount), 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Annual analytics + chart */}
            <div className="wf-panel" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span className="wf-sec" style={{ marginBottom: 0, paddingBottom: 0, border: "none" }}>📊 Аналітика</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                  <button onClick={() => setAnalyticsYear(y => y - 1)} style={{ background: "none", border: "1px solid rgba(201,168,76,0.3)", color: "#9a8a60", padding: "4px 10px", borderRadius: 3, cursor: "pointer", fontSize: 12 }}>‹</button>
                  <span style={{ color: "#c9a84c", fontWeight: 800, fontFamily: "'Exo 2',sans-serif", minWidth: 44, textAlign: "center" }}>{chartYear}</span>
                  <button onClick={() => setAnalyticsYear(y => y + 1)} style={{ background: "none", border: "1px solid rgba(201,168,76,0.3)", color: "#9a8a60", padding: "4px 10px", borderRadius: 3, cursor: "pointer", fontSize: 12 }}>›</button>
                </div>
              </div>

              {/* Year totals row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { label: `Дохід ${chartYear}`, val: `$${yearInc.toFixed(0)}`, color: "#10b981" },
                  { label: `Витрати ${chartYear}`, val: `$${yearExp.toFixed(0)}`, color: "#f43f5e" },
                  { label: "Різниця", val: `${yearNet >= 0 ? "+" : ""}$${yearNet.toFixed(0)}`, color: yearNet >= 0 ? "#00ff88" : "#f43f5e" },
                ].map(s => (
                  <div key={s.label} style={{ background: "rgba(8,5,2,0.65)", border: `1px solid ${s.color}30`, borderLeft: `3px solid ${s.color}90`, borderRadius: 4, padding: "12px 14px", textAlign: "center", boxShadow: `0 0 18px ${s.color}0a, inset 0 0 30px rgba(0,0,0,0.3)` }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif", textShadow: `0 0 14px ${s.color}55`, letterSpacing: "-0.5px" }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: "#6a5a40", marginTop: 4, textTransform: "uppercase", letterSpacing: 1.5 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* SVG line chart */}
              <div style={{ background: "rgba(5,3,1,0.5)", borderRadius: 4, padding: "8px 4px 4px", border: "1px solid rgba(201,168,76,0.12)", position: "relative" }}>
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}
                  onMouseLeave={() => setChartTooltip(null)}>
                  <defs>
                    <clipPath id="posClip"><rect x={PL} y={PT} width={cW} height={Math.max(0, zeroY - PT)} /></clipPath>
                    <clipPath id="negClip"><rect x={PL} y={zeroY} width={cW} height={Math.max(0, PT + cH - zeroY)} /></clipPath>
                  </defs>
                  {/* Grid lines */}
                  {[0.25,0.5,0.75,1].map(p => (
                    <line key={p} x1={PL} y1={PT + cH*(1-p)} x2={W-PR} y2={PT + cH*(1-p)} stroke="rgba(201,168,76,0.07)" strokeWidth="1" />
                  ))}
                  {/* Zero line */}
                  <line x1={PL} y1={zeroY} x2={W-PR} y2={zeroY} stroke="rgba(201,168,76,0.35)" strokeWidth="1" strokeDasharray="4,3" />
                  {/* Area fills */}
                  <path d={netAreaPath} fill="rgba(16,185,129,0.22)" clipPath="url(#posClip)" />
                  <path d={netAreaPath} fill="rgba(244,63,94,0.22)" clipPath="url(#negClip)" />
                  {/* Net line */}
                  <path d={netLinePath} fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinejoin="round" />
                  {/* Hovered column highlight */}
                  {chartTooltip !== null && (() => {
                    const colW2 = cW / 11;
                    return <rect x={Math.max(PL, px(chartTooltip) - colW2/2)} y={PT} width={colW2} height={cH} fill="rgba(201,168,76,0.07)" rx={2} />;
                  })()}
                  {/* Dots */}
                  {chartNet.map((v, i) => (v !== 0 &&
                    <circle key={i} cx={px(i)} cy={pyNet(v)} r={chartTooltip === i ? 4.5 : 3}
                      fill={v >= 0 ? "#10b981" : "#f43f5e"}
                      stroke={chartTooltip === i ? (v >= 0 ? "#10b981" : "#f43f5e") : "none"}
                      strokeWidth="2" strokeOpacity="0.4" />
                  ))}
                  {/* Invisible hover column areas (on top of dots) */}
                  {chartNet.map((v, i) => {
                    const colW2 = cW / 11;
                    return (
                      <rect key={`h${i}`} x={Math.max(PL, px(i) - colW2/2)} y={PT} width={colW2} height={cH}
                        fill="transparent" style={{ cursor: "crosshair" }}
                        onMouseEnter={() => setChartTooltip(i)} />
                    );
                  })}
                  {/* Month labels */}
                  {MONTH_NAMES.map((name, i) => (
                    <text key={i} x={px(i)} y={H-5} textAnchor="middle"
                      fill={chartTooltip === i ? "rgba(201,168,76,0.95)" : "rgba(154,138,96,0.6)"}
                      fontSize="9" fontFamily="monospace" fontWeight={chartTooltip === i ? "700" : "400"}>{name}</text>
                  ))}
                  {/* Y-axis main labels: max, 0, min */}
                  {[
                    ...(maxNet > 0.5 ? [[maxNet, PT, "#10b981"]] : []),
                    [0, zeroY, "#c9a84c"],
                    ...(minNet < -0.5 ? [[minNet, PT+cH, "#f43f5e"]] : [])
                  ].map(([val, yPos, col]) => (
                    <g key={`lbl${val}`}>
                      <rect x={1} y={yPos-7} width={PL-5} height={13} rx={2} fill="rgba(6,4,1,0.8)" />
                      <text x={PL-5} y={yPos+4} textAnchor="end" fill={col} fontSize="9" fontFamily="monospace" fontWeight="700">
                        {val > 0 ? `+$${Math.round(val)}` : val < 0 ? `-$${Math.round(Math.abs(val))}` : "$0"}
                      </text>
                    </g>
                  ))}
                  {/* 50% midpoint labels */}
                  {[
                    ...(maxNet > 25 ? [[maxNet/2, pyNet(maxNet/2), "#10b981"]] : []),
                    ...(minNet < -25 ? [[minNet/2, pyNet(minNet/2), "#f43f5e"]] : [])
                  ].map(([val, yPos, col]) => (
                    <g key={`mid${val}`}>
                      <rect x={1} y={yPos-5} width={PL-5} height={10} rx={2} fill="rgba(6,4,1,0.65)" />
                      <text x={PL-5} y={yPos+3.5} textAnchor="end" fill={col} fillOpacity="0.55" fontSize="7.5" fontFamily="monospace">
                        {val > 0 ? `+$${Math.round(val)}` : `-$${Math.round(Math.abs(val))}`}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* HTML tooltip overlay */}
                {chartTooltip !== null && (() => {
                  const i = chartTooltip;
                  const inc = chartInc[i];
                  const exp = chartExp[i];
                  const net = chartNet[i];
                  const leftPct = px(i) / W * 100;
                  const flipLeft = i >= 9;
                  const fmtAmt = (v) => `$${Math.round(Math.abs(v))}`;
                  return (
                    <div style={{
                      position: "absolute", top: 6,
                      left: `${leftPct}%`,
                      transform: flipLeft ? "translateX(-108%)" : "translateX(6%)",
                      background: "linear-gradient(160deg,rgba(16,11,4,0.98),rgba(8,5,2,0.98))",
                      border: "1px solid rgba(201,168,76,0.4)",
                      borderTop: "2px solid rgba(201,168,76,0.65)",
                      borderRadius: 5,
                      padding: "8px 12px",
                      minWidth: 138,
                      boxShadow: "0 6px 24px rgba(0,0,0,0.75), 0 0 16px rgba(201,168,76,0.06)",
                      pointerEvents: "none",
                      zIndex: 10,
                      fontFamily: "'Space Mono',monospace",
                    }}>
                      <div style={{ fontSize: 10, color: "#c9a84c", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7, fontFamily: "'Exo 2',sans-serif", borderBottom: "1px solid rgba(201,168,76,0.2)", paddingBottom: 5 }}>
                        {MONTH_NAMES[i]} {chartYear}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 9, color: "#4a7a5a", letterSpacing: 0.5 }}>📈 дохід</span>
                          <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>{fmtAmt(inc)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 9, color: "#7a3a4a", letterSpacing: 0.5 }}>📉 витрати</span>
                          <span style={{ fontSize: 11, color: "#f43f5e", fontWeight: 700 }}>{fmtAmt(exp)}</span>
                        </div>
                        <div style={{ borderTop: "1px solid rgba(201,168,76,0.18)", marginTop: 2, paddingTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 9, color: "#8a7a50" }}>різниця</span>
                          <span style={{ fontSize: 12, color: net >= 0 ? "#00ff88" : "#f43f5e", fontWeight: 800, textShadow: `0 0 8px ${net >= 0 ? "#00ff88" : "#f43f5e"}60` }}>
                            {net >= 0 ? "+" : "-"}{fmtAmt(net)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: "flex", gap: 16, justifyContent: "center", paddingTop: 6, paddingBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#10b981", fontFamily: "'Space Mono',monospace" }}>■ профіцит</span>
                  <span style={{ fontSize: 10, color: "#f43f5e", fontFamily: "'Space Mono',monospace" }}>■ дефіцит</span>
                  <span style={{ fontSize: 10, color: "#c9a84c", fontFamily: "'Space Mono',monospace" }}>— дохід − витрати</span>
                </div>
              </div>
            </div>

            {/* Milestone bars */}
            <div className="wf-panel" style={{ padding: 16 }}>
              <div className="wf-sec">🏁 Дохідні цілі</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "До $100", max: 100, color: "#10b981" },
                  { label: "До $1,000", max: 1000, color: "#6366f1" },
                  { label: "До $10,000", max: 10000, color: "#f43f5e" },
                  { label: "До $100,000", max: 100000, color: "#f59e0b" },
                ].map(g => (
                  <div key={g.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5 }}>
                      <span style={{ color: "#e0d8c0" }}>{g.label}</span>
                      <span style={{ color: g.color, fontFamily: "'Space Mono',monospace" }}>${totalIncome.toFixed(0)} · {Math.min(100, (totalIncome / g.max) * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(201,168,76,0.12)", borderRadius: 3 }}>
                      <div style={{ width: `${Math.min(100, (totalIncome / g.max) * 100)}%`, height: "100%", background: g.color, borderRadius: 3, transition: "width 0.5s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
          );
        })()}

        {/* Project delete confirmation modal */}
        {projectDeleteConfirm !== null && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", zIndex: 9995, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div className="wf-panel" style={{ maxWidth: 380, width: "100%", padding: 24 }}>
              <div style={{ fontSize: 22, marginBottom: 12, textAlign: "center" }}>🗑</div>
              <div className="wf-sec" style={{ textAlign: "center", marginBottom: 8 }}>Видалити проект?</div>
              <div style={{ fontSize: 13, color: "#e0d8c0", textAlign: "center", marginBottom: 6, fontFamily: "'Exo 2',sans-serif", fontWeight: 700 }}>«{projects[projectDeleteConfirm]?.name}»</div>
              {(() => {
                const dp = projects[projectDeleteConfirm];
                const totalDeduct = (dp?.creationXP ?? 200) + (dp?.completionXPPaid ? (dp?.completionXP ?? 0) : 0);
                return <div style={{ fontSize: 12, color: "#f43f5e", textAlign: "center", marginBottom: 20, fontFamily: "'Space Mono',monospace" }}>−{totalDeduct} XP</div>;
              })()}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => {
                  const dp = projects[projectDeleteConfirm];
                  const totalDeduct = (dp?.creationXP ?? 200) + (dp?.completionXPPaid ? (dp?.completionXP ?? 0) : 0);
                  setProjects(prev => prev.filter((_, idx) => idx !== projectDeleteConfirm));
                  loseXP(totalDeduct, "project", "↩ проект видалено");
                  setProjectDeleteConfirm(null);
                }} style={{ flex: 1, background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.5)", color: "#f43f5e", padding: "10px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>Так, видалити</button>
                <button onClick={() => setProjectDeleteConfirm(null)} style={{ flex: 1, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", padding: "10px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Скасувати</button>
              </div>
            </div>
          </div>
        )}

        {/* Projects */}
        {activeTab === "projects" && (
          <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
              <input
                value={projectInput}
                onChange={e => setProjectInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addProject()}
                placeholder="Назва проекту..."
                style={{ flex: 1, minWidth: 200, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "10px 14px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
              />
              <select value={projectCategory} onChange={e => setProjectCategory(e.target.value)}
                style={{ background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "10px 12px", color: "#c9a84c", fontSize: 12, cursor: "pointer" }}>
                {PROJECT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: "6px 12px" }}>
                <span style={{ fontSize: 11, color: "#6a5a40", whiteSpace: "nowrap" }}>XP за виконання:</span>
                <input
                  type="number" min="0" max="99999"
                  value={projectCompletionXP}
                  onChange={e => setProjectCompletionXP(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 90, background: "none", border: "none", color: "#c9a84c", fontSize: 13, fontFamily: "'Space Mono',monospace", fontWeight: 700, outline: "none", textAlign: "center", MozAppearance: "textfield", appearance: "textfield" }}
                />
              </div>
              <button className="act-btn" onClick={addProject} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Додати</button>
            </div>
            {/* Active projects grouped by category */}
            {(() => {
              const activeProjects = projects.filter(p => (p.status ?? "done") !== "done");
              const doneProjects = projects.filter(p => (p.status ?? "done") === "done");
              const projectCard = (p) => {
                const realIdx = projects.indexOf(p);
                const status = p.status ?? "done";
                const cxp = p.completionXP ?? 0;
                const isDone = status === "done";
                const changeStatus = (next) => {
                  setProjects(prev => prev.map((x, idx) => {
                    if (idx !== realIdx) return x;
                    const paid = x.completionXPPaid ?? false;
                    const xcxp = x.completionXP ?? 0;
                    if (next === "done" && !paid && xcxp > 0) {
                      gainXP(xcxp, `🚀 ${x.name}`, "project");
                      return { ...x, status: next, completionXPPaid: true, completedAt: new Date().toISOString() };
                    }
                    if (next !== "done" && paid && xcxp > 0) {
                      loseXP(xcxp, "project", "↩ проект не завершено");
                      return { ...x, status: next, completionXPPaid: false, completedAt: null };
                    }
                    return { ...x, status: next, completedAt: next === "done" ? (x.completedAt ?? new Date().toISOString()) : null };
                  }));
                };
                const cat = PROJECT_CATEGORIES.find(c => c.id === (p.category ?? "other")) ?? PROJECT_CATEGORIES[PROJECT_CATEGORIES.length - 1];
                const stCfg = PROJECT_STATUSES.find(s => s.id === status) ?? PROJECT_STATUSES[0];
                const doneDate = p.completedAt ? new Date(p.completedAt).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" }) : p.date;
                return (
                  <div key={realIdx} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(5,3,1,0.76)", border: `1px solid rgba(201,168,76,0.15)`, borderLeft: `3px solid ${cat.color}`, borderRadius: 4, padding: "12px 16px", opacity: isDone ? 0.62 : 1 }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: isDone ? "#6a7060" : "#e0d8c0", fontSize: 13, fontFamily: "'Exo 2',sans-serif", fontWeight: 600, textDecoration: isDone ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      {cxp > 0 && (
                        <div style={{ fontSize: 11, color: isDone ? "#3a5030" : "#5a4a20", fontFamily: "'Space Mono',monospace", marginTop: 2 }}>{isDone ? `✓ +${cxp} XP отримано` : `🔒 +${cxp} XP при завершенні`}</div>
                      )}
                    </div>
                    <span style={{ color: "#6a5a40", fontSize: 11, fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>{isDone ? `✓ ${doneDate}` : p.date}</span>
                    <select value={status} onChange={e => changeStatus(e.target.value)} title="Статус"
                      style={{ fontSize: 11, padding: "4px 8px", borderRadius: 3, border: `1px solid ${stCfg.border}`, background: stCfg.bg, color: stCfg.color, cursor: "pointer", fontWeight: 700, fontFamily: "'Exo 2',sans-serif" }}>
                      {PROJECT_STATUSES.map(s => <option key={s.id} value={s.id} style={{ background: "#0c0903", color: "#e0d8c0" }}>{s.label}</option>)}
                    </select>
                    <button onClick={() => setProjectDeleteConfirm(realIdx)} title="Видалити" style={{ background: "none", border: "none", color: "#5a3a30", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 4px" }} onMouseEnter={e => e.target.style.color="#f43f5e"} onMouseLeave={e => e.target.style.color="#5a3a30"}>×</button>
                  </div>
                );
              };

              const catGroups = PROJECT_CATEGORIES.map(cat => ({
                cat,
                items: activeProjects.filter(p => (p.category ?? "other") === cat.id),
              })).filter(g => g.items.length > 0);

              // виконані: найсвіжіші зверху
              const sortedDone = [...doneProjects].sort((a, b) =>
                (b.completedAt ? new Date(b.completedAt).getTime() : 0) - (a.completedAt ? new Date(a.completedAt).getTime() : 0));

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {catGroups.length === 0 && !doneProjects.length && (
                    <div style={{ textAlign: "center", padding: 32, color: "#6a5f40", fontSize: 13 }}>Ще немає проектів. Додай перший!</div>
                  )}
                  {catGroups.map(({ cat, items }) => (
                    <div key={cat.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ background: `${cat.color}14`, border: `1px solid ${cat.color}44`, color: cat.color, padding: "3px 12px", borderRadius: 3, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{cat.icon} {cat.label}</span>
                        <span style={{ fontSize: 11, color: "#5a4a30" }}>{items.length} {items.length === 1 ? "проект" : "проекти"}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {items.map(projectCard)}
                      </div>
                    </div>
                  ))}

                  {/* Виконані проекти — затухлий список, найсвіжіші зверху */}
                  {sortedDone.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: "#3a6a3a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8, marginTop: 4 }}>✓ Виконано · {sortedDone.length}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {sortedDone.map(projectCard)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === "progress" && (() => {
          const PRESET_TAGS = ["AI-інструмент", "проект", "навичка", "дохід", "ідея", "перемога", "урок"];
          const addEntry = () => {
            if (!progressInput.trim()) return;
            const entry = { id: `pr_${Date.now()}`, date: progressDate, text: progressInput.trim(), tags: progressTags };
            setProgressLog(prev => [entry, ...prev]);
            recordActiveDay();
            setProgressInput("");
            setProgressTags([]);
            setProgressDate(todayStr());
          };
          const grouped = progressLog.reduce((acc, e) => {
            (acc[e.date] = acc[e.date] ?? []).push(e);
            return acc;
          }, {});
          const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
          const visibleDates = progressShowAll ? sortedDates : sortedDates.slice(0, 7);
          const fmtDate = (ds) => {
            const d = new Date(ds + "T00:00:00");
            const today = todayStr();
            const yest = (() => { const x = new Date(); x.setDate(x.getDate()-1); return x.toISOString().slice(0,10); })();
            if (ds === today) return "Сьогодні";
            if (ds === yest) return "Вчора";
            return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
          };
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Input card */}
              <div className="wf-panel" style={{ padding: 16 }}>
                <div className="wf-sec">✍️ Що зробив сьогодні?</div>
                <textarea value={progressInput} onChange={e => setProgressInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) addEntry(); }}
                  placeholder="Опиши свій прогрес, досягнення або відкриття…"
                  rows={3} style={{ width: "100%", background: "rgba(8,5,2,0.7)", border: "1px solid rgba(201,168,76,0.25)", color: "#e0d8c0", padding: "10px 12px", borderRadius: 4, fontSize: 13, fontFamily: "'Exo 2',sans-serif", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5, colorScheme: "dark", marginBottom: 10 }} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {PRESET_TAGS.map(tag => {
                    const active = progressTags.includes(tag);
                    return (
                      <button key={tag} onClick={() => setProgressTags(p => active ? p.filter(t=>t!==tag) : [...p, tag])}
                        style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, border: `1px solid ${active ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.2)"}`, background: active ? "rgba(201,168,76,0.18)" : "none", color: active ? "#c9a84c" : "#6a5840", cursor: "pointer", fontFamily: "'Space Mono',monospace" }}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="date" value={progressDate} onChange={e => setProgressDate(e.target.value)}
                    style={{ background: "rgba(8,5,2,0.7)", border: "1px solid rgba(201,168,76,0.25)", color: "#9a8a60", padding: "6px 10px", borderRadius: 4, fontSize: 12, fontFamily: "'Space Mono',monospace", outline: "none", colorScheme: "dark" }} />
                  <button onClick={addEntry} disabled={!progressInput.trim()}
                    style={{ marginLeft: "auto", background: progressInput.trim() ? "#c9a84c" : "rgba(201,168,76,0.1)", border: "none", color: progressInput.trim() ? "#000" : "#5a4a30", padding: "8px 20px", borderRadius: 4, cursor: progressInput.trim() ? "pointer" : "default", fontWeight: 800, fontSize: 13, fontFamily: "'Exo 2',sans-serif" }}>
                    + Додати
                  </button>
                </div>
              </div>

              {/* Log */}
              {sortedDates.length === 0 ? (
                <div className="wf-panel" style={{ padding: 24, textAlign: "center", color: "#4a3a20", fontSize: 13 }}>
                  Ще немає записів — зроби перший! 🚀
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {visibleDates.map(ds => (
                    <div key={ds}>
                      <div style={{ fontSize: 11, color: "#6a5a40", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'Space Mono',monospace", marginBottom: 6, paddingLeft: 2 }}>
                        {fmtDate(ds)}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {grouped[ds].map(entry => (
                          <div key={entry.id} className="wf-panel" style={{ padding: "12px 14px", position: "relative" }}>
                            <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 2 }}>
                              <button onClick={() => { setProgressEditId(entry.id); setProgressEditText(entry.text); }}
                                style={{ background: "none", border: "none", color: "#4a3a25", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "2px 5px" }}
                                onMouseEnter={e => e.target.style.color="#c9a84c"} onMouseLeave={e => e.target.style.color="#4a3a25"}>✎</button>
                              <button onClick={() => setProgressLog(p => p.filter(e => e.id !== entry.id))}
                                style={{ background: "none", border: "none", color: "#4a3a25", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 4px" }}
                                onMouseEnter={e => e.target.style.color="#f43f5e"} onMouseLeave={e => e.target.style.color="#4a3a25"}>×</button>
                            </div>
                            {progressEditId === entry.id ? (
                              <div style={{ paddingRight: 52 }}>
                                <textarea
                                  autoFocus
                                  ref={el => {
                                    progressEditRef.current = el;
                                    // авто-висота під увесь текст при відкритті (один раз)
                                    if (el && !el.dataset.sized) { el.dataset.sized = "1"; el.style.height = "auto"; el.style.height = Math.max(72, el.scrollHeight + 2) + "px"; }
                                  }}
                                  value={progressEditText}
                                  onChange={e => {
                                    setProgressEditText(e.target.value);
                                    // росте під текст, але не зменшується нижче поточної (ручної) висоти
                                    const cur = e.target.offsetHeight;
                                    e.target.style.height = "auto";
                                    e.target.style.height = Math.max(72, cur, e.target.scrollHeight + 2) + "px";
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === "Enter" && e.ctrlKey) { setProgressLog(p => p.map(x => x.id === entry.id ? { ...x, text: progressEditText.trim() || x.text } : x)); setProgressEditId(null); }
                                    if (e.key === "Escape") setProgressEditId(null);
                                  }}
                                  style={{ width: "100%", minHeight: 72, background: "rgba(8,5,2,0.8)", border: "1px solid rgba(201,168,76,0.35)", borderBottom: "none", borderRadius: "3px 3px 0 0", padding: "8px 10px", color: "#fff", fontSize: 13, fontFamily: "'Exo 2',sans-serif", resize: "none", overflow: "hidden", lineHeight: 1.6, display: "block", boxSizing: "border-box" }}
                                />
                                {/* Помітна ручка-смужка для ручного розтягування */}
                                <div
                                  onMouseDown={e => {
                                    e.preventDefault();
                                    const ta = progressEditRef.current;
                                    if (!ta) return;
                                    const startY = e.clientY;
                                    const startH = ta.offsetHeight;
                                    const onMove = ev => { ta.style.height = Math.max(72, startH + (ev.clientY - startY)) + "px"; };
                                    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                                    window.addEventListener("mousemove", onMove);
                                    window.addEventListener("mouseup", onUp);
                                  }}
                                  title="Потягни, щоб змінити висоту"
                                  style={{ height: 18, background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.35)", borderTop: "none", borderRadius: "0 0 3px 3px", cursor: "ns-resize", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, userSelect: "none" }}>
                                  <span style={{ width: 22, height: 2, background: "rgba(201,168,76,0.55)", borderRadius: 2 }} />
                                  <span style={{ width: 10, height: 2, background: "rgba(201,168,76,0.4)", borderRadius: 2 }} />
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                  <button onClick={() => { setProgressLog(p => p.map(x => x.id === entry.id ? { ...x, text: progressEditText.trim() || x.text } : x)); setProgressEditId(null); }}
                                    style={{ background: "#c9a84c", border: "none", color: "#000", padding: "5px 14px", borderRadius: 3, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Зберегти</button>
                                  <button onClick={() => setProgressEditId(null)}
                                    style={{ background: "none", border: "1px solid rgba(201,168,76,0.25)", color: "#6a5a40", padding: "5px 12px", borderRadius: 3, cursor: "pointer", fontSize: 12 }}>Скасувати</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: 13, color: "#e0d8c0", lineHeight: 1.6, fontFamily: "'Exo 2',sans-serif", paddingRight: 52, whiteSpace: "pre-wrap" }}>{entry.text}</div>
                            )}
                            {entry.tags?.length > 0 && (
                              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                                {entry.tags.map(tag => (
                                  <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: "#8a7a50", fontFamily: "'Space Mono',monospace" }}>{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {sortedDates.length > 7 && (
                    <button onClick={() => setProgressShowAll(v => !v)}
                      style={{ background: "none", border: "1px solid rgba(201,168,76,0.2)", color: "#6a5840", padding: "8px", borderRadius: 3, cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono',monospace" }}>
                      {progressShowAll ? "▲ Сховати" : `▼ Показати всі (${sortedDates.length} днів)`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === "stats" && (() => {
          const net = totalIncome - totalExpenses;
          const netColor = net >= 0 ? "#00ff88" : "#f43f5e";
          const SKILL_STAT_ROWS = [
            { catId: "llm",        emoji: "🧠", label: "LLM",            tasks: [{ id: "prompts", label: "Промптів" }, { id: "real_tasks", label: "Задач вирішено" }] },
            { catId: "image",      emoji: "🎨", label: "Зображення",     tasks: [{ id: "images_gen", label: "Згенеровано" }, { id: "images_commercial", label: "Комерційних" }] },
            { catId: "video",      emoji: "🎬", label: "Відео",          tasks: [{ id: "videos_created", label: "Створено" }, { id: "videos_commercial", label: "Для клієнтів" }] },
            { catId: "voice",      emoji: "🎙️", label: "Голос / Аудіо", tasks: [{ id: "audio_files", label: "Аудіо-файлів" }, { id: "audio_minutes", label: "Хвилин" }] },
            { catId: "music",      emoji: "🎵", label: "Музика",         tasks: [{ id: "tracks_created", label: "Треків" }, { id: "tracks_published", label: "Опублікованих" }] },
            { catId: "automation", emoji: "⚙️", label: "Автоматизація", tasks: [{ id: "automations_created", label: "Автоматизацій" }, { id: "hours_saved", label: "Год заощаджено" }] },
            { catId: "code",       emoji: "💻", label: "Код",            tasks: [{ id: "lines_written", label: "Рядків коду" }, { id: "projects_launched", label: "Проектів" }] },
            { catId: "design",     emoji: "✨", label: "Дизайн",         tasks: [{ id: "mockups_created", label: "Макетів" }, { id: "logos_created", label: "Логотипів" }] },
            { catId: "content",    emoji: "📱", label: "Контент",        tasks: [{ id: "posts_published", label: "Постів" }, { id: "followers_gained", label: "Підписників" }, { id: "content_views", label: "Переглядів" }] },
            { catId: "monetize",   emoji: "💰", label: "Монетизація",    tasks: [{ id: "ai_income", label: "Дохід ($)" }, { id: "clients", label: "Клієнтів" }] },
          ];
          // XP sources — "Сьогодні" береться з журналу XP, а "Загалом" рахується
          // напряму з поточного стану (точне джерело правди), щоб усі вкладки, з яких
          // приходить XP, мали правильні суми незалежно від моменту старту обліку.
          const xpToday_act = ACTIVITY_DEFS.reduce((s, d) => s + (todayActivity[d.key] ?? 0) * d.xp, 0);
          const todayLogEntries = xpLog.filter(e => e.date === todayStr());
          const todayBySource = todayLogEntries.reduce((acc, e) => { acc[e.source] = (acc[e.source] ?? 0) + e.amount; return acc; }, {});
          todayBySource.activity = xpToday_act;

          // Точні «Загалом» з поточного стану:
          const derivedAch = ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id)).reduce((s, a) => s + a.xp, 0);
          const derivedIncome = incomeEntries.reduce((s, e) => s + (e.xpPaid ?? 0), 0);
          const derivedSession = sessions.dates.length * 5;
          let skillTaskXP = 0;
          SKILL_TASKS.forEach(cat => {
            cat.progressive.forEach(t => {
              const claimed = skillTasksData[`${cat.id}_${t.id}`]?.claimed ?? [];
              t.milestones.forEach((m, i) => { if (claimed.includes(i)) skillTaskXP += m.xp; });
            });
            cat.oneTime.forEach(t => { if (skillTasksData[`${cat.id}_${t.id}`] === true) skillTaskXP += t.xp; });
          });
          const derivedSkill = totalTools * 100 + skillTaskXP;
          // Цілі/план/проекти ведуться журналом (нові, відстежувані)
          const totalBySource = xpLog.reduce((acc, e) => { acc[e.source] = (acc[e.source] ?? 0) + e.amount; return acc; }, {});
          const logGoalPlan = (totalBySource.goal ?? 0) + (totalBySource.plan ?? 0);
          const logProject = totalBySource.project ?? 0;
          // Активність = решта (поглинає стартові 300 XP та все, що поза іншими джерелами).
          // AI-сесії формально теж активність → зливаємо у «Активність».
          const accountedNonActivity = derivedSkill + derivedAch + derivedIncome + derivedSession + logGoalPlan + logProject;
          const derivedActivity = Math.max(0, totalXP - accountedNonActivity);
          const activityTotal = derivedActivity + derivedSession;

          const XP_GROUPS = [
            { key: "activity",    emoji: "⚡", label: "Активність",            color: "#00ff88", desc: "дії + AI-сесії",                total: activityTotal, todayKeys: ["activity", "session"] },
            { key: "goal_plan",   emoji: "🎯", label: "Цілі & задачі",         color: "#06b6d4", desc: "цілі + план дій",               total: logGoalPlan,   todayKeys: ["goal", "plan"] },
            { key: "skill",       emoji: "🧩", label: "Навички + інструменти", color: "#6366f1", desc: `${totalTools} інструментів`,     total: derivedSkill,  todayKeys: ["skill"] },
            { key: "project",     emoji: "🚀", label: "Проекти",               color: "#a855f7", desc: `${projects.length} проектів`,    total: logProject,    todayKeys: ["project"] },
            { key: "achievement", emoji: "🏆", label: "Досягнення",            color: "#fbbf24", desc: `${unlockedAchievements.length} нагород`, total: derivedAch, todayKeys: ["achievement"] },
            { key: "income",      emoji: "💰", label: "Фінанси",               color: "#10b981", desc: "дохід з AI",                    total: derivedIncome, todayKeys: ["income"] },
          ];
          const allGroups = XP_GROUPS;
          const grpTodayVal = (grp) => grp.todayKeys.reduce((s, k) => s + (todayBySource[k] ?? 0), 0);
          const sourcesTotal = XP_GROUPS.reduce((s, g) => s + g.total, 0);
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Джерела XP */}
              <div>
                <div className="wf-sec" style={{ marginBottom: 16 }}>⭐ Джерела XP</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                  {allGroups.map(grp => {
                    const tval = grpTodayVal(grp);
                    const aval = grp.total;
                    if (aval === 0 && tval === 0) return null;
                    return (
                      <div key={grp.key} className="wf-card" style={{ padding: "12px 14px", border: `1px solid ${grp.color}33`, borderTop: `2px solid ${grp.color}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                          <span style={{ fontSize: 18 }}>{grp.emoji}</span>
                          <div>
                            <div style={{ fontSize: 10, color: "#c9b890", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{grp.label}</div>
                            {grp.desc && <div style={{ fontSize: 9, color: "#5a5040", fontFamily: "'Space Mono',monospace" }}>{grp.desc}</div>}
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 6, padding: "6px 8px" }}>
                            <div style={{ fontSize: 9, color: "#6a5a38", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>Сьогодні</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: tval > 0 ? grp.color : "#4a4030", fontFamily: "'Space Mono',monospace" }}>{tval > 0 ? <>+{tval}<span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, marginLeft: 2 }}>XP</span></> : "—"}</div>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 6, padding: "6px 8px" }}>
                            <div style={{ fontSize: 9, color: "#6a5a38", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>Загалом</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: grp.color, fontFamily: "'Space Mono',monospace" }}>{aval > 0 ? <>+{aval.toLocaleString()}<span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, marginLeft: 2 }}>XP</span></> : "—"}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 8, fontSize: 12, fontFamily: "'Space Mono',monospace", color: "#9a8a60" }}>
                  <span>Разом по джерелах:</span>
                  <b style={{ color: "#c9a84c", fontSize: 14 }}>{sourcesTotal.toLocaleString()} XP</b>
                  <span style={{ color: "#5a5040" }}>= рівень ({totalXP.toLocaleString()} XP)</span>
                </div>
              </div>
              {/* Фінанси */}
              <div>
                <div className="wf-sec" style={{ marginBottom: 16 }}>💸 Фінанси <span style={{ fontSize: 11, color: "#6a5f40", fontWeight: 400 }}>· ▼ розгорнути періоди</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {(() => {
                    const incEntries = incomeEntries.map(e => ({ date: e.date, delta: toUSD(e.amount, e.currency) }));
                    const expEntries = expenseEntries.map(e => ({ date: e.date, delta: toUSD(e.amount, e.currency) }));
                    const netEntries = [...incEntries, ...expenseEntries.map(e => ({ date: e.date, delta: -toUSD(e.amount, e.currency) }))];
                    return [
                      { label: "Дохід", value: `$${totalIncome.toFixed(2)}`, color: "#00ff88", entries: incEntries },
                      { label: "Витрати", value: `$${totalExpenses.toFixed(2)}`, color: "#f43f5e", entries: expEntries },
                      { label: net >= 0 ? "Профіт +" : "Збиток −", value: `$${Math.abs(net).toFixed(2)}`, color: netColor, entries: netEntries },
                    ];
                  })().map(s => (
                    <MetricPeriods key={s.label} entries={s.entries} color={s.color} fmt={v => `$${v.toFixed(2)}`}
                      className="wf-card"
                      cardStyle={{ padding: "16px 14px", textAlign: "center", border: `1px solid ${s.color}33`, borderTop: `2px solid ${s.color}`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: "#9a8a60", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Space Mono',monospace" }}>{s.value}</div>
                    </MetricPeriods>
                  ))}
                </div>
              </div>
              {/* Час на вивчення ШІ */}
              <div>
                <div className="wf-sec" style={{ marginBottom: 16 }}>⏱️ Час на вивчення ШІ <span style={{ fontSize: 11, color: "#6a5f40", fontWeight: 400 }}>· 1 раз = 30 хв</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {(() => {
                    const eduH = (learnTime.education ?? 0) * 0.5;
                    const bizH = (learnTime.business ?? 0) * 0.5;
                    const vidCount = learnTime.edu_videos ?? 0;
                    const totalH = eduH + bizH;
                    const logFor = (...keys) => metricLog.filter(e => keys.includes(e.key));
                    const hoursFmt = v => `${(v % 1 === 0 ? v : v.toFixed(1))} год`;
                    return [
                      { label: "Навчання",     emoji: "📚", hours: eduH,   sub: `${learnTime.education ?? 0} × 30хв`, color: "#06b6d4", entries: logFor("education").map(e => ({ date: e.date, delta: e.delta * 0.5 })), fmt: hoursFmt },
                      { label: "Бізнес",       emoji: "💼", hours: bizH,   sub: `${learnTime.business ?? 0} × 30хв`,  color: "#f59e0b", entries: logFor("business").map(e => ({ date: e.date, delta: e.delta * 0.5 })), fmt: hoursFmt },
                      { label: "Навч. відео",  emoji: "📺", hours: null, count: vidCount, sub: `${vidCount} відео`,    color: "#a855f7", entries: logFor("edu_videos"), fmt: v => v.toLocaleString() },
                      { label: "Всього годин", emoji: "🎯", hours: totalH, sub: `edu+biz`,                            color: "#00ff88", entries: logFor("education", "business").map(e => ({ date: e.date, delta: e.delta * 0.5 })), fmt: hoursFmt },
                    ];
                  })().map(s => (
                    <MetricPeriods key={s.label} entries={s.entries} color={s.color} fmt={s.fmt}
                      className="wf-card"
                      cardStyle={{ padding: "16px 14px", textAlign: "center", border: `1px solid ${s.color}33`, borderTop: `2px solid ${s.color}`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: "#9a8a60", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{s.emoji} {s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Space Mono',monospace" }}>
                        {s.hours !== null ? <>{s.hours.toLocaleString()} <span style={{ fontSize: 13 }}>год</span></> : s.count}
                      </div>
                      <div style={{ fontSize: 11, color: "#6a5f40", fontFamily: "'Space Mono',monospace", marginTop: 4 }}>{s.sub}</div>
                    </MetricPeriods>
                  ))}
                </div>
              </div>
              {/* Навички */}
              <div>
                <div className="wf-sec" style={{ marginBottom: 16 }}>💪 Навички — виконано <span style={{ fontSize: 11, color: "#6a5f40", fontWeight: 400 }}>· ▼ розгорнути періоди</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SKILL_STAT_ROWS.map(row => {
                    const cat = SKILL_TASKS.find(c => c.id === row.catId);
                    const catColor = cat?.color ?? "#c9a84c";
                    const tasks = row.tasks.map(t => ({
                      label: t.label,
                      count: (skillTasksData[`${row.catId}_${t.id}`]?.count ?? 0),
                      entries: metricLog.filter(e => e.key === `${row.catId}_${t.id}`),
                    }));
                    const hasAny = tasks.some(c => c.count > 0);
                    return (
                      <div key={row.catId} className="wf-card" style={{ padding: "12px 16px", border: `1px solid ${hasAny ? catColor + "44" : "rgba(201,168,76,0.12)"}`, borderLeft: `3px solid ${hasAny ? catColor : "rgba(201,168,76,0.2)"}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: tasks.length ? 4 : 0 }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{row.emoji}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#c8b89a", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{row.label}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: "8px 18px" }}>
                          {tasks.map(c => (
                            <MetricPeriods key={c.label} entries={c.entries} color={catColor} align="flex-start"
                              cardStyle={{ padding: "6px 8px", borderRadius: 4 }}>
                              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                                <span style={{ color: "#6a5f40" }}>{c.label}: </span>
                                <span style={{ color: c.count > 0 ? catColor : "#4a4030", fontWeight: 700 }}>{c.count.toLocaleString()}</span>
                              </div>
                            </MetricPeriods>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontSize: 10, color: "#5a5040", fontFamily: "'Space Mono',monospace" }}>
                  Загальні лічильники — за весь час. Розбивка «Сьог/Міс/Рік» та по періодах рахується з цього оновлення (для фінансів — за всю історію записів).
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === "radio" && (() => {
          const active = radioStations.find(s => s.videoId === radioActive) || null;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#d4b040", fontFamily: "'Exo 2',sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>🎵 Радіо для роботи</div>
                  <div style={{ fontSize: 11, color: "#6a5f40", fontFamily: "'Space Mono',monospace", marginTop: 4 }}>Фонова музика для фокусу. Обери станцію — грає, поки ти на сайті.</div>
                </div>
                <button onClick={() => setRadioAddOpen(o => !o)} style={{ padding: "9px 16px", background: radioAddOpen ? "rgba(201,168,76,0.18)" : "rgba(10,12,22,0.7)", border: "1px solid rgba(201,168,76,0.45)", borderRadius: 4, color: "#d4b040", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>{radioAddOpen ? "× Скасувати" : "+ Додати станцію"}</button>
              </div>

              {/* Add form */}
              {radioAddOpen && (
                <div style={{ background: "rgba(10,12,22,0.6)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={radioUrl} onChange={e => setRadioUrl(e.target.value)} placeholder="YouTube-посилання (youtube.com/watch?v=… або youtu.be/…)" style={{ width: "100%", padding: "10px 12px", background: "rgba(8,5,2,0.6)", border: "1px solid rgba(201,168,76,0.30)", borderRadius: 4, color: "#e0d8c0", fontSize: 13, fontFamily: "'Space Mono',monospace", outline: "none", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input value={radioTitle} onChange={e => setRadioTitle(e.target.value)} placeholder="Назва (необов'язково)" style={{ flex: "1 1 180px", padding: "10px 12px", background: "rgba(8,5,2,0.6)", border: "1px solid rgba(201,168,76,0.30)", borderRadius: 4, color: "#e0d8c0", fontSize: 13, fontFamily: "'Space Mono',monospace", outline: "none", boxSizing: "border-box" }} />
                    <input value={radioGenre} onChange={e => setRadioGenre(e.target.value)} placeholder="Жанр (напр. Lo-Fi)" style={{ flex: "1 1 140px", padding: "10px 12px", background: "rgba(8,5,2,0.6)", border: "1px solid rgba(201,168,76,0.30)", borderRadius: 4, color: "#e0d8c0", fontSize: 13, fontFamily: "'Space Mono',monospace", outline: "none", boxSizing: "border-box" }} />
                    <button onClick={addRadioStation} style={{ padding: "10px 20px", background: "rgba(0,255,136,0.14)", border: "1px solid rgba(0,255,136,0.5)", borderRadius: 4, color: "#00ff88", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>Додати</button>
                  </div>
                </div>
              )}

              {/* Сам плеєр живе у персистентному блоці над вкладками (грає і при
                  перемиканні категорій). Тут — лише підказка, коли нічого не грає. */}
              {!active && (
                <div style={{ background: "rgba(10,12,22,0.4)", border: "1px dashed rgba(201,168,76,0.25)", borderRadius: 8, padding: "28px 16px", textAlign: "center", color: "#6a5f40", fontSize: 13, fontFamily: "'Space Mono',monospace" }}>
                  ▶ Обери станцію нижче, щоб увімкнути музику
                </div>
              )}

              {/* Stations grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {radioStations.map(st => {
                  const playing = st.videoId === radioActive;
                  return (
                    <div key={st.id} style={{ position: "relative", background: playing ? `${st.color}14` : "rgba(10,12,22,0.55)", border: `1px solid ${playing ? st.color + "70" : "rgba(201,168,76,0.18)"}`, borderTop: `2px solid ${st.color}${playing ? "" : "55"}`, borderRadius: 8, padding: 14, cursor: "pointer", transition: "all 0.15s" }} onClick={() => setRadioActive(playing ? null : st.videoId)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: st.color, background: `${st.color}1a`, border: `1px solid ${st.color}40`, borderRadius: 3, padding: "2px 8px", fontFamily: "'Space Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>{st.genre}</span>
                        <button onClick={e => { e.stopPropagation(); removeRadioStation(st.id); }} title="Видалити" style={{ fontSize: 14, color: "#6a5f40", background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#e0d8c0", fontFamily: "'Exo 2',sans-serif", marginTop: 10 }}>{st.title}</div>
                      {st.channel && <div style={{ fontSize: 11, color: "#6a5f40", fontFamily: "'Space Mono',monospace", marginTop: 2 }}>{st.channel}</div>}
                      <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: playing ? st.color : "#9a8a60", fontFamily: "'Exo 2',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>
                        {playing ? "♫ Грає зараз" : "▶ Увімкнути"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: 10, color: "#5a5040", fontFamily: "'Space Mono',monospace", lineHeight: 1.5 }}>
                💡 Перша станція — той Future Garage стрім, що ти скинув. Решта — рекомендації для фокусу. Якщо стрім offline, відкрий його на YouTube або додай свій live-стрім кнопкою вгорі.
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── AI Chat Widget ── */}
    {(() => {
      const AI_MODELS = [
        { id: "gpt-4o-mini",              label: "GPT-4o mini",    provider: "openai",    icon: "🟢" },
        { id: "gpt-4o",                   label: "GPT-4o",         provider: "openai",    icon: "🟢" },
        { id: "gpt-4.5-preview",          label: "GPT-4.5",        provider: "openai",    icon: "🟢" },
        { id: "gpt-4.1",                  label: "GPT-4.1",        provider: "openai",    icon: "🟢" },
        { id: "gpt-4.1-mini",             label: "GPT-4.1 mini",   provider: "openai",    icon: "🟢" },
        { id: "o3",                       label: "o3",             provider: "openai",    icon: "🟢" },
        { id: "o3-mini",                  label: "o3-mini",        provider: "openai",    icon: "🟢" },
        { id: "o4-mini",                  label: "o4-mini",        provider: "openai",    icon: "🟢" },
        { id: "claude-haiku-4-5-20251001",label: "Claude Haiku",   provider: "anthropic", icon: "🟠" },
        { id: "claude-sonnet-4-6",        label: "Claude Sonnet",  provider: "anthropic", icon: "🟠" },
        { id: "claude-opus-4-8",          label: "Claude Opus",    provider: "anthropic", icon: "🟠" },
        { id: "gemini-2.5-flash",         label: "Gemini 2.5 Flash", provider: "gemini",  icon: "🔵" },
        { id: "gemini-2.0-flash",         label: "Gemini 2.0 Flash", provider: "gemini",  icon: "🔵" },
        { id: "gemini-1.5-flash",         label: "Gemini 1.5 Flash", provider: "gemini",  icon: "🔵" },
        { id: "gemini-2.5-pro",           label: "Gemini 2.5 Pro",   provider: "gemini",  icon: "🔵" },
      ];
      const isCustomModel = !AI_MODELS.find(m => m.id === aiModel);
      const curModel = AI_MODELS.find(m => m.id === aiModel) ?? { id: aiModel, label: aiModel, provider: "openai", icon: "🟢" };

      const buildSystemPrompt = () => {
        const level = Math.floor(Math.sqrt(totalXP / 80));
        const toolCount = Object.values(skillData).reduce((s, v) => s + (v.unlockedTools?.length ?? 0), 0);
        const monthSessions = sessions.dates.filter(d => d.startsWith(new Date().toISOString().slice(0, 7))).length;
        return `Ти AI-асистент у персональному трекері прогресу Вови у вивченні AI-інструментів та заробітку з AI.\n\nПоточний стан:\n- XP: ${totalXP} → Рівень ${level}\n- Вивчено AI-інструментів: ${toolCount}\n- Дохід загалом: $${totalIncome.toFixed(2)}\n- Стрік: ${streak} днів поспіль\n- Проекти: ${projects.length} всього, ${projects.filter(p => p.status === "done").length} завершено\n- Сесій цього місяця: ${monthSessions}\n\nВеди себе як наставник і мотиватор. Давай конкретні поради, задачки та рекомендації виходячи з реального прогресу. Відповідай українською мовою. Будь стислим але корисним.`;
      };

      const sendMessage = async () => {
        if (!aiInput.trim() && aiAttachments.length === 0) return;
        const provider = curModel.provider;
        const key = aiApiKeys[provider];
        if (!key) { setAiSettingsOpen(true); return; }

        const userMsg = { role: "user", content: aiInput.trim(), attachments: aiAttachments.length ? [...aiAttachments] : undefined, ts: Date.now() };
        const newMsgs = [...aiMessages, userMsg];
        setAiMessages(newMsgs);
        setAiInput("");
        setAiAttachments([]);
        setAiLoading(true);

        try {
          const sys = buildSystemPrompt();
          if (provider === "openai") {
            const msgs = [
              { role: "system", content: sys },
              ...newMsgs.map(m => ({
                role: m.role,
                content: m.attachments?.length
                  ? [{ type: "text", text: m.content || "" }, ...m.attachments.map(a => ({ type: "image_url", image_url: { url: `data:${a.type};base64,${a.data}` } }))]
                  : (m.content || "")
              }))
            ];
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model: aiModel, messages: msgs, stream: true })
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message ?? res.statusText); }
            const reader = res.body.getReader();
            const dec = new TextDecoder();
            let acc = "";
            setAiMessages(prev => [...prev, { role: "assistant", content: "", ts: Date.now() }]);
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              for (const line of dec.decode(value).split("\n")) {
                if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
                try { const d = JSON.parse(line.slice(6)); acc += d.choices?.[0]?.delta?.content ?? ""; } catch (_) {}
              }
              setAiMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: acc } : m));
            }
          } else if (provider === "anthropic") {
            const msgs = newMsgs.map(m => ({
              role: m.role,
              content: m.attachments?.length
                ? [...m.attachments.map(a => ({ type: "image", source: { type: "base64", media_type: a.type, data: a.data } })), { type: "text", text: m.content || "" }]
                : (m.content || "")
            }));
            const res = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json", "anthropic-dangerous-allow-browser": "true" },
              body: JSON.stringify({ model: aiModel, max_tokens: 2048, system: sys, messages: msgs })
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message ?? res.statusText); }
            const data = await res.json();
            setAiMessages(prev => [...prev, { role: "assistant", content: data.content?.[0]?.text ?? "Порожня відповідь", ts: Date.now() }]);
          } else if (provider === "gemini") {
            const contents = newMsgs
              .map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [
                  ...(m.attachments ?? []).filter(a => a.type && a.data).map(a => ({ inlineData: { mimeType: a.type, data: a.data } })),
                  ...(m.content?.trim() ? [{ text: m.content }] : [])
                ]
              }))
              .filter(m => m.parts.length > 0);
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${key}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ system_instruction: { parts: [{ text: sys }] }, contents })
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message ?? res.statusText); }
            const data = await res.json();
            setAiMessages(prev => [...prev, { role: "assistant", content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Порожня відповідь", ts: Date.now() }]);
          }
        } catch (err) {
          setAiMessages(prev => [...prev, { role: "assistant", content: `❌ Помилка: ${err.message}`, ts: Date.now() }]);
        }
        setAiLoading(false);
      };

      const handlePaste = (e) => {
        for (const item of e.clipboardData?.items ?? []) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = ev => setAiAttachments(prev => [...prev, { type: item.type, data: ev.target.result.split(",")[1] }]);
            reader.readAsDataURL(file);
          }
        }
      };

      const handleFileInput = (e) => {
        for (const file of e.target.files ?? []) {
          if (!file.type.startsWith("image/")) continue;
          const reader = new FileReader();
          reader.onload = ev => setAiAttachments(prev => [...prev, { type: file.type, data: ev.target.result.split(",")[1] }]);
          reader.readAsDataURL(file);
        }
        e.target.value = "";
      };

      const renderMsg = (text) => text.split("\n").map((line, i, arr) => (
        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
      ));

      return (
        <div data-ai-chat style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          {aiOpen && (
            <div style={{ width: 290, maxWidth: "calc(100vw - 40px)", maxHeight: "min(520px, calc(100vh - 110px))", background: "linear-gradient(180deg,rgba(12,8,3,0.97),rgba(7,5,1,0.98))", border: "1px solid rgba(201,168,76,0.3)", borderTop: "2px solid rgba(201,168,76,0.55)", borderRadius: 8, boxShadow: "0 12px 48px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", fontFamily: "'Exo 2',sans-serif" }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid rgba(201,168,76,0.15)", background: "rgba(201,168,76,0.04)" }}>
                <span style={{ fontSize: 15 }}>🤖</span>
                <span style={{ fontSize: 12, color: "#c9a84c", fontWeight: 700, letterSpacing: 1 }}>AI АСИСТЕНТ</span>
                <div style={{ marginLeft: "auto" }}>
                  <button onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setAiDropPos({ bottom: window.innerHeight - r.top + 6, right: window.innerWidth - r.right }); setAiModelOpen(v => !v); }} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.22)", color: "#9a8a60", padding: "3px 8px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontFamily: "'Space Mono',monospace" }}>
                    {curModel.icon} {curModel.label} ▾
                  </button>
                </div>
                <button onClick={() => setAiSettingsOpen(v => !v)} title="API ключі" style={{ background: aiSettingsOpen ? "rgba(201,168,76,0.12)" : "none", border: "none", color: "#6a5840", cursor: "pointer", fontSize: 14, padding: "2px 5px", borderRadius: 3 }}>⚙</button>
                <button onClick={() => setAiMessages([])} title="Очистити" style={{ background: "none", border: "none", color: "#5a3a30", cursor: "pointer", fontSize: 13, padding: "2px 4px" }}>🗑</button>
                <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", color: "#6a5840", cursor: "pointer", fontSize: 18, padding: "2px 4px", lineHeight: 1 }}>×</button>
              </div>

              {/* Settings */}
              {aiSettingsOpen && (
                <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(201,168,76,0.12)", background: "rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 10, color: "#6a5840", textTransform: "uppercase", letterSpacing: 1 }}>API Ключі (зберігаються локально)</div>
                  {[{k:"openai",label:"OpenAI",ph:"sk-..."},{k:"anthropic",label:"Anthropic",ph:"sk-ant-..."},{k:"gemini",label:"Google Gemini",ph:"AIza..."}].map(({k,label,ph}) => (
                    <div key={k} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <label style={{ fontSize: 10, color: "#8a7a50" }}>{label}</label>
                      <input type="password" value={aiApiKeys[k]} onChange={e => setAiApiKeys(p => ({...p,[k]:e.target.value}))} placeholder={ph}
                        style={{ background: "rgba(8,5,2,0.8)", border: "1px solid rgba(201,168,76,0.2)", color: "#c9a84c", padding: "5px 8px", borderRadius: 3, fontSize: 11, fontFamily: "'Space Mono',monospace", outline: "none" }} />
                    </div>
                  ))}
                  {/* Check available Gemini models */}
                  <button onClick={async () => {
                    if (!aiApiKeys.gemini) { setAiAvailModels(["⚠ спочатку введи Gemini ключ"]); return; }
                    setAiAvailModels(["⏳ завантаження…"]);
                    try {
                      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${aiApiKeys.gemini}`);
                      const d = await r.json();
                      if (d.error) { setAiAvailModels([`❌ ${d.error.message}`]); return; }
                      const list = (d.models ?? [])
                        .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
                        .map(m => m.name.replace("models/", ""))
                        .filter(n => n.startsWith("gemini"));
                      setAiAvailModels(list.length ? list : ["(порожньо)"]);
                    } catch (e) { setAiAvailModels([`❌ ${e.message}`]); }
                  }} style={{ background: "rgba(70,90,201,0.12)", border: "1px solid rgba(100,120,220,0.35)", color: "#8ea0e0", padding: "6px", borderRadius: 3, cursor: "pointer", fontSize: 10, fontFamily: "'Space Mono',monospace", marginTop: 2 }}>
                    🔵 Перевірити доступні Gemini-моделі
                  </button>
                  {aiAvailModels && (
                    <div style={{ fontSize: 10, color: "#8a7a50", fontFamily: "'Space Mono',monospace", background: "rgba(8,5,2,0.6)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 3, padding: "6px 8px", maxHeight: 110, overflowY: "auto", lineHeight: 1.5 }}>
                      {aiAvailModels.map((m, i) => (
                        <div key={i} onClick={() => { if (m.startsWith("gemini")) { setAiModel(m); setAiAvailModels(null); } }}
                          style={{ cursor: m.startsWith("gemini") ? "pointer" : "default", color: m === aiModel ? "#c9a84c" : undefined, padding: "1px 0" }}>
                          {m.startsWith("gemini") ? `• ${m}${m === aiModel ? " ✓" : ""}` : m}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              <div ref={aiMsgsRef} style={{ flex: 1, maxHeight: 380, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                {aiMessages.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#4a3a20", textAlign: "center", padding: "24px 0" }}>
                    Привіт! Я знаю твій прогрес і готовий допомогти.<br />
                    <span style={{ fontSize: 11, color: "#3a2a15" }}>Запитай щось або попроси задачку 🎯</span>
                  </div>
                ) : aiMessages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 3 }}>
                      {msg.attachments?.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                          {msg.attachments.map((a, ai) => <img key={ai} src={`data:${a.type};base64,${a.data}`} alt="" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 4, border: "1px solid rgba(201,168,76,0.25)" }} />)}
                        </div>
                      )}
                      {msg.content && (
                        <div style={{ maxWidth: "85%", padding: "7px 11px", borderRadius: isUser ? "10px 10px 2px 10px" : "10px 10px 10px 2px", background: isUser ? "rgba(201,168,76,0.13)" : "rgba(255,255,255,0.04)", border: `1px solid ${isUser ? "rgba(201,168,76,0.28)" : "rgba(255,255,255,0.07)"}`, fontSize: 12, lineHeight: 1.55, color: isUser ? "#e0d8c0" : "#b8b0a0", wordBreak: "break-word" }}>
                          {renderMsg(msg.content)}
                        </div>
                      )}
                    </div>
                  );
                })}
                {aiLoading && (
                  <div style={{ display: "flex" }}>
                    <div style={{ padding: "8px 14px", borderRadius: "10px 10px 10px 2px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 16, color: "#5a4830", letterSpacing: 3 }}>···</div>
                  </div>
                )}
              </div>

              {/* Attachment previews */}
              {aiAttachments.length > 0 && (
                <div style={{ display: "flex", gap: 6, padding: "6px 12px", borderTop: "1px solid rgba(201,168,76,0.1)", flexWrap: "wrap" }}>
                  {aiAttachments.map((a, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={`data:${a.type};base64,${a.data}`} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4, border: "1px solid rgba(201,168,76,0.3)" }} />
                      <button onClick={() => setAiAttachments(p => p.filter((_,j)=>j!==i))} style={{ position: "absolute", top: -4, right: -4, background: "#f43f5e", border: "none", color: "#fff", borderRadius: "50%", width: 15, height: 15, fontSize: 9, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(201,168,76,0.15)", display: "flex", gap: 6, alignItems: "flex-end" }}>
                <label title="Прикріпити зображення" style={{ cursor: "pointer", color: "#5a4a30", fontSize: 18, flexShrink: 0, paddingBottom: 3 }}>
                  📎<input type="file" accept="image/*" multiple onChange={handleFileInput} style={{ display: "none" }} />
                </label>
                <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} onPaste={handlePaste}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Повідомлення… (Enter — надіслати)"
                  rows={1} style={{ flex: 1, background: "rgba(8,5,2,0.7)", border: "1px solid rgba(201,168,76,0.2)", color: "#e0d8c0", padding: "7px 10px", borderRadius: 4, fontSize: 12, fontFamily: "'Exo 2',sans-serif", resize: "none", outline: "none", maxHeight: 100, overflowY: "auto", lineHeight: 1.45, colorScheme: "dark" }} />
                <button onClick={sendMessage} disabled={aiLoading || (!aiInput.trim() && aiAttachments.length === 0)}
                  style={{ background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.4)", color: aiLoading ? "#4a3a20" : "#c9a84c", padding: "7px 12px", borderRadius: 4, cursor: aiLoading ? "default" : "pointer", fontSize: 14, flexShrink: 0 }}>
                  ▶
                </button>
              </div>
            </div>
          )}

          {/* Model dropdown — fixed, outside panel so it's never clipped */}
          {aiModelOpen && aiDropPos && (
            <div style={{ position: "fixed", bottom: aiDropPos.bottom, right: aiDropPos.right, background: "rgba(10,7,2,0.99)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 6, overflowY: "auto", maxHeight: "min(280px, calc(100vh - 140px))", minWidth: 165, zIndex: 10001, boxShadow: "0 -6px 28px rgba(0,0,0,0.85)" }}
              onMouseLeave={() => setAiModelOpen(false)}>
              {["gemini","openai","anthropic"].map(prov => (
                <div key={prov}>
                  <div style={{ fontSize: 9, color: "#5a4a30", padding: "6px 12px 2px", textTransform: "uppercase", letterSpacing: 1.5 }}>{{ openai:"OpenAI", anthropic:"Anthropic", gemini:"Google" }[prov]}</div>
                  {AI_MODELS.filter(m => m.provider === prov).map(m => (
                    <button key={m.id} onClick={() => { setAiModel(m.id); setAiModelOpen(false); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 14px", background: m.id === aiModel ? "rgba(201,168,76,0.14)" : "none", border: "none", color: m.id === aiModel ? "#c9a84c" : "#9a8a60", cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono',monospace" }}>
                      {m.icon} {m.label}{m.id === aiModel ? " ✓" : ""}
                    </button>
                  ))}
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(201,168,76,0.15)", padding: "6px 10px 8px" }}>
                <div style={{ fontSize: 9, color: "#5a4a30", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Свій model ID</div>
                <input
                  placeholder="напр. gpt-5, chatgpt-4o-latest…"
                  defaultValue={isCustomModel ? aiModel : ""}
                  onKeyDown={e => { if (e.key === "Enter" && e.target.value.trim()) { setAiModel(e.target.value.trim()); setAiModelOpen(false); } }}
                  onBlur={e => { if (e.target.value.trim()) { setAiModel(e.target.value.trim()); } }}
                  style={{ width: "100%", background: "rgba(8,5,2,0.9)", border: "1px solid rgba(201,168,76,0.25)", color: "#c9a84c", padding: "4px 8px", borderRadius: 3, fontSize: 10, fontFamily: "'Space Mono',monospace", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
          )}

          {/* FAB button */}
          <button onClick={() => { setAiOpen(v => !v); setAiModelOpen(false); }}
            style={{ width: 52, height: 52, borderRadius: "50%", background: aiOpen ? "rgba(201,168,76,0.22)" : "linear-gradient(135deg,rgba(201,168,76,0.22),rgba(120,80,20,0.22))", border: `2px solid ${aiOpen ? "rgba(201,168,76,0.65)" : "rgba(201,168,76,0.35)"}`, color: "#c9a84c", fontSize: 22, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.65), 0 0 14px rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {aiOpen ? "×" : "🤖"}
          </button>
        </div>
      );
    })()}
    </div>
  );
}
