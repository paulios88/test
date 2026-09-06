const STORAGE_KEY = "habit-tracker-habits";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateKeyOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
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

let habits = loadHabits();

const listEl = document.getElementById("habit-list");
const emptyEl = document.getElementById("empty-state");
const formEl = document.getElementById("add-form");
const inputEl = document.getElementById("habit-input");
const dateEl = document.getElementById("today");

dateEl.textContent = new Date().toLocaleDateString("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function render() {
  listEl.innerHTML = "";
  emptyEl.style.display = habits.length ? "none" : "block";

  const today = todayKey();

  habits.forEach((habit) => {
    const done = habit.doneDates.includes(today);
    const streak = calcStreak(habit.doneDates);

    const li = document.createElement("li");
    li.className = "habit" + (done ? " done" : "");

    const check = document.createElement("button");
    check.className = "habit-check";
    check.type = "button";
    check.textContent = done ? "✓" : "";
    check.addEventListener("click", () => toggleHabit(habit.id));

    const info = document.createElement("div");
    info.className = "habit-info";

    const name = document.createElement("div");
    name.className = "habit-name";
    name.textContent = habit.name;

    const streakEl = document.createElement("div");
    streakEl.className = "habit-streak";
    streakEl.textContent = streak > 0 ? `🔥 ${streak} Tage in Folge` : "Noch keine Serie";

    info.appendChild(name);
    info.appendChild(streakEl);

    const del = document.createElement("button");
    del.className = "habit-delete";
    del.type = "button";
    del.textContent = "×";
    del.addEventListener("click", () => deleteHabit(habit.id));

    li.appendChild(check);
    li.appendChild(info);
    li.appendChild(del);
    listEl.appendChild(li);
  });
}

function toggleHabit(id) {
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;
  const today = todayKey();
  const idx = habit.doneDates.indexOf(today);
  if (idx === -1) {
    habit.doneDates.push(today);
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
  habits.push({ id: Date.now().toString(), name, doneDates: [] });
  saveHabits(habits);
  inputEl.value = "";
  render();
});

render();
