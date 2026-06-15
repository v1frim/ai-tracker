# AI Progress Tracker — контекст проекту

## Що це
Веб-застосунок для відстеження прогресу Вови у вивченні AI-інструментів та заробітку з AI.
Мотивація через гейміфікацію: XP, рівні, стріки, досягнення.

Живий сайт: https://v1frim.github.io/ai-tracker/
Репо: https://github.com/v1frim/ai-tracker

## Стек
- React 18 + Vite 5
- Чистий CSS (inline styles, без UI-бібліотек)
- localStorage для збереження всіх даних (ключ: `ai_tracker_v1`)
- GitHub Pages для хостингу (гілка `gh-pages`)

## Деплой
Автоматичний: push до `main` або будь-якої `claude/**` гілки → GitHub Actions білдить і деплоїть.
Файл: `.github/workflows/deploy.yml`
**ВАЖЛИВО**: завжди запускати `npm run build` локально перед пушем, щоб впевнитись що білд чистий.
Вручну: `npm run deploy`

## Структура
```
src/
├── AITracker.jsx   ← весь застосунок (один великий компонент + IIFE-вкладки)
├── constants.js    ← SKILLS, ACHIEVEMENTS, DEFAULT_*, STORAGE_KEY тощо
├── index.css       ← базові стилі (reset + scrollbar)
└── main.jsx        ← точка входу
index.html
vite.config.js      ← base: "/ai-tracker/"
```

## Архітектура AITracker.jsx
- Один функціональний компонент, ~5200 рядків
- Кожна вкладка рендериться через `{activeTab === "xyz" && (() => { ... })()}` — IIFE всередині JSX
- Усі `const` всередині IIFE: `renderTaskRow`, `renderPlanRow`, `renderGoalRow`, `dragHandlers` тощо
- **КРИТИЧНО для drag**: `dragHandlers` визначається в IIFE після render-функцій, але викликається під час рендеру — TDZ не проблема бо всі `const` вже присвоєні до return

## Поточний стан вкладок
`🏠 Головна` · `🎯 Цілі & План` · `🚀 Проекти` · `🔧 Інструменти` · `🧩 Навички` · `🏆 Досягнення` · `💳 Фінанси` · `🔥 Сесії` · `📊 Прогрес` · `📈 Статистика` · `🎵 Радіо`

## Вкладка «Цілі & План» (activeTab === "goalsplan")
Три рівні ієрархії: **Цілі** → **Плани** → **Задачі**
- Drag & drop між всіма типами + інбоксом; перемотування всередині секції
- **FIX для drag**: `onDragStart` використовує `setTimeout(() => setDragItem(...), 0)` — без цього React перерендерить і скасовує drag
- `draggable={true}` + `userSelect:"none"` + `cursor:"grab"` на **всьому рядку** (не тільки на іконці ⠿)
- Іконка `⠿` — декоративна (pointerEvents: none), колір ~35% opacity від кольору категорії
- Типи: goal(customXP:500, `#c084fc`), plan(xp:150, `#22d3ee`), task(xp:50, `#00ff88`)
- XP-бейджі (`+150 XP`) — яскраві, fontWeight:700, borderRadius:4, border opacity ~0.6
- Лічильники секцій (`1`, `8`) — міні-бейджі з рамкою та фоном у кольорі секції
- GapZone (індикатор між рядками) — тонка 4px лінія зі свіченням, без тексту, без розширення
- Інбокс ідей: тип (Ціль/План/Задача) задається при додаванні, бейдж клікабельний (цикл по типах)

## Вкладка «Інструменти» (activeTab === "tools")
Нова концепція: кожен тул — кнопка-посилання `<a href target="_blank">`.
- **Активні інструменти** (ті що Вова вже використовує, `active: true`) — яскраві, кольорові
- **Інші інструменти** (`active: false`) — приглушені, пунктирна рамка
- `SKILLS.tools` тепер `{name: string, url: string, active: boolean}[]` (не рядки!)
- Активні: Claude, ChatGPT, Gemini, Grok (LLM); ChatGPT/Gemini/Grok/Higgsfield/Syntx (зображення); Higgsfield/Syntx/Seedance/Kling/Runway/Grok (відео); ElevenLabs/Higgsfield/Syntx (голос); Suno (музика)
- `unlockedTools` в skillData збережений для backward compat досягнень, але UI unlock прибрано

