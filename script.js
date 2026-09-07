const STORAGE_KEY = "habit-tracker-habits";

const CATEGORIES = [
  { id: "health", label: "Gesundheit", color: "#30d158", icon: "leaf" },
  { id: "work", label: "Arbeit", color: "#0a84ff", icon: "target" },
  { id: "learning", label: "Lernen", color: "#bf5af2", icon: "book" },
  { id: "other", label: "Sonstiges", color: "#8e8e93", icon: "star" },
];

const PRESET_HABITS = [
  { name: "Wasser trinken", category: "health", icon: "droplet" },
  { name: "Sport treiben", category: "health", icon: "dumbbell" },
  { name: "Meditieren", category: "health", icon: "leaf" },
  { name: "Spazieren gehen", category: "health", icon: "footprints" },
  { name: "Lesen", category: "learning", icon: "book" },
  { name: "Journaling", category: "learning", icon: "pencil" },
  { name: "Fokuszeit", category: "work", icon: "target" },
  { name: "Früh aufstehen", category: "other", icon: "sunrise" },
  { name: "Handyfrei vorm Schlafen", category: "other", icon: "moon" },
];

const ICON_PATHS = {
  check: '<polyline points="4 12 10 18 20 6"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  flame: '<path d="M12 2c-1 4-5 6-5 11a5 5 0 0 0 10 0c0-2-1-3.5-2-4.5.2 2-1 3-2 3-1.2 0-1.8-1.2-1-2.5C13 7 13 5 12 2z"/>',
  droplet: '<path d="M12 2C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.5-3-7-7-13z"/>',
  dumbbell: '<line x1="5" y1="12" x2="19" y2="12"/><rect x="2" y="9" width="4" height="6" rx="1"/><rect x="18" y="9" width="4" height="6" rx="1"/>',
  leaf: '<path d="M4 20c9 0 15-6 15-15 0-.7 0-1.3-.1-2C10 4 4 10 4 19c0 .3 0 .7.1 1z"/><line x1="4" y1="20" x2="10" y2="14"/>',
  footprints: '<circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="15" r="2.5"/><line x1="8" y1="10.5" x2="8" y2="14"/><line x1="16" y1="17.5" x2="16" y2="21"/>',
  book: '<path d="M4 4.5C4 4.5 7 4 12 6c5-2 8-1.5 8-1.5v14c0 0-3-.5-8 1.5-5-2-8-1.5-8-1.5v-14z"/><line x1="12" y1="6" x2="12" y2="20"/>',
  pencil: '<path d="M4 20l1-4L15 6l3 3L8 19l-4 1z"/><line x1="13.5" y1="7.5" x2="16.5" y2="10.5"/>',
  sunrise: '<line x1="12" y1="3" x2="12" y2="7"/><line x1="4.2" y1="11.2" x2="6.6" y2="13"/><line x1="19.8" y1="11.2" x2="17.4" y2="13"/><line x1="2" y1="18" x2="22" y2="18"/><path d="M6 18a6 6 0 0 1 12 0"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  star: '<path d="M12 3l2.6 5.9L21 9.6l-4.9 4.3 1.4 6.4L12 17l-5.5 3.3 1.4-6.4L3 9.6l6.4-.7z"/>',
};

