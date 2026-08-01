# Як зроблено збереження/бекап даних в AI Progress Tracker

> Технічний бриф для перенесення підходу в інший застосунок.
> Джерело: `src/AITracker.jsx` (React + Vite, дані в localStorage, хостинг GitHub Pages).
> ⚠️ Наприкінці — розділ про мобільні платформи: там наш основний API **не працює**, потрібна адаптація.

## Задача

Усі дані застосунку живуть у `localStorage` одного браузера. Це зручно (нуль бекенду, нуль акаунтів),
але має ту саму дірку, що описана в критиці мобільного застосунку: **очистив дані сайту / видалив
застосунок — усе зникло**. Потрібен був спосіб тримати копію поза застосунком, без сервера й реєстрації.

## Архітектура: 3 рівні

1. **Робочі дані** — `localStorage`, кілька ключів (у нас `ai_tracker_v1` + `ai_tracker_today_act`).
2. **Файл-копія на диску** — один JSON, який користувач сам розміщує (в нас зазвичай у теці, що
   синхронізується з хмарою: OneDrive/Google Drive/iCloud). Хмара дає позаконтурне зберігання й історію версій.
3. **Авто-перезапис цього файлу** — після кожної зміни даних, тихо, без діалогів.

Ключова ідея рівня 3: **File System Access API** дозволяє один раз попросити користувача обрати файл,
зберегти *дескриптор* цього файлу і далі перезаписувати його без жодних запитань. Це перетворює
«ручний бекап, про який усі забувають» на «копія завжди свіжа».

## Реалізація

### 1. Дескриптор файлу зберігається в IndexedDB (не в localStorage!)

`FileSystemFileHandle` не серіалізується в JSON, тож у localStorage його покласти неможливо.
Але IndexedDB зберігає його як структуровану копію — і дескриптор переживає перезавантаження сторінки.

```js
const HANDLE_DB = "app_fs";
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
```

### 2. Формат файлу копії

Обгортка з міткою застосунку й часом експорту — щоб при відновленні можна було перевірити,
що це «наш» файл, і показати користувачу дату.

```js
const BACKUP_KEYS = ["app_state_v1", "app_today_v1"];   // усі ключі localStorage застосунку
const BACKUP_FILENAME = "app-backup.json";

function collectBackupData() {
  const data = { _app: "app-name", _exportedAt: new Date().toISOString(), keys: {} };
  for (const k of BACKUP_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) data.keys[k] = v;
  }
  return JSON.stringify(data, null, 2);
}

function applyBackupData(json) {
  const parsed = JSON.parse(json);
  const keys = parsed.keys ?? parsed;              // приймаємо і «голий» формат
  if (!keys || typeof keys !== "object") throw new Error("Некоректний файл копії");
  if (!(BACKUP_KEYS[0] in keys)) throw new Error("У файлі немає даних застосунку");
  for (const k of BACKUP_KEYS) {
    if (k in keys && keys[k] != null) localStorage.setItem(k, keys[k]);
  }
}
```

### 3. Дозволи

Дозвіл на запис може «протухнути» (див. підводні камені). Тому дві різні функції:

```js
async function verifyPermission(handle, write) {
  const opts = { mode: write ? "readwrite" : "read" };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  if ((await handle.requestPermission(opts)) === "granted") return true;  // потребує жесту користувача!
  return false;
}
```

### 4. Перша копія (з діалогом) + fallback

```js
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
    return "saved";        // файл прив'язано → далі авто-режим
  }
  // Fallback (Safari / Firefox / мобільні): звичайне завантаження, без авто-режиму
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = BACKUP_FILENAME;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
```

### 5. Тихий авто-перезапис

Головна відмінність: **тільки `queryPermission`, без `requestPermission`** — бо запит дозволу
вимагає жесту користувача і з фонового коду просто впаде. Немає дозволу → тихо нічого не робимо.

```js
async function silentBackupToDisk() {
  if (!window.showSaveFilePicker) return false;
  const handle = await idbGet("backup").catch(() => null);
  if (!handle) return false;
  if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted") return false;
  const writable = await handle.createWritable();
  await writable.write(collectBackupData());
  await writable.close();
  return true;
}
```

Виклик — з debounce, щоб не смикати диск на кожне натискання. У нас лічильник `saveTick`
інкрементується в тому ж `useEffect`, що пише в localStorage:

```js
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
```

### 6. Відновлення

```js
async function readBackupFromDisk() {
  if (window.showOpenFilePicker) {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
    });
    return await (await handle.getFile()).text();
  }
  // Fallback: прихований input[type=file] + FileReader
}
```

Після `applyBackupData(json)` — обов'язково `location.reload()`, бо стан у пам'яті вже застарів.

### 7. UI (мінімум, який реально працює)

