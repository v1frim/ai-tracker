// ─── Усі статичні константи ai-tracker ───────────────────────────────────────
// Виокремлено з AITracker.jsx для читабельності.
// Функції і React-компоненти залишаються у AITracker.jsx.

export const SKILLS = [
  { id: "llm",        name: "LLM / Чат-боти",            emoji: "🧠", color: "#00ff88", tools: ["ChatGPT", "Claude", "Gemini", "Grok", "Mistral", "DeepSeek"] },
  { id: "image",      name: "Генерація зображень",        emoji: "🎨", color: "#ff6b35", tools: ["Midjourney", "DALL-E", "Leonardo", "Flux", "Stable Diffusion", "Ideogram"] },
  { id: "video",      name: "Генерація відео",            emoji: "🎬", color: "#a855f7", tools: ["Sora", "Kling", "Runway", "Pika", "Luma", "HeyGen"] },
  { id: "voice",      name: "Голос / Аудіо",              emoji: "🎙️", color: "#06b6d4", tools: ["ElevenLabs", "PlayHT", "Murf AI", "Azure Speech", "Coqui TTS"] },
  { id: "music",      name: "Музика",                     emoji: "🎵", color: "#ec4899", tools: ["Suno", "Udio", "AIVA", "Boomy", "Beatoven"] },
  { id: "automation", name: "Автоматизація / Агенти",     emoji: "⚙️", color: "#f59e0b", tools: ["n8n", "Make", "Zapier", "LangGraph", "CrewAI", "AutoGen"] },
  { id: "code",       name: "Код / Боти",                 emoji: "💻", color: "#6366f1", tools: ["Claude Code", "Codex", "GitHub Copilot", "Cursor", "Vercel", "Railway"] },
  { id: "design",     name: "AI Дизайн",                  emoji: "✨", color: "#f43f5e", tools: ["Canva AI", "Looka", "Uizard", "Brandmark", "Adobe Firefly"] },
  { id: "content",    name: "Контент / Публікації",       emoji: "📱", color: "#10b981", tools: ["Buffer", "Hootsuite", "Metricool", "CapCut AI", "OpusClip"] },
  { id: "monetize",   name: "Монетизація",                emoji: "💰", color: "#fbbf24", tools: ["Gumroad", "LemonSqueezy", "Stripe", "Paddle", "Ko-fi", "Etsy"] },
];

export const TOTAL_TOOLS = SKILLS.reduce((a, s) => a + s.tools.length, 0);

export const TIERS = {
  common:    { label: "Common",    color: "#9a7850", glow: "rgba(154,120,80,0.40)"  },
  uncommon:  { label: "Uncommon",  color: "#a0b8c8", glow: "rgba(160,184,200,0.45)" },
  rare:      { label: "Rare",      color: "#4a9fd4", glow: "rgba(74,159,212,0.50)"  },
  epic:      { label: "Epic",      color: "#a855f7", glow: "rgba(168,85,247,0.55)"  },
  legendary: { label: "Legendary", color: "#ffb700", glow: "rgba(255,183,0,0.70)"   },
  prime:     { label: "Prime",     color: "#ef4444", glow: "rgba(239,68,68,0.60)"   },
};

export const ACH_GROUPS = [
  { id: "tools",    label: "🧠 Інструменти" },
  { id: "income",   label: "💰 Дохід" },
  { id: "projects", label: "🚀 Проекти" },
  { id: "code",     label: "💻 Рядки коду" },
  { id: "streak",   label: "🔥 Стріки" },
  { id: "sessions", label: "⚡ Сесії" },
  { id: "learning", label: "📚 Вивчення ШІ" },
  { id: "special",  label: "🏅 Особливі" },
];