function iconSvg(name, extra = "") {
  const path = ICON_PATHS[name] || ICON_PATHS.star;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="${extra}">${path}</svg>`;
}

const WEEKDAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

function dateKeyOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayKey() {
  return dateKeyOffset(0);
}

function loadHabits() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function calcStreak(doneDates) {
  const set = new Set(doneDates);
  let streak = 0;
  let offset = set.has(todayKey()) ? 0 : 1;
  while (set.has(dateKeyOffset(offset))) {
    streak++;
    offset++;
  }
  return streak;
}

function calcBestStreak(doneDates) {
  const sorted = [...new Set(doneDates)].sort();
  let best = 0;
  let current = 0;
  let prevDate = null;
  for (const key of sorted) {
    const date = new Date(key);
    if (prevDate !== null) {
      const diffDays = Math.round((date - prevDate) / 86400000);
      current = diffDays === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    best = Math.max(best, current);
    prevDate = date;
  }
  return best;
}

function calcWeekRate(doneDates) {
  const set = new Set(doneDates);
  let done = 0;
  for (let i = 0; i < 7; i++) {
    if (set.has(dateKeyOffset(i))) done++;
  }
  return Math.round((done / 7) * 100);
}

let habits = loadHabits();

const listEl = document.getElementById("habit-list");
const emptyEl = document.getElementById("empty-state");
const formEl = document.getElementById("add-form");
const inputEl = document.getElementById("habit-input");
const categorySelectEl = document.getElementById("category-select");
const addButtonEl = document.getElementById("add-button");
const presetListEl = document.getElementById("preset-list");
const dateEl = document.getElementById("today");
const summaryEl = document.getElementById("summary");

dateEl.textContent = new Date().toLocaleDateString("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

addButtonEl.innerHTML = iconSvg("plus");

CATEGORIES.forEach((cat) => {
  const opt = document.createElement("option");
  opt.value = cat.id;
  opt.textContent = cat.label;
  categorySelectEl.appendChild(opt);
});

function renderSummary() {
  const today = todayKey();
  const doneToday = habits.filter((h) => h.doneDates.includes(today)).length;
  summaryEl.textContent = habits.length
    ? `${doneToday} von ${habits.length} heute erledigt`
    : "";
}

function renderPresets() {
  presetListEl.innerHTML = "";
  PRESET_HABITS.forEach((preset) => {
    const added = habits.some((h) => h.name === preset.name);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "preset-chip" + (added ? " added" : "");
    chip.innerHTML = `${iconSvg(added ? "check" : preset.icon)}<span>${preset.name}</span>`;
    if (!added) {
      chip.addEventListener("click", () => addHabit(preset.name, preset.category, preset.icon));
    }
    presetListEl.appendChild(chip);
  });
}

function buildWeekGrid(habit) {
  const grid = document.createElement("div");
  grid.className = "week-grid";
  const today = todayKey();

  for (let offset = 6; offset >= 0; offset--) {
    const key = dateKeyOffset(offset);
    const done = habit.doneDates.includes(key);

    const cell = document.createElement("div");
    cell.className = "day-cell" + (key === today ? " today" : "");

    const label = document.createElement("div");
    label.className = "day-label";
    label.textContent = WEEKDAY_LABELS[new Date(key).getDay()];

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "day-dot" + (done ? " done" : "");
    dot.innerHTML = done ? iconSvg("check") : "";
    dot.addEventListener("click", () => toggleHabitDate(habit.id, key));

    cell.appendChild(label);
    cell.appendChild(dot);
    grid.appendChild(cell);
  }
  return grid;
}

function render() {
  listEl.innerHTML = "";
  emptyEl.style.display = habits.length ? "none" : "block";
  renderSummary();
  renderPresets();

  habits.forEach((habit) => {
    const category = categoryById(habit.category);
    const streak = calcStreak(habit.doneDates);
    const best = calcBestStreak(habit.doneDates);
    const rate = calcWeekRate(habit.doneDates);

    const li = document.createElement("li");
    li.className = "habit";
    li.style.setProperty("--cat-color", category.color);

    const top = document.createElement("div");
    top.className = "habit-top";

    const iconBox = document.createElement("div");
    iconBox.className = "habit-icon";
    iconBox.innerHTML = iconSvg(habit.icon || category.icon);

    const info = document.createElement("div");
    info.className = "habit-info";

    const name = document.createElement("div");
    name.className = "habit-name";
    name.textContent = habit.name;

    const catLabel = document.createElement("div");
    catLabel.className = "habit-category";
    catLabel.textContent = category.label;

    const stats = document.createElement("div");
    stats.className = "habit-stats";
    stats.innerHTML = streak > 0
      ? `${iconSvg("flame")}<span>${streak} Tage Serie · Rekord ${best} · Woche ${rate}%</span>`
      : `<span>Rekord ${best} · Woche ${rate}%</span>`;

    info.appendChild(name);
    info.appendChild(catLabel);
    info.appendChild(stats);

    const del = document.createElement("button");
    del.className = "habit-delete";
    del.type = "button";
    del.setAttribute("aria-label", "Löschen");
    del.innerHTML = iconSvg("close");
    del.addEventListener("click", () => deleteHabit(habit.id));

    top.appendChild(iconBox);
    top.appendChild(info);
    top.appendChild(del);

    li.appendChild(top);
    li.appendChild(buildWeekGrid(habit));
    listEl.appendChild(li);
  });
}

function toggleHabitDate(id, dateKey) {
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;
  const idx = habit.doneDates.indexOf(dateKey);
  if (idx === -1) {
    habit.doneDates.push(dateKey);
  } else {
    habit.doneDates.splice(idx, 1);
  }
  saveHabits(habits);
  render();
}

function addHabit(name, category, icon) {
  habits.push({
    id: Date.now().toString(),
    name,
    category,
    icon,
    doneDates: [],
  });
  saveHabits(habits);
  render();
}

function deleteHabit(id) {
  habits = habits.filter((h) => h.id !== id);
  saveHabits(habits);
  render();
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = inputEl.value.trim();
  if (!name) return;
  addHabit(name, categorySelectEl.value, null);
  inputEl.value = "";
});

render();