- Кнопка **💾 Зробити копію** — перший раз питає файл, далі просто оновлює.
- Підпис **«Остання копія: 15 липня, 14:32 ✓»** — беремо з `BACKUP_AT_KEY`. Це і є нагадування.
- Індикатор **авто-режиму** — щоб було видно, що копія оновлюється сама.
- Кнопка **📍 Перепривʼязати файл** — скидає дескриптор (`idbSet("backup", undefined)`), наступна копія знову спитає, куди зберігати.
- Кнопка **📂 Відновити** — з попередженням, що вона перезапише поточні дані.

## ⚠️ Підводні камені (перевірено на власній шкурі)

### 1. Найбільша втрата даних сталася НЕ через відсутність бекапу

Ми відкотили сайт на стару збірку. Стара збірка не знала про поле `inbox`, яке з'явилося пізніше —
і при першому ж збереженні **перезаписала весь стан без цього поля**. Дані зникли, а авто-копія
слухняно записала вже зіпсований стан у файл, затерши хорошу копію.

**Фікс — зливати стан поверх прочитаного, а не замінювати його:**

```js
// saved — те, що прочитали з localStorage при старті
const state = { ...saved, ...currentState };   // поля, невідомі цій збірці, виживають
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
```

Це робить збереження стійким до відкатів версій і до різних збірок на різних пристроях.

### 2. Авто-копія в один файл = один рівень захисту

Якщо дані зіпсувалися, авто-копія тихо запише зіпсоване поверх хорошого. **Потрібна ротація:**
тримати 3–7 останніх копій (`backup-1.json`, `backup-2.json`, …) або хоча б окремий «щотижневий»
знімок, який перезаписується рідше. Ми цього не зробили одразу — і саме тому втратили дані остаточно.
Хмарна тека частково рятує (історія версій OneDrive/iCloud), але покладатися на це не варто.

### 3. Дозвіл на запис протухає після перезапуску браузера

Chrome скидає `readwrite`-дозвіл між сесіями. Авто-копія при цьому **тихо перестає працювати** —
і користувач думає, що все добре. Тому:
- статус авто-режиму треба показувати явно;
- дату останньої копії — теж (якщо їй тиждень, це видно);
- і варто активно нагадувати, якщо копії давно не було.

### 4. `showSaveFilePicker` є лише в Chromium на десктопі

Safari (включно з усіма браузерами на iOS), Firefox — не підтримують. Там працює лише fallback
із завантаженням файлу, без авто-режиму.

## 📱 Що змінити для мобільного застосунку

Це головне, якщо цільова платформа — телефон. **Наш підхід з авто-перезаписом файлу на iOS не працює**
(немає File System Access API), а «завантаження в браузері» на телефоні — саме та погана штука,
про яку йдеться в критиці. Тому:

### Замість `showSaveFilePicker` → Web Share API

Він відкриває **системне «Поділитися»**, звідки файл летить у Файли / iCloud Drive / Telegram — тобто
рівно те, що потрібно:

```js
async function shareBackup() {
  const json = collectBackupData();
  const file = new File([json], "app-backup.json", { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Резервна копія" });
    return "shared";
  }
  // далі — звичайне завантаження як запасний варіант
}
```

Обмеження: викликається **тільки з жесту користувача**, тож автоматичного фонового бекапу на iOS не буде.
Отже, для мобільного критично:

1. **Активне нагадування** (те, що пропонує критика): рахувати `днів з останньої копії` і показувати
   помітну плашку після 7 / 14 / 30 днів — не сірим підписом, а помітним банером з кнопкою «Зберегти зараз».
   Дані для цього вже є — `BACKUP_AT_KEY`.
2. **Нагадування при ризикових моментах** — перед великими змінами, або раз на N запусків.
3. **Ротація копій** — див. пункт 2 підводних каменів; на мобільному ще важливіша, бо копії робляться рідше.
4. **Імпорт** — приймати файл через звичайний `input[type=file]` (працює скрізь) + валідація формату.

### Якщо потрібна справжня синхронізація між пристроями

Файлова копія — це страховка, а не синхронізація. Якщо треба саме «дані на всіх пристроях», варіанти
за зростанням складності: iCloud/CloudKit (тільки Apple, зате безкоштовно й без бекенду) →
Supabase / Firebase (кросплатформно, потрібен акаунт) → власний бекенд. Але навіть із синхронізацією
**експорт у файл варто лишити** — він рятує від помилок самої синхронізації, а не лише від втрати пристрою.

## Підсумок — що варто скопіювати

| Рішення | Навіщо |
|---|---|
| Обгортка файлу `{_app, _exportedAt, keys}` | валідація при імпорті + видима дата |
| Дескриптор файлу в IndexedDB | авто-перезапис без діалогів (десктоп) |
| `query` без `request` у фоні | тихий бекап не падає без жесту |
| debounce ~3 с | не смикати диск на кожну зміну |
| `{...saved, ...state}` при збереженні | **захист від втрати даних при відкаті версії** |
| Дата останньої копії + нагадування | користувач бачить, що страховка жива |
| Ротація копій (3–7 файлів) | захист від «зіпсоване перезаписало хороше» |
| Web Share API на мобільному | копія летить у Файли/iCloud, а не в завантаження |
