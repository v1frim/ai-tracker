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

const SKILL_TASKS = [
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
      { id: "negative_prompting", label: "Освоїв техніку negative prompting",      xp: 300  },
      { id: "product_cards",      label: "Зробив 10 карток товарів для магазину",  xp: 600  },
      { id: "first_income_img",   label: "Перший заробіток на AI-зображеннях",     xp: 2000 },
      { id: "client_approved",    label: "Клієнт схвалив зображення з першого разу", xp: 400 },
    ],
  },
  {
    id: "video", name: "Генерація відео", emoji: "🎬", color: "#a855f7",
    progressive: [
      { id: "videos_created",    label: "Створити відео",                  milestones: [{count:1,xp:150},{count:10,xp:500},{count:100,xp:1500},{count:500,xp:4000}] },
      { id: "videos_commercial", label: "Відео для клієнтів / комерції",   milestones: [{count:1,xp:300},{count:5,xp:800},{count:25,xp:2000},{count:100,xp:4500}] },
    ],
    oneTime: [
      { id: "first_social_video",  label: "Перше AI-відео для соцмереж",      xp: 500  },
      { id: "1k_views",            label: "Відео набрало 1,000+ переглядів",   xp: 1000 },
      { id: "10k_views",           label: "Відео набрало 10,000+ переглядів",  xp: 2500 },
      { id: "first_income_video",  label: "Заробив перший $ на AI-відео",      xp: 2000 },
      { id: "video_series",        label: "Зробив серію з 5 відео",            xp: 800  },
    ],
  },
  {
    id: "voice", name: "Голос / Аудіо", emoji: "🎙️", color: "#06b6d4",
    progressive: [
      { id: "audio_files",         label: "Створити озвучок / аудіо-файлів",    milestones: [{count:1,xp:100},{count:10,xp:350},{count:100,xp:1000},{count:500,xp:3000}] },
      { id: "audio_minutes",       label: "Хвилин озвученого контенту",         milestones: [{count:10,xp:150},{count:60,xp:500},{count:300,xp:1200},{count:1000,xp:3000}] },
      { id: "voice_practice_days", label: "Днів практики з голосовими AI",      milestones: [{count:1,xp:100},{count:7,xp:300},{count:30,xp:900},{count:90,xp:2500}] },
    ],
    oneTime: [
      { id: "voice_clone",      label: "Клонував голос (власний або персонажа)", xp: 800  },
      { id: "commercial_voice", label: "Озвучив перше комерційне відео",         xp: 1000 },
      { id: "income_voice",     label: "Заробив $ на озвучці",                   xp: 2000 },
      { id: "podcast_episode",  label: "Зробив подкаст-епізод з AI-голосом",    xp: 1000 },
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
      { id: "streaming_track", label: "Трек на стримінгу (Spotify тощо)", xp: 1500 },
      { id: "licensed_pack",   label: "Пакет з 5 ліцензованих треків",    xp: 800  },
      { id: "income_music",    label: "Заробив $ на AI-музиці",            xp: 2000 },
    ],
  },
  {
    id: "automation", name: "Автоматизація / Агенти", emoji: "⚙️", color: "#f59e0b",
    progressive: [
      { id: "automations_created", label: "Створити автоматизацій (воронок)",           milestones: [{count:1,xp:200},{count:5,xp:600},{count:20,xp:1500},{count:100,xp:4000}] },
      { id: "hours_saved",         label: "Заощаджених годин завдяки автоматизації",    milestones: [{count:1,xp:100},{count:10,xp:400},{count:50,xp:1200},{count:200,xp:3000}] },
    ],
    oneTime: [
      { id: "first_biz_auto",   label: "Автоматизував перший бізнес-процес",        xp: 1000 },
      { id: "first_ai_agent",   label: "Запустив першого AI-агента",                xp: 800  },
      { id: "client_auto",      label: "Зробив автоматизацію для клієнта",          xp: 2000 },
      { id: "agent_24h",        label: "Агент працював 24 год без участі людини",   xp: 1500 },
      { id: "income_auto",      label: "Заробив $ на автоматизації",                xp: 2000 },
    ],
  },
  {
    id: "code", name: "Код / Боти", emoji: "💻", color: "#6366f1",
    progressive: [
      { id: "lines_written",  label: "Рядків коду написано",          milestones: [{count:100,xp:100},{count:1000,xp:400},{count:10000,xp:1500},{count:50000,xp:4000}] },
      { id: "projects_launched", label: "Запущених проектів / сайтів", milestones: [{count:1,xp:300},{count:3,xp:700},{count:10,xp:2000},{count:30,xp:5000}] },
    ],
    oneTime: [
      { id: "first_deploy",    label: "Перший сайт задеплоєний (Oxford_1000!)", xp: 800  },
      { id: "telegram_bot",    label: "Перший Telegram-бот",                    xp: 1000 },
      { id: "100_users",       label: "Проект набрав 100 активних користувачів", xp: 2000 },
      { id: "paid_client_code", label: "Перший платний клієнт за код",          xp: 2000 },
      { id: "first_saas",      label: "Перший SaaS продукт",                    xp: 3000 },
    ],
  },
  {
    id: "design", name: "AI Дизайн", emoji: "✨", color: "#f43f5e",
    progressive: [
      { id: "mockups_created", label: "Дизайн-макетів створено",       milestones: [{count:1,xp:100},{count:10,xp:350},{count:100,xp:1000},{count:500,xp:3000}] },
      { id: "logos_created",   label: "Логотипів / брендів створено",  milestones: [{count:1,xp:200},{count:5,xp:600},{count:25,xp:1500},{count:100,xp:4000}] },
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
      { id: "content_views",    label: "Переглядів контенту",                     milestones: [{count:100,xp:100},{count:1000,xp:400},{count:10000,xp:1200},{count:100000,xp:3500}] },
    ],
    oneTime: [
      { id: "viral_post",       label: "Перший вірусний пост (1000+ переглядів)", xp: 1000 },
      { id: "30_days_posting",  label: "30 днів щоденних публікацій",             xp: 1500 },
      { id: "content_monetize", label: "Перша монетизація контенту",              xp: 2000 },
    ],
  },
  {
    id: "monetize", name: "Монетизація", emoji: "💰", color: "#fbbf24",
    progressive: [
      { id: "ai_income",  label: "Дохід з AI-проектів ($)",  milestones: [{count:1,xp:200},{count:100,xp:800},{count:1000,xp:2500},{count:10000,xp:6000}] },
      { id: "clients",    label: "Клієнтів / продажів",      milestones: [{count:1,xp:300},{count:5,xp:800},{count:20,xp:2000},{count:100,xp:5000}] },
    ],
    oneTime: [
      { id: "first_paid_client",  label: "Перший платний клієнт",            xp: 1000 },
      { id: "digital_product",    label: "Перший цифровий продукт на продаж", xp: 1500 },
      { id: "1k_month",           label: "Перший місяць $1,000+ з AI",        xp: 3000 },
      { id: "passive_income",     label: "Перший пасивний дохід",             xp: 2000 },
    ],
  },
];

// Рівні складності — 6 ступенів рідкісності
const TIERS = {
  common:    { label: "Common",    color: "#9a7850", glow: "rgba(154,120,80,0.40)"  },
  uncommon:  { label: "Uncommon",  color: "#a0b8c8", glow: "rgba(160,184,200,0.45)" },
  rare:      { label: "Rare",      color: "#4a9fd4", glow: "rgba(74,159,212,0.50)"  },
  epic:      { label: "Epic",      color: "#a855f7", glow: "rgba(168,85,247,0.55)"  },
  legendary: { label: "Legendary", color: "#ffb700", glow: "rgba(255,183,0,0.70)"   },
  prime:     { label: "Prime",     color: "#ef4444", glow: "rgba(239,68,68,0.60)"   },
};

