import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

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

const DEFAULT_INCOME_CATS = [
  { id: "affiliate",  name: "Affiliate",        color: "#10b981", icon: "🤝" },
  { id: "products",   name: "Digital Products",  color: "#6366f1", icon: "📦" },
  { id: "services",   name: "Послуги",           color: "#f59e0b", icon: "🛠️" },
  { id: "content",    name: "Контент",           color: "#ec4899", icon: "📱" },
  { id: "inc_other",  name: "Інше",             color: "#9a8a60", icon: "💰" },
];

const DEFAULT_EXPENSE_CATS = [
  { id: "claude_sub",  name: "Claude",   color: "#c9a84c", icon: "🤖" },
  { id: "chatgpt_sub", name: "ChatGPT",  color: "#10b981", icon: "💬" },
  { id: "syntx_sub",   name: "Syntx",    color: "#6366f1", icon: "💻" },
  { id: "gemini_sub",  name: "Gemini",   color: "#4a9fd4", icon: "✨" },
  { id: "exp_other",   name: "Інше",     color: "#9a8a60", icon: "💸" },
];

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
  const [journalOpen, setJournalOpen] = useState(true);
  const [showAllSubs, setShowAllSubs] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState(null); // { id, name, xp }
  const [toolRevokeConfirm, setToolRevokeConfirm] = useState(null); // { skillId, tool }
  const [projectDeleteConfirm, setProjectDeleteConfirm] = useState(null); // index
  const [projects, setProjects] = useState(saved?.projects ?? DEFAULT_PROJECTS);
  const [projectInput, setProjectInput] = useState("");
  const [projectCompletionXP, setProjectCompletionXP] = useState(200);
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

  // AI Chat Widget state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState(saved?.aiMessages ?? []);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModel, setAiModel] = useState(saved?.aiModel ?? "gpt-4o-mini");
  const [aiApiKeys, setAiApiKeys] = useState(saved?.aiApiKeys ?? { openai: "", anthropic: "", gemini: "" });
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [aiAttachments, setAiAttachments] = useState([]);
  const [aiModelOpen, setAiModelOpen] = useState(false);
  const [aiDropPos, setAiDropPos] = useState(null);

  const TAB_IDS = ["dashboard", "sessions", "skills", "achievements", "goals", "plan", "finances", "projects"];

  useEffect(() => {
    const state = { skillData, totalXP, incomeEntries, expenseEntries, incomeCats, expenseCats, uahRate, uahRateUpdatedAt, subscriptions, subCheckedMonth, projects, unlockedAchievements, sessions, goals, plan, aiMessages, aiModel, aiApiKeys };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [skillData, totalXP, incomeEntries, expenseEntries, incomeCats, expenseCats, uahRate, uahRateUpdatedAt, subscriptions, subCheckedMonth, projects, unlockedAchievements, sessions, goals, plan, aiMessages, aiModel, aiApiKeys]);

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
        checkAchievements(newTotal, totalIncome, projects.length, updated, ua, streak, sessions.dates.length);
        return ua;
      });
      return updated;
    });
  }, [gainXP, checkAchievements, totalIncome, projects, streak, sessions.dates.length]);

  const addIncomeEntry = useCallback(() => {
    const amt = parseFloat(incForm.amount);
    if (!amt || amt <= 0) return;
    const amtUSD = incForm.currency === "UAH" ? amt / uahRate : amt;
    const xpPaid = Math.ceil(amtUSD * 3);
    const entry = { id: `inc_${Date.now()}`, catId: incForm.catId, amount: amt, currency: incForm.currency, date: incForm.date || todayStr(), note: incForm.note, xpPaid };
    setIncomeEntries(prev => {
      const next = [...prev, entry];
      const newTotal = next.reduce((s, e) => s + toUSD(e.amount, e.currency), 0);
      gainXP(xpPaid, `(+$${amtUSD.toFixed(2)})`);
      setUnlockedAchievements(ua => {
        checkAchievements(totalTools, newTotal, projects.length, skillData, ua, streak, sessions.dates.length);
        return ua;
      });
      return next;
    });
    setIncForm(f => ({ ...f, amount: "", note: "", date: todayStr() }));
  }, [incForm, uahRate, toUSD, gainXP, checkAchievements, totalTools, projects, skillData, streak, sessions.dates.length]);

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
      setTotalXP(prev => Math.max(0, prev - xp));
      showNotif(`↩ Повернуто −${xp} XP`, "xp");
    }
    setPendingDelete(prev => {
      if (prev?.timerId) clearTimeout(prev.timerId);
      const timerId = setTimeout(() => setPendingDelete(null), 5000);
      return { id, type: "income", entry, xpPaid: xp, refund: true, timerId };
    });
  }, [incomeEntries, showNotif]);

  const undoDelete = useCallback(() => {
    if (!pendingDelete) return;
    if (pendingDelete.timerId) clearTimeout(pendingDelete.timerId);
    if (pendingDelete.type === "income") {
      setIncomeEntries(prev => [...prev, pendingDelete.entry]);
      if (pendingDelete.refund && pendingDelete.xpPaid > 0) {
        setTotalXP(prev => prev + pendingDelete.xpPaid);
        showNotif(`✓ Скасовано — +${pendingDelete.xpPaid} XP повернено`, "xp");
      }
    } else {
      setExpenseEntries(prev => [...prev, pendingDelete.entry]);
    }
    setPendingDelete(null);
  }, [pendingDelete, showNotif]);

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
    const newProjects = [...projects, { name: projectInput.trim(), date: new Date().toLocaleDateString("uk-UA"), status: "in_progress", creationXP: 100, completionXP: cxp, completionXPPaid: false }];
    setProjects(newProjects);
    gainXP(100, `(${projectInput.trim()})`);
    setProjectCompletionXP(200);
    setProjectInput("");
    setUnlockedAchievements(ua => {
      checkAchievements(totalTools, totalIncome, newProjects.length, skillData, ua, streak, sessions.dates.length);
      return ua;
    });
  }, [projectInput, projects, gainXP, checkAchievements, totalTools, totalIncome, skillData, streak, sessions.dates.length]);

  const logSession = useCallback(() => {
    if (doneToday) return;
    const today = todayStr();
    const newDates = [...sessions.dates, today];
    const newStreak = calcStreak(newDates);
    const newSessions = { ...sessions, dates: newDates };
    setSessions(newSessions);
    gainXP(50, "(AI-сесія)");
    setUnlockedAchievements(ua => {
      checkAchievements(totalTools, totalIncome, projects.length, skillData, ua, newStreak, newDates.length);
      return ua;
    });
  }, [doneToday, sessions, gainXP, checkAchievements, totalTools, totalIncome, projects, skillData]);

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

      <div style={{ position: "relative", zIndex: 1, maxWidth: "min(1200px, 92vw)", margin: "0 auto", padding: "20px 14px" }}>

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
                { label: "Дохід", val: `$${totalIncome.toFixed(0)}`, color: "#c9a84c" },
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
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid rgba(201,168,76,0.28)", overflowX: "auto", flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)} style={{ padding: "11px 13px", borderRadius: 0, fontSize: 12, cursor: "pointer", background: "transparent", color: activeTab === t.id ? "#d4b040" : "#6a5f40", border: "none", borderBottom: activeTab === t.id ? "2px solid #d4b040" : "2px solid transparent", marginBottom: -1, fontWeight: activeTab === t.id ? 800 : 600, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: "1.5px", whiteSpace: "nowrap" }}>{t.label}</button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 13, marginBottom: 20 }}>
              {SKILLS.map(sk => {
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
                          <button key={tool} className="tool-chip" onClick={() => done ? setToolRevokeConfirm({ skillId: sk.id, tool }) : learnTool(sk.id, tool)} style={{ padding: "7px 14px", borderRadius: 3, fontSize: 13, cursor: "pointer", background: done ? `${sk.color}20` : "rgba(6,4,1,0.72)", border: `1px solid ${done ? sk.color : "rgba(201,168,76,0.25)"}`, color: done ? sk.color : "#6a5f40", fontFamily: "'Space Mono',monospace", textDecoration: done ? "line-through" : "none" }}>
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

        {/* Revoke tool confirmation modal */}
        {toolRevokeConfirm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", zIndex: 9995, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div className="wf-panel" style={{ maxWidth: 360, width: "100%", padding: 24 }}>
              <div style={{ fontSize: 22, marginBottom: 12, textAlign: "center" }}>🔧</div>
              <div className="wf-sec" style={{ textAlign: "center", marginBottom: 8 }}>Зняти інструмент?</div>
              <div style={{ fontSize: 14, color: "#e0d8c0", textAlign: "center", marginBottom: 6, fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{toolRevokeConfirm.tool}</div>
              <div style={{ fontSize: 12, color: "#f43f5e", textAlign: "center", marginBottom: 20, fontFamily: "'Space Mono',monospace" }}>−100 XP</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => {
                  setSkillData(prev => {
                    const updated = { ...prev, [toolRevokeConfirm.skillId]: { unlockedTools: prev[toolRevokeConfirm.skillId].unlockedTools.filter(t => t !== toolRevokeConfirm.tool) } };
                    return updated;
                  });
                  setTotalXP(prev => Math.max(0, prev - 100));
                  setToolRevokeConfirm(null);
                }} style={{ flex: 1, background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.5)", color: "#f43f5e", padding: "10px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>Так, зняти</button>
                <button onClick={() => setToolRevokeConfirm(null)} style={{ flex: 1, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", padding: "10px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Залишити</button>
              </div>
            </div>
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
                  setTotalXP(prev => Math.max(0, prev - revokeConfirm.xp));
                  setRevokeConfirm(null);
                }} style={{ flex: 1, background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.5)", color: "#f43f5e", padding: "10px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>Так, скасувати</button>
                <button onClick={() => setRevokeConfirm(null)} style={{ flex: 1, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", padding: "10px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Залишити</button>
              </div>
            </div>
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13 }}>
                    {items.map(a => {
                      const done = unlockedAchievements.includes(a.id);
                      const tier = TIERS[a.tier];
                      return (
                        <div key={a.id} className={done ? "wf-card" : ""} style={{ position: "relative", background: done ? `linear-gradient(160deg, ${tier.color}30, rgba(10,7,2,0.92))` : "rgba(14,10,4,0.88)", border: `1px solid ${done ? tier.color + "70" : "rgba(201,168,76,0.22)"}`, borderTop: `2px solid ${done ? tier.color : "rgba(201,168,76,0.30)"}`, borderRadius: 4, padding: 16, boxShadow: done ? `0 0 24px ${tier.glow}, inset 0 0 40px ${tier.color}08` : "none" }}>
                          {done && (
                            <button onClick={() => setRevokeConfirm({ id: a.id, name: a.name, xp: a.xp })} title="Скасувати досягнення" style={{ position: "absolute", top: 8, right: 8, background: "rgba(244,63,94,0.0)", border: "none", color: "rgba(244,63,94,0.25)", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "2px 4px", borderRadius: 3, transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background="rgba(244,63,94,0.15)"; e.currentTarget.style.color="#f43f5e"; }} onMouseLeave={e => { e.currentTarget.style.background="rgba(244,63,94,0)"; e.currentTarget.style.color="rgba(244,63,94,0.25)"; }}>🔓</button>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div style={{ fontSize: done ? 36 : 28, filter: done ? `drop-shadow(0 0 8px ${tier.color}99)` : "grayscale(1) brightness(0.45)", transition: "font-size 0.2s" }}>{a.icon}</div>
                            <span style={{ fontSize: 9, fontWeight: 800, color: done ? tier.color : "#6a5a38", border: `1px solid ${done ? tier.color + "66" : "rgba(201,168,76,0.22)"}`, borderRadius: 2, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'Exo 2',sans-serif", whiteSpace: "nowrap" }}>{tier.label}</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: done ? tier.color : "#9a8a60", marginBottom: 6, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{a.name}</div>
                          <div style={{ fontSize: 12, color: done ? "#b0a080" : "#7a6a48", marginBottom: 10, lineHeight: 1.5 }}>{a.desc}</div>
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
                { label: "Загальний дохід", val: `$${totalIncome.toFixed(0)}`, icon: "💰", color: "#f59e0b" },
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
                return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
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
                <div className="wf-panel" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: journalOpen ? 14 : 0, cursor: "pointer" }} onClick={() => setJournalOpen(v => !v)}>
                    <span className="wf-sec" style={{ marginBottom: 0, paddingBottom: 0, border: "none" }}>📋 Журнал операцій</span>
                    <span style={{ fontSize: 12, color: "#5a4a30", marginLeft: 6 }}>{allTx.length} записів</span>
                    <span style={{ marginLeft: "auto", color: "#9a8a60", fontSize: 14 }}>{journalOpen ? "▲" : "▼"}</span>
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
                                  {sub.currency === "UAH" && <div style={{ fontSize: 13, color: "#a07040", marginTop: 2 }}>≈ ${amtUSD.toFixed(2)}</div>}
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
                        {dateGroups.map(group => (
                          <div key={group.date}>
                            <div style={{ fontSize: 12, color: "#9a8a60", textTransform: "uppercase", letterSpacing: 2, padding: "12px 0 6px", fontFamily: "'Space Mono',monospace", position: "sticky", top: 0, background: "rgba(8,5,2,0.95)", zIndex: 1 }}>
                              {txDateLabel(group.date)}
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
                                      <div style={{ fontSize: 13, color: "#a07040", marginTop: 2 }}>≈ ${amtUSD.toFixed(2)}</div>
                                    )}
                                  </div>
                                  <button onClick={() => isInc ? refundIncomeEntry(tx.id) : startDelete(tx.id, "expense")} style={{ background: "none", border: "none", color: "#5a3a30", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "4px 6px", flexShrink: 0, transition: "color 0.15s" }} onMouseEnter={e => e.target.style.color="#f43f5e"} onMouseLeave={e => e.target.style.color="#5a3a30"}>×</button>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Income table */}
            <div className="wf-panel" style={{ padding: 16 }}>
              <span className="wf-sec" style={{ display: "block", marginBottom: 12 }}>📈 Дохід</span>
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
                      <tr style={{ borderTop: "1px solid rgba(201,168,76,0.20)" }}>
                        <td style={{ padding: "8px 8px", color: "#c9a84c", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Всього</td>
                        {months.map(m => { const v = incomeEntries.filter(e => e.date.startsWith(m)).reduce((s, e) => s + toUSD(e.amount, e.currency), 0); return <td key={m} style={{ textAlign: "right", padding: "8px 8px", color: v > 0 ? "#c9a84c" : "#3a3028", fontWeight: 700 }}>{v > 0 ? `$${v.toFixed(0)}` : "—"}</td>; })}
                        <td style={{ textAlign: "right", padding: "8px 8px", color: "#c9a84c", fontWeight: 800 }}>${totalIncome.toFixed(0)}</td>
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
            <div className="wf-panel" style={{ padding: 16 }}>
              <span className="wf-sec" style={{ display: "block", marginBottom: 12 }}>📉 Витрати</span>
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
                      <tr style={{ borderTop: "1px solid rgba(201,168,76,0.20)" }}>
                        <td style={{ padding: "8px 8px", color: "#c9a84c", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Всього</td>
                        {months.map(m => { const v = expenseEntries.filter(e => e.date.startsWith(m)).reduce((s, e) => s + toUSD(e.amount, e.currency), 0); return <td key={m} style={{ textAlign: "right", padding: "8px 8px", color: v > 0 ? "#f43f5e" : "#3a3028", fontWeight: 700 }}>{v > 0 ? `$${v.toFixed(0)}` : "—"}</td>; })}
                        <td style={{ textAlign: "right", padding: "8px 8px", color: "#f43f5e", fontWeight: 800 }}>${totalExpenses.toFixed(0)}</td>
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
            <div className="wf-panel" style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: subscriptions.length > 0 || showSubForm ? 14 : 0 }}>
                <span className="wf-sec" style={{ marginBottom: 0, paddingBottom: 0, border: "none" }}>📅 Підписки</span>
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
                  setTotalXP(prev => Math.max(0, prev - totalDeduct));
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
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: "6px 12px" }}>
                <span style={{ fontSize: 11, color: "#6a5a40", whiteSpace: "nowrap" }}>XP за виконання:</span>
                <input
                  type="number" min="0" max="9999"
                  value={projectCompletionXP}
                  onChange={e => setProjectCompletionXP(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 60, background: "none", border: "none", color: "#c9a84c", fontSize: 13, fontFamily: "'Space Mono',monospace", fontWeight: 700, outline: "none", textAlign: "center" }}
                />
              </div>
              <button className="act-btn" onClick={addProject} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Додати (+100 XP)</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((p, i) => {
                const status = p.status ?? "done";
                const statusCfg = {
                  done:        { label: "✓ завершено",   color: "#00ff88", bg: "rgba(0,255,136,0.10)", border: "rgba(0,255,136,0.30)" },
                  in_progress: { label: "🔄 в процесі",  color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)" },
                  cancelled:   { label: "✕ скасовано",  color: "#6a5a40", bg: "rgba(106,90,64,0.10)",  border: "rgba(106,90,64,0.25)" },
                }[status];
                const cxp = p.completionXP ?? 0;
                const cycleStatus = () => {
                  const next = status === "done" ? "in_progress" : "done";
                  setProjects(prev => prev.map((x, idx) => {
                    if (idx !== i) return x;
                    const paid = x.completionXPPaid ?? false;
                    if (next === "done" && !paid && cxp > 0) {
                      gainXP(cxp, `🚀 ${x.name}`);
                      return { ...x, status: next, completionXPPaid: true };
                    }
                    if (next === "in_progress" && paid && cxp > 0) {
                      setTotalXP(p2 => Math.max(0, p2 - cxp));
                      return { ...x, status: next, completionXPPaid: false };
                    }
                    return { ...x, status: next };
                  }));
                };
                const cardBorder = status === "done" ? "rgba(99,102,241,0.30)" : status === "in_progress" ? "rgba(245,158,11,0.30)" : "rgba(106,90,64,0.20)";
                const cardBg = status === "done" ? "rgba(99,102,241,0.07)" : status === "in_progress" ? "rgba(245,158,11,0.06)" : "rgba(20,15,5,0.5)";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: `3px solid ${statusCfg.color}`, borderRadius: 4, padding: "13px 16px", opacity: status === "cancelled" ? 0.6 : 1 }}>
                    <span style={{ fontSize: 20 }}>{status === "in_progress" ? "⚙️" : status === "cancelled" ? "📦" : "🚀"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: status === "cancelled" ? "#6a5a40" : "#e0d8c0", fontSize: 13, fontFamily: "'Exo 2',sans-serif", fontWeight: 600, textDecoration: status === "cancelled" ? "line-through" : "none" }}>{p.name}</div>
                      {cxp > 0 && (
                        <div style={{ fontSize: 11, color: status === "done" ? "#c9a84c" : "#5a4a20", fontFamily: "'Space Mono',monospace", marginTop: 2 }}>
                          {status === "done" ? `✓ +${cxp} XP за виконання` : `🔒 +${cxp} XP при завершенні`}
                        </div>
                      )}
                    </div>
                    <span style={{ color: "#6a5a40", fontSize: 11, fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>{p.date}</span>
                    <button onClick={cycleStatus} title="Змінити статус" style={{ fontSize: 11, padding: "4px 10px", borderRadius: 3, border: `1px solid ${statusCfg.border}`, background: statusCfg.bg, color: statusCfg.color, cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap", fontFamily: "'Exo 2',sans-serif" }}>{statusCfg.label}</button>
                    <button onClick={() => setProjectDeleteConfirm(i)} title="Видалити проект" style={{ background: "none", border: "none", color: "#5a3a30", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 4px", transition: "color 0.15s" }} onMouseEnter={e => e.target.style.color="#f43f5e"} onMouseLeave={e => e.target.style.color="#5a3a30"}>×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
        { id: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash ✓free", provider: "gemini", icon: "🔵" },
        { id: "gemini-2.0-flash",              label: "Gemini 2.0 Flash ✓free", provider: "gemini", icon: "🔵" },
        { id: "gemini-2.5-pro-preview-06-05",  label: "Gemini 2.5 Pro $",       provider: "gemini", icon: "🔵" },
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
        <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          {aiOpen && (
            <div style={{ width: 360, maxWidth: "calc(100vw - 40px)", maxHeight: "min(520px, calc(100vh - 110px))", background: "linear-gradient(180deg,rgba(12,8,3,0.97),rgba(7,5,1,0.98))", border: "1px solid rgba(201,168,76,0.3)", borderTop: "2px solid rgba(201,168,76,0.55)", borderRadius: 8, boxShadow: "0 12px 48px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", fontFamily: "'Exo 2',sans-serif" }}>

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
                </div>
              )}

              {/* Messages */}
              <div style={{ flex: 1, maxHeight: 380, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, opacity: 0.18, transition: "opacity 0.3s ease" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0.18"}>
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
              {["openai","anthropic","gemini"].map(prov => (
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