export const ACHIEVEMENTS = [
  // ── Інструменти ──
  { id: "first_tool",    group: "tools", tier: "common",    name: "Перший крок",          desc: "Вивчи 1 AI-інструмент",                xp: 50,   icon: "🔧", check: (t) => t >= 1,           progress: (t) => ({ cur: t, max: 1 }) },
  { id: "five_tools",    group: "tools", tier: "uncommon",  name: "Дослідник",            desc: "Вивчи 5 AI-інструментів",              xp: 150,  icon: "🔍", check: (t) => t >= 5,           progress: (t) => ({ cur: t, max: 5 }) },
  { id: "ten_tools",     group: "tools", tier: "rare",      name: "Колекціонер",          desc: "Вивчи 10 AI-інструментів",             xp: 300,  icon: "🗂️", check: (t) => t >= 10,          progress: (t) => ({ cur: t, max: 10 }) },
  { id: "all_categories",group: "tools", tier: "epic",      name: "Поліглот ШІ",          desc: "По 1 інструменту в кожній категорії",  xp: 500,  icon: "🌐",
    check: (t, i, p, skillData) => SKILLS.every(s => skillData[s.id]?.unlockedTools?.length > 0),
    progress: (t, i, p, skillData) => ({ cur: SKILLS.filter(s => skillData[s.id]?.unlockedTools?.length > 0).length, max: SKILLS.length }) },
  { id: "twenty_tools",  group: "tools", tier: "legendary", name: "Майстер інструментів", desc: "Вивчи 20 AI-інструментів",             xp: 800,  icon: "🧰", check: (t) => t >= 20,          progress: (t) => ({ cur: t, max: 20 }) },
  { id: "all_tools",     group: "tools", tier: "prime",     name: "Арсенал",              desc: `Вивчи всі ${TOTAL_TOOLS} інструментів`, xp: 2000, icon: "🌟", check: (t) => t >= TOTAL_TOOLS, progress: (t) => ({ cur: t, max: TOTAL_TOOLS }) },

  // ── Дохід ──
  { id: "first_dollar",   group: "income", tier: "common",    name: "Перший долар",  desc: "Зароби перший $1 з AI",   xp: 100,  icon: "💵", check: (t, i) => i >= 1,       progress: (t, i) => ({ cur: i, max: 1 }) },
  { id: "hundred_dollar", group: "income", tier: "uncommon",  name: "Перша сотня",   desc: "Зароби $100 з AI",        xp: 300,  icon: "💯", check: (t, i) => i >= 100,     progress: (t, i) => ({ cur: i, max: 100 }) },
  { id: "thousand_dollar",group: "income", tier: "rare",      name: "Перша тисяча",  desc: "Зароби $1,000 з AI",      xp: 700,  icon: "🏆", check: (t, i) => i >= 1000,    progress: (t, i) => ({ cur: i, max: 1000 }) },
  { id: "tenk_dollar",    group: "income", tier: "epic",      name: "П'ять нулів",   desc: "Зароби $10,000 з AI",     xp: 1500, icon: "💎", check: (t, i) => i >= 10000,   progress: (t, i) => ({ cur: i, max: 10000 }) },
  { id: "hundredk_dollar",group: "income", tier: "prime",     name: "Шестизначний",  desc: "Зароби $100,000 з AI",    xp: 5000, icon: "👑", check: (t, i) => i >= 100000,  progress: (t, i) => ({ cur: i, max: 100000 }) },
  { id: "million_dollar", group: "income", tier: "legendary", name: "Мільйонер",     desc: "Зароби $1,000,000 з AI",  xp: 15000,icon: "🤑", check: (t, i) => i >= 1000000, progress: (t, i) => ({ cur: i, max: 1000000 }) },

  // ── Проекти ──
  { id: "first_project",  group: "projects", tier: "common",    name: "Будівничий",       desc: "Заверши перший AI-проект", xp: 200,  icon: "🚀", check: (t, i, p) => p >= 1,  progress: (t, i, p) => ({ cur: p, max: 1 }) },
  { id: "three_projects", group: "projects", tier: "uncommon",  name: "Серійний творець", desc: "Заверши 3 проекти",        xp: 400,  icon: "🏗️", check: (t, i, p) => p >= 3,  progress: (t, i, p) => ({ cur: p, max: 3 }) },
  { id: "five_projects",  group: "projects", tier: "epic",      name: "Продуктолог",      desc: "Заверши 5 проектів",       xp: 900,  icon: "🏭", check: (t, i, p) => p >= 5,  progress: (t, i, p) => ({ cur: p, max: 5 }) },
  { id: "ten_projects",   group: "projects", tier: "legendary", name: "Імперія",          desc: "Заверши 10 проектів",      xp: 2000, icon: "🏛️", check: (t, i, p) => p >= 10, progress: (t, i, p) => ({ cur: p, max: 10 }) },

  // ── Стріки ──
  { id: "streak_3",   group: "streak", tier: "common",    name: "Розгін",         desc: "3 дні поспіль з AI",    xp: 100,  icon: "✨", check: (t, i, p, sd, streak) => streak >= 3,   progress: (t, i, p, sd, streak) => ({ cur: streak, max: 3 }) },
  { id: "streak_7",   group: "streak", tier: "uncommon",  name: "Тижневий стрік", desc: "7 днів поспіль з AI",   xp: 250,  icon: "🔥", check: (t, i, p, sd, streak) => streak >= 7,   progress: (t, i, p, sd, streak) => ({ cur: streak, max: 7 }) },
  { id: "streak_30",  group: "streak", tier: "epic",      name: "Місячний стрік", desc: "30 днів поспіль з AI",  xp: 1000, icon: "⚡", check: (t, i, p, sd, streak) => streak >= 30,  progress: (t, i, p, sd, streak) => ({ cur: streak, max: 30 }) },
  { id: "streak_90",  group: "streak", tier: "rare",      name: "Три місяці",     desc: "90 днів поспіль з AI",  xp: 2000, icon: "🌊", check: (t, i, p, sd, streak) => streak >= 90,  progress: (t, i, p, sd, streak) => ({ cur: streak, max: 90 }) },
  { id: "streak_180", group: "streak", tier: "prime",     name: "Пів року",       desc: "180 днів поспіль з AI", xp: 4000, icon: "🌋", check: (t, i, p, sd, streak) => streak >= 180, progress: (t, i, p, sd, streak) => ({ cur: streak, max: 180 }) },
  { id: "streak_365", group: "streak", tier: "legendary", name: "Залізна воля",   desc: "365 днів поспіль з AI", xp: 8000, icon: "👑", check: (t, i, p, sd, streak) => streak >= 365, progress: (t, i, p, sd, streak) => ({ cur: streak, max: 365 }) },

  // ── Сесії ──
  { id: "sessions_30",  group: "sessions", tier: "common",    name: "Місяць з AI",  desc: "30 AI-сесій",   xp: 350,   icon: "📆", check: (t, i, p, sd, st, ts) => ts >= 30,   progress: (t, i, p, sd, st, ts) => ({ cur: ts, max: 30 }) },
  { id: "sessions_90",  group: "sessions", tier: "rare",      name: "Квартал",      desc: "90 AI-сесій",   xp: 800,   icon: "💪", check: (t, i, p, sd, st, ts) => ts >= 90,   progress: (t, i, p, sd, st, ts) => ({ cur: ts, max: 90 }) },
  { id: "sessions_180", group: "sessions", tier: "epic",      name: "Пів року",     desc: "180 AI-сесій",  xp: 1500,  icon: "🦾", check: (t, i, p, sd, st, ts) => ts >= 180,  progress: (t, i, p, sd, st, ts) => ({ cur: ts, max: 180 }) },
  { id: "sessions_365", group: "sessions", tier: "legendary", name: "Рік з AI",     desc: "365 AI-сесій",  xp: 4000,  icon: "🏵️", check: (t, i, p, sd, st, ts) => ts >= 365,  progress: (t, i, p, sd, st, ts) => ({ cur: ts, max: 365 }) },
  { id: "sessions_730", group: "sessions", tier: "prime",     name: "Два роки",     desc: "730 AI-сесій",  xp: 8000,  icon: "🌟", check: (t, i, p, sd, st, ts) => ts >= 730,  progress: (t, i, p, sd, st, ts) => ({ cur: ts, max: 730 }) },
  { id: "sessions_1095",group: "sessions", tier: "prime",     name: "Три роки",     desc: "1095 AI-сесій", xp: 15000, icon: "👁️", check: (t, i, p, sd, st, ts) => ts >= 1095, progress: (t, i, p, sd, st, ts) => ({ cur: ts, max: 1095 }) },

  // ── Вивчення ШІ ──
  { id: "learn_10",    group: "learning", tier: "common",    name: "Початківець",  desc: "10 год вивчення ШІ (навч+бізнес)",      xp: 200,   icon: "📖", check: (t, i, p, sd, st, ts, h) => h >= 10,    progress: (t, i, p, sd, st, ts, h) => ({ cur: h, max: 10 }) },
  { id: "learn_50",    group: "learning", tier: "uncommon",  name: "Учень",        desc: "50 год вивчення ШІ (навч+бізнес)",      xp: 500,   icon: "📗", check: (t, i, p, sd, st, ts, h) => h >= 50,    progress: (t, i, p, sd, st, ts, h) => ({ cur: h, max: 50 }) },
  { id: "learn_250",   group: "learning", tier: "rare",      name: "Студент ШІ",   desc: "250 год вивчення ШІ (навч+бізнес)",     xp: 1200,  icon: "📘", check: (t, i, p, sd, st, ts, h) => h >= 250,   progress: (t, i, p, sd, st, ts, h) => ({ cur: h, max: 250 }) },
  { id: "learn_1000",  group: "learning", tier: "epic",      name: "Експерт",      desc: "1,000 год вивчення ШІ (навч+бізнес)",   xp: 3000,  icon: "🎓", check: (t, i, p, sd, st, ts, h) => h >= 1000,  progress: (t, i, p, sd, st, ts, h) => ({ cur: h, max: 1000 }) },
  { id: "learn_5000",  group: "learning", tier: "legendary", name: "Майстер ШІ",   desc: "5,000 год вивчення ШІ (навч+бізнес)",   xp: 8000,  icon: "🧠", check: (t, i, p, sd, st, ts, h) => h >= 5000,  progress: (t, i, p, sd, st, ts, h) => ({ cur: h, max: 5000 }) },
  { id: "learn_10000", group: "learning", tier: "prime",     name: "10,000 годин", desc: "10,000 год — правило майстерності",      xp: 20000, icon: "🏆", check: (t, i, p, sd, st, ts, h) => h >= 10000, progress: (t, i, p, sd, st, ts, h) => ({ cur: h, max: 10000 }) },

  // ── Рядки коду ──
  { id: "code_5k",   group: "code", tier: "common",    name: "Перші рядки",  desc: "5,000 рядків коду на GitHub",   xp: 300,   icon: "⌨️", check: (t,i,p,sd,st,ts,h,cl) => cl >= 5000,   progress: (t,i,p,sd,st,ts,h,cl) => ({ cur: cl, max: 5000 }) },
  { id: "code_25k",  group: "code", tier: "uncommon",  name: "Кодер",        desc: "25,000 рядків коду на GitHub",  xp: 800,   icon: "💻", check: (t,i,p,sd,st,ts,h,cl) => cl >= 25000,  progress: (t,i,p,sd,st,ts,h,cl) => ({ cur: cl, max: 25000 }) },
  { id: "code_75k",  group: "code", tier: "epic",      name: "Інженер",      desc: "75,000 рядків коду на GitHub",  xp: 2000,  icon: "🖥️", check: (t,i,p,sd,st,ts,h,cl) => cl >= 75000,  progress: (t,i,p,sd,st,ts,h,cl) => ({ cur: cl, max: 75000 }) },
  { id: "code_150k", group: "code", tier: "rare",      name: "Архітектор",   desc: "150,000 рядків коду на GitHub", xp: 4000,  icon: "🏛️", check: (t,i,p,sd,st,ts,h,cl) => cl >= 150000, progress: (t,i,p,sd,st,ts,h,cl) => ({ cur: cl, max: 150000 }) },
  { id: "code_300k", group: "code", tier: "prime",     name: "Кодомайстер",  desc: "300,000 рядків коду на GitHub", xp: 8000,  icon: "⚙️", check: (t,i,p,sd,st,ts,h,cl) => cl >= 300000, progress: (t,i,p,sd,st,ts,h,cl) => ({ cur: cl, max: 300000 }) },
  { id: "code_500k", group: "code", tier: "legendary", name: "Легенда коду", desc: "500,000 рядків коду на GitHub", xp: 15000, icon: "👑", check: (t,i,p,sd,st,ts,h,cl) => cl >= 500000, progress: (t,i,p,sd,st,ts,h,cl) => ({ cur: cl, max: 500000 }) },

  // ── Особливі ──
  { id: "oxford_dev", group: "special", tier: "epic", name: "Oxford Dev", desc: "Запущено! (Oxford_1000 вже є 🎉)", xp: 300, icon: "📚", check: () => true },
];

