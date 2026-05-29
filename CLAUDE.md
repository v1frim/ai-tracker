# AI Progress Tracker — контекст проекту

## Що це
Веб-застосунок для відстеження прогресу Вови у вивченні AI-інструментів та заробітку з AI.
Аналог Oxford_1000, але для AI-шляху. Мотивація через гейміфікацію: XP, рівні, стріки, досягнення.

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
Вручну: `npm run deploy`

## Структура
```
src/
└── AITracker.jsx   ← весь застосунок (один компонент)
    index.css       ← базові стилі (reset + scrollbar)
    main.jsx        ← точка входу
index.html
vite.config.js      ← base: "/ai-tracker/"
```

## Дані в localStorage
```js
{
  skillData: { [skillId]: { unlockedTools: string[] } },
  totalXP: number,
  income: number,
  projects: [{ name, date }],
  sessions: { dates: string[], monthlyTarget: number },
  unlockedAchievements: string[]
}
```

## Що вже є в додатку
- **10 категорій** AI-інструментів (LLM, зображення, відео, голос, музика, автоматизація, код, дизайн, контент, монетизація)
- **XP-система** з рівнями (`Math.sqrt(xp/80)`)
- **13 досягнень** (інструменти, проекти, дохід, стріки, сесії)
- **Трекер доходу** з прогрес-барами ($100 → $1k → $10k → $100k)
- **Трекер проектів** (+200 XP за кожен)
- **Щоденні AI-сесії**: check-in, стрік, місячна ціль, 56-денний heatmap (+50 XP/сесія)

## Вкладки
`📊 Дашборд` · `🔥 Сесії` · `🧩 Навички` · `🏆 Досягнення` · `💰 Дохід` · `🚀 Проекти`

## Дизайн
Темна тема (`#080a12`), неоновий акцент `#00ff88`, шрифти Exo 2 + Space Mono, grid-фон.
Кольори категорій: llm=#00ff88, image=#ff6b35, video=#a855f7, voice=#06b6d4, music=#ec4899,
automation=#f59e0b, code=#6366f1, design=#f43f5e, content=#10b981, monetize=#fbbf24

## Початкові дані (не скидати)
- XP: 300 (за Oxford_1000)
- Перший проект: "Oxford_1000 — додаток для англійської" (2026)
- Досягнення oxford_dev розблоковано за замовчуванням

## Команди
```bash
npm run dev      # локальний сервер
npm run build    # збірка в dist/
npm run deploy   # ручний деплой на gh-pages
```