// Групи досягнень (для рендеру з заголовками)
const ACH_GROUPS = [
  { id: "tools",    label: "🧠 Інструменти" },
  { id: "income",   label: "💰 Дохід" },
  { id: "projects", label: "🚀 Проекти" },
  { id: "streak",   label: "🔥 Стріки" },
  { id: "sessions", label: "⚡ Сесії" },
  { id: "learning", label: "📚 Вивчення ШІ" },
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
  { id: "million_dollar",  group: "income", tier: "legendary", name: "Мільйонер",    desc: "Зароби $1,000,000 з AI",  xp: 15000, icon: "🤑", check: (t, i) => i >= 1000000 },

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

  // ── Вивчення ШІ (годин) ──
  { id: "learn_10",    group: "learning", tier: "common",    name: "Початківець",    desc: "10 годин вивчення ШІ",     xp: 200,   icon: "📖", check: (t, i, p, sd, st, ts, h) => h >= 10 },
  { id: "learn_50",    group: "learning", tier: "uncommon",  name: "Учень",          desc: "50 годин вивчення ШІ",     xp: 500,   icon: "📗", check: (t, i, p, sd, st, ts, h) => h >= 50 },
  { id: "learn_250",   group: "learning", tier: "rare",      name: "Студент ШІ",     desc: "250 годин вивчення ШІ",    xp: 1200,  icon: "📘", check: (t, i, p, sd, st, ts, h) => h >= 250 },
  { id: "learn_1000",  group: "learning", tier: "epic",      name: "Експерт",        desc: "1,000 годин вивчення ШІ",  xp: 3000,  icon: "🎓", check: (t, i, p, sd, st, ts, h) => h >= 1000 },
  { id: "learn_5000",  group: "learning", tier: "legendary", name: "Майстер ШІ",     desc: "5,000 годин вивчення ШІ",  xp: 8000,  icon: "🧠", check: (t, i, p, sd, st, ts, h) => h >= 5000 },
  { id: "learn_10000", group: "learning", tier: "prime",     name: "10,000 годин",   desc: "10,000 годин — правило майстерності", xp: 20000, icon: "🏆", check: (t, i, p, sd, st, ts, h) => h >= 10000 },

  // ── Особливі ──
  { id: "oxford_dev", group: "special", tier: "epic", name: "Oxford Dev", desc: "Запущено! (Oxford_1000 вже є 🎉)", xp: 300, icon: "📚", check: () => true },
];

const DEFAULT_SKILL_DATA = Object.fromEntries(SKILLS.map(s => [s.id, { unlockedTools: [] }]));
const DEFAULT_PROJECTS = [{ name: "Oxford_1000 — додаток для англійської", date: "2026" }];
const DEFAULT_SESSIONS = { dates: [], monthlyTarget: 50 };
const STORAGE_KEY = "ai_tracker_v1";

// Єдине джерело правди для блоку «Активність».
// kind: "learn" → лічильник у learnTime; "skill" → у skillTasksData (ключ catId_taskId).
const ACTIVITY_DEFS = [
  { kind: "learn", key: "education",            emoji: "📚", label: "Навчання",    color: "#06b6d4", note: "30хв/раз", xp: 4 },
  { kind: "learn", key: "business",             emoji: "💼", label: "Бізнес",      color: "#f59e0b", note: "30хв/раз", xp: 4 },
  { kind: "learn", key: "edu_videos",           emoji: "📺", label: "Навч. відео", color: "#a855f7", note: "1 відео",  xp: 3 },
  { kind: "skill", key: "image_images_gen",     emoji: "🎨", label: "Зображення",  color: "#ff6b35",                  xp: 2 },
  { kind: "skill", key: "video_videos_created", emoji: "🎬", label: "Відео",       color: "#a855f7",                  xp: 8 },
  { kind: "skill", key: "music_tracks_created", emoji: "🎵", label: "Музика",      color: "#ec4899",                  xp: 6 },
];
const ACTIVITY_XP = Object.fromEntries(ACTIVITY_DEFS.map(d => [d.key, d.xp]));

const GOAL_CATEGORIES = [
  { id: "income", label: "Дохід", color: "#f59e0b", icon: "💰" },
  { id: "skills", label: "Навички", color: "#00ff88", icon: "🧠" },
  { id: "project", label: "Проект", color: "#6366f1", icon: "🚀" },
  { id: "other", label: "Інше", color: "#6a5f40", icon: "🎯" },
];

