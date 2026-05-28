const STORAGE_KEY = "small-steps-diet-assistant-v1";

const defaultState = {
  profile: {
    startWeight: 80,
    currentWeight: 80,
    goalWeight: 60
  },
  habits: {},
  logs: []
};

const pauseLines = [
  "Am I hungry, stressed, bored, or tired?",
  "What would make the next 10 minutes easier?",
  "Can I drink water and wait before deciding?",
  "What feeling am I trying to change?",
  "Would a short walk lower the urge by 1 point?",
  "Can I choose a smaller portion and eat slowly?"
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let state = loadState();

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored ? mergeState(defaultState, stored) : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(base, stored) {
  return {
    ...base,
    ...stored,
    profile: { ...base.profile, ...stored.profile },
    habits: { ...base.habits, ...stored.habits },
    logs: Array.isArray(stored.logs) ? stored.logs : []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function addLog(type, data) {
  state.logs.unshift({
    id: crypto.randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    ...data
  });
  saveState();
  render();
}

function recentLogs(days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return state.logs.filter((log) => new Date(log.createdAt).getTime() >= cutoff);
}

function weightLogs() {
  return state.logs
    .filter((log) => log.type === "weight")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function render() {
  const { startWeight, currentWeight, goalWeight } = state.profile;
  const totalToLose = Math.max(startWeight - goalWeight, 1);
  const lost = Math.max(startWeight - currentWeight, 0);
  const progress = Math.min(lost / totalToLose, 1);
  const circumference = 302;

  $("#currentWeight").textContent = currentWeight.toFixed(1).replace(".0", "");
  $("#goalWeight").textContent = goalWeight.toFixed(0);
  $("#progressRing").style.strokeDashoffset = String(circumference - circumference * progress);

  const next = Math.max(goalWeight, Math.ceil((currentWeight - 2) * 10) / 10);
  $("#nextMilestone").textContent = `${next.toFixed(1).replace(".0", "")} kg`;
  $("#milestoneNote").textContent = `${Math.max(currentWeight - next, 0).toFixed(1)} kg to the next step.`;

  $("#todayDate").textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date());

  renderHabits();
  renderInsights();
  renderCoachPrompt();
}

function renderHabits() {
  const day = todayKey();
  const habits = state.habits[day] || {};
  $$("[data-habit]").forEach((input) => {
    input.checked = Boolean(habits[input.dataset.habit]);
  });

  const wins = Object.values(habits).filter(Boolean).length;
  $("#todayScore").textContent = `${wins} ${wins === 1 ? "win" : "wins"}`;
  $("#todayNudge").textContent = wins >= 3 ? "That is a real day." : "One pause counts.";
}

function renderInsights() {
  const logs = recentLogs();
  const meals = logs.filter((log) => log.type === "meal");
  const urges = logs.filter((log) => log.type === "urge");
  const protein = meals.filter((log) => log.protein);
  const weights = weightLogs();
  const firstWeight = weights[0]?.weight ?? state.profile.startWeight;
  const latestWeight = weights.at(-1)?.weight ?? state.profile.currentWeight;
  const change = latestWeight - firstWeight;

  $("#mealCount").textContent = meals.length;
  $("#urgeCount").textContent = urges.length;
  $("#proteinCount").textContent = protein.length;
  $("#weightChange").textContent = `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`;

  const timeline = $("#timeline");
  timeline.innerHTML = "";
  logs.slice(0, 12).forEach((log) => {
    const item = document.createElement("li");
    const time = document.createElement("time");
    const text = document.createElement("span");
    time.textContent = formatDate(log.createdAt);
    text.textContent = describeLog(log);
    item.append(time, text);
    timeline.append(item);
  });

  if (!logs.length) {
    const item = document.createElement("li");
    item.textContent = "Your next entry will show up here.";
    timeline.append(item);
  }
}

function describeLog(log) {
  if (log.type === "weight") return `Weight saved: ${log.weight} kg`;
  if (log.type === "urge") return `Urge: ${log.reason || "stress"}; tried ${log.action}.`;
  return `${log.name || "Meal"}; hunger ${log.hunger}/10, stress ${log.stress}/10${log.protein ? ", protein included" : ""}.`;
}

function renderCoachPrompt() {
  const logs = recentLogs();
  const summary = logs.length
    ? logs.map((log) => `- ${formatDate(log.createdAt)}: ${describeLog(log)}`).join("\n")
    : "- No logs yet.";

  $("#coachPrompt").value = `You are my supportive weight-loss coach. I currently weigh ${state.profile.currentWeight} kg and my long-term goal is ${state.profile.goalWeight} kg. I want small steps, especially help with stress eating when I am not hungry.

My last 7 days:
${summary}

Please give me:
1. One kind observation.
2. One pattern you notice.
3. A simple plan for tomorrow.
4. A stress-eating pause script I can use.

Keep it practical, non-shaming, and focused on small choices. Do not give medical advice.`;
}

function setActiveTab(tabId) {
  $$(".tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tabId));
  $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
}

function bindEvents() {
  $$(".tab").forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  $("[data-habit='pause']").focus();

  $$("[data-habit]").forEach((input) => {
    input.addEventListener("change", () => {
      const day = todayKey();
      state.habits[day] = state.habits[day] || {};
      state.habits[day][input.dataset.habit] = input.checked;
      saveState();
      render();
    });
  });

  $("#newPause").addEventListener("click", () => {
    const current = $("#pauseLine").textContent;
    const nextLines = pauseLines.filter((line) => line !== current);
    $("#pauseLine").textContent = nextLines[Math.floor(Math.random() * nextLines.length)];
  });

  $("#weightForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const weight = Number($("#weightInput").value);
    if (!weight) return showToast("Add your weight first.");
    state.profile.currentWeight = weight;
    if (!state.profile.startWeight) state.profile.startWeight = weight;
    addLog("weight", { weight });
    $("#weightInput").value = "";
    showToast("Weight saved.");
  });

  $("#mealForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#mealName").value.trim();
    if (!name) return showToast("Add what you ate first.");
    addLog("meal", {
      name,
      hunger: Number($("#mealHunger").value),
      stress: Number($("#mealStress").value),
      note: $("#mealNote").value.trim(),
      protein: $("#mealProtein").checked
    });
    event.currentTarget.reset();
    $("#mealHunger").value = 5;
    $("#mealStress").value = 5;
    showToast("Meal saved.");
  });

  $("#urgeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const reason = $("#urgeReason").value.trim();
    addLog("urge", {
      reason,
      action: $("#urgeAction").value
    });
    event.currentTarget.reset();
    showToast("Urge saved. That pause matters.");
  });

  $("#copyPrompt").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#coachPrompt").value);
    showToast("Coach prompt copied.");
  });

  $("#exportData").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diet-assistant-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  $("#resetDemo").addEventListener("click", () => {
    if (!confirm("Reset all saved entries on this device?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(defaultState);
    render();
    showToast("Reset complete.");
  });
}

bindEvents();
render();
