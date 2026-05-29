import { useState, useEffect, useCallback, useMemo } from "react";

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

export default function AITracker() {
  const saved = loadState();

  const [skillData, setSkillData] = useState(saved?.skillData ?? DEFAULT_SKILL_DATA);
  const [totalXP, setTotalXP] = useState(saved?.totalXP ?? 300);
  const [income, setIncome] = useState(saved?.income ?? 0);
  const [incomeInput, setIncomeInput] = useState("");
  const [projects, setProjects] = useState(saved?.projects ?? DEFAULT_PROJECTS);
  const [projectInput, setProjectInput] = useState("");
  const [sessions, setSessions] = useState(saved?.sessions ?? DEFAULT_SESSIONS);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [notification, setNotification] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState(saved?.unlockedAchievements ?? ["oxford_dev"]);

  useEffect(() => {
    const state = { skillData, totalXP, income, projects, unlockedAchievements, sessions };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [skillData, totalXP, income, projects, unlockedAchievements, sessions]);

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
    { id: "dashboard", label: "📊 Дашборд" },
    { id: "sessions", label: "🔥 Сесії" },
    { id: "skills", label: "🧩 Навички" },
    { id: "achievements", label: "🏆 Досягнення" },
    { id: "income", label: "💰 Дохід" },
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
    <div style={{ fontFamily: "'Courier New', monospace", background: "#080a12", minHeight: "100vh", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;800&family=Space+Mono:wght@400;700&display=swap');
        .tab-btn { transition: all 0.18s; }
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
        input::placeholder { color: #475569; }
        input:focus { outline: none; border-color: rgba(0,255,136,0.4) !important; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize: "44px 44px", pointerEvents: "none" }} />

      {notification && (
        <div key={notification.id} style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, background: notification.type === "achievement" ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#00ff88,#00bb66)", color: "#000", padding: "11px 20px", borderRadius: 12, fontWeight: 700, fontSize: 13, boxShadow: `0 0 28px ${notification.type === "achievement" ? "rgba(245,158,11,0.6)" : "rgba(0,255,136,0.5)"}`, animation: "slideIn 0.3s ease", fontFamily: "'Space Mono',monospace" }}>{notification.msg}</div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 920, margin: "0 auto", padding: "20px 14px" }}>

        {/* Header */}
        <div style={{ marginBottom: 22, paddingBottom: 20, borderBottom: "1px solid rgba(0,255,136,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#00ff88,#00aa55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#000", boxShadow: "0 0 22px rgba(0,255,136,0.45)", fontFamily: "'Exo 2',sans-serif" }}>В</div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>Вова</span>
                <span style={{ background: "rgba(0,255,136,0.12)", border: "1px solid #00ff88", color: "#00ff88", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>LVL {totalLevel}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{totalXP} XP</span>
                {streak > 0 && (
                  <span style={{ background: "rgba(245,158,11,0.12)", border: "1px solid #f59e0b", color: "#f59e0b", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🔥 {streak} дн.</span>
                )}
              </div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, xpProgress)}%`, height: "100%", background: "linear-gradient(90deg,#00ff88,#00cc6a)", borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>
                <span style={{ fontSize: 10, color: "#00ff88", whiteSpace: "nowrap" }}>→ LVL {totalLevel + 1}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Дохід", val: `$${income.toFixed(0)}`, color: "#f59e0b" },
                { label: "Проекти", val: projects.length, color: "#6366f1" },
                { label: "Інструменти", val: `${totalTools}/${TOTAL_TOOLS}`, color: "#00ff88" },
                { label: "Сесій/міс", val: `${monthSessions}/${sessions.monthlyTarget}`, color: "#f43f5e" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "8px 13px" }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 7, marginBottom: 22, flexWrap: "wrap" }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)} style={{ padding: "8px 15px", borderRadius: 10, fontSize: 12, cursor: "pointer", background: activeTab === t.id ? "#00ff88" : "rgba(255,255,255,0.04)", color: activeTab === t.id ? "#000" : "#94a3b8", border: activeTab === t.id ? "none" : "1px solid rgba(255,255,255,0.09)", fontWeight: activeTab === t.id ? 700 : 400, fontFamily: "'Space Mono',monospace" }}>{t.label}</button>
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
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>{sk.name}</div>
                    <div style={{ fontSize: 10, color: sk.color, marginBottom: 6 }}>{unlocked.length}/{sk.tools.length} інстр.</div>
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
                <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
                  Стрік: {streak} дн. · {monthSessions}/{sessions.monthlyTarget} цього місяця · всього {sessions.dates.length} сесій
                </div>
              </div>
              {!doneToday && (
                <button className="checkin-btn" onClick={logSession} style={{ background: "linear-gradient(135deg,#00ff88,#00cc6a)", color: "#000", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Space Mono',monospace", boxShadow: "0 0 20px rgba(0,255,136,0.3)", whiteSpace: "nowrap" }}>+ Так (+50 XP)</button>
              )}
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>🎯 Швидкі дії</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "+ Вивчити інструмент", color: "#00ff88", rgb: "0,255,136", tab: "skills" },
                  { label: "+ Записати дохід", color: "#f59e0b", rgb: "245,158,11", tab: "income" },
                  { label: "+ Новий проект", color: "#6366f1", rgb: "99,102,241", tab: "projects" },
                ].map(btn => (
                  <button key={btn.tab} className="act-btn" onClick={() => setActiveTab(btn.tab)} style={{ background: `rgba(${btn.rgb},0.1)`, border: `1px solid ${btn.color}`, color: btn.color, padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontFamily: "'Space Mono',monospace", fontWeight: 700 }}>{btn.label}</button>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>🏅 Розблоковано досягнень: </span>
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
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, fontFamily: "'Space Mono',monospace" }}>
                {new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              {doneToday ? (
                <div>
                  <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#00ff88", fontFamily: "'Exo 2',sans-serif" }}>Сесія виконана!</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>Повернись завтра для нового +50 XP</div>
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
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'Exo 2',sans-serif" }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 3, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: s.color, marginTop: 2 }}>{s.sub}</div>
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
                  <span style={{ fontSize: 11, color: "#64748b" }}>Ціль:</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={sessions.monthlyTarget}
                    onChange={e => updateMonthlyTarget(e.target.value)}
                    style={{ width: 56, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "4px 8px", color: "#00ff88", fontSize: 13, fontFamily: "'Space Mono',monospace", textAlign: "center" }}
                  />
                  <span style={{ fontSize: 11, color: "#64748b" }}>сесій</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                <span style={{ color: "#94a3b8" }}>{monthSessions} виконано</span>
                <span style={{ color: "#00ff88", fontWeight: 700 }}>{Math.min(100, Math.round(monthSessions / sessions.monthlyTarget * 100))}%</span>
              </div>
              <div style={{ height: 10, background: "rgba(255,255,255,0.07)", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (monthSessions / sessions.monthlyTarget) * 100)}%`, height: "100%", background: monthSessions >= sessions.monthlyTarget ? "#00ff88" : "linear-gradient(90deg,#f43f5e,#f59e0b)", borderRadius: 5, transition: "width 0.5s" }} />
              </div>
            </div>

            {/* Heatmap */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 18 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14 }}>🗓 Активність (останні 56 днів)</div>
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
                <span style={{ fontSize: 10, color: "#475569" }}>Пропущено</span>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: "#00ff88" }} />
                <span style={{ fontSize: 10, color: "#475569" }}>Є сесія</span>
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
                      <div style={{ fontSize: 10, color: sk.color, marginTop: 2 }}>{unlocked.length}/{sk.tools.length} вивчено · +100 XP за інструмент</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
                        <div style={{ width: `${(unlocked.length / sk.tools.length) * 100}%`, height: "100%", background: sk.color, borderRadius: 3 }} />
                      </div>
                      <span style={{ color: "#475569", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {sk.tools.map(tool => {
                        const done = unlocked.includes(tool);
                        return (
                          <button key={tool} className="tool-chip" disabled={done} onClick={() => learnTool(sk.id, tool)} style={{ padding: "6px 13px", borderRadius: 8, fontSize: 11, cursor: done ? "default" : "pointer", background: done ? `${sk.color}20` : "rgba(255,255,255,0.04)", border: `1px solid ${done ? sk.color : "rgba(255,255,255,0.1)"}`, color: done ? sk.color : "#94a3b8", fontFamily: "'Space Mono',monospace", textDecoration: done ? "line-through" : "none" }}>
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
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{a.desc}</div>
                  <div style={{ fontSize: 11, color: "#00ff88" }}>+{a.xp} XP {done ? "✓" : ""}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Income */}
        {activeTab === "income" && (
          <div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 22, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 14, color: "#64748b", marginBottom: 6 }}>Загальний дохід з AI</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: "#f59e0b", fontFamily: "'Exo 2',sans-serif", marginBottom: 18 }}>${income.toFixed(2)}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={incomeInput}
                  onChange={e => setIncomeInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addIncome()}
                  placeholder="Сума в $..."
                  type="number"
                  min="0"
                  style={{ width: 150, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 14px", color: "#fff", fontSize: 15, fontFamily: "'Space Mono',monospace" }}
                />
                <button className="act-btn" onClick={addIncome} style={{ background: "#f59e0b", color: "#000", border: "none", padding: "9px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Записати</button>
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
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
                style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono',monospace" }}
              />
              <button className="act-btn" onClick={addProject} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Додати (+200 XP)</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, padding: "13px 16px" }}>
                  <span style={{ fontSize: 20 }}>🚀</span>
                  <span style={{ flex: 1, color: "#fff", fontSize: 13 }}>{p.name}</span>
                  <span style={{ color: "#475569", fontSize: 11 }}>{p.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