## Вкладка «Радіо» (activeTab === "radio")
YouTube live-стріми для фонової музики під час роботи.
- Персистентний плеєр: iframe поза вкладковим рендером — музика не переривається при перемиканні вкладок
- На вкладці «Радіо» — повний відеоплеєр; на інших — компактний (280px, 44px) у bottom-left
- **Пауза**: `radioPaused` state; на паузі iframe знімається (DOM), при відновленні — знову монтується
- **Перемикач**: `⏮ / ⏭` кнопки (показуються якщо станцій > 1), `switchRadioStation(dir)` по колу
- Нові станції отримують `hsl(random, 75%, 60%)` колір рознесений від наявних (не фіксована палітра)
- Всі станції (включно з дефолтними) мають кнопку `×` для видалення

### Дефолтні станції (DEFAULT_RADIO в constants.js)
```js
{ id: "r_futuregarage", videoId: "M7CEXcnSyuU", genre: "Future Garage", color: "#06b6d4" }
{ id: "r_lofi",         videoId: "jfKfPfyJRdk", genre: "Lo-Fi",         color: "#ec4899" }  // може бути offline
{ id: "r_synthwave",    videoId: "4xDzrJKXOOY", genre: "Synthwave",     color: "#a855f7" }
{ id: "r_chillhop",     videoId: "5yx6BWlEVcY", genre: "Chillhop",      color: "#f59e0b" }
{ id: "r_sleep",        videoId: "rUxyKA_-grg", genre: "Sleep / Calm",  color: "#6366f1" }
```

## localStorage schema (актуальна)
```js
{
  skillData: { [skillId]: { unlockedTools: string[] } },  // backward compat
  totalXP: number,
  income: number,
  projects: [{ name, date, category?, status?, ... }],
  sessions: { dates: string[], monthlyTarget: number },
  unlockedAchievements: string[],
  longGoals: Goal[],   // Цілі
  plan: Plan[],        // Плани
  goals: Task[],       // Задачі (назва misleading — це tasks)
  inbox: InboxItem[],
  radioStations: RadioStation[],  // зберігається; включає custom
  // radioActive НЕ зберігається (без автоплею при завантаженні)
}
```

## Дизайн
Темна тема (`#080a12`), неоновий акцент `#00ff88`, шрифти Exo 2 + Space Mono, grid-фон.
Кольори категорій: llm=#00ff88, image=#ff6b35, video=#a855f7, voice=#06b6d4, music=#ec4899,
automation=#f59e0b, code=#6366f1, design=#f43f5e, content=#10b981, monetize=#fbbf24

## Початкові дані (не скидати)
- XP: 300 (за Oxford_1000)
- Перший проект: "Oxford_1000 — додаток для англійської" (2026)
- Досягнення `oxford_dev` розблоковано за замовчуванням

## Відома специфіка / підводні камені
- **Drag setTimeout**: `onDragStart` → `setTimeout(() => setDragItem(...), 0)` — ОБОВ'ЯЗКОВО, інакше React скасовує drag
- **SKILLS.tools** — тепер об'єкти `{name,url,active}`, не рядки. При зміні — оновлювати всі місця де `t.name` vs старий `t`
- **Вкладки як IIFE**: `{activeTab === "x" && (() => { const ... = ...; return <JSX/>; })()}` — нормальний паттерн цього проекту
- **`goals` state** = задачі (Tasks), **`longGoals` state** = цілі, **`plan` state** = плани — назви misleading
- Завжди перевіряти `npm run build` після правок — deploy може впасти без локальної перевірки

## Команди
```bash
npm run dev      # локальний сервер
npm run build    # збірка в dist/ — запускати перед кожним push!
npm run deploy   # ручний деплой на gh-pages
```

## Гілка розробки
`claude/fervent-turing-x581Z` → автодеплой на живий сайт при кожному push
