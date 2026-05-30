import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const SKILLS = [
  { id: "llm", name: "LLM / Чат-боти", emoji: "🧠", color: "#00ff88", tools: ["ChatGPT", "Claude", "Gemini", "Grok", "Mistral", "DeepSeek"] },
  { id: "image", name: "Генерація зображень", emoji: "🎨", color: "#ff6b35", tools: ["Midjourney", "DALL-E", "Leonardo", "Flux", "Stable Diffusion", "Ideogram"] },
  { id: "video", name: "Генерація відео", emoji: "🎬", color: "#a855f7", tools: ["Sora", "Kling", "Runway", "Pika", "Luma", "HeyGen"] },
  { id: "voice", name: "Голос / Аудіо", emoji: "🎙️", color: "#06b6d4", tools: ["ElevenLabs", "PlayHT", "Murf AI", "Azure Speech", "Coqui TTS"] },
  { id: "music", name: "Музика", emoji: "🎵", color: "#ec4899", tools: ["Suno", "Udio", "AIVA", "Boomy", "Beatoven"] },
  { id: "automation", name: "Автоматизація / Агенти", emoji: "⚙️", color: "#f59e0b", tools: ["n8n", "Make", "Zapier", "LangGraph", "CrewAI", "AutoGen"] },
  { id: "code", name: "Код / Боти", emoji: "💻", color: "#6366f1", tools: ["Claude Code", "Codex", "GitHub Copilot", "Cursor", "Vercel", "Railway"] },
  { id: "design", name: "AI Дизайн", emoji: "✨", color: "#f43f5e", tools: ["Canva AI", "Looka", "Uizard", "Brandmark", "Adobe Firefly"] },
  { id: "content", name: "Контент / Публікації", emoji: "📱", color: "#10b981", tools: ["Buffer", "Hootsuite", "Metricool", "CapCut AI", "OpusClip"] },
  { id: "monetize", name: "Монетизація", emoji: "💰", color: "#fbbf24", tools: ["Gumroad", "LemonSqueezy", "Stripe", "Paddle", "Ko-fi", "Etsy"] },
];

const TOTAL_TOOLS = SKILLS.reduce((a, s) => a + s.tools.length, 0);

// Рівні складності — 6 ступенів рідкісності
const TIERS = {
  common:    { label: "Common",    color: "#9a7850", glow: "rgba(154,120,80,0.40)"  },
  uncommon:  { label: "Uncommon",  color: "#a0b8c8", glow: "rgba(160,184,200,0.45)" },
  rare:      { label: "Rare",      color: "#4a9fd4", glow: "rgba(74,159,212,0.50)"  },
  epic:      { label: "Epic",      color: "#a855f7", glow: "rgba(168,85,247,0.55)"  },
  legendary: { label: "Legendary", color: "#c9a84c", glow: "rgba(201,168,76,0.55)"  },
  prime:     { label: "Prime",     color: "#ef4444", glow: "rgba(239,68,68,0.60)"   },
};

// Групи досягнень (для рендеру з заголовками)
const ACH_GROUPS = [
  { id: "tools",    label: "🧠 Інструменти" },
  { id: "income",   label: "💰 Дохід" },
  { id: "projects", label: "🚀 Проекти" },
  { id: "streak",   label: "🔥 Стріки" },
  { id: "sessions", label: "⚡ Сесії" },
  { id: "special",  label: "🏅 Особливі" },
];

const ACHIEVEMENTS = [
  // ── Інструменти ──
  { id: "first_tool",    group: "tools", tier: "common",    name: "Перший крок",          desc: "Вивчи 1 AI-інструмент",                xp: 50,   icon: "🔧", check: (t) => t >= 1 },
  { id: "five_tools",    group: "tools", tier: "uncommon",  name: "Дослідник",            desc: "Вивчи 5 AI-інструментів",              xp: 150,  icon: "🔍", check: (t) => t >= 5 },
  { id: "ten_tools",     group: "tools", tier: "rare",      name: "Колекціонер",          desc: "Вивчи 10 AI-інструментів",             xp: 300,  icon: "🗂️", check: (t) => t >= 10 },
  { id: "all_categories",group: "tools", tier: "epic",      name: "Поліглот ШІ",          desc: "По 1 інструменту в кожній категорії",  xp: 500,  icon: "🌐",
    check: (t, i, p, skillData) => SKILLS.every(s => skillData[s.id]?.unlockedTools?.length > 0) },
  { id: "twenty_tools",  group: "tools", tier: "legendary", name: "Майстер інструментів", desc: "Вивчи 20 AI-інструментів",             xp: 800,  icon: "🧰", check: (t) => t >= 20 },
  { id: "all_tools",     group: "tools", tier: "prime",     name: "Арсенал",              desc: `Вивчи всі ${TOTAL_TOOLS} інструментів`, xp: 2000, icon: "🌟", check: (t) => t >= TOTAL_TOOLS },

  // ── Дохід ──
  { id: "first_dollar",   group: "income", tier: "common",    name: "Перший долар",  desc: "Зароби перший $1 з AI",   xp: 100,  icon: "💵", check: (t, i) => i >= 1 },
  { id: "hundred_dollar", group: "income", tier: "uncommon",  name: "Перша сотня",   desc: "Зароби $100 з AI",        xp: 300,  icon: "💯", check: (t, i) => i >= 100 },
  { id: "thousand_dollar",group: "income", tier: "rare",      name: "Перша тисяча",  desc: "Зароби $1,000 з AI",      xp: 700,  icon: "🏆", check: (t, i) => i >= 1000 },
  { id: "tenk_dollar",    group: "income", tier: "epic",      name: "П'ять нулів",   desc: "Зароби $10,000 з AI",     xp: 1500, icon: "💎", check: (t, i) => i >= 10000 },
  { id: "hundredk_dollar",group: "income", tier: "prime",     name: "Шестизначний",  desc: "Зароби $100,000 з AI",    xp: 5000, icon: "👑", check: (t, i) => i >= 100000 },

  // ── Проекти ──
  { id: "first_project",  group: "projects", tier: "common",    name: "Будівничий",       desc: "Заверши перший AI-проект", xp: 200,  icon: "🚀", check: (t, i, p) => p >= 1 },
  { id: "three_projects", group: "projects", tier: "uncommon",  name: "Серійний творець", desc: "Заверши 3 проекти",        xp: 400,  icon: "🏗️", check: (t, i, p) => p >= 3 },
  { id: "five_projects",  group: "projects", tier: "epic",      name: "Продуктолог",      desc: "Заверши 5 проектів",       xp: 900,  icon: "🏭", check: (t, i, p) => p >= 5 },
  { id: "ten_projects",   group: "projects", tier: "legendary", name: "Імперія",          desc: "Заверши 10 проектів",      xp: 2000, icon: "🏛️", check: (t, i, p) => p >= 10 },

  // ── Стріки ──
  { id: "streak_3",   group: "streak", tier: "common",    name: "Розгін",         desc: "3 дні поспіль з AI",    xp: 100,  icon: "✨", check: (t, i, p, sd, streak) => streak >= 3 },
  { id: "streak_7",   group: "streak", tier: "uncommon",  name: "Тижневий стрік", desc: "7 днів поспіль з AI",   xp: 250,  icon: "🔥", check: (t, i, p, sd, streak) => streak >= 7 },
  { id: "streak_30",  group: "streak", tier: "epic",      name: "Місячний стрік", desc: "30 днів поспіль з AI",  xp: 1000, icon: "⚡", check: (t, i, p, sd, streak) => streak >= 30 },
  { id: "streak_100", group: "streak", tier: "prime",     name: "Незламний",      desc: "100 днів поспіль з AI", xp: 3000, icon: "🌋", check: (t, i, p, sd, streak) => streak >= 100 },

  // ── Сесії ──
  { id: "sessions_10",  group: "sessions", tier: "common",    name: "Звичка",      desc: "Проведи 10 AI-сесій",  xp: 150,  icon: "🌱", check: (t, i, p, sd, streak, totalSess) => totalSess >= 10 },
  { id: "sessions_50",  group: "sessions", tier: "rare",      name: "50 сесій",    desc: "Проведи 50 AI-сесій",  xp: 500,  icon: "💪", check: (t, i, p, sd, streak, totalSess) => totalSess >= 50 },
  { id: "sessions_100", group: "sessions", tier: "epic",      name: "Сотня сесій", desc: "Проведи 100 AI-сесій", xp: 1200, icon: "🦾", check: (t, i, p, sd, streak, totalSess) => totalSess >= 100 },
  { id: "sessions_365", group: "sessions", tier: "legendary", name: "Рік з AI",    desc: "Проведи 365 AI-сесій", xp: 4000, icon: "🏵️", check: (t, i, p, sd, streak, totalSess) => totalSess >= 365 },

  // ── Особливі ──
  { id: "oxford_dev", group: "special", tier: "epic", name: "Oxford Dev", desc: "Запущено! (Oxford_1000 вже є 🎉)", xp: 300, icon: "📚", check: () => true },
];

