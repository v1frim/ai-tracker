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

const ACHIEVEMENTS = [
  { id: "first_tool", name: "Перший крок", desc: "Вивчи будь-який AI-інструмент", xp: 50, icon: "🔧", check: (t) => t >= 1 },
  { id: "five_tools", name: "Дослідник", desc: "Вивчи 5 AI-інструментів", xp: 150, icon: "🔍", check: (t) => t >= 5 },
  { id: "ten_tools", name: "Колекціонер", desc: "Вивчи 10 AI-інструментів", xp: 300, icon: "🗂️", check: (t) => t >= 10 },
  { id: "first_project", name: "Будівничий", desc: "Заверши перший AI-проект", xp: 200, icon: "🚀", check: (t, i, p) => p >= 1 },
  { id: "three_projects", name: "Серійний творець", desc: "Заверши 3 проекти", xp: 400, icon: "🏗️", check: (t, i, p) => p >= 3 },
  { id: "first_dollar", name: "Перший долар", desc: "Зароби перші $1 з AI", xp: 200, icon: "💵", check: (t, i) => i >= 1 },
  { id: "hundred_dollar", name: "Перша сотня", desc: "Зароби $100 з AI", xp: 500, icon: "💯", check: (t, i) => i >= 100 },
  { id: "thousand_dollar", name: "Перша тисяча", desc: "Зароби $1000 з AI", xp: 1000, icon: "🏆", check: (t, i) => i >= 1000 },
  { id: "streak_7", name: "Тижневий стрік", desc: "7 днів поспіль з AI", xp: 250, icon: "🔥", check: (t, i, p, sd, streak) => streak >= 7 },
  { id: "streak_30", name: "Місячний стрік", desc: "30 днів поспіль з AI", xp: 800, icon: "⚡", check: (t, i, p, sd, streak) => streak >= 30 },
  { id: "sessions_50", name: "50 сесій", desc: "Проведи 50 AI-сесій", xp: 500, icon: "💪", check: (t, i, p, sd, streak, totalSess) => totalSess >= 50 },
  { id: "all_categories", name: "Поліглот ШІ", desc: "Вивчи хоча б 1 інструмент у кожній категорії", xp: 500, icon: "🌐",
    check: (t, i, p, skillData) => SKILLS.every(s => skillData[s.id]?.unlockedTools?.length > 0) },
  { id: "oxford_dev", name: "Oxford Dev", desc: "Запущено! (Oxford_1000 вже є 🎉)", xp: 300, icon: "📚", check: () => true },
];

const DEFAULT_SKILL_DATA = Object.fromEntries(SKILLS.map(s => [s.id, { unlockedTools: [] }]));
const DEFAULT_PROJECTS = [{ name: "Oxford_1000 — додаток для англійської", date: "2026" }];
const DEFAULT_SESSIONS = { dates: [], monthlyTarget: 50 };
const STORAGE_KEY = "ai_tracker_v1";