export const DEFAULT_SKILL_DATA = Object.fromEntries(SKILLS.map(s => [s.id, { unlockedTools: [] }]));
export const DEFAULT_PROJECTS   = [{ name: "Oxford_1000 — додаток для англійської", date: "2026" }];
export const DEFAULT_SESSIONS   = { dates: [], monthlyTarget: 50 };
export const STORAGE_KEY        = "ai_tracker_v1";
export const APP_START_DATE     = "2026-06-01";

// YouTube-канали з AI-новинами для панелі на дашборді.
// channelId захардкожено де відомо — пропускає ненадійний крок resolveChannelId.
export const YT_CHANNELS = [
  { handle: "AIGeniy",          name: "Штучний Геній",  channelId: "UCNptVg1AvxwdXZJ6bVP2Z6Q" },
  { handle: "Web3nity",         name: "Web3nity",       channelId: "UCuaYG7fdQ-4myL_CVtvwNHQ" },
  { handle: "s_belyak",         name: "Сергій Беляк" },
  { handle: "traffic_system",   name: "Гришин Трафік",  channelId: "UC2YAEMGLlJphyeh5qNUAL_w" },
  { handle: "mikhail.timochko", name: "Михаил Тимочко", channelId: "UCudUZhJR8BUTiJ_njlAqr_w" },
  { handle: "RusanovSasha",     name: "AlexRusanov AI" },
  { handle: "aishny",           name: "ИИШНЫЙ",         channelId: "UCRArIk56Yl7ui2WUAKS3NGA" },
];