const DEFAULT_SKILL_DATA = Object.fromEntries(SKILLS.map(s => [s.id, { unlockedTools: [] }]));
const DEFAULT_PROJECTS = [{ name: "Oxford_1000 — додаток для англійської", date: "2026" }];
const DEFAULT_SESSIONS = { dates: [], monthlyTarget: 50 };
const STORAGE_KEY = "ai_tracker_v1";

const GOAL_CATEGORIES = [
  { id: "income", label: "Дохід", color: "#f59e0b", icon: "💰" },
  { id: "skills", label: "Навички", color: "#00ff88", icon: "🧠" },
  { id: "project", label: "Проект", color: "#6366f1", icon: "🚀" },
  { id: "other", label: "Інше", color: "#6a5f40", icon: "🎯" },
];

const PLAN_PRIORITIES = [
  { id: "now", label: "Зараз", color: "#00ff88", bg: "rgba(0,255,136,0.08)" },
  { id: "soon", label: "Скоро", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  { id: "later", label: "Потім", color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
  { id: "scale", label: "Масштаб", color: "#a855f7", bg: "rgba(168,85,247,0.08)" },
];

const DEFAULT_GOALS = [
  { id: "dg1", text: "Заробити $14,000 цього року", category: "income", done: false },
  { id: "dg2", text: "Вивчити 20 AI-інструментів", category: "skills", done: false },
  { id: "dg3", text: "Запустити перший digital product", category: "project", done: false },
];

const DEFAULT_PLAN = [
  { id: "dp1", text: "Affiliate — партнерські комісії за продаж AI-сервісів", priority: "now", done: false },
  { id: "dp2", text: "Digital Products — шаблони, пресети, гайди, паки", priority: "now", done: false },
  { id: "dp3", text: "Послуги — AI-послуги клієнтам (картки, контент, боти)", priority: "now", done: false },
  { id: "dp4", text: "Контент — монетизація соц. мереж (YouTube, TikTok, Telegram)", priority: "soon", done: false },
  { id: "dp5", text: "Навчання — AI-курси, гайди, консультації", priority: "soon", done: false },
  { id: "dp6", text: "SaaS / Боти — програмні сервіси за підпискою", priority: "later", done: false },
  { id: "dp7", text: "Ком'юніті — закриті спільноти і підписки", priority: "later", done: false },
  { id: "dp8", text: "Контент-фабрика — B2B виробництво контенту для інших", priority: "scale", done: false },
  { id: "dp9", text: "Автоматизація — продаж AI-пайплайнів для бізнесу", priority: "scale", done: false },
];

const LEAGUES = [
  { id: "grey",      name: "Сіра",        minLevel: 1,   maxLevel: 9,   color: "#a0a8b8", bg: "linear-gradient(135deg,#3a3c42,#6a6e78)", glow: "rgba(160,168,184,0.45)" },
  { id: "bronze",    name: "Бронзова",    minLevel: 10,  maxLevel: 19,  color: "#c08040", bg: "linear-gradient(135deg,#6a3c10,#c08040)", glow: "rgba(192,128,64,0.5)"  },
  { id: "silver",    name: "Срібна",      minLevel: 20,  maxLevel: 34,  color: "#c8d4e0", bg: "linear-gradient(135deg,#6a7880,#b0bcc8)", glow: "rgba(200,212,224,0.5)" },
  { id: "gold",      name: "Золота",      minLevel: 35,  maxLevel: 54,  color: "#c9a84c", bg: "linear-gradient(135deg,#7a5818,#c9a84c)", glow: "rgba(201,168,76,0.55)" },
  { id: "diamond",   name: "Діамантова", minLevel: 55,  maxLevel: 79,  color: "#a855f7", bg: "linear-gradient(135deg,#5a1a9a,#a855f7)", glow: "rgba(168,85,247,0.55)" },
  { id: "royal",     name: "Королівська",minLevel: 80,  maxLevel: 99,  color: "#f43f5e", bg: "linear-gradient(135deg,#8a1030,#f43f5e)", glow: "rgba(244,63,94,0.55)"  },
  { id: "legendary", name: "Легендарна", minLevel: 100, maxLevel: 100, color: "#ff2020", bg: "linear-gradient(135deg,#8a0000,#ff2020)", glow: "rgba(255,32,32,0.6)"   },
];

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
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

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
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

// ── Floating 3D background ──────────────────────────────────────────────────
const BG_SHAPES = [
  { id:  1, type: "cube",    left:  7, top: 11, size: 72, depth: 0.22, phase: 0.0, blur: 0, op: 0.72 },
  { id:  2, type: "ring",    left: 80, top:  7, size: 60, depth: 0.42, phase: 2.1, blur: 0, op: 0.58 },
  { id:  3, type: "tri",     left: 56, top: 58, size: 52, depth: 0.33, phase: 1.0, blur: 0, op: 0.52 },
  { id:  4, type: "diamond", left: 88, top: 72, size: 56, depth: 0.38, phase: 3.2, blur: 0, op: 0.62 },
  { id:  5, type: "cube",    left: 70, top: 27, size: 48, depth: 0.50, phase: 4.1, blur: 5, op: 0.35 },
  { id:  6, type: "ring",    left: 17, top: 68, size: 44, depth: 0.28, phase: 0.7, blur: 0, op: 0.52 },
  { id:  7, type: "tri",     left: 35, top: 20, size: 40, depth: 0.45, phase: 1.8, blur: 0, op: 0.55 },
  { id:  8, type: "cube",    left:  2, top: 42, size: 46, depth: 0.18, phase: 2.5, blur: 0, op: 0.48 },
  { id:  9, type: "ring",    left: 63, top: 84, size: 32, depth: 0.55, phase: 3.8, blur: 4, op: 0.38 },
  { id: 10, type: "diamond", left: 25, top: 33, size: 30, depth: 0.30, phase: 0.4, blur: 0, op: 0.48 },
  { id: 11, type: "tri",     left: 84, top: 52, size: 36, depth: 0.25, phase: 1.5, blur: 0, op: 0.52 },
  { id: 12, type: "ring",    left: 44, top: 88, size: 26, depth: 0.60, phase: 2.9, blur: 6, op: 0.28 },
  { id: 13, type: "cube",    left: 48, top: 37, size: 38, depth: 0.36, phase: 5.0, blur: 3, op: 0.33 },
  { id: 14, type: "diamond", left: 92, top: 37, size: 42, depth: 0.20, phase: 1.2, blur: 0, op: 0.58 },
  { id: 15, type: "tri",     left: 62, top: 12, size: 28, depth: 0.48, phase: 3.6, blur: 0, op: 0.42 },
];

function CubeSvg({ s }) {
  const h = s * 0.5;
  const top   = `0,${-h} ${h},${-h*0.5} 0,0 ${-h},${-h*0.5}`;
  const right  = `${h},${-h*0.5} 0,0 0,${h} ${h},${h*0.5}`;
  const left   = `${-h},${-h*0.5} 0,0 0,${h} ${-h},${h*0.5}`;
  const W = h * 2 + 4; const H = h * 1.5 + 4;
  return (
    <svg width={W} height={H} viewBox={`${-h-2} ${-h-2} ${W} ${H}`} style={{ display: "block" }}>
      <polygon points={top}   fill="#c9a84c" fillOpacity="0.80" stroke="#e8c870" strokeWidth="0.7" strokeOpacity="0.60" />
      <polygon points={right} fill="#7a5818" fillOpacity="0.80" stroke="#a07828" strokeWidth="0.7" strokeOpacity="0.55" />
      <polygon points={left}  fill="#3a2808" fillOpacity="0.80" stroke="#5a3c10" strokeWidth="0.7" strokeOpacity="0.50" />
    </svg>
  );
}
function RingSvg({ s }) {
  const r = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
      <circle cx={r} cy={r} r={r-2}    fill="none" stroke="#c9a84c" strokeWidth="2.5" strokeOpacity="0.65" />
      <circle cx={r} cy={r} r={r*0.55} fill="none" stroke="#8a6820" strokeWidth="1.2" strokeOpacity="0.38" />
    </svg>
  );
}
function TriSvg({ s }) {
  const h = s * 0.866;
  return (
    <svg width={s} height={h} viewBox={`0 0 ${s} ${h}`} style={{ display: "block" }}>
      <polygon points={`${s/2},2 ${s-2},${h-2} 2,${h-2}`} fill="none" stroke="#a08030" strokeWidth="2.2" strokeOpacity="0.68" />
    </svg>
  );
}
function DiamondSvg({ s }) {
  const m = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
      <polygon points={`${m},2 ${s-2},${m} ${m},${s-2} 2,${m}`} fill="none" stroke="#c9a84c" strokeWidth="2.2" strokeOpacity="0.65" />
      <polygon points={`${m},${s*0.22} ${s*0.78},${m} ${m},${s*0.78} ${s*0.22},${m}`} fill="#8a6018" fillOpacity="0.14" />
    </svg>
  );
}