const GOAL_CATEGORIES = [
  { id: "income", label: "Дохід", color: "#f59e0b", icon: "💰" },
  { id: "skills", label: "Навички", color: "#00ff88", icon: "🧠" },
  { id: "project", label: "Проект", color: "#6366f1", icon: "🚀" },
  { id: "other", label: "Інше", color: "#a8b8cc", icon: "🎯" },
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
      <polygon points={top}   fill="#7099ff" fillOpacity="0.82" stroke="#9ab8ff" strokeWidth="0.7" strokeOpacity="0.55" />
      <polygon points={right} fill="#3d5ec9" fillOpacity="0.82" stroke="#5070dd" strokeWidth="0.7" strokeOpacity="0.55" />
      <polygon points={left}  fill="#1d3696" fillOpacity="0.82" stroke="#2f4cbb" strokeWidth="0.7" strokeOpacity="0.55" />
    </svg>
  );
}
function RingSvg({ s }) {
  const r = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
      <circle cx={r} cy={r} r={r-2}    fill="none" stroke="#7090ee" strokeWidth="2.8" strokeOpacity="0.78" />
      <circle cx={r} cy={r} r={r*0.55} fill="none" stroke="#4f6ccc" strokeWidth="1.2" strokeOpacity="0.42" />
    </svg>
  );
}
function TriSvg({ s }) {
  const h = s * 0.866;
  return (
    <svg width={s} height={h} viewBox={`0 0 ${s} ${h}`} style={{ display: "block" }}>
      <polygon points={`${s/2},2 ${s-2},${h-2} 2,${h-2}`} fill="none" stroke="#7090ee" strokeWidth="2.2" strokeOpacity="0.78" />
    </svg>
  );
}
function DiamondSvg({ s }) {
  const m = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
      <polygon points={`${m},2 ${s-2},${m} ${m},${s-2} 2,${m}`} fill="none" stroke="#7090ee" strokeWidth="2.2" strokeOpacity="0.78" />
      <polygon points={`${m},${s*0.22} ${s*0.78},${m} ${m},${s*0.78} ${s*0.22},${m}`} fill="#4560cc" fillOpacity="0.13" />
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
    <div style={{ fontFamily: "'Courier New', monospace", background: "transparent", minHeight: "100vh", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;800&family=Space+Mono:wght@400;700&display=swap');
        .tab-btn { transition: all 0.18s; letter-spacing: 0.3px; }
        .tab-btn:hover { transform: translateY(-2px); }
        .skill-card { transition: all 0.18s; }
        .skill-card:hover { transform: translateY(-3px); }
        .tool-chip { transition: all 0.15s; }
        .tool-chip:hover:not(:disabled) { transform: scale(1.06); }
        .act-btn { transition: all 0.15s; }
        .act-btn:hover { transform: translateY(-1px); opacity: 0.9; }
        .checkin-btn { transition: all 0.2s; }
        .checkin-btn:not(:disabled):hover { transform: scale(1.03); box-shadow: 0 0 40px rgba(0,255,136,0.5) !important; }
        @keyframes slideIn { from { transform: translateX(120px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        input::placeholder { color: #4d6070; }
        input:focus { outline: none; border-color: rgba(0,255,136,0.4) !important; }
        select option { background: #0e1a3a; color: #e2e8f0; }
        .sec-title { font-family: 'Exo 2',sans-serif; font-size: 11px; font-weight: 700;
                     color: #c9a84c; text-transform: uppercase; letter-spacing: 3px; }
      `}</style>

      <FloatingBg />

      {notification && (
        <div key={notification.id} style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, background: notification.type === "achievement" ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#00ff88,#00bb66)", color: "#000", padding: "11px 20px", borderRadius: 12, fontWeight: 700, fontSize: 13, boxShadow: `0 0 28px ${notification.type === "achievement" ? "rgba(245,158,11,0.6)" : "rgba(0,255,136,0.5)"}`, animation: "slideIn 0.3s ease", fontFamily: "'Space Mono',monospace" }}>{notification.msg}</div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 920, margin: "0 auto", padding: "20px 14px" }}>

        {/* Header */}
        <div style={{ marginBottom: 22, paddingBottom: 20, borderBottom: "1px solid rgba(0,255,136,0.15)" }}>
          {/* Top row: avatar + name + stats */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#00ff88,#00aa55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#000", boxShadow: "0 0 22px rgba(0,255,136,0.45)", fontFamily: "'Exo 2',sans-serif", letterSpacing: -1 }}>Vi</div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>ViFrim</span>
                {streak > 0 && (
                  <span style={{ background: "rgba(245,158,11,0.12)", border: "1px solid #f59e0b", color: "#f59e0b", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🔥 {streak} дн.</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#7a8fa6", marginTop: 3 }}>AI Progress Tracker</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Дохід", val: `$${income.toFixed(0)}`, color: "#f59e0b" },
                { label: "Проекти", val: projects.length, color: "#6366f1" },
                { label: "Інструменти", val: `${totalTools}/${TOTAL_TOOLS}`, color: "#00ff88" },
                { label: "Сесій/міс", val: `${monthSessions}/${sessions.monthlyTarget}`, color: "#f43f5e" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "8px 13px" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#7a8fa6", textTransform: "uppercase", letterSpacing: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* XP Bar — Aion style */}
          <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,255,136,0.12)", borderRadius: 12, padding: "10px 14px" }}>
            {/* Level labels + XP numbers */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "linear-gradient(135deg,#00ff88,#00aa55)", color: "#000", padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 800, fontFamily: "'Exo 2',sans-serif" }}>LVL {totalLevel}</span>
                <span style={{ fontSize: 12, color: "#00ff88", fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{totalXP.toLocaleString()} XP</span>
              </div>
              <div style={{ fontSize: 11, color: "#7a8fa6", fontFamily: "'Space Mono',monospace" }}>
                ще <span style={{ color: "#a8b8cc", fontWeight: 700 }}>{(nextLevelXP - totalXP).toLocaleString()}</span> XP
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#7a8fa6", fontFamily: "'Space Mono',monospace" }}>{nextLevelXP.toLocaleString()} XP</span>
                <span style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 800, fontFamily: "'Exo 2',sans-serif" }}>LVL {totalLevel + 1}</span>
              </div>
            </div>

            {/* Bar track */}
            <div style={{ position: "relative", height: 14, background: "rgba(255,255,255,0.06)", borderRadius: 7, overflow: "hidden", border: "1px solid rgba(0,255,136,0.08)" }}>
              {/* Filled portion */}
              <div style={{
                width: `${Math.min(100, xpProgress)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #006633 0%, #00cc66 60%, #00ff88 85%, #aaffd4 100%)",
                borderRadius: 7,
                transition: "width 0.7s ease",
                boxShadow: "0 0 10px rgba(0,255,136,0.6), inset 0 1px 0 rgba(255,255,255,0.2)",
                position: "relative",
              }}>
                {/* Shimmer line */}
                <div style={{ position: "absolute", top: 2, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.3)", borderRadius: 2 }} />
              </div>
              {/* Segment notches */}
              {[10,20,30,40,50,60,70,80,90].map(p => (
                <div key={p} style={{ position: "absolute", top: 0, left: `${p}%`, width: 1, height: "100%", background: "rgba(0,0,0,0.35)", pointerEvents: "none" }} />
              ))}
            </div>

            {/* Progress percent */}
            <div style={{ textAlign: "center", marginTop: 5, fontSize: 12, color: "#7a8fa6", fontFamily: "'Space Mono',monospace" }}>
              {Math.round(xpProgress)}% до наступного рівня
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 7, marginBottom: 22, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)} style={{ padding: "9px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer", background: activeTab === t.id ? "#00ff88" : "rgba(255,255,255,0.05)", color: activeTab === t.id ? "#000" : "#c0cfe0", border: activeTab === t.id ? "none" : "1px solid rgba(255,255,255,0.12)", fontWeight: activeTab === t.id ? 800 : 500, fontFamily: "'Exo 2',sans-serif" }}>{t.label}</button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 13, marginBottom: 20 }}>
              {SKILLS.slice(0, 6).map(sk => {
                const unlocked = skillData[sk.id].unlockedTools;
                return (
                  <div key={sk.id} onClick={() => { setSelectedSkill(sk); setActiveTab("skills"); }} className="skill-card" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${unlocked.length > 0 ? sk.color + "33" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: 14, cursor: "pointer" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{sk.emoji}</div>
                    <div style={{ fontSize: 11, color: "#a8b8cc", marginBottom: 5 }}>{sk.name}</div>
                    <div style={{ fontSize: 12, color: sk.color, marginBottom: 6 }}>{unlocked.length}/{sk.tools.length} інстр.</div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                      <div style={{ width: `${(unlocked.length / sk.tools.length) * 100}%`, height: "100%", background: sk.color, borderRadius: 2, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick session check-in on dashboard */}
            <div style={{ background: doneToday ? "rgba(0,255,136,0.05)" : "rgba(244,63,94,0.05)", border: `1px solid ${doneToday ? "rgba(0,255,136,0.2)" : "rgba(244,63,94,0.2)"}`, borderRadius: 14, padding: 16, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: doneToday ? "#00ff88" : "#f43f5e", fontFamily: "'Exo 2',sans-serif" }}>
                  {doneToday ? "✓ AI-сесія сьогодні виконана" : "⚡ Чи працював сьогодні з AI?"}
                </div>
                <div style={{ fontSize: 11, color: "#7a8fa6", marginTop: 3 }}>
                  Стрік: {streak} дн. · {monthSessions}/{sessions.monthlyTarget} цього місяця · всього {sessions.dates.length} сесій
                </div>
              </div>
              {!doneToday && (
                <button className="checkin-btn" onClick={logSession} style={{ background: "linear-gradient(135deg,#00ff88,#00cc6a)", color: "#000", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Space Mono',monospace", boxShadow: "0 0 20px rgba(0,255,136,0.3)", whiteSpace: "nowrap" }}>+ Так (+50 XP)</button>
              )}
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>🎯 Швидкі дії</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "+ Вивчити інструмент", color: "#00ff88", rgb: "0,255,136", tab: "skills" },
                  { label: "+ Записати дохід", color: "#f59e0b", rgb: "245,158,11", tab: "finances" },
                  { label: "+ Новий проект", color: "#6366f1", rgb: "99,102,241", tab: "projects" },
                ].map(btn => (
                  <button key={btn.tab} className="act-btn" onClick={() => setActiveTab(btn.tab)} style={{ background: `rgba(${btn.rgb},0.1)`, border: `1px solid ${btn.color}`, color: btn.color, padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{btn.label}</button>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: "#8090a8" }}>🏅 Розблоковано досягнень: </span>
                <span style={{ fontSize: 13, color: "#00ff88", fontWeight: 700 }}>{unlockedAchievements.length} / {ACHIEVEMENTS.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Big check-in button */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#8090a8", marginBottom: 6, fontFamily: "'Space Mono',monospace" }}>
                {new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              {doneToday ? (
                <div>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#00ff88", fontFamily: "'Exo 2',sans-serif" }}>Сесія виконана!</div>
                  <div style={{ fontSize: 12, color: "#7a8fa6", marginTop: 6 }}>Повернись завтра для нового +50 XP</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Exo 2',sans-serif", marginBottom: 16 }}>Ти сьогодні працював з AI?</div>
                  <button className="checkin-btn" onClick={logSession} style={{ background: "linear-gradient(135deg,#00ff88,#00cc6a)", color: "#000", border: "none", padding: "16px 40px", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 16, fontFamily: "'Exo 2',sans-serif", boxShadow: "0 0 30px rgba(0,255,136,0.4)", letterSpacing: 0.5 }}>⚡ Так, працював! (+50 XP)</button>
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
                <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color}22`, borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "#7a8fa6", marginTop: 3, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: s.color, marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Monthly progress bar */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                  📅 Ціль місяця
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#8090a8" }}>Ціль:</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={sessions.monthlyTarget}
                    onChange={e => updateMonthlyTarget(e.target.value)}
                    style={{ width: 56, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 8px", color: "#00ff88", fontSize: 13, fontFamily: "'Space Mono',monospace", textAlign: "center" }}
                  />
                  <span style={{ fontSize: 11, color: "#8090a8" }}>сесій</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                <span style={{ color: "#a8b8cc" }}>{monthSessions} виконано</span>
                <span style={{ color: "#00ff88", fontWeight: 700 }}>{Math.min(100, Math.round(monthSessions / sessions.monthlyTarget * 100))}%</span>
              </div>
              <div style={{ height: 10, background: "rgba(255,255,255,0.07)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (monthSessions / sessions.monthlyTarget) * 100)}%`, height: "100%", background: monthSessions >= sessions.monthlyTarget ? "#00ff88" : "linear-gradient(90deg,#f43f5e,#f59e0b)", borderRadius: 5, transition: "width 0.5s" }} />
              </div>
            </div>

            {/* Heatmap */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>🗓 Активність (останні 56 днів)</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 4 }}>
                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {week.map(day => {
                      const done = sessionSet.has(day);
                      const isToday = day === todayStr();
                      return (
                        <div key={day} title={day} style={{ width: 14, height: 14, borderRadius: 3, background: done ? "#00ff88" : "rgba(255,255,255,0.06)", border: isToday ? "1px solid #00ff88" : "none", transition: "background 0.2s" }} />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: "rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize: 12, color: "#7a8fa6" }}>Пропущено</span>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: "#00ff88" }} />
                <span style={{ fontSize: 12, color: "#7a8fa6" }}>Є сесія</span>
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
                <div key={sk.id} className="skill-card" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${isOpen ? sk.color : unlocked.length > 0 ? sk.color + "33" : "rgba(255,255,255,0.08)"}`, borderRadius: 14, overflow: "hidden" }}>
                  <div onClick={() => setSelectedSkill(isOpen ? null : sk)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{sk.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{sk.name}</div>
                      <div style={{ fontSize: 12, color: sk.color, marginTop: 2 }}>{unlocked.length}/{sk.tools.length} вивчено · +100 XP за інструмент</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
                        <div style={{ width: `${(unlocked.length / sk.tools.length) * 100}%`, height: "100%", background: sk.color, borderRadius: 3 }} />
                      </div>
                      <span style={{ color: "#7a8fa6", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {sk.tools.map(tool => {
                        const done = unlocked.includes(tool);
                        return (
                          <button key={tool} className="tool-chip" disabled={done} onClick={() => learnTool(sk.id, tool)} style={{ padding: "6px 13px", borderRadius: 8, fontSize: 11, cursor: done ? "default" : "pointer", background: done ? `${sk.color}20` : "rgba(255,255,255,0.04)", border: `1px solid ${done ? sk.color : "rgba(255,255,255,0.1)"}`, color: done ? sk.color : "#a8b8cc", fontFamily: "'Space Mono',monospace", textDecoration: done ? "line-through" : "none" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 13 }}>
            {ACHIEVEMENTS.map(a => {
              const done = unlockedAchievements.includes(a.id);
              return (
                <div key={a.id} style={{ background: done ? "rgba(245,158,11,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${done ? "#f59e0b44" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: 16, opacity: done ? 1 : 0.55, filter: done ? "none" : "grayscale(0.6)" }}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>{a.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: done ? "#f59e0b" : "#fff", marginBottom: 4, fontFamily: "'Exo 2',sans-serif" }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "#8090a8", marginBottom: 8 }}>{a.desc}</div>
                  <div style={{ fontSize: 11, color: "#00ff88" }}>+{a.xp} XP {done ? "✓" : ""}</div>
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
                <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${s.color}22`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "#7a8fa6", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Add goal */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16 }}>
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
                  style={{ flex: 1, minWidth: 180, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
                />
                <select
                  value={goalCategory}
                  onChange={e => setGoalCategory(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 12px", color: "#a8b8cc", fontSize: 12, cursor: "pointer" }}
                >
                  {GOAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
                <button className="act-btn" onClick={() => {
                  if (!goalInput.trim()) return;
                  setGoals(prev => [...prev, { id: `g${Date.now()}`, text: goalInput.trim(), category: goalCategory, done: false }]);
                  setGoalInput("");
                }} style={{ background: "#00ff88", color: "#000", border: "none", padding: "9px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Додати</button>
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
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, background: g.done ? "rgba(0,255,136,0.05)" : "rgba(255,255,255,0.03)", border: `1px solid ${g.done ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "12px 16px" }}>
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
                        <span style={{ flex: 1, color: g.done ? "#7a8fa6" : "#e2e8f0", fontSize: 13, textDecoration: g.done ? "line-through" : "none" }}>{g.text}</span>
                        {!g.done && !g.xpAwarded && (
                          <span style={{ fontSize: 12, color: "#00ff88", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)", padding: "2px 7px", borderRadius: 20, whiteSpace: "nowrap" }}>+100 XP</span>
                        )}
                        <button onClick={() => setGoals(prev => prev.filter(x => x.id !== g.id))}
                          style={{ background: "none", border: "none", color: "#4d6070", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
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
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16 }}>
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
                  style={{ flex: 1, minWidth: 180, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
                />
                <select
                  value={planPriority}
                  onChange={e => setPlanPriority(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 12px", color: "#a8b8cc", fontSize: 12, cursor: "pointer" }}
                >
                  {PLAN_PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <button className="act-btn" onClick={() => {
                  if (!planInput.trim()) return;
                  setPlan(prev => [...prev, { id: `p${Date.now()}`, text: planInput.trim(), priority: planPriority, done: false }]);
                  setPlanInput("");
                }} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Додати</button>
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
                    <span style={{ background: pr.bg, border: `1px solid ${pr.color}44`, color: pr.color, padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{pr.label}</span>
                    <span style={{ fontSize: 11, color: "#4d6070" }}>{items.length} активних{done.length > 0 ? ` · ${done.length} виконано` : ""}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {[...items, ...done].map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, background: item.done ? "rgba(255,255,255,0.02)" : pr.bg, border: `1px solid ${item.done ? "rgba(255,255,255,0.05)" : pr.color + "22"}`, borderRadius: 11, padding: "11px 14px" }}>
                        <button onClick={() => setPlan(prev => prev.map(x => {
                          if (x.id !== item.id) return x;
                          if (!x.done && !x.xpAwarded) {
                            gainXP(75, "(план дій)");
                            return { ...x, done: true, xpAwarded: true };
                          }
                          return { ...x, done: !x.done };
                        }))}
                          style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${item.done ? "#7a8fa6" : pr.color}`, background: item.done ? "#7a8fa6" : "transparent", cursor: "pointer", flexShrink: 0, fontSize: 12, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                          {item.done ? "✓" : ""}
                        </button>
                        <span style={{ flex: 1, color: item.done ? "#4d6070" : "#cbd5e1", fontSize: 12, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
                        {!item.done && !item.xpAwarded && (
                          <span style={{ fontSize: 12, color: pr.color, background: pr.bg, border: `1px solid ${pr.color}33`, padding: "2px 7px", borderRadius: 20, whiteSpace: "nowrap" }}>+75 XP</span>
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
                          style={{ background: "none", border: "none", color: "#4d6070", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
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
                <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${s.color}22`, borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#7a8fa6", marginTop: 6, textTransform: "uppercase", letterSpacing: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Net balance bar */}
            {(income > 0 || expenses > 0) && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, color: "#8090a8", marginBottom: 8 }}>Дохід vs Витрати</div>
                <div style={{ height: 10, background: "rgba(255,255,255,0.07)", borderRadius: 5, overflow: "hidden", display: "flex" }}>
                  {income > 0 && (
                    <div style={{ width: `${Math.min(100, (income / Math.max(income, expenses)) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#059669,#10b981)", borderRadius: "5px 0 0 5px", transition: "width 0.5s" }} />
                  )}
                </div>
                <div style={{ height: 10, background: "rgba(255,255,255,0.07)", borderRadius: 5, overflow: "hidden", marginTop: 4, display: "flex" }}>
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
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: 16 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, fontWeight: 700, color: "#10b981", marginBottom: 12 }}>📈 Додати дохід</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={incomeInput}
                  onChange={e => setIncomeInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addIncome()}
                  placeholder="Сума в $..."
                  type="number"
                  min="0"
                  style={{ width: 160, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px", color: "#fff", fontSize: 15, fontFamily: "'Space Mono',monospace" }}
                />
                <button className="act-btn" onClick={addIncome} style={{ background: "#10b981", color: "#000", border: "none", padding: "9px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Записати</button>
                <span style={{ fontSize: 11, color: "#7a8fa6" }}>+3× XP від суми</span>
              </div>
            </div>

            {/* Expense input */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 14, padding: 16 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, fontWeight: 700, color: "#f43f5e", marginBottom: 12 }}>📉 Додати витрату</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={expenseInput}
                  onChange={e => setExpenseInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addExpense()}
                  placeholder="Сума в $..."
                  type="number"
                  min="0"
                  style={{ width: 160, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px", color: "#fff", fontSize: 15, fontFamily: "'Space Mono',monospace" }}
                />
                <button className="act-btn" onClick={addExpense} style={{ background: "#f43f5e", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>− Записати</button>
              </div>
            </div>

            {/* Milestone bars (based on income) */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 700, color: "#c9a84c", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>🏁 Дохідні цілі</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "До $100", max: 100, color: "#10b981" },
                  { label: "До $1,000", max: 1000, color: "#6366f1" },
                  { label: "До $10,000", max: 10000, color: "#f43f5e" },
                  { label: "До $100,000", max: 100000, color: "#f59e0b" },
                ].map(g => (
                  <div key={g.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                      <span style={{ color: "#fff" }}>{g.label}</span>
                      <span style={{ color: g.color }}>{Math.min(100, (income / g.max) * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
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
                style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
              />
              <button className="act-btn" onClick={addProject} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Додати (+200 XP)</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, padding: "13px 16px" }}>
                  <span style={{ fontSize: 20 }}>🚀</span>
                  <span style={{ flex: 1, color: "#fff", fontSize: 13 }}>{p.name}</span>
                  <span style={{ color: "#7a8fa6", fontSize: 11 }}>{p.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