const PLAN_TYPES = [
  { id: "content",  label: "Контент",  color: "#ec4899", bg: "rgba(236,72,153,0.08)" },
  { id: "learning", label: "Навчання", color: "#06b6d4", bg: "rgba(6,182,212,0.08)" },
  { id: "bots",     label: "Боти",     color: "#a855f7", bg: "rgba(168,85,247,0.08)" },
  { id: "work",     label: "Робота",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  { id: "other",    label: "Інше",     color: "#9a8a60", bg: "rgba(154,138,96,0.08)" },
];

const PLAN_URGENCIES = [
  { id: "now",   label: "Зараз", order: 0 },
  { id: "soon",  label: "Скоро", order: 1 },
  { id: "later", label: "Потім", order: 2 },
];

const DEFAULT_GOALS = [
  { id: "dg1", text: "Навчитися та застосувати 3 нові AI-інструменти", priority: "important", xp: 150, done: false },
  { id: "dg2", text: "Зробити перший продаж через AI", priority: "urgent", xp: 200, done: false },
  { id: "dg3", text: "Написати пост про прогрес в AI", priority: "normal", xp: 50, done: false },
];

const TASK_PRIORITIES = [
  { id: "urgent",    label: "Термінові",  color: "#f43f5e", bg: "rgba(244,63,94,0.10)",  border: "rgba(244,63,94,0.30)",  fontWeight: 800 },
  { id: "important", label: "Важливі",    color: "#c9a84c", bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.28)", fontWeight: 700 },
  { id: "normal",    label: "Звичайні",   color: "#8a9ab0", bg: "rgba(138,154,176,0.06)", border: "rgba(138,154,176,0.20)", fontWeight: 500 },
];

const MONTH_NAMES_UA = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

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

const DEFAULT_LONG_GOALS = [
  { id: "lg1", text: "Заробити $14,000 цього року", period: "year_cur",  customXP: 500, done: false },
  { id: "lg2", text: "Вивчити 20 AI-інструментів",  period: "year_cur",  customXP: 300, done: false },
  { id: "lg3", text: "Запустити перший digital product", period: "longterm", customXP: 400, done: false },
];

const DEFAULT_PLAN = [
  { id: "dp1", text: "Affiliate — партнерські комісії за продаж AI-сервісів", type: "other", urgency: "now",   done: false },
  { id: "dp2", text: "Digital Products — шаблони, пресети, гайди, паки",       type: "other", urgency: "now",   done: false },
  { id: "dp3", text: "Послуги — AI-послуги клієнтам (картки, контент, боти)",   type: "other", urgency: "now",   done: false },
  { id: "dp4", text: "Контент — монетизація соц. мереж (YouTube, TikTok, Telegram)", type: "other", urgency: "soon",  done: false },
  { id: "dp5", text: "Навчання — AI-курси, гайди, консультації",                type: "other", urgency: "soon",  done: false },
  { id: "dp6", text: "SaaS / Боти — програмні сервіси за підпискою",            type: "other", urgency: "later", done: false },
  { id: "dp7", text: "Ком'юніті — закриті спільноти і підписки",                type: "other", urgency: "later", done: false },
  { id: "dp8", text: "Контент-фабрика — B2B виробництво контенту для інших",    type: "other", urgency: "later", done: false },
  { id: "dp9", text: "Автоматизація — продаж AI-пайплайнів для бізнесу",        type: "other", urgency: "later", done: false },
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

const APP_START_DATE = "2026-06-01";

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

// ── Floating 3D background — dark blue geometric ───────────────────────────
const BG_SHAPES = [
  // Back layer — large panels, barely move
  { id:  1, type: "shard", left: -6,  top: -10, size: 500, depth: 0.12, phase: 0.0, op: 0.90, v: "a" },
  { id:  2, type: "shard", left: 36,  top: -14, size: 460, depth: 0.16, phase: 1.9, op: 0.85, v: "b" },
  { id:  3, type: "shard", left: 60,  top: 20,  size: 420, depth: 0.14, phase: 3.1, op: 0.82, v: "c" },
  { id:  4, type: "shard", left: 74,  top: -20, size: 440, depth: 0.19, phase: 0.8, op: 0.88, v: "d" },
  // Mid layer
  { id:  5, type: "shard", left: 6,   top: 48,  size: 300, depth: 0.28, phase: 2.2, op: 0.76, v: "b" },
  { id:  6, type: "shard", left: 44,  top: 54,  size: 270, depth: 0.34, phase: 4.1, op: 0.70, v: "a" },
  { id:  7, type: "shard", left: 76,  top: 52,  size: 310, depth: 0.26, phase: 1.3, op: 0.74, v: "d" },
  { id:  8, type: "shard", left: -2,  top: 22,  size: 240, depth: 0.32, phase: 5.2, op: 0.68, v: "c" },
  // Glow crack lines
  { id:  9, type: "glow",  left: 18,  top: 12,  size: 320, depth: 0.38, phase: 0.6, op: 0.55, v: "a" },
  { id: 10, type: "glow",  left: 50,  top: 6,   size: 280, depth: 0.44, phase: 2.7, op: 0.48, v: "b" },
  { id: 11, type: "glow",  left: 66,  top: 60,  size: 240, depth: 0.46, phase: 1.2, op: 0.42, v: "c" },
  { id: 12, type: "glow",  left: 30,  top: 68,  size: 200, depth: 0.52, phase: 3.8, op: 0.38, v: "a" },
  // Front small shards — move most with cursor
  { id: 13, type: "shard", left: 2,   top: 72,  size: 190, depth: 0.50, phase: 3.4, op: 0.62, v: "c" },
  { id: 14, type: "shard", left: 20,  top: 80,  size: 170, depth: 0.56, phase: 0.9, op: 0.55, v: "a" },
  { id: 15, type: "shard", left: 84,  top: 24,  size: 210, depth: 0.47, phase: 2.4, op: 0.65, v: "b" },
];

function ShardSvg({ s, v }) {
  const pts = {
    a: `0,${s*0.28} ${s*0.65},0 ${s},${s*0.60} ${s*0.28},${s}`,
    b: `${s*0.24},0 ${s},${s*0.18} ${s*0.80},${s} 0,${s*0.84}`,
    c: `${s*0.08},0 ${s*0.94},${s*0.06} ${s},${s*0.90} ${s*0.06},${s*0.96}`,
    d: `${s*0.46},0 ${s*0.96},${s*0.42} ${s*0.54},${s} 0,${s*0.56}`,
  }[v] || "";
  const id = `sg${v}${s}`;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <polygon points={pts} fill="#050a16" fillOpacity="0.94" stroke="#1e58c8" strokeWidth="1.2" strokeOpacity="0.70" filter={`url(#${id})`} />
    </svg>
  );
}

function GlowLineSvg({ s, v }) {
  const L = {
    a: [0, s*0.38, s, s*0.12],
    b: [s*0.14, 0, s*0.86, s],
    c: [0, s*0.72, s, s*0.28],
  }[v] || [0, 0, s, s];
  const id = `gl${v}${s}`;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <line x1={L[0]} y1={L[1]} x2={L[2]} y2={L[3]} stroke="#2070e8" strokeWidth="2.5" strokeOpacity="0.75" filter={`url(#${id})`} />
      <line x1={L[0]} y1={L[1]} x2={L[2]} y2={L[3]} stroke="#90c0ff" strokeWidth="0.8" strokeOpacity="0.45" />
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
      curRef.current.x += (tgtRef.current.x - curRef.current.x) * 0.038;
      curRef.current.y += (tgtRef.current.y - curRef.current.y) * 0.038;
      const t = Date.now() / 1000;
      wrapRef.current?.querySelectorAll("[data-bg]").forEach(el => {
        const depth = +el.dataset.depth;
        const phase = +el.dataset.phase;
        const tx = curRef.current.x * depth * -28;
        const ty = curRef.current.y * depth * -28;
        const fy = Math.sin(t * 0.38 + phase) * 8;
        const fx = Math.cos(t * 0.28 + phase) * 4;
        const rot = Math.sin(t * 0.14 + phase) * 3;
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
          style={{ position: "absolute", left: `${s.left}%`, top: `${s.top}%`, opacity: s.op, willChange: "transform" }}>
          {s.type === "shard" && <ShardSvg s={s.size} v={s.v} />}
          {s.type === "glow"  && <GlowLineSvg s={s.size} v={s.v} />}
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
    return (saved_ta?.date === todayStr()) ? saved_ta.data : {};
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
  const [aiAvailModels, setAiAvailModels] = useState(null);
  const aiMsgsRef = useRef(null);
  const dragRef = useRef({});

  const TAB_IDS = ["dashboard", "goals", "plan", "longgoals", "projects", "tools", "skillstasks", "achievements", "finances", "sessions", "progress", "stats"];

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
    const state = { skillData, totalXP, activityXP, xpLog, incomeEntries, expenseEntries, incomeCats, expenseCats, uahRate, uahRateUpdatedAt, subscriptions, subCheckedMonth, projects, unlockedAchievements, achievementDates, sessions, activeDays, goals, longGoals, longGoalEpoch, plan, aiMessages, aiModel, aiApiKeys, progressLog, todayXP, skillTasksData, learnTime };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [skillData, totalXP, activityXP, xpLog, incomeEntries, expenseEntries, incomeCats, expenseCats, uahRate, uahRateUpdatedAt, subscriptions, subCheckedMonth, projects, unlockedAchievements, achievementDates, sessions, activeDays, goals, longGoals, longGoalEpoch, plan, aiMessages, aiModel, aiApiKeys, progressLog, todayXP, skillTasksData, learnTime]);

  useEffect(() => {
    localStorage.setItem("ai_tracker_today_act", JSON.stringify({ date: todayStr(), data: todayActivity }));
  }, [todayActivity]);

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
  const curLevelXP = xpForLevel(totalLevel);
  const nextLevelXP = xpForLevel(totalLevel + 1);
  const xpProgress = ((totalXP - curLevelXP) / (nextLevelXP - curLevelXP)) * 100;
  const totalTools = Object.values(skillData).flatMap(s => s.unlockedTools).length;

  const streak = useMemo(() => calcStreak(sessions.dates), [sessions.dates]);
  const longestStreak = useMemo(() => calcLongestStreak(sessions.dates), [sessions.dates]);
  const monthSessions = useMemo(() => sessionsThisMonth(sessions.dates), [sessions.dates]);
  const doneToday = sessions.dates.includes(todayStr());
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

  const showAchievementToast = useCallback((ach) => {
    const tid = Date.now() + Math.random();
    setAchieveToasts(prev => [...prev.slice(-3), { id: tid, dying: false, ...ach }]);
    setTimeout(() => setAchieveToasts(prev => prev.map(t => t.id === tid ? { ...t, dying: true } : t)), 3800);
    setTimeout(() => setAchieveToasts(prev => prev.filter(t => t.id !== tid)), 4300);
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
    const newlyUnlocked = [];
    let bonusXP = 0;
    ACHIEVEMENTS.forEach(a => {
      if (currentUnlocked.includes(a.id)) return;
      if (a.check(tools, inc, proj, sd, currentStreak, totalSessions, learnHours)) {
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
    const newProjects = [...projects, { name: projectInput.trim(), date: new Date().toLocaleDateString("uk-UA"), status: "in_progress", creationXP: 100, completionXP: cxp, completionXPPaid: false }];
    setProjects(newProjects);
    gainXP(100, `(${projectInput.trim()})`, "project");
    recordActiveDay();
    setProjectCompletionXP(200);
    setProjectInput("");
    setUnlockedAchievements(ua => {
      checkAchievements(totalTools, totalIncome, newProjects.length, skillData, ua, streak, sessions.dates.length);
      return ua;
    });
  }, [projectInput, projects, gainXP, recordActiveDay, checkAchievements, totalTools, totalIncome, skillData, streak, sessions.dates.length]);

  const logSession = useCallback(() => {
    if (doneToday) return;
    const today = todayStr();
    const newDates = [...sessions.dates, today];
    const newStreak = calcStreak(newDates);
    const newSessions = { ...sessions, dates: newDates };
    setSessions(newSessions);
    gainXP(5, "(AI-сесія)", "session");
    recordActiveDay();
    setUnlockedAchievements(ua => {
      checkAchievements(totalTools, totalIncome, projects.length, skillData, ua, newStreak, newDates.length);
      return ua;
    });
  }, [doneToday, sessions, gainXP, recordActiveDay, checkAchievements, totalTools, totalIncome, projects, skillData]);

  const updateMonthlyTarget = useCallback((val) => {
    const t = parseInt(val);
    if (t > 0 && t <= 31) setSessions(prev => ({ ...prev, monthlyTarget: t }));
  }, []);

  const tabs = [
    { id: "dashboard",    label: "🏠 Головна" },
    { id: "goals",        label: "✅ Задачі" },
    { id: "plan",         label: "📋 План дій" },
    { id: "longgoals",    label: "🎯 Цілі" },
    { id: "projects",    label: "🚀 Проекти" },
    { id: "tools",       label: "🛠️ Інструменти" },
    { id: "skillstasks", label: "💪 Навички" },
    { id: "achievements", label: "🏆 Досягнення" },
    { id: "finances",     label: "💸 Фінанси" },
    { id: "sessions",     label: "🔥 Сесії" },
    { id: "progress",     label: "📝 Прогрес" },
    { id: "stats",        label: "📊 Статистика" },
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

      <div style={{ position: "relative", zIndex: 1, maxWidth: "min(1200px, 92vw)", margin: "0 auto", padding: "20px 14px" }}>

        {/* Header */}
        {(() => {
          const lg = getLeague(totalLevel);
          const lc = lg.color;
          const lglow = lg.glow;
          const lbg = lg.bg.replace("135deg", "90deg");
          return (
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${lc}44` }}>

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
                <span style={{ background: `${lc}14`, border: `1px solid ${lc}80`, color: lc, padding: "3px 10px", borderRadius: 3, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>🔥 {totalActiveDays} дн.</span>
              </div>
              <div style={{ fontSize: 11, color: `${lc}80`, marginTop: 4, textTransform: "uppercase", letterSpacing: 3 }}>AI Progress Tracker</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "Дохід", val: `$${totalIncome.toFixed(0)}`, color: lc },
                { label: "Проекти", val: projects.length, color: lc },
                { label: "Інструменти", val: `${totalTools}/${TOTAL_TOOLS}`, color: "#00ff88" },
                { label: "Сесій/міс", val: `${monthSessions}/${daysInCurrentMonth}`, color: lc },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "10px 14px", minWidth: 84, background: "rgba(8,5,2,0.55)", border: `1px solid ${lc}28`, borderTop: `2px solid ${lc}60`, borderRadius: 4, boxShadow: `0 0 12px ${lglow}` }}>
                  <div style={{ fontSize: 11, color: `${lc}88`, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* XP Bar */}
          <div style={{ padding: "12px 16px", background: "rgba(8,5,2,0.55)", border: `1px solid ${lc}28`, borderTop: `2px solid ${lc}60`, borderRadius: 4, boxShadow: `0 0 12px ${lglow}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: lbg, color: "#000", padding: "3px 12px", borderRadius: 3, fontSize: 12, fontWeight: 800, fontFamily: "'Exo 2',sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>RANK {totalLevel}</span>
                <span style={{ fontSize: 12, color: lc, fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{totalXP.toLocaleString()} XP</span>
                {todayXP.total > 0 && (
                  <span style={{ background: "rgba(0,255,136,0.14)", border: "1px solid rgba(0,255,136,0.45)", color: "#00ff88", fontSize: 11, fontWeight: 800, fontFamily: "'Space Mono',monospace", padding: "2px 9px", borderRadius: 12, letterSpacing: 0.3, whiteSpace: "nowrap" }}>+{todayXP.total} XP сьогодні</span>
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
                if (!nextLg) return <span style={{ fontSize: 11, color: lc, fontFamily: "'Exo 2',sans-serif", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>★ {cur.name} ліга — МАКС</span>;
                const levelsLeft = nextLg.minLevel - totalLevel;
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: cur.color, fontFamily: "'Exo 2',sans-serif", fontWeight: 700, textTransform: "uppercase" }}>{cur.name}</span>
                    <span style={{ fontSize: 11, color: "#5a4a30" }}>→</span>
                    <span style={{ fontSize: 11, color: nextLg.color, fontFamily: "'Exo 2',sans-serif", fontWeight: 700, textTransform: "uppercase" }}>{nextLg.name}</span>
                    <span style={{ fontSize: 11, color: `${lc}88`, fontFamily: "'Space Mono',monospace" }}>ще {levelsLeft} рів.</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
          );
        })()}

        {/* Tabs — Warframe underline style */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid rgba(201,168,76,0.28)", flexWrap: "wrap", flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)} style={{ padding: "11px 13px", borderRadius: 0, fontSize: 12, cursor: "pointer", background: "transparent", color: activeTab === t.id ? "#d4b040" : "#6a5f40", border: "none", borderBottom: activeTab === t.id ? "2px solid #d4b040" : "2px solid transparent", marginBottom: -1, fontWeight: activeTab === t.id ? 800 : 600, fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: "1.5px", whiteSpace: "nowrap" }}>{t.label}</button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Session check-in */}
            <div style={{ background: doneToday ? "rgba(201,168,76,0.06)" : "rgba(244,63,94,0.05)", border: `1px solid ${doneToday ? "rgba(201,168,76,0.30)" : "rgba(244,63,94,0.2)"}`, borderTop: doneToday ? "2px solid rgba(201,168,76,0.6)" : "2px solid rgba(244,63,94,0.5)", borderRadius: 4, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: doneToday ? "#c9a84c" : "#f43f5e", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
                  {doneToday ? "✓ AI-сесія сьогодні виконана" : "⚡ Чи працював сьогодні з AI?"}
                </div>
                <div style={{ fontSize: 11, color: "#9a8a60", marginTop: 3 }}>
                  Стрік: {streak} дн. · {monthSessions}/{daysInCurrentMonth} цього місяця
                </div>
              </div>
              {!doneToday && (
                <button className="checkin-btn" onClick={logSession} style={{ background: "linear-gradient(135deg,#00ff88,#00cc6a)", color: "#000", border: "none", padding: "10px 20px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Space Mono',monospace", boxShadow: "0 0 20px rgba(0,255,136,0.3)", whiteSpace: "nowrap" }}>+ Так (+5 XP)</button>
              )}
            </div>

            {/* Активність */}
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
                      const xpLabel = tr.note ? `${tr.note} · +${tr.xp} XP` : `+${tr.xp} XP/шт`;
                      return (
                        <div key={tr.key} style={{ position: "relative", background: `${tr.color}0d`, border: `1px solid ${tr.color}35`, borderRadius: 8, padding: "14px 12px 12px", display: "flex", flexDirection: "column", gap: 10, overflow: "visible" }}>
                          {cardFloats.map(f => (
                            <span key={f.id} className="float-text" style={{ color: f.color }}>{f.text}</span>
                          ))}

                          {/* Header row */}
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ fontSize: 18 }}>{tr.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#9a8a72", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{tr.label}</div>
                              <div style={{ fontSize: 9, color: "#4a4030", fontFamily: "'Space Mono',monospace" }}>{xpLabel}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 22, fontWeight: 900, color: tr.color, fontFamily: "'Space Mono',monospace", textShadow: `0 0 10px ${tr.color}66`, lineHeight: 1 }}>{count}</div>
                              {todayCount > 0 && (
                                <div style={{ fontSize: 9, color: `${tr.color}99`, fontFamily: "'Space Mono',monospace", marginTop: 2 }}>+{todayCount} сьогодні</div>
                              )}
                            </div>
                          </div>

                          {/* Big + button */}
                          <button
                            className="act-plus"
                            onClick={() => doInc(1)}
                            style={{
                              width: "100%", padding: "14px 0",
                              borderRadius: 6,
                              background: `linear-gradient(180deg, ${tr.color}44 0%, ${tr.color}22 50%, ${tr.color}30 100%)`,
                              border: `2px solid ${tr.color}88`,
                              color: tr.color,
                              boxShadow: `0 4px 0 ${tr.color}44, 0 0 18px ${tr.color}33, inset 0 1px 0 ${tr.color}55`,
                              letterSpacing: 2,
                            }}
                          >+</button>

                          {/* − / N / ±N row */}
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

            {/* Priority tasks highlight */}
            {(() => {
              const activeTasks = goals.filter(g => !g.done);
              const urgentTasks = activeTasks.filter(g => g.priority === "urgent");
              const importantTasks = activeTasks.filter(g => g.priority === "important");
              const topTasks = [...urgentTasks, ...importantTasks].slice(0, 5);
              return (
                <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2 }}>🎯 Пріоритети</div>
                    <button onClick={() => setActiveTab("goals")} style={{ background: "none", border: "none", color: "#6a5f40", fontSize: 11, cursor: "pointer", fontFamily: "'Space Mono',monospace" }}>Всі задачі →</button>
                  </div>
                  {topTasks.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#6a5f40", textAlign: "center", padding: "12px 0" }}>
                      Немає активних пріоритетних задач.{" "}
                      <span onClick={() => setActiveTab("goals")} style={{ color: "#c9a84c", cursor: "pointer" }}>Додати →</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {topTasks.map(g => {
                        const pr = TASK_PRIORITIES.find(p => p.id === g.priority) ?? TASK_PRIORITIES[2];
                        return (
                          <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, background: pr.bg, border: `1px solid ${pr.border}`, borderRadius: 4, padding: "10px 14px" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: pr.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 13, color: "#e0d8c0", fontWeight: pr.fontWeight }}>{g.text}</span>
                            <span style={{ fontSize: 10, color: pr.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{pr.label}</span>
                          </div>
                        );
                      })}
                      {activeTasks.length > topTasks.length && (
                        <div onClick={() => setActiveTab("goals")} style={{ fontSize: 11, color: "#6a5f40", textAlign: "center", cursor: "pointer", paddingTop: 4 }}>
                          + ще {activeTasks.length - topTasks.length} задач →
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Skills grid */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>🧠 Навички</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
                {SKILLS.map(sk => {
                  const unlocked = skillData[sk.id].unlockedTools;
                  return (
                    <div key={sk.id} onClick={() => { setSelectedSkill(sk); setActiveTab("tools"); }} className="skill-card" style={{ background: "rgba(3,2,0,0.6)", border: `1px solid ${unlocked.length > 0 ? sk.color + "33" : "rgba(201,168,76,0.10)"}`, borderRadius: 4, padding: 12, cursor: "pointer" }}>
                      <div style={{ fontSize: 18, marginBottom: 5 }}>{sk.emoji}</div>
                      <div style={{ fontSize: 11, color: "#9a8a60", marginBottom: 4, fontFamily: "'Exo 2',sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{sk.name}</div>
                      <div style={{ fontSize: 12, color: sk.color, marginBottom: 5, fontWeight: 700, fontFamily: "'Exo 2',sans-serif" }}>{unlocked.length}/{sk.tools.length}</div>
                      <div style={{ height: 3, background: "rgba(201,168,76,0.18)", borderRadius: 2 }}>
                        <div style={{ width: `${(unlocked.length / sk.tools.length) * 100}%`, height: "100%", background: sk.color, borderRadius: 2, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>⚡ Швидкі дії</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "+ Вивчити інструмент", color: "#00ff88", rgb: "0,255,136", tab: "tools" },
                  { label: "+ Записати дохід", color: "#f59e0b", rgb: "245,158,11", tab: "finances" },
                  { label: "+ Новий проект", color: "#6366f1", rgb: "99,102,241", tab: "projects" },
                  { label: "+ Нова задача", color: "#f43f5e", rgb: "244,63,94", tab: "goals" },
                ].map(btn => (
                  <button key={btn.tab} className="act-btn" onClick={() => setActiveTab(btn.tab)} style={{ background: `rgba(${btn.rgb},0.1)`, border: `1px solid ${btn.color}`, color: btn.color, padding: "10px 16px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{btn.label}</button>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 4, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#8a7850" }}>🏅 Досягнення</span>
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
                  <div style={{ fontSize: 12, color: "#9a8a60", marginTop: 6 }}>Повернись завтра для нового +5 XP</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Exo 2',sans-serif", marginBottom: 16 }}>Ти сьогодні працював з AI?</div>
                  <button className="checkin-btn" onClick={logSession} style={{ background: "linear-gradient(135deg,#00ff88,#00cc6a)", color: "#000", border: "none", padding: "16px 40px", borderRadius: 4, fontWeight: 800, cursor: "pointer", fontSize: 16, fontFamily: "'Exo 2',sans-serif", boxShadow: "0 0 30px rgba(0,255,136,0.4)", letterSpacing: 0.5 }}>⚡ Так, працював! (+5 XP)</button>
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
                  loseXP(100, "skill", "↩ інструмент");
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
        {/* Goals = Задачі */}
        {activeTab === "goals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Add task */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 16 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>+ Нова задача</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && goalInput.trim()) {
                      setGoals(prev => [...prev, { id: `g${Date.now()}`, text: goalInput.trim(), priority: goalPriority, xp: goalXP, done: false, createdAt: new Date().toISOString() }]);
                      setGoalInput("");
                    }
                  }}
                  placeholder="Опиши задачу..."
                  style={{ flex: 1, minWidth: 180, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 14px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
                />
                <select
                  value={goalPriority}
                  onChange={e => setGoalPriority(e.target.value)}
                  style={{ background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 12px", color: "#c0b090", fontSize: 12, cursor: "pointer" }}
                >
                  {TASK_PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "0 10px" }}>
                  <span style={{ fontSize: 11, color: "#6a5f40" }}>XP</span>
                  <input type="number" min="0" max="9999" value={goalXP} onChange={e => setGoalXP(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: 52, background: "transparent", border: "none", color: "#00ff88", fontSize: 13, fontFamily: "'Space Mono',monospace", textAlign: "center", padding: "9px 0" }} />
                </div>
                <button className="act-btn" onClick={() => {
                  if (!goalInput.trim()) return;
                  setGoals(prev => [...prev, { id: `g${Date.now()}`, text: goalInput.trim(), priority: goalPriority, xp: goalXP, done: false, createdAt: new Date().toISOString() }]);
                  setGoalInput("");
                }} style={{ background: "#00ff88", color: "#000", border: "none", padding: "9px 16px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Додати</button>
              </div>
            </div>

            {/* Tasks by priority */}
            {TASK_PRIORITIES.map(pr => {
              const prTasks = goals.filter(g => !g.done && (g.priority ?? "normal") === pr.id);
              if (!prTasks.length) return null;
              return (
                <div key={pr.id} style={{ background: "rgba(5,3,1,0.76)", border: `1px solid ${pr.border}`, borderLeft: `3px solid ${pr.color}`, borderRadius: 4, padding: 16 }}>
                  <div style={{ fontSize: 12, color: pr.color, fontWeight: 800, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.5 }}>{pr.label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {prTasks.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, background: pr.bg, borderRadius: 4, padding: "10px 12px" }}>
                        <button onClick={() => setGoals(prev => prev.map(x => {
                          if (x.id !== g.id) return x;
                          if (!x.done && !x.xpAwarded) { gainXP(g.xp ?? 100, "(задачу виконано)", "goal"); return { ...x, done: true, xpAwarded: true }; }
                          return { ...x, done: !x.done };
                        }))} style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${pr.color}66`, background: "transparent", cursor: "pointer", flexShrink: 0, fontSize: 10, color: pr.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }} />
                        {goalEditId === g.id ? (
                          <div style={{ flex: 1, display: "flex", gap: 6 }}>
                            <input
                              autoFocus
                              value={goalEditText}
                              onChange={e => setGoalEditText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") { setGoals(prev => prev.map(x => x.id === g.id ? { ...x, text: goalEditText.trim() || x.text, xp: goalEditXP } : x)); setGoalEditId(null); }
                                if (e.key === "Escape") setGoalEditId(null);
                              }}
                              onBlur={() => { setGoals(prev => prev.map(x => x.id === g.id ? { ...x, text: goalEditText.trim() || x.text, xp: goalEditXP } : x)); setGoalEditId(null); }}
                              style={{ flex: 1, background: "rgba(8,5,2,0.9)", border: `1px solid ${pr.color}66`, borderRadius: 3, padding: "4px 10px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(8,5,2,0.9)", border: `1px solid ${pr.color}44`, borderRadius: 3, padding: "0 8px" }}>
                              <span style={{ fontSize: 10, color: "#6a5f40" }}>XP</span>
                              <input type="number" min="0" max="9999" value={goalEditXP} onChange={e => setGoalEditXP(Math.max(0, parseInt(e.target.value) || 0))}
                                style={{ width: 44, background: "transparent", border: "none", color: "#00ff88", fontSize: 12, fontFamily: "'Space Mono',monospace", textAlign: "center", padding: "4px 0" }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ flex: 1, color: "#e0d8c0", fontSize: 13, fontWeight: pr.fontWeight }}>{g.text}</span>
                        )}
                        {goalEditId !== g.id && (
                          <span style={{ fontSize: 11, color: "#00ff88", background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap", flexShrink: 0 }}>+{g.xp ?? 100} XP</span>
                        )}
                        {/* Priority change */}
                        <select
                          value={g.priority ?? "normal"}
                          onChange={e => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, priority: e.target.value } : x))}
                          style={{ background: "rgba(8,5,2,0.68)", border: `1px solid ${pr.color}44`, borderRadius: 3, padding: "3px 6px", color: pr.color, fontSize: 10, cursor: "pointer", maxWidth: 90 }}
                        >
                          {TASK_PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                        <button onClick={() => { setGoalEditId(g.id); setGoalEditText(g.text); setGoalEditXP(g.xp ?? 100); }}
                          style={{ background: "none", border: "none", color: "#6a5f40", cursor: "pointer", fontSize: 13, padding: "0 3px" }} title="Редагувати">✎</button>
                        <button onClick={() => setGoals(prev => prev.filter(x => x.id !== g.id))}
                          style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 16, padding: "0 3px" }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Done tasks */}
            {(() => {
              const doneTasks = goals.filter(g => g.done);
              if (!doneTasks.length) return null;
              return (
                <div style={{ background: "rgba(5,3,1,0.60)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 4, padding: 16 }}>
                  <div style={{ fontSize: 12, color: "#00ff88", fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.5 }}>✓ Виконано ({doneTasks.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {doneTasks.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
                        <button onClick={() => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, done: false } : x))}
                          style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #00ff88", background: "#00ff88", cursor: "pointer", flexShrink: 0, fontSize: 10, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✓</button>
                        <span style={{ flex: 1, color: "#6a7060", fontSize: 12, textDecoration: "line-through" }}>{g.text}</span>
                        <button onClick={() => setGoals(prev => prev.filter(x => x.id !== g.id))}
                          style={{ background: "none", border: "none", color: "#4a4030", cursor: "pointer", fontSize: 15, padding: "0 3px" }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {goals.length === 0 && (
              <div style={{ textAlign: "center", padding: 32, color: "#6a5f40", fontSize: 13 }}>Ще немає задач. Додай першу!</div>
            )}
          </div>
        )}

        {/* Long-term Goals = Цілі */}
        {activeTab === "longgoals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Add goal */}
            <div style={{ background: "rgba(5,3,1,0.76)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: 16 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>+ Нова ціль</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  value={longGoalInput}
                  onChange={e => setLongGoalInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && longGoalInput.trim()) {
                      setLongGoals(prev => [...prev, { id: `lg${Date.now()}`, text: longGoalInput.trim(), period: longGoalPeriod, customXP: longGoalXP, done: false, createdAt: new Date().toISOString() }]);
                      setLongGoalInput("");
                    }
                  }}
                  placeholder="Опиши ціль..."
                  style={{ flex: 1, minWidth: 200, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 14px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
                />
                <select
                  value={longGoalPeriod}
                  onChange={e => setLongGoalPeriod(e.target.value)}
                  style={{ background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 12px", color: "#c0b090", fontSize: 12, cursor: "pointer" }}
                >
                  {GOAL_PERIODS.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "0 10px" }}>
                  <span style={{ fontSize: 11, color: "#6a5f40" }}>XP</span>
                  <input type="number" min="0" max="99999" value={longGoalXP} onChange={e => setLongGoalXP(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: 60, background: "transparent", border: "none", color: "#00ff88", fontSize: 13, fontFamily: "'Space Mono',monospace", textAlign: "center", padding: "9px 0" }} />
                </div>
                <button className="act-btn" onClick={() => {
                  if (!longGoalInput.trim()) return;
                  setLongGoals(prev => [...prev, { id: `lg${Date.now()}`, text: longGoalInput.trim(), period: longGoalPeriod, customXP: longGoalXP, done: false, createdAt: new Date().toISOString() }]);
                  setLongGoalInput("");
                }} style={{ background: "#00ff88", color: "#000", border: "none", padding: "9px 16px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Додати</button>
              </div>
            </div>

            {/* Goals by period */}
            {GOAL_PERIODS.map(per => {
              const perGoals = longGoals.filter(g => !g.done && g.period === per.id);
              if (!perGoals.length) return null;
              return (
                <div key={per.id} style={{ background: "rgba(5,3,1,0.76)", border: `1px solid ${per.color}33`, borderLeft: `3px solid ${per.color}`, borderRadius: 4, padding: 16 }}>
                  <div style={{ fontSize: 12, color: per.color, fontWeight: 800, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.5 }}>{per.icon} {per.label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {perGoals.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, background: `${per.color}08`, borderRadius: 4, padding: "10px 12px" }}>
                        <button onClick={() => setLongGoals(prev => prev.map(x => {
                          if (x.id !== g.id) return x;
                          if (!x.done && !x.xpAwarded) { gainXP(x.customXP ?? 200, "(ціль досягнута)", "goal"); return { ...x, done: true, xpAwarded: true }; }
                          return { ...x, done: !x.done };
                        }))} style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${per.color}66`, background: "transparent", cursor: "pointer", flexShrink: 0, fontSize: 10, color: per.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }} />
                        {longGoalEditId === g.id ? (
                          <div style={{ flex: 1, display: "flex", gap: 6 }}>
                            <input
                              autoFocus
                              value={longGoalEditText}
                              onChange={e => setLongGoalEditText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") { setLongGoals(prev => prev.map(x => x.id === g.id ? { ...x, text: longGoalEditText.trim() || x.text, customXP: longGoalEditXP } : x)); setLongGoalEditId(null); }
                                if (e.key === "Escape") setLongGoalEditId(null);
                              }}
                              onBlur={() => { setLongGoals(prev => prev.map(x => x.id === g.id ? { ...x, text: longGoalEditText.trim() || x.text, customXP: longGoalEditXP } : x)); setLongGoalEditId(null); }}
                              style={{ flex: 1, background: "rgba(8,5,2,0.9)", border: `1px solid ${per.color}66`, borderRadius: 3, padding: "4px 10px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(8,5,2,0.9)", border: `1px solid ${per.color}44`, borderRadius: 3, padding: "0 8px" }}>
                              <span style={{ fontSize: 10, color: "#6a5f40" }}>XP</span>
                              <input type="number" min="0" max="99999" value={longGoalEditXP} onChange={e => setLongGoalEditXP(Math.max(0, parseInt(e.target.value) || 0))}
                                style={{ width: 52, background: "transparent", border: "none", color: "#00ff88", fontSize: 12, fontFamily: "'Space Mono',monospace", textAlign: "center", padding: "4px 0" }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ flex: 1, color: "#e0d8c0", fontSize: 13, fontWeight: 600 }}>{g.text}</span>
                        )}
                        {longGoalEditId !== g.id && (
                          <span style={{ fontSize: 11, color: per.color, background: `${per.color}14`, border: `1px solid ${per.color}33`, padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap", flexShrink: 0 }}>+{g.customXP ?? 200} XP</span>
                        )}
                        <select
                          value={g.period}
                          onChange={e => setLongGoals(prev => prev.map(x => x.id === g.id ? { ...x, period: e.target.value } : x))}
                          style={{ background: "rgba(8,5,2,0.68)", border: `1px solid ${per.color}44`, borderRadius: 3, padding: "3px 6px", color: per.color, fontSize: 10, cursor: "pointer", maxWidth: 110 }}
                        >
                          {GOAL_PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                        <button onClick={() => { setLongGoalEditId(g.id); setLongGoalEditText(g.text); setLongGoalEditXP(g.customXP ?? 200); }}
                          style={{ background: "none", border: "none", color: "#6a5f40", cursor: "pointer", fontSize: 13, padding: "0 3px" }} title="Редагувати">✎</button>
                        <button onClick={() => setLongGoals(prev => prev.filter(x => x.id !== g.id))}
                          style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 16, padding: "0 3px" }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Done goals */}
            {(() => {
              const doneGoals = longGoals.filter(g => g.done);
              if (!doneGoals.length) return null;
              return (
                <div style={{ background: "rgba(5,3,1,0.60)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 4, padding: 16 }}>
                  <div style={{ fontSize: 12, color: "#00ff88", fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.5 }}>✓ Досягнуто ({doneGoals.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {doneGoals.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
                        <button onClick={() => setLongGoals(prev => prev.map(x => x.id === g.id ? { ...x, done: false } : x))}
                          style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #00ff88", background: "#00ff88", cursor: "pointer", flexShrink: 0, fontSize: 10, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✓</button>
                        <span style={{ flex: 1, color: "#6a7060", fontSize: 12, textDecoration: "line-through" }}>{g.text}</span>
                        <button onClick={() => setLongGoals(prev => prev.filter(x => x.id !== g.id))}
                          style={{ background: "none", border: "none", color: "#4a4030", cursor: "pointer", fontSize: 15, padding: "0 3px" }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {longGoals.length === 0 && (
              <div style={{ textAlign: "center", padding: 32, color: "#6a5f40", fontSize: 13 }}>Ще немає цілей. Додай першу!</div>
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
                      setPlan(prev => [...prev, { id: `p${Date.now()}`, text: planInput.trim(), type: planType, urgency: planUrgency, done: false }]);
                      setPlanInput("");
                    }
                  }}
                  placeholder="Задача або стратегія..."
                  style={{ flex: 1, minWidth: 180, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 14px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
                />
                <select
                  value={planType}
                  onChange={e => setPlanType(e.target.value)}
                  style={{ background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 12px", color: "#6a5f40", fontSize: 12, cursor: "pointer" }}
                >
                  {PLAN_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <select
                  value={planUrgency}
                  onChange={e => setPlanUrgency(e.target.value)}
                  style={{ background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 4, padding: "9px 12px", color: "#6a5f40", fontSize: 12, cursor: "pointer" }}
                >
                  {PLAN_URGENCIES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
                <button className="act-btn" onClick={() => {
                  if (!planInput.trim()) return;
                  setPlan(prev => [...prev, { id: `p${Date.now()}`, text: planInput.trim(), type: planType, urgency: planUrgency, done: false }]);
                  setPlanInput("");
                }} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Додати</button>
              </div>
            </div>

            {/* Type groups */}
            {PLAN_TYPES.map(pt => {
              const urgencyOrder = Object.fromEntries(PLAN_URGENCIES.map(u => [u.id, u.order]));
              const items = plan
                .filter(p => (p.type ?? "other") === pt.id && !p.done)
                .sort((a, b) => (urgencyOrder[a.urgency ?? "later"] ?? 2) - (urgencyOrder[b.urgency ?? "later"] ?? 2));
              const done = plan.filter(p => (p.type ?? "other") === pt.id && p.done);
              if (!items.length && !done.length) return null;
              return (
                <div key={pt.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ background: pt.bg, border: `1px solid ${pt.color}44`, color: pt.color, padding: "3px 12px", borderRadius: 3, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{pt.label}</span>
                    <span style={{ fontSize: 11, color: "#5a4a30" }}>{items.length} активних{done.length > 0 ? ` · ${done.length} виконано` : ""}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {[...items, ...done].map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, background: item.done ? "rgba(5,3,1,0.80)" : pt.bg, border: `1px solid ${item.done ? "rgba(8,5,2,0.68)" : pt.color + "22"}`, borderLeft: item.done ? undefined : `3px solid ${pt.color}88`, borderRadius: 4, padding: "11px 14px" }}>
                        <button onClick={() => setPlan(prev => prev.map(x => {
                          if (x.id !== item.id) return x;
                          if (!x.done && !x.xpAwarded) {
                            gainXP(75, "(план дій)", "plan");
                            return { ...x, done: true, xpAwarded: true };
                          }
                          return { ...x, done: !x.done };
                        }))}
                          style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${item.done ? "#9a8a60" : pt.color}`, background: item.done ? "#9a8a60" : "transparent", cursor: "pointer", flexShrink: 0, fontSize: 12, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                          {item.done ? "✓" : ""}
                        </button>
                        {planEditId === item.id ? (
                          <input
                            value={planEditText}
                            autoFocus
                            onChange={e => setPlanEditText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                const t = planEditText.trim();
                                if (t) setPlan(prev => prev.map(x => x.id === item.id ? { ...x, text: t } : x));
                                setPlanEditId(null);
                              } else if (e.key === "Escape") {
                                setPlanEditId(null);
                              }
                            }}
                            onBlur={() => {
                              const t = planEditText.trim();
                              if (t) setPlan(prev => prev.map(x => x.id === item.id ? { ...x, text: t } : x));
                              setPlanEditId(null);
                            }}
                            style={{ flex: 1, background: "rgba(8,5,2,0.85)", border: `1px solid ${pt.color}66`, borderRadius: 4, padding: "5px 9px", color: "#fff", fontSize: 12, fontFamily: "'Space Mono',monospace" }}
                          />
                        ) : (
                          <span
                            onDoubleClick={() => { if (!item.done) { setPlanEditId(item.id); setPlanEditText(item.text); } }}
                            style={{ flex: 1, color: item.done ? "#5a4a30" : "#cbd5e1", fontSize: 12, textDecoration: item.done ? "line-through" : "none" }}
                          >{item.text}</span>
                        )}
                        {!item.done && !item.xpAwarded && planEditId !== item.id && (
                          <span style={{ fontSize: 12, color: pt.color, background: pt.bg, border: `1px solid ${pt.color}33`, padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap" }}>+75 XP</span>
                        )}
                        {!item.done && planEditId !== item.id && (
                          <>
                            <button onClick={() => { setPlanEditId(item.id); setPlanEditText(item.text); }}
                              style={{ background: "none", border: "none", color: "#6a5f40", cursor: "pointer", fontSize: 13, padding: "0 4px" }} title="Редагувати">✎</button>
                            <select
                              value={item.type ?? "other"}
                              onChange={e => setPlan(prev => prev.map(x => x.id === item.id ? { ...x, type: e.target.value } : x))}
                              style={{ background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 4, padding: "2px 6px", color: pt.color, fontSize: 11, cursor: "pointer" }}
                            >
                              {PLAN_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                            <select
                              value={item.urgency ?? "later"}
                              onChange={e => setPlan(prev => prev.map(x => x.id === item.id ? { ...x, urgency: e.target.value } : x))}
                              style={{ background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 4, padding: "2px 6px", color: "#9a8a60", fontSize: 11, cursor: "pointer" }}
                            >
                              {PLAN_URGENCIES.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                            </select>
                          </>
                        )}
                        {planEditId !== item.id && (
                          <button onClick={() => setPlan(prev => prev.filter(x => x.id !== item.id))}
                            style={{ background: "none", border: "none", color: "#5a4a30", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                        )}
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
                <div className="wf-panel" style={{ padding: 16, borderLeft: "3px solid #c9a84c", borderTop: "1px solid rgba(201,168,76,0.35)", background: "rgba(201,168,76,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: journalOpen ? 14 : 0, cursor: "pointer", padding: "4px 8px", margin: "-4px -8px", marginBottom: journalOpen ? 10 : -4, borderRadius: 4, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.30)", transition: "background 0.15s" }} onClick={() => setJournalOpen(v => !v)}>
                    <span className="wf-sec" style={{ marginBottom: 0, paddingBottom: 0, border: "none", color: "#c9a84c" }}>📋 Журнал операцій</span>
                    <span style={{ fontSize: 12, color: "#5a4a30", marginLeft: 6 }}>{allTx.length} записів</span>
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
            <div className="wf-panel" style={{ padding: 16, borderLeft: "3px solid #00ff88", borderTop: "1px solid rgba(0,255,136,0.25)", background: "rgba(0,255,136,0.03)" }}>
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
            <div className="wf-panel" style={{ padding: 16, borderLeft: "3px solid #f43f5e", borderTop: "1px solid rgba(244,63,94,0.25)", background: "rgba(244,63,94,0.03)" }}>
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
            <div className="wf-panel" style={{ padding: 16, borderLeft: "3px solid #a855f7", borderTop: "1px solid rgba(168,85,247,0.25)", background: "rgba(168,85,247,0.03)" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(8,5,2,0.68)", border: "1px solid rgba(201,168,76,0.20)", borderRadius: 4, padding: "6px 12px" }}>
                <span style={{ fontSize: 11, color: "#6a5a40", whiteSpace: "nowrap" }}>XP за виконання:</span>
                <input
                  type="number" min="0" max="99999"
                  value={projectCompletionXP}
                  onChange={e => setProjectCompletionXP(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 90, background: "none", border: "none", color: "#c9a84c", fontSize: 13, fontFamily: "'Space Mono',monospace", fontWeight: 700, outline: "none", textAlign: "center", MozAppearance: "textfield", appearance: "textfield" }}
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
                      gainXP(cxp, `🚀 ${x.name}`, "project");
                      return { ...x, status: next, completionXPPaid: true };
                    }
                    if (next === "in_progress" && paid && cxp > 0) {
                      loseXP(cxp, "project", "↩ проект не завершено");
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
                                  value={progressEditText}
                                  onChange={e => setProgressEditText(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter" && e.ctrlKey) { setProgressLog(p => p.map(x => x.id === entry.id ? { ...x, text: progressEditText.trim() || x.text } : x)); setProgressEditId(null); }
                                    if (e.key === "Escape") setProgressEditId(null);
                                  }}
                                  style={{ width: "100%", minHeight: 72, background: "rgba(8,5,2,0.8)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 3, padding: "8px 10px", color: "#fff", fontSize: 13, fontFamily: "'Exo 2',sans-serif", resize: "vertical", lineHeight: 1.6 }}
                                />
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
          const XP_SOURCE_META = {
            activity:    { emoji: "⚡", label: "Активність",   color: "#00ff88" },
            session:     { emoji: "🔥", label: "AI-сесії",     color: "#f59e0b" },
            skill:       { emoji: "🧩", label: "Навички",      color: "#6366f1" },
            project:     { emoji: "🚀", label: "Проекти",      color: "#a855f7" },
            achievement: { emoji: "🏆", label: "Досягнення",   color: "#fbbf24" },
            income:      { emoji: "💰", label: "Дохід",        color: "#10b981" },
            goal:        { emoji: "🎯", label: "Цілі / задачі", color: "#06b6d4" },
            plan:        { emoji: "📋", label: "План дій",     color: "#ec4899" },
            other:       { emoji: "•",  label: "Інше",         color: "#9a8a60" },
          };
          const xpBySource = xpLog.reduce((acc, e) => {
            acc[e.source] = (acc[e.source] ?? 0) + e.amount;
            return acc;
          }, {});
          // Активність знаємо точно з лічильників (навіть за період до журналу).
          xpBySource.activity = activityXP ?? computeCorrectActivityXP();
          const loggedSum = Object.values(xpBySource).reduce((s, v) => s + v, 0);
          const untracked = totalXP - loggedSum;
          const xpSourceRows = Object.entries(xpBySource)
            .filter(([, v]) => v !== 0)
            .sort((a, b) => b[1] - a[1]);
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Джерела XP */}
              <div>
                <div className="wf-sec" style={{ marginBottom: 16 }}>⭐ Джерела XP <span style={{ fontSize: 11, color: "#6a5f40", fontWeight: 400 }}>· за сьогодні</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                  {xpSourceRows.map(([src, val]) => {
                    const m = XP_SOURCE_META[src] ?? XP_SOURCE_META.other;
                    return (
                      <div key={src} className="wf-card" style={{ padding: "14px 14px", border: `1px solid ${m.color}33`, borderTop: `2px solid ${m.color}`, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{m.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: "#9a8a60", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{m.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: m.color, fontFamily: "'Space Mono',monospace" }}>{val > 0 ? "+" : ""}{val.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>XP</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: "6px 20px", fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#9a8a60" }}>
                  <span>Облічено журналом: <b style={{ color: "#c8b89a" }}>{loggedSum.toLocaleString()} XP</b></span>
                  <span>Фактичний XP: <b style={{ color: "#c8b89a" }}>{totalXP.toLocaleString()}</b></span>
                  {untracked !== 0 && (
                    <span style={{ color: untracked > 0 ? "#f59e0b" : "#f43f5e" }}>
                      {untracked > 0 ? "Поза журналом (до старту обліку): " : "Розбіжність: "}
                      <b>{untracked > 0 ? "+" : ""}{untracked.toLocaleString()} XP</b>
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: "#5a5040", fontFamily: "'Space Mono',monospace" }}>
                  Журнал фіксує кожне нарахування з цього оновлення. «Активність» рахується точно з лічильників.
                </div>
              </div>
              {/* Фінанси */}
              <div>
                <div className="wf-sec" style={{ marginBottom: 16 }}>💸 Фінанси</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[
                    { label: "Дохід", value: `$${totalIncome.toFixed(2)}`, color: "#00ff88" },
                    { label: "Витрати", value: `$${totalExpenses.toFixed(2)}`, color: "#f43f5e" },
                    { label: net >= 0 ? "Профіт +" : "Збиток −", value: `$${Math.abs(net).toFixed(2)}`, color: netColor },
                  ].map(s => (
                    <div key={s.label} className="wf-card" style={{ padding: "18px 16px", textAlign: "center", border: `1px solid ${s.color}33`, borderTop: `2px solid ${s.color}` }}>
                      <div style={{ fontSize: 11, color: "#9a8a60", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Space Mono',monospace" }}>{s.value}</div>
                    </div>
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
                    return [
                      { label: "Навчання",     emoji: "📚", count: learnTime.education ?? 0, hours: eduH,   sub: `${learnTime.education ?? 0} × 30хв`, color: "#06b6d4" },
                      { label: "Бізнес",       emoji: "💼", count: learnTime.business ?? 0,  hours: bizH,   sub: `${learnTime.business ?? 0} × 30хв`,  color: "#f59e0b" },
                      { label: "Навч. відео",  emoji: "📺", count: vidCount,                 hours: null,   sub: `${vidCount} відео`,                   color: "#a855f7" },
                      { label: "Всього годин", emoji: "🎯", count: null,                     hours: totalH, sub: `edu+biz`,                              color: "#00ff88" },
                    ];
                  })().map(s => (
                    <div key={s.label} className="wf-card" style={{ padding: "18px 16px", textAlign: "center", border: `1px solid ${s.color}33`, borderTop: `2px solid ${s.color}` }}>
                      <div style={{ fontSize: 11, color: "#9a8a60", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{s.emoji} {s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Space Mono',monospace" }}>
                        {s.hours !== null ? <>{s.hours.toLocaleString()} <span style={{ fontSize: 13 }}>год</span></> : s.count}
                      </div>
                      <div style={{ fontSize: 11, color: "#6a5f40", fontFamily: "'Space Mono',monospace", marginTop: 4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Навички */}
              <div>
                <div className="wf-sec" style={{ marginBottom: 16 }}>💪 Навички — виконано</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SKILL_STAT_ROWS.map(row => {
                    const cat = SKILL_TASKS.find(c => c.id === row.catId);
                    const catColor = cat?.color ?? "#c9a84c";
                    const counts = row.tasks.map(t => ({
                      label: t.label,
                      count: (skillTasksData[`${row.catId}_${t.id}`]?.count ?? 0),
                    }));
                    const hasAny = counts.some(c => c.count > 0);
                    return (
                      <div key={row.catId} className="wf-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, border: `1px solid ${hasAny ? catColor + "44" : "rgba(201,168,76,0.12)"}`, borderLeft: `3px solid ${hasAny ? catColor : "rgba(201,168,76,0.2)"}` }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{row.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#c8b89a", fontFamily: "'Exo 2',sans-serif", textTransform: "uppercase", letterSpacing: 1, flexShrink: 0, minWidth: 110 }}>{row.label}</span>
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                          {counts.map(c => (
                            <span key={c.label} style={{ fontFamily: "'Space Mono',monospace", fontSize: 12 }}>
                              <span style={{ color: "#6a5f40" }}>{c.label}: </span>
                              <span style={{ color: c.count > 0 ? catColor : "#4a4030", fontWeight: 700 }}>{c.count.toLocaleString()}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
            <div style={{ width: 310, maxWidth: "calc(100vw - 40px)", maxHeight: "min(520px, calc(100vh - 110px))", background: "linear-gradient(180deg,rgba(12,8,3,0.97),rgba(7,5,1,0.98))", border: "1px solid rgba(201,168,76,0.3)", borderTop: "2px solid rgba(201,168,76,0.55)", borderRadius: 8, boxShadow: "0 12px 48px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", fontFamily: "'Exo 2',sans-serif" }}>

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