function FloatingBg() {
  const wrapRef  = useRef(null);
  const tgtRef   = useRef({ x: 0, y: 0 });
  const curRef   = useRef({ x: 0, y: 0 });
  const rafRef   = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      tgtRef.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      tgtRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      curRef.current.x += (tgtRef.current.x - curRef.current.x) * 0.038;
      curRef.current.y += (tgtRef.current.y - curRef.current.y) * 0.038;
      const t = Date.now() / 1000;
      wrapRef.current?.querySelectorAll("[data-bg]").forEach(el => {
        const depth = +el.dataset.depth;
        const phase = +el.dataset.phase;
        const tx = curRef.current.x * depth * -26;
        const ty = curRef.current.y * depth * -26;
        const fy = Math.sin(t * 0.44 + phase) * 9;
        const fx = Math.cos(t * 0.33 + phase) * 4;
        const rot = Math.sin(t * 0.17 + phase) * 5;
        el.style.transform = `translate(${tx+fx}px,${ty+fy}px) rotate(${rot}deg)`;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    tick();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {BG_SHAPES.map(s => (
        <div key={s.id} data-bg data-depth={s.depth} data-phase={s.phase}
          style={{ position: "absolute", left: `${s.left}%`, top: `${s.top}%`,
                   filter: s.blur ? `blur(${s.blur}px)` : undefined,
                   opacity: s.op, willChange: "transform" }}>
          {s.type === "cube"    && <CubeSvg    s={s.size} />}
          {s.type === "ring"    && <RingSvg    s={s.size} />}
          {s.type === "tri"     && <TriSvg     s={s.size} />}
          {s.type === "diamond" && <DiamondSvg s={s.size} />}
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
  const [income, setIncome] = useState(saved?.income ?? 0);
  const [incomeInput, setIncomeInput] = useState("");
  const [expenses, setExpenses] = useState(saved?.expenses ?? 0);
  const [expenseInput, setExpenseInput] = useState("");
  const [projects, setProjects] = useState(saved?.projects ?? DEFAULT_PROJECTS);
  const [projectInput, setProjectInput] = useState("");
  const [sessions, setSessions] = useState(saved?.sessions ?? DEFAULT_SESSIONS);
  const [goals, setGoals] = useState(saved?.goals ?? DEFAULT_GOALS);
  const [plan, setPlan] = useState(saved?.plan ?? DEFAULT_PLAN);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [notification, setNotification] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState(saved?.unlockedAchievements ?? ["oxford_dev"]);
  const [goalInput, setGoalInput] = useState("");
  const [goalCategory, setGoalCategory] = useState("income");
  const [planInput, setPlanInput] = useState("");
  const [planPriority, setPlanPriority] = useState("now");

  const TAB_IDS = ["dashboard", "sessions", "skills", "achievements", "goals", "plan", "finances", "projects"];

  useEffect(() => {
    const state = { skillData, totalXP, income, expenses, projects, unlockedAchievements, sessions, goals, plan };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [skillData, totalXP, income, expenses, projects, unlockedAchievements, sessions, goals, plan]);

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

  const totalLevel = calcLevel(totalXP);
  const curLevelXP = xpForLevel(totalLevel);
  const nextLevelXP = xpForLevel(totalLevel + 1);
  const xpProgress = ((totalXP - curLevelXP) / (nextLevelXP - curLevelXP)) * 100;
  const totalTools = Object.values(skillData).flatMap(s => s.unlockedTools).length;

  const streak = useMemo(() => calcStreak(sessions.dates), [sessions.dates]);
  const monthSessions = useMemo(() => sessionsThisMonth(sessions.dates), [sessions.dates]);
  const doneToday = sessions.dates.includes(todayStr());
  const heatmapDays = useMemo(() => lastNDays(56), []);
  const sessionSet = useMemo(() => new Set(sessions.dates), [sessions.dates]);

  const showNotif = useCallback((msg, type = "xp") => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => setNotification(null), 2800);
  }, []);

  const checkAchievements = useCallback((tools, inc, proj, sd, currentUnlocked, currentStreak, totalSessions) => {
    const newlyUnlocked = [];
    let bonusXP = 0;
    ACHIEVEMENTS.forEach(a => {
      if (currentUnlocked.includes(a.id)) return;
      if (a.check(tools, inc, proj, sd, currentStreak, totalSessions)) {
        newlyUnlocked.push(a.id);
        bonusXP += a.xp;
      }
    });
    if (newlyUnlocked.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newlyUnlocked]);
      setTotalXP(prev => prev + bonusXP);
      newlyUnlocked.forEach((id, idx) => {
        const a = ACHIEVEMENTS.find(x => x.id === id);
        setTimeout(() => showNotif(`🏆 ${a.name} розблоковано!`, "achievement"), 600 + idx * 900);
      });
    }
  }, [showNotif]);

  const gainXP = useCallback((amount, label = "") => {
    setTotalXP(prev => prev + amount);
    showNotif(`+${amount} XP ${label}`, "xp");
  }, [showNotif]);

  const learnTool = useCallback((skillId, tool) => {
    setSkillData(prev => {
      const current = prev[skillId].unlockedTools;
      if (current.includes(tool)) return prev;
      const updated = { ...prev, [skillId]: { unlockedTools: [...current, tool] } };
      const newTotal = Object.values(updated).flatMap(s => s.unlockedTools).length;
      gainXP(100, `(${tool})`);
      setUnlockedAchievements(ua => {
        checkAchievements(newTotal, income, projects.length, updated, ua, streak, sessions.dates.length);
        return ua;
      });
      return updated;
    });
  }, [gainXP, checkAchievements, income, projects, streak, sessions.dates.length]);

  const addIncome = useCallback(() => {
    const amt = parseFloat(incomeInput);
    if (!amt || amt <= 0) return;
    const newIncome = income + amt;
    setIncome(newIncome);
    gainXP(Math.ceil(amt * 3), `(+$${amt})`);
    setIncomeInput("");
    setUnlockedAchievements(ua => {
      checkAchievements(totalTools, newIncome, projects.length, skillData, ua, streak, sessions.dates.length);
      return ua;
    });
  }, [incomeInput, income, gainXP, checkAchievements, totalTools, projects, skillData, streak, sessions.dates.length]);

  const addExpense = useCallback(() => {
    const amt = parseFloat(expenseInput);
    if (!amt || amt <= 0) return;
    setExpenses(prev => prev + amt);
    setExpenseInput("");
  }, [expenseInput]);

  const addProject = useCallback(() => {
    if (!projectInput.trim()) return;
    const newProjects = [...projects, { name: projectInput.trim(), date: new Date().toLocaleDateString("uk-UA") }];
    setProjects(newProjects);
    gainXP(200, `(${projectInput.trim()})`);
    setProjectInput("");
    setUnlockedAchievements(ua => {
      checkAchievements(totalTools, income, newProjects.length, skillData, ua, streak, sessions.dates.length);
      return ua;
    });
  }, [projectInput, projects, gainXP, checkAchievements, totalTools, income, skillData, streak, sessions.dates.length]);

  const logSession = useCallback(() => {
    if (doneToday) return;
    const today = todayStr();
    const newDates = [...sessions.dates, today];
    const newStreak = calcStreak(newDates);
    const newSessions = { ...sessions, dates: newDates };
    setSessions(newSessions);
    gainXP(50, "(AI-сесія)");
    setUnlockedAchievements(ua => {
      checkAchievements(totalTools, income, projects.length, skillData, ua, newStreak, newDates.length);
      return ua;
    });
  }, [doneToday, sessions, gainXP, checkAchievements, totalTools, income, projects, skillData]);

  const updateMonthlyTarget = useCallback((val) => {
    const t = parseInt(val);
    if (t > 0 && t <= 31) setSessions(prev => ({ ...prev, monthlyTarget: t }));
  }, []);

  const tabs = [
    { id: "dashboard", label: "🏠 Головна" },
    { id: "sessions", label: "🔥 Сесії" },
    { id: "skills", label: "🧩 Навички" },
    { id: "achievements", label: "🏆 Досягнення" },
    { id: "goals", label: "🎯 Цілі" },
    { id: "plan", label: "📋 План дій" },
    { id: "finances", label: "💸 Фінанси" },
    { id: "projects", label: "🚀 Проекти" },
  ];

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
      `}</style>

      <FloatingBg />

      {notification && (
        <div key={notification.id} style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, background: "linear-gradient(135deg,rgba(40,28,4,0.98),rgba(18,12,2,0.98))", color: "#c9a84c", padding: "12px 22px", borderRadius: 3, fontWeight: 700, fontSize: 12, border: "1px solid rgba(201,168,76,0.55)", borderTop: "2px solid #c9a84c", boxShadow: "0 0 30px rgba(201,168,76,0.30), 0 6px 24px rgba(0,0,0,0.7)", animation: "slideIn 0.3s ease", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 2 }}>{notification.msg}</div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 920, margin: "0 auto", padding: "20px 14px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid rgba(201,168,76,0.30)" }}>
          {/* Top row: avatar + name + stats */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 58, height: 58, borderRadius: 4, background: "linear-gradient(145deg,#3a2808,#7a5818)", border: `2px solid ${getLeague(totalLevel).color}`, boxShadow: `0 0 22px ${getLeague(totalLevel).glow}, inset 0 0 16px rgba(201,168,76,0.08)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#c9a84c", fontFamily: "'Exo 2',sans-serif", letterSpacing: -1 }}>Vi</div>
              <div style={{ position: "absolute", bottom: -8, right: -10 }}><LeagueBadge level={totalLevel} size={30} /></div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 22, fontWeight: 800, color: "#e0d8c0", letterSpacing: 3, textTransform: "uppercase" }}>ViFrim</span>
                <span style={{ background: `${getLeague(totalLevel).color}22`, border: `1px solid ${getLeague(totalLevel).color}88`, color: getLeague(totalLevel).color, padding: "3px 10px", borderRadius: 3, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{getLeague(totalLevel).name} ліга</span>
                {streak > 0 && (
                  <span style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.5)", color: "#c9a84c", padding: "3px 10px", borderRadius: 3, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>🔥 {streak} дн.</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#9a8a60", marginTop: 4, textTransform: "uppercase", letterSpacing: 3 }}>AI Progress Tracker</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "Дохід", val: `$${income.toFixed(0)}`, color: "#c9a84c" },
                { label: "Проекти", val: projects.length, color: "#c9a84c" },
                { label: "Інструменти", val: `${totalTools}/${TOTAL_TOOLS}`, color: "#00ff88" },
                { label: "Сесій/міс", val: `${monthSessions}/${sessions.monthlyTarget}`, color: "#c9a84c" },
              ].map(s => (
                <div key={s.label} className="wf-panel" style={{ textAlign: "center", padding: "10px 14px", minWidth: 84 }}>
                  <div style={{ fontSize: 11, color: "#9a8a60", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* XP Bar — Warframe Mastery Rank style */}
          <div className="wf-panel" style={{ padding: "12px 16px" }}>
            {/* Level labels + XP numbers */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "linear-gradient(135deg,#7a5818,#c9a84c)", color: "#000", padding: "3px 12px", borderRadius: 3, fontSize: 12, fontWeight: 800, fontFamily: "'Exo 2',sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>RANK {totalLevel}</span>
                <span style={{ fontSize: 12, color: "#c9a84c", fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{totalXP.toLocaleString()} XP</span>
              </div>
              <div style={{ fontSize: 11, color: "#9a8a60", fontFamily: "'Space Mono',monospace" }}>
                ще <span style={{ color: "#c9a84c", fontWeight: 700 }}>{(nextLevelXP - totalXP).toLocaleString()}</span> XP
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#9a8a60", fontFamily: "'Space Mono',monospace" }}>{nextLevelXP.toLocaleString()} XP</span>
                <span style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.5)", color: "#c9a84c", padding: "3px 12px", borderRadius: 3, fontSize: 12, fontWeight: 800, fontFamily: "'Exo 2',sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>RANK {totalLevel + 1}</span>
              </div>
            </div>

            {/* Bar track */}
            <div style={{ position: "relative", height: 12, background: "rgba(20,14,4,0.80)", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(201,168,76,0.20)" }}>
              {/* Filled portion — gold gradient like Warframe capacity bar */}
              <div style={{
                width: `${Math.min(100, xpProgress)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #4a3008 0%, #8a6020 30%, #c9a84c 70%, #e8c870 100%)",
                borderRadius: 2,
                transition: "width 0.7s ease",
                boxShadow: "0 0 10px rgba(201,168,76,0.5), inset 0 1px 0 rgba(255,230,100,0.3)",
                position: "relative",
              }}>
                <div style={{ position: "absolute", top: 1, left: 0, right: 0, height: 2, background: "rgba(255,230,100,0.35)", borderRadius: 2 }} />
              </div>
              {/* Segment notches */}
              {[10,20,30,40,50,60,70,80,90].map(p => (
                <div key={p} style={{ position: "absolute", top: 0, left: `${p}%`, width: 1, height: "100%", background: "rgba(0,0,0,0.50)", pointerEvents: "none" }} />
              ))}
            </div>

            {/* Progress percent + league info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7, flexWrap: "wrap", gap: 6 }}>
              <div style={{ fontSize: 11, color: "#9a8a60", fontFamily: "'Space Mono',monospace" }}>
                {Math.round(xpProgress)}% до рівня {totalLevel + 1}
              </div>
              {(() => {
                const cur = getLeague(totalLevel);
                const nextLg = LEAGUES[LEAGUES.indexOf(cur) + 1];
                if (!nextLg) return <span style={{ fontSize: 11, color: cur.color, fontFamily: "'Exo 2',sans-serif", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>★ {cur.name} ліга — МАКС</span>;
                const levelsLeft = nextLg.minLevel - totalLevel;
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: cur.color, fontFamily: "'Exo 2',sans-serif", fontWeight: 700, textTransform: "uppercase" }}>{cur.name}</span>
                    <span style={{ fontSize: 11, color: "#5a4a30" }}>→</span>
                    <span style={{ fontSize: 11, color: nextLg.color, fontFamily: "'Exo 2',sans-serif", fontWeight: 700, textTransform: "uppercase" }}>{nextLg.name}</span>
                    <span style={{ fontSize: 11, color: "#9a8a60", fontFamily: "'Space Mono',monospace" }}>ще {levelsLeft} рів.</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Tabs — Warframe underline style */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, flexWrap: "wrap", borderBottom: "1px solid rgba(201,168,76,0.28)" }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)} style={{ padding: "11px 16px", borderRadius: 0, fontSize: 13, cursor: "pointer", background: "transparent", color: activeTab === t.id ? "#d4b040" : "#6a5f40", border: "none", borderBottom: activeTab === t.id ? "2px solid #d4b040" : "2px solid transparent", marginBottom: -1, fontWeight: activeTab === t.id ? 800 : 600, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: "3px" }}>{t.label}</button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 13, marginBottom: 20 }}>
              {SKILLS.slice(0, 6).map(sk => {
                const unlocked = skillData[sk.id].unlockedTools;
                return (
                  <div key={sk.id} onClick={() => { setSelectedSkill(sk); setActiveTab("skills"); }} className="skill-card" style={{ background: "rgba(5,3,1,0.76)", border: `1px solid ${unlocked.length > 0 ? sk.color + "33" : "rgba(201,168,76,0.12)"}`, borderRadius: 4, padding: 14, cursor: "pointer" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{sk.emoji}</div>
                    <div style={{ fontSize: 13, color: "#9a8a60", marginBottom: 5, fontFamily: "'Exo 2',sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{sk.name}</div>
                    <div style={{ fontSize: 13, color: sk.color, marginBottom: 6, fontWeight: 700, fontFamily: "'Exo 2',sans-serif" }}>{unlocked.length}/{sk.tools.length} інстр.</div>
                    <div style={{ height: 4, background: "rgba(201,168,76,0.18)", borderRadius: 2 }}>
                      <div style={{ width: `${(unlocked.length / sk.tools.length) * 100}%`, height: "100%", background: sk.color, borderRadius: 2, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick session check-in on dashboard */}
            <div style={{ background: doneToday ? "rgba(201,168,76,0.06)" : "rgba(244,63,94,0.05)", border: `1px solid ${doneToday ? "rgba(201,168,76,0.30)" : "rgba(244,63,94,0.2)"}`, borderTop: doneToday ? "2px solid rgba(201,168,76,0.6)" : "2px solid rgba(244,63,94,0.5)", borderRadius: 4, padding: 16, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: doneToday ? "#c9a84c" : "#f43f5e", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
                  {doneToday ? "✓ AI-сесія сьогодні виконана" : "⚡ Чи працював сьогодні з AI?"}
                </div>
                <div style={{ fontSize: 11, color: "#9a8a60", marginTop: 3 }}>
                  Стрік: {streak} дн. · {monthSessions}/{sessions.monthlyTarget} цього місяця · всього {sessions.dates.length} сесій
                </div>
              </div>
              {!doneToday && (
                <button className="checkin-btn" onClick={logSession} style={{ background: "linear-gradient(135deg,#00ff88,#00cc6a)", color: "#000", border: "none", padding: "10px 20px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Space Mono',monospace", boxShadow: "0 0 20px rgba(0,255,136,0.3)", whiteSpace: "nowrap" }}>+ Так (+50 XP)</button>
              )}
            </div>

            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>🎯 Швидкі дії</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "+ Вивчити інструмент", color: "#00ff88", rgb: "0,255,136", tab: "skills" },
                  { label: "+ Записати дохід", color: "#f59e0b", rgb: "245,158,11", tab: "finances" },
                  { label: "+ Новий проект", color: "#6366f1", rgb: "99,102,241", tab: "projects" },
                ].map(btn => (
                  <button key={btn.tab} className="act-btn" onClick={() => setActiveTab(btn.tab)} style={{ background: `rgba(${btn.rgb},0.1)`, border: `1px solid ${btn.color}`, color: btn.color, padding: "10px 16px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{btn.label}</button>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: "#8a7850" }}>🏅 Розблоковано досягнень: </span>
                <span style={{ fontSize: 13, color: "#00ff88", fontWeight: 700 }}>{unlockedAchievements.length} / {ACHIEVEMENTS.length}</span>
              </div>
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
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#00ff88", fontFamily: "'Exo 2',sans-serif" }}>Сесія виконана!</div>
                  <div style={{ fontSize: 12, color: "#9a8a60", marginTop: 6 }}>Повернись завтра для нового +50 XP</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Exo 2',sans-serif", marginBottom: 16 }}>Ти сьогодні працював з AI?</div>
                  <button className="checkin-btn" onClick={logSession} style={{ background: "linear-gradient(135deg,#00ff88,#00cc6a)", color: "#000", border: "none", padding: "16px 40px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 16, fontFamily: "'Exo 2',sans-serif", boxShadow: "0 0 30px rgba(0,255,136,0.4)", letterSpacing: 0.5 }}>⚡ Так, працював! (+50 XP)</button>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
              {[
                { label: "Стрік", val: `${streak} дн.`, icon: "🔥", color: "#f59e0b", sub: streak >= 7 ? "Топ!" : "Тримай!" },
                { label: "Цього місяця", val: `${monthSessions}/${sessions.monthlyTarget}`, icon: "📅", color: "#00ff88", sub: `${Math.round(monthSessions / sessions.monthlyTarget * 100)}%` },
                { label: "Всього сесій", val: sessions.dates.length, icon: "⚡", color: "#6366f1", sub: `+50 XP кожна` },
                { label: "Найдовший стрік", val: `${Math.max(streak, 0)} дн.`, icon: "🏅", color: "#ec4899", sub: "личний рекорд" },
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                  📅 Ціль місяця
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#8a7850" }}>Ціль:</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={sessions.monthlyTarget}
                    onChange={e => updateMonthlyTarget(e.target.value)}
                    style={{ width: 56, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 3, padding: "4px 8px", color: "#00ff88", fontSize: 13, fontFamily: "'Space Mono',monospace", textAlign: "center" }}
                  />
                  <span style={{ fontSize: 11, color: "#8a7850" }}>сесій</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                <span style={{ color: "#6a5f40" }}>{monthSessions} виконано</span>
                <span style={{ color: "#00ff88", fontWeight: 700 }}>{Math.min(100, Math.round(monthSessions / sessions.monthlyTarget * 100))}%</span>
              </div>
              <div style={{ height: 10, background: "rgba(201,168,76,0.12)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (monthSessions / sessions.monthlyTarget) * 100)}%`, height: "100%", background: monthSessions >= sessions.monthlyTarget ? "#c9a84c" : "linear-gradient(90deg,#f43f5e,#f59e0b)", borderRadius: 5, transition: "width 0.5s" }} />
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
        {activeTab === "skills" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SKILLS.map(sk => {
              const unlocked = skillData[sk.id].unlockedTools;
              const isOpen = selectedSkill?.id === sk.id;
              return (
                <div key={sk.id} className="skill-card wf-card" style={{ border: `1px solid ${isOpen ? sk.color + "80" : unlocked.length > 0 ? sk.color + "44" : "rgba(201,168,76,0.18)"}`, borderTop: `2px solid ${isOpen ? sk.color : unlocked.length > 0 ? sk.color + "88" : "rgba(201,168,76,0.35)"}`, overflow: "hidden" }}>
                  <div onClick={() => setSelectedSkill(isOpen ? null : sk)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{sk.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#e0d8c0", textTransform: "uppercase", letterSpacing: 2, fontFamily: "'Exo 2',sans-serif" }}>{sk.name}</div>
                      <div style={{ fontSize: 13, color: sk.color, marginTop: 4, letterSpacing: 1, fontWeight: 600 }}>{unlocked.length}/{sk.tools.length} · +100 XP за інструмент</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 5, background: "rgba(201,168,76,0.18)", borderRadius: 3 }}>
                        <div style={{ width: `${(unlocked.length / sk.tools.length) * 100}%`, height: "100%", background: sk.color, borderRadius: 3 }} />
                      </div>
                      <span style={{ color: "#9a8a60", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {sk.tools.map(tool => {
                        const done = unlocked.includes(tool);
                        return (
                          <button key={tool} className="tool-chip" disabled={done} onClick={() => learnTool(sk.id, tool)} style={{ padding: "7px 14px", borderRadius: 3, fontSize: 13, cursor: done ? "default" : "pointer", background: done ? `${sk.color}20` : "rgba(6,4,1,0.72)", border: `1px solid ${done ? sk.color : "rgba(201,168,76,0.25)"}`, color: done ? sk.color : "#6a5f40", fontFamily: "'Space Mono',monospace", textDecoration: done ? "line-through" : "none" }}>
                            {done ? "✓ " : ""}{tool}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Achievements */}
        {activeTab === "achievements" && (
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 13 }}>
                    {items.map(a => {
                      const done = unlockedAchievements.includes(a.id);
                      const tier = TIERS[a.tier];
                      return (
                        <div key={a.id} className={done ? "wf-card" : ""} style={{ background: done ? `linear-gradient(160deg, ${tier.color}26, rgba(10,7,2,0.95))` : "rgba(14,10,4,0.88)", border: `1px solid ${done ? tier.color + "55" : "rgba(201,168,76,0.22)"}`, borderTop: `2px solid ${done ? tier.color : "rgba(201,168,76,0.30)"}`, borderRadius: 4, padding: 16, boxShadow: done ? `0 0 18px ${tier.glow}` : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div style={{ fontSize: 28, filter: done ? "none" : "grayscale(1) brightness(0.55)" }}>{a.icon}</div>
                            <span style={{ fontSize: 9, fontWeight: 800, color: done ? tier.color : "#6a5a38", border: `1px solid ${done ? tier.color + "66" : "rgba(201,168,76,0.22)"}`, borderRadius: 2, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'Exo 2',sans-serif", whiteSpace: "nowrap" }}>{tier.label}</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: done ? tier.color : "#9a8a60", marginBottom: 6, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{a.name}</div>
                          <div style={{ fontSize: 12, color: done ? "#9a8a60" : "#7a6a48", marginBottom: 10, lineHeight: 1.5 }}>{a.desc}</div>
                          <div style={{ fontSize: 12, color: done ? tier.color : "#6a5a38", fontFamily: "'Space Mono',monospace", letterSpacing: 1 }}>+{a.xp} XP {done ? "✓" : "🔒"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Goals */}
        {activeTab === "goals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
              {[
                { label: "Загальний дохід", val: `$${income.toFixed(0)}`, icon: "💰", color: "#f59e0b" },
                { label: "Інструментів", val: `${totalTools}/${TOTAL_TOOLS}`, icon: "🧠", color: "#00ff88" },
                { label: "Проектів", val: projects.length, icon: "🚀", color: "#6366f1" },
                { label: "AI-сесій", val: sessions.dates.length, icon: "⚡", color: "#f43f5e" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(6,4,1,0.72)", border: `1px solid ${s.color}22`, borderRadius: 4, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "#9a8a60", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Add goal */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 16 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>+ Нова ціль</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && goalInput.trim()) {
                      setGoals(prev => [...prev, { id: `g${Date.now()}`, text: goalInput.trim(), category: goalCategory, done: false }]);
                      setGoalInput("");
                    }
                  }}
                  placeholder="Опиши ціль..."
                  style={{ flex: 1, minWidth: 180, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 14px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
                />
                <select
                  value={goalCategory}
                  onChange={e => setGoalCategory(e.target.value)}
                  style={{ background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 12px", color: "#6a5f40", fontSize: 12, cursor: "pointer" }}
                >
                  {GOAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
                <button className="act-btn" onClick={() => {
                  if (!goalInput.trim()) return;
                  setGoals(prev => [...prev, { id: `g${Date.now()}`, text: goalInput.trim(), category: goalCategory, done: false }]);
                  setGoalInput("");
                }} style={{ background: "#00ff88", color: "#000", border: "none", padding: "9px 16px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Додати</button>
              </div>
            </div>

            {/* Goals list by category */}
            {GOAL_CATEGORIES.map(cat => {
              const catGoals = goals.filter(g => g.category === cat.id);
              if (!catGoals.length) return null;
              return (
                <div key={cat.id}>
                  <div style={{ fontSize: 12, color: cat.color, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{cat.icon} {cat.label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {catGoals.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, background: g.done ? "rgba(0,255,136,0.05)" : "rgba(5,3,1,0.76)", border: `1px solid ${g.done ? "rgba(0,255,136,0.2)" : "rgba(201,168,76,0.18)"}`, borderRadius: 4, padding: "12px 16px" }}>
                        <button onClick={() => setGoals(prev => prev.map(x => {
                          if (x.id !== g.id) return x;
                          if (!x.done && !x.xpAwarded) {
                            gainXP(100, "(ціль виконано)");
                            return { ...x, done: true, xpAwarded: true };
                          }
                          return { ...x, done: !x.done };
                        }))}
                          style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${g.done ? "#00ff88" : "rgba(255,255,255,0.2)"}`, background: g.done ? "#00ff88" : "transparent", cursor: "pointer", flexShrink: 0, fontSize: 11, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                          {g.done ? "✓" : ""}
                        </button>
                        <span style={{ flex: 1, color: g.done ? "#9a8a60" : "#e0d8c0", fontSize: 13, textDecoration: g.done ? "line-through" : "none" }}>{g.text}</span>
                        {!g.done && !g.xpAwarded && (
                          <span style={{ fontSize: 12, color: "#00ff88", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)", padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap" }}>+100 XP</span>
                        )}
                        <button onClick={() => setGoals(prev => prev.filter(x => x.id !== g.id))}
                          style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {goals.filter(g => g.done).length > 0 && goals.filter(g => !g.done).length === 0 && (
              <div style={{ textAlign: "center", padding: 24, color: "#00ff88", fontSize: 13 }}>🎉 Всі цілі виконано!</div>
            )}
          </div>
        )}

        {/* Plan */}
        {activeTab === "plan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Add task */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 16 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>+ Нова задача</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={planInput}
                  onChange={e => setPlanInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && planInput.trim()) {
                      setPlan(prev => [...prev, { id: `p${Date.now()}`, text: planInput.trim(), priority: planPriority, done: false }]);
                      setPlanInput("");
                    }
                  }}
                  placeholder="Задача або стратегія..."
                  style={{ flex: 1, minWidth: 180, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 14px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
                />
                <select
                  value={planPriority}
                  onChange={e => setPlanPriority(e.target.value)}
                  style={{ background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 12px", color: "#6a5f40", fontSize: 12, cursor: "pointer" }}
                >
                  {PLAN_PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <button className="act-btn" onClick={() => {
                  if (!planInput.trim()) return;
                  setPlan(prev => [...prev, { id: `p${Date.now()}`, text: planInput.trim(), priority: planPriority, done: false }]);
                  setPlanInput("");
                }} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Додати</button>
              </div>
            </div>

            {/* Priority groups */}
            {PLAN_PRIORITIES.map(pr => {
              const items = plan.filter(p => p.priority === pr.id && !p.done);
              const done = plan.filter(p => p.priority === pr.id && p.done);
              if (!items.length && !done.length) return null;
              return (
                <div key={pr.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ background: pr.bg, border: `1px solid ${pr.color}44`, color: pr.color, padding: "3px 12px", borderRadius: 3, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{pr.label}</span>
                    <span style={{ fontSize: 11, color: "#5a4a30" }}>{items.length} активних{done.length > 0 ? ` · ${done.length} виконано` : ""}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {[...items, ...done].map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, background: item.done ? "rgba(5,3,1,0.80)" : pr.bg, border: `1px solid ${item.done ? "rgba(8,5,2,0.68)" : pr.color + "22"}`, borderRadius: 11, padding: "11px 14px" }}>
                        <button onClick={() => setPlan(prev => prev.map(x => {
                          if (x.id !== item.id) return x;
                          if (!x.done && !x.xpAwarded) {
                            gainXP(75, "(план дій)");
                            return { ...x, done: true, xpAwarded: true };
                          }
                          return { ...x, done: !x.done };
                        }))}
                          style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${item.done ? "#9a8a60" : pr.color}`, background: item.done ? "#9a8a60" : "transparent", cursor: "pointer", flexShrink: 0, fontSize: 12, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                          {item.done ? "✓" : ""}
                        </button>
                        <span style={{ flex: 1, color: item.done ? "#5a4a30" : "#cbd5e1", fontSize: 12, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
                        {!item.done && !item.xpAwarded && (
                          <span style={{ fontSize: 12, color: pr.color, background: pr.bg, border: `1px solid ${pr.color}33`, padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap" }}>+75 XP</span>
                        )}
                        {!item.done && (
                          <select
                            value={item.priority}
                            onChange={e => setPlan(prev => prev.map(x => x.id === item.id ? { ...x, priority: e.target.value } : x))}
                            style={{ background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 6, padding: "2px 6px", color: pr.color, fontSize: 12, cursor: "pointer" }}
                          >
                            {PLAN_PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                          </select>
                        )}
                        <button onClick={() => setPlan(prev => prev.filter(x => x.id !== item.id))}
                          style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Finances */}
        {activeTab === "finances" && (() => {
          const net = income - expenses;
          const netPositive = net >= 0;
          return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 3-column summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                { label: "Дохід", val: `$${income.toFixed(2)}`, color: "#10b981", icon: "📈" },
                { label: "Витрати", val: `$${expenses.toFixed(2)}`, color: "#f43f5e", icon: "📉" },
                { label: "Баланс", val: `${netPositive ? "+" : ""}$${net.toFixed(2)}`, color: netPositive ? "#00ff88" : "#f43f5e", icon: netPositive ? "💚" : "🔴" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(6,4,1,0.72)", border: `1px solid ${s.color}22`, borderRadius: 4, padding: "18px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#9a8a60", marginTop: 6, textTransform: "uppercase", letterSpacing: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Net balance bar */}
            {(income > 0 || expenses > 0) && (
              <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#8a7850", marginBottom: 8 }}>Дохід vs Витрати</div>
                <div style={{ height: 10, background: "rgba(201,168,76,0.12)", borderRadius: 5, overflow: "hidden", display: "flex" }}>
                  {income > 0 && (
                    <div style={{ width: `${Math.min(100, (income / Math.max(income, expenses)) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#059669,#10b981)", borderRadius: "5px 0 0 5px", transition: "width 0.5s" }} />
                  )}
                </div>
                <div style={{ height: 10, background: "rgba(201,168,76,0.12)", borderRadius: 5, overflow: "hidden", marginTop: 4, display: "flex" }}>
                  {expenses > 0 && (
                    <div style={{ width: `${Math.min(100, (expenses / Math.max(income, expenses)) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#b91c1c,#f43f5e)", borderRadius: "5px 0 0 5px", transition: "width 0.5s" }} />
                  )}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: "#10b981" }}>■ Дохід</span>
                  <span style={{ fontSize: 12, color: "#f43f5e" }}>■ Витрати</span>
                  {!netPositive && <span style={{ fontSize: 12, color: "#f43f5e", marginLeft: "auto" }}>мінус ${Math.abs(net).toFixed(2)}</span>}
                </div>
              </div>
            )}

            {/* Income input */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 4, padding: 16 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, fontWeight: 700, color: "#10b981", marginBottom: 12 }}>📈 Додати дохід</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={incomeInput}
                  onChange={e => setIncomeInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addIncome()}
                  placeholder="Сума в $..."
                  type="number"
                  min="0"
                  style={{ width: 160, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 14px", color: "#fff", fontSize: 15, fontFamily: "'Space Mono',monospace" }}
                />
                <button className="act-btn" onClick={addIncome} style={{ background: "#10b981", color: "#000", border: "none", padding: "9px 18px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Записати</button>
                <span style={{ fontSize: 11, color: "#9a8a60" }}>+3× XP від суми</span>
              </div>
            </div>

            {/* Expense input */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 4, padding: 16 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, fontWeight: 700, color: "#f43f5e", marginBottom: 12 }}>📉 Додати витрату</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={expenseInput}
                  onChange={e => setExpenseInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addExpense()}
                  placeholder="Сума в $..."
                  type="number"
                  min="0"
                  style={{ width: 160, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 14px", color: "#fff", fontSize: 15, fontFamily: "'Space Mono',monospace" }}
                />
                <button className="act-btn" onClick={addExpense} style={{ background: "#f43f5e", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>− Записати</button>
              </div>
            </div>

            {/* Milestone bars (based on income) */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>🏁 Дохідні цілі</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "До $100", max: 100, color: "#10b981" },
                  { label: "До $1,000", max: 1000, color: "#6366f1" },
                  { label: "До $10,000", max: 10000, color: "#f43f5e" },
                  { label: "До $100,000", max: 100000, color: "#f59e0b" },
                ].map(g => (
                  <div key={g.label} style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                      <span style={{ color: "#fff" }}>{g.label}</span>
                      <span style={{ color: g.color }}>{Math.min(100, (income / g.max) * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(201,168,76,0.12)", borderRadius: 3 }}>
                      <div style={{ width: `${Math.min(100, (income / g.max) * 100)}%`, height: "100%", background: g.color, borderRadius: 3, transition: "width 0.5s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          );
        })()}

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
              <button className="act-btn" onClick={addProject} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Додати (+200 XP)</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 4, padding: "13px 16px" }}>
                  <span style={{ fontSize: 20 }}>🚀</span>
                  <span style={{ flex: 1, color: "#fff", fontSize: 13 }}>{p.name}</span>
                  <span style={{ color: "#9a8a60", fontSize: 11 }}>{p.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
