const STORAGE_KEY = "habit-tracker-habits";

const CATEGORIES = [
  { id: "health", label: "Gesundheit", color: "#30d158" },
  { id: "work", label: "Arbeit", color: "#0a84ff" },
  { id: "learning", label: "Lernen", color: "#bf5af2" },
  { id: "other", label: "Sonstiges", color: "#8e8e93" },
];

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
const dateEl = document.getElementById("today");
const summaryEl = document.getElementById("summary");

dateEl.textContent = new Date().toLocaleDateString("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

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
    dot.textContent = done ? "✓" : "";
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
      ? `<span class="streak">🔥 ${streak} Tage Serie</span> · Rekord ${best} · Woche ${rate}%`
      : `Rekord ${best} · Woche ${rate}%`;

    info.appendChild(name);
    info.appendChild(catLabel);
    info.appendChild(stats);

    const del = document.createElement("button");
    del.className = "habit-delete";
    del.type = "button";
    del.textContent = "×";
    del.addEventListener("click", () => deleteHabit(habit.id));

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

function deleteHabit(id) {
  habits = habits.filter((h) => h.id !== id);
  saveHabits(habits);
  render();
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = inputEl.value.trim();
  if (!name) return;
  habits.push({
    id: Date.now().toString(),
    name,
    category: categorySelectEl.value,
    doneDates: [],
  });
  saveHabits(habits);
  inputEl.value = "";
  render();
});

render();