// Радіо-станції (YouTube live-стріми) для вкладки «🎵 Радіо».
// Перша — стрім, який скинув Вова; решта — рекомендації.
// Користувач може додавати/видаляти свої — список зберігається в localStorage.
export const DEFAULT_RADIO = [
  { id: "r_futuregarage", title: "Future Garage Radio", channel: "Chill Music Lab", videoId: "M7CEXcnSyuU", genre: "Future Garage", color: "#06b6d4" },
  { id: "r_lofi",         title: "lofi hip hop radio",   channel: "Lofi Girl",       videoId: "jfKfPfyJRdk", genre: "Lo-Fi",         color: "#ec4899" },
  { id: "r_synthwave",    title: "synthwave radio",      channel: "Lofi Girl",       videoId: "4xDzrJKXOOY", genre: "Synthwave",     color: "#a855f7" },
  { id: "r_chillhop",     title: "Chillhop Radio",       channel: "Chillhop Music",  videoId: "5yx6BWlEVcY", genre: "Chillhop",      color: "#f59e0b" },
  { id: "r_sleep",        title: "lofi sleep radio",     channel: "Lofi Girl",       videoId: "rUxyKA_-grg", genre: "Sleep / Calm",  color: "#6366f1" },
];

export const ACTIVITY_DEFS = [
  { kind: "learn", key: "education",            emoji: "📚", label: "Навчання",    color: "#06b6d4", note: "30хв/раз", unit: "30 хв", xp: 4 },
  { kind: "learn", key: "business",             emoji: "💼", label: "Бізнес",      color: "#f59e0b", note: "30хв/раз", unit: "30 хв", xp: 4 },
  { kind: "learn", key: "edu_videos",           emoji: "📺", label: "Навч. відео", color: "#a855f7", note: "1 відео",  unit: "відео",  xp: 3 },
  { kind: "skill", key: "image_images_gen",     emoji: "🎨", label: "Зображення",  color: "#ff6b35",                  xp: 2 },
  { kind: "skill", key: "video_videos_created", emoji: "🎬", label: "Відео",       color: "#a855f7",                  xp: 8 },
  { kind: "skill", key: "music_tracks_created", emoji: "🎵", label: "Музика",      color: "#ec4899",                  xp: 6 },
];
export const ACTIVITY_XP = Object.fromEntries(ACTIVITY_DEFS.map(d => [d.key, d.xp]));

export const GOAL_CATEGORIES = [
  { id: "income",  label: "Дохід",    color: "#f59e0b", icon: "💰" },
  { id: "skills",  label: "Навички",  color: "#00ff88", icon: "🧠" },
  { id: "project", label: "Проект",   color: "#6366f1", icon: "🚀" },
  { id: "other",   label: "Інше",     color: "#6a5f40", icon: "🎯" },
];

export const PLAN_TYPES = [
  { id: "content",  label: "Контент",  color: "#ec4899", bg: "rgba(236,72,153,0.08)" },
  { id: "learning", label: "Навчання", color: "#06b6d4", bg: "rgba(6,182,212,0.08)" },
  { id: "bots",     label: "Боти",     color: "#a855f7", bg: "rgba(168,85,247,0.08)" },
  { id: "work",     label: "Робота",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  { id: "other",    label: "Інше",     color: "#9a8a60", bg: "rgba(154,138,96,0.08)" },
];

export const PROJECT_CATEGORIES = [
  { id: "ai",       label: "ШІ / ML",          color: "#00ff88", icon: "🤖" },
  { id: "web",      label: "Веб",              color: "#6366f1", icon: "🌐" },
  { id: "bot",      label: "Бот",              color: "#a855f7", icon: "🤖" },
  { id: "content",  label: "Контент",          color: "#ec4899", icon: "📹" },
  { id: "work",     label: "Робота / Клієнти", color: "#ef4444", icon: "🤝" },
  { id: "business", label: "Бізнес",           color: "#f59e0b", icon: "💼" },
  { id: "learning", label: "Навчання",         color: "#06b6d4", icon: "📚" },
  { id: "other",    label: "Інше",             color: "#9a8a60", icon: "📦" },
];

export const PROJECT_STATUSES = [
  { id: "in_progress", label: "🔄 в процесі", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)" },
  { id: "paused",      label: "⏸ на паузі",  color: "#06b6d4", bg: "rgba(6,182,212,0.10)",  border: "rgba(6,182,212,0.30)" },
  { id: "done",        label: "✓ виконано",   color: "#00ff88", bg: "rgba(0,255,136,0.10)",  border: "rgba(0,255,136,0.30)" },
];

export const PLAN_URGENCIES = [
  { id: "now",   label: "Зараз", order: 0 },
  { id: "soon",  label: "Скоро", order: 1 },
  { id: "later", label: "Потім", order: 2 },
];

export const DEFAULT_GOALS = [
  { id: "dg1", text: "Навчитися та застосувати 3 нові AI-інструменти", priority: "important", xp: 150, done: false },
  { id: "dg2", text: "Зробити перший продаж через AI",                 priority: "urgent",    xp: 200, done: false },
  { id: "dg3", text: "Написати пост про прогрес в AI",                 priority: "normal",    xp: 50,  done: false },
];

export const TASK_PRIORITIES = [
  { id: "urgent",    label: "Термінові", color: "#f43f5e", bg: "rgba(244,63,94,0.10)",   border: "rgba(244,63,94,0.30)",   fontWeight: 800 },
  { id: "important", label: "Важливі",   color: "#c9a84c", bg: "rgba(201,168,76,0.08)",  border: "rgba(201,168,76,0.28)",  fontWeight: 700 },
  { id: "normal",    label: "Звичайні",  color: "#8a9ab0", bg: "rgba(138,154,176,0.06)", border: "rgba(138,154,176,0.20)", fontWeight: 500 },
];

export const MONTH_NAMES_UA = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

export const LEAGUES = [
  { id: "grey",      name: "Сіра",         minLevel: 1,   maxLevel: 9,   color: "#a0a8b8", bg: "linear-gradient(135deg,#3a3c42,#6a6e78)", glow: "rgba(160,168,184,0.45)" },
  { id: "bronze",    name: "Бронзова",     minLevel: 10,  maxLevel: 19,  color: "#c08040", bg: "linear-gradient(135deg,#6a3c10,#c08040)", glow: "rgba(192,128,64,0.5)"  },
  { id: "silver",    name: "Срібна",       minLevel: 20,  maxLevel: 34,  color: "#c8d4e0", bg: "linear-gradient(135deg,#6a7880,#b0bcc8)", glow: "rgba(200,212,224,0.5)" },
  { id: "gold",      name: "Золота",       minLevel: 35,  maxLevel: 54,  color: "#c9a84c", bg: "linear-gradient(135deg,#7a5818,#c9a84c)", glow: "rgba(201,168,76,0.55)" },
  { id: "diamond",   name: "Діамантова",   minLevel: 55,  maxLevel: 79,  color: "#a855f7", bg: "linear-gradient(135deg,#5a1a9a,#a855f7)", glow: "rgba(168,85,247,0.55)" },
  { id: "royal",     name: "Королівська",  minLevel: 80,  maxLevel: 99,  color: "#f43f5e", bg: "linear-gradient(135deg,#8a1030,#f43f5e)", glow: "rgba(244,63,94,0.55)"  },
  { id: "legendary", name: "Легендарна",   minLevel: 100, maxLevel: 100, color: "#ff2020", bg: "linear-gradient(135deg,#8a0000,#ff2020)", glow: "rgba(255,32,32,0.6)"   },
];

export const DEFAULT_INCOME_CATS = [
  { id: "affiliate", name: "Affiliate",       color: "#10b981", icon: "🤝" },
  { id: "products",  name: "Digital Products", color: "#6366f1", icon: "📦" },
  { id: "services",  name: "Послуги",          color: "#f59e0b", icon: "🛠️" },
  { id: "content",   name: "Контент",          color: "#ec4899", icon: "📱" },
  { id: "inc_other", name: "Інше",             color: "#9a8a60", icon: "💰" },
];

export const DEFAULT_EXPENSE_CATS = [
  { id: "claude_sub",  name: "Claude",  color: "#c9a84c", icon: "🤖" },
  { id: "chatgpt_sub", name: "ChatGPT", color: "#10b981", icon: "💬" },
  { id: "syntx_sub",   name: "Syntx",   color: "#6366f1", icon: "💻" },
  { id: "gemini_sub",  name: "Gemini",  color: "#4a9fd4", icon: "✨" },
  { id: "exp_other",   name: "Інше",    color: "#9a8a60", icon: "💸" },
];

export const DEFAULT_LONG_GOALS = [
  { id: "lg1", text: "Заробити $14,000 цього року",         period: "year_cur",  customXP: 500, done: false },
  { id: "lg2", text: "Вивчити 20 AI-інструментів",          period: "year_cur",  customXP: 300, done: false },
  { id: "lg3", text: "Запустити перший digital product",    period: "longterm",  customXP: 400, done: false },
];

export const DEFAULT_PLAN = [
  { id: "dp1", text: "Affiliate — партнерські комісії за продаж AI-сервісів",       type: "other", urgency: "now",   done: false },
  { id: "dp2", text: "Digital Products — шаблони, пресети, гайди, паки",            type: "other", urgency: "now",   done: false },
  { id: "dp3", text: "Послуги — AI-послуги клієнтам (картки, контент, боти)",       type: "other", urgency: "now",   done: false },
  { id: "dp4", text: "Контент — монетизація соц. мереж (YouTube, TikTok, Telegram)",type: "other", urgency: "soon",  done: false },
  { id: "dp5", text: "Навчання — AI-курси, гайди, консультації",                    type: "other", urgency: "soon",  done: false },
  { id: "dp6", text: "SaaS / Боти — програмні сервіси за підпискою",               type: "other", urgency: "later", done: false },
  { id: "dp7", text: "Ком'юніті — закриті спільноти і підписки",                   type: "other", urgency: "later", done: false },
  { id: "dp8", text: "Контент-фабрика — B2B виробництво контенту для інших",        type: "other", urgency: "later", done: false },
  { id: "dp9", text: "Автоматизація — продаж AI-пайплайнів для бізнесу",           type: "other", urgency: "later", done: false },
];

export const SKILL_TASKS = [
  {
    id: "llm", name: "LLM / Чат-боти", emoji: "🧠", color: "#00ff88",
    progressive: [
      { id: "prompts",    label: "Написати промптів",                milestones: [{count:1,xp:100},{count:50,xp:400},{count:200,xp:1000},{count:1000,xp:3000}] },
      { id: "real_tasks", label: "Вирішити реальних задач через AI", milestones: [{count:1,xp:150},{count:20,xp:600},{count:100,xp:1500},{count:500,xp:4000}] },
      { id: "streak",     label: "Днів поспіль використовував AI",   milestones: [{count:3,xp:200},{count:14,xp:600},{count:30,xp:1200},{count:100,xp:3000}] },
    ],
    oneTime: [
      { id: "system_prompt",     label: "Зробив власний system prompt",             xp: 500  },
      { id: "compare_models",    label: "Порівняв 3+ моделі на одному завданні",    xp: 400  },
      { id: "taught_ai",         label: "Навчив когось іншого користуватись AI",    xp: 1000 },
      { id: "income_text",       label: "Перший дохід завдяки AI-тексту",           xp: 2000 },
      { id: "automated_routine", label: "Автоматизував рутинне завдання через AI",  xp: 800  },
    ],
  },
  {
    id: "image", name: "Генерація зображень", emoji: "🎨", color: "#ff6b35",
    progressive: [
      { id: "images_gen",        label: "Згенерувати зображень",               milestones: [{count:1,xp:100},{count:10,xp:350},{count:100,xp:1000},{count:1000,xp:3500}] },
      { id: "images_commercial", label: "Зображень для комерційних цілей",     milestones: [{count:1,xp:200},{count:10,xp:600},{count:100,xp:2000},{count:500,xp:4000}] },
      { id: "images_sold",       label: "Продати/передати зображення клієнту", milestones: [{count:1,xp:500},{count:5,xp:1200},{count:20,xp:2500}] },
    ],
    oneTime: [
      { id: "negative_prompting", label: "Освоїв техніку negative prompting",        xp: 300  },
      { id: "product_cards",      label: "Зробив 10 карток товарів для магазину",    xp: 600  },
      { id: "first_income_img",   label: "Перший заробіток на AI-зображеннях",       xp: 2000 },
      { id: "client_approved",    label: "Клієнт схвалив зображення з першого разу", xp: 400  },
    ],
  },
  {
    id: "video", name: "Генерація відео", emoji: "🎬", color: "#a855f7",
    progressive: [
      { id: "videos_created",    label: "Створити відео",                milestones: [{count:1,xp:150},{count:10,xp:500},{count:100,xp:1500},{count:500,xp:4000}] },
      { id: "videos_commercial", label: "Відео для клієнтів / комерції", milestones: [{count:1,xp:300},{count:5,xp:800},{count:25,xp:2000},{count:100,xp:4500}] },
    ],
    oneTime: [
      { id: "first_social_video", label: "Перше AI-відео для соцмереж",     xp: 500  },
      { id: "1k_views",           label: "Відео набрало 1,000+ переглядів",  xp: 1000 },
      { id: "10k_views",          label: "Відео набрало 10,000+ переглядів", xp: 2500 },
      { id: "first_income_video", label: "Заробив перший $ на AI-відео",     xp: 2000 },
      { id: "video_series",       label: "Зробив серію з 5 відео",           xp: 800  },
    ],
  },
  {
    id: "voice", name: "Голос / Аудіо", emoji: "🎙️", color: "#06b6d4",
    progressive: [
      { id: "audio_files",         label: "Створити озвучок / аудіо-файлів", milestones: [{count:1,xp:100},{count:10,xp:350},{count:100,xp:1000},{count:500,xp:3000}] },
      { id: "audio_minutes",       label: "Хвилин озвученого контенту",      milestones: [{count:10,xp:150},{count:60,xp:500},{count:300,xp:1200},{count:1000,xp:3000}] },
      { id: "voice_practice_days", label: "Днів практики з голосовими AI",   milestones: [{count:1,xp:100},{count:7,xp:300},{count:30,xp:900},{count:90,xp:2500}] },
    ],
    oneTime: [
      { id: "voice_clone",      label: "Клонував голос (власний або персонажа)", xp: 800  },
      { id: "commercial_voice", label: "Озвучив перше комерційне відео",         xp: 1000 },
      { id: "income_voice",     label: "Заробив $ на озвучці",                   xp: 2000 },
      { id: "podcast_episode",  label: "Зробив подкаст-епізод з AI-голосом",     xp: 1000 },
    ],
  },
  {
    id: "music", name: "Музика", emoji: "🎵", color: "#ec4899",
    progressive: [
      { id: "tracks_created",   label: "Створити музичних треків", milestones: [{count:1,xp:100},{count:10,xp:350},{count:100,xp:1000},{count:500,xp:3000}] },
      { id: "tracks_published", label: "Опублікованих треків",     milestones: [{count:1,xp:300},{count:5,xp:800},{count:20,xp:2000},{count:100,xp:5000}] },
    ],
    oneTime: [
      { id: "youtube_track",   label: "Перший трек у YouTube відео",       xp: 800  },
      { id: "streaming_track", label: "Трек на стримінгу (Spotify тощо)",  xp: 1500 },
      { id: "licensed_pack",   label: "Пакет з 5 ліцензованих треків",     xp: 800  },
      { id: "income_music",    label: "Заробив $ на AI-музиці",            xp: 2000 },
    ],
  },
  {
    id: "automation", name: "Автоматизація / Агенти", emoji: "⚙️", color: "#f59e0b",
    progressive: [
      { id: "automations_created", label: "Створити автоматизацій (воронок)",        milestones: [{count:1,xp:200},{count:5,xp:600},{count:20,xp:1500},{count:100,xp:4000}] },
      { id: "hours_saved",         label: "Заощаджених годин завдяки автоматизації", milestones: [{count:1,xp:100},{count:10,xp:400},{count:50,xp:1200},{count:200,xp:3000}] },
    ],
    oneTime: [
      { id: "first_biz_auto", label: "Автоматизував перший бізнес-процес",       xp: 1000 },
      { id: "first_ai_agent", label: "Запустив першого AI-агента",               xp: 800  },
      { id: "client_auto",    label: "Зробив автоматизацію для клієнта",         xp: 2000 },
      { id: "agent_24h",      label: "Агент працював 24 год без участі людини",  xp: 1500 },
      { id: "income_auto",    label: "Заробив $ на автоматизації",               xp: 2000 },
    ],
  },
  {
    id: "code", name: "Код / Боти", emoji: "💻", color: "#6366f1",
    progressive: [
      { id: "lines_written",    label: "Рядків коду написано",          milestones: [{count:100,xp:100},{count:1000,xp:400},{count:10000,xp:1500},{count:50000,xp:4000}] },
      { id: "projects_launched",label: "Запущених проектів / сайтів",   milestones: [{count:1,xp:300},{count:3,xp:700},{count:10,xp:2000},{count:30,xp:5000}] },
    ],
    oneTime: [
      { id: "first_deploy",     label: "Перший сайт задеплоєний (Oxford_1000!)", xp: 800  },
      { id: "telegram_bot",     label: "Перший Telegram-бот",                    xp: 1000 },
      { id: "100_users",        label: "Проект набрав 100 активних користувачів", xp: 2000 },
      { id: "paid_client_code", label: "Перший платний клієнт за код",           xp: 2000 },
      { id: "first_saas",       label: "Перший SaaS продукт",                    xp: 3000 },
    ],
  },
  {
    id: "design", name: "AI Дизайн", emoji: "✨", color: "#f43f5e",
    progressive: [
      { id: "mockups_created", label: "Дизайн-макетів створено",      milestones: [{count:1,xp:100},{count:10,xp:350},{count:100,xp:1000},{count:500,xp:3000}] },
      { id: "logos_created",   label: "Логотипів / брендів створено", milestones: [{count:1,xp:200},{count:5,xp:600},{count:25,xp:1500},{count:100,xp:4000}] },
    ],
    oneTime: [
      { id: "first_logo_client", label: "Перший логотип для клієнта", xp: 1000 },
      { id: "full_brandbook",    label: "Повний брендбук з AI",       xp: 2000 },
      { id: "ui_ux_mockup",      label: "UI/UX макет додатку",        xp: 1500 },
      { id: "income_design",     label: "Заробив $ на AI-дизайні",    xp: 2000 },
    ],
  },
  {
    id: "content", name: "Контент / Публікації", emoji: "📱", color: "#10b981",
    progressive: [
      { id: "posts_published",  label: "Опублікованих постів (Інста/ТГ/YouTube)", milestones: [{count:1,xp:100},{count:10,xp:350},{count:100,xp:1000},{count:500,xp:3000}] },
      { id: "followers_gained", label: "Підписників здобуто",                    milestones: [{count:10,xp:100},{count:100,xp:400},{count:1000,xp:1500},{count:10000,xp:5000}] },
      { id: "content_views",    label: "Переглядів контенту",                    milestones: [{count:100,xp:100},{count:1000,xp:400},{count:10000,xp:1200},{count:100000,xp:3500}] },
    ],
    oneTime: [
      { id: "viral_post",      label: "Перший вірусний пост (1000+ переглядів)", xp: 1000 },
      { id: "30_days_posting", label: "30 днів щоденних публікацій",             xp: 1500 },
      { id: "content_monetize",label: "Перша монетизація контенту",              xp: 2000 },
    ],
  },
  {
    id: "monetize", name: "Монетизація", emoji: "💰", color: "#fbbf24",
    progressive: [
      { id: "ai_income", label: "Дохід з AI-проектів ($)", milestones: [{count:1,xp:200},{count:100,xp:800},{count:1000,xp:2500},{count:10000,xp:6000}] },
      { id: "clients",   label: "Клієнтів / продажів",     milestones: [{count:1,xp:300},{count:5,xp:800},{count:20,xp:2000},{count:100,xp:5000}] },
    ],
    oneTime: [
      { id: "first_paid_client", label: "Перший платний клієнт",             xp: 1000 },
      { id: "digital_product",   label: "Перший цифровий продукт на продаж", xp: 1500 },
      { id: "1k_month",          label: "Перший місяць $1,000+ з AI",        xp: 3000 },
      { id: "passive_income",    label: "Перший пасивний дохід",             xp: 2000 },
    ],
  },
];
