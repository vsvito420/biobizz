// BioBizz All-Mix Dünger Rechner

// ml pro Liter Wasser, Index = Woche (0 = Vegetationsphase)
const FERTILIZERS = [
  { id: "rootJuice", name: "Root Juice", color: "#8a6d5a", mlPerL: [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "bioGrow",   name: "Bio Grow",   color: "#4f8a58", mlPerL: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0] },
  { id: "bioBloom",  name: "Bio Bloom",  color: "#f3a08c", mlPerL: [0, 1, 2, 2, 3, 3, 4, 4, 4, 0, 0] },
  { id: "bioHeaven", name: "Bio Heaven", color: "#3a9db0", mlPerL: [2, 2, 2, 3, 4, 4, 5, 5, 5, 0, 0] },
  { id: "topMax",    name: "Top Max",    color: "#c24d4b", mlPerL: [0, 1, 1, 1, 1, 4, 4, 4, 4, 0, 0] },
  { id: "actiVera",  name: "Acti Vera",  color: "#7fae4e", mlPerL: [2, 2, 2, 3, 4, 4, 5, 5, 5, 0, 0] },
];

const WEEKS = FERTILIZERS[0].mlPerL.length;
const STORAGE_KEY = "biobizz-state-v2";

function phaseFor(week) {
  if (week === 0) return "Vegetationsphase";
  if (week >= 9) return "Spülen (nur Wasser)";
  return `Blüte · Woche ${week}`;
}

// ---- State ---------------------------------------------------------------

const state = {
  week: 0,
  liters: 1,
  enabled: Object.fromEntries(FERTILIZERS.map((f) => [f.id, true])),
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    if (Number.isInteger(saved.week) && saved.week >= 0 && saved.week < WEEKS) state.week = saved.week;
    if (typeof saved.liters === "number" && saved.liters > 0) state.liters = saved.liters;
    if (saved.enabled) Object.assign(state.enabled, saved.enabled);
  } catch (_) { /* Speicher nicht verfügbar */ }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* ignorieren */ }
}

// ---- DOM -----------------------------------------------------------------

const $ = (id) => document.getElementById(id);
const weekInput = $("week");
const weekValue = $("weekValue");
const phaseEl = $("phase");
const wateringRange = $("watering");
const wateringNumber = $("wateringNumber");
const list = $("fertilizers");
const totalEl = $("total");
const scheduleTable = $("schedule");
const chartEmpty = $("chartEmpty");

weekInput.max = WEEKS - 1;

const fmt = (n) => n.toLocaleString("de-DE", { minimumFractionDigits: n % 1 ? 1 : 0, maximumFractionDigits: 2 });

function mlFor(f) {
  return f.mlPerL[state.week] * state.liters;
}

function buildList() {
  list.innerHTML = "";
  for (const f of FERTILIZERS) {
    const li = document.createElement("li");
    li.className = "fertilizer-item";
    li.style.setProperty("--c", f.color);
    li.innerHTML = `
      <label>
        <input type="checkbox" data-id="${f.id}">
        <span class="swatch" aria-hidden="true"></span>
        <span class="name">${f.name}</span>
      </label>
      <span class="rate"></span>
      <span class="result"></span>`;
    li.querySelector("input").addEventListener("change", (e) => {
      state.enabled[f.id] = e.target.checked;
      render();
    });
    list.appendChild(li);
  }
}

function buildSchedule() {
  const head = `<thead><tr><th scope="col">Dünger</th>${
    Array.from({ length: WEEKS }, (_, w) => `<th scope="col" data-week="${w}">${w === 0 ? "Veg" : "W" + w}</th>`).join("")
  }</tr></thead>`;
  const body = FERTILIZERS.map((f) => `<tr><th scope="row"><span class="swatch" style="--c:${f.color}"></span>${f.name}</th>${
    f.mlPerL.map((v, w) => `<td data-week="${w}">${v || "–"}</td>`).join("")
  }</tr>`).join("");
  scheduleTable.innerHTML = head + `<tbody>${body}</tbody>`;
  scheduleTable.addEventListener("click", (e) => {
    const cell = e.target.closest("[data-week]");
    if (!cell) return;
    state.week = Number(cell.dataset.week);
    render();
  });
}

// ---- Chart ---------------------------------------------------------------

let chart = null;
if (window.Chart) {
  chart = new Chart($("fertilizerChart"), {
    type: "doughnut",
    data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderColor: "#1b1f1c", borderWidth: 2 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "55%",
      plugins: {
        legend: { position: "bottom", labels: { color: "#dfe6e0", font: { family: "Ubuntu" }, boxWidth: 14 } },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt(ctx.parsed)} ml` } },
      },
    },
  });
}

function updateChart(active) {
  const shown = active.filter(({ ml }) => ml > 0);
  chartEmpty.hidden = shown.length > 0;
  if (!chart) return;
  chart.data.labels = shown.map(({ f }) => f.name);
  chart.data.datasets[0].data = shown.map(({ ml }) => ml);
  chart.data.datasets[0].backgroundColor = shown.map(({ f }) => f.color);
  chart.update();
}

// ---- Render --------------------------------------------------------------

function render() {
  weekInput.value = state.week;
  weekValue.textContent = state.week === 0 ? "Veg" : state.week;
  phaseEl.textContent = phaseFor(state.week);
  wateringRange.value = Math.min(state.liters, Number(wateringRange.max));
  if (document.activeElement !== wateringNumber) wateringNumber.value = state.liters;

  let total = 0;
  const active = [];
  for (const f of FERTILIZERS) {
    const li = list.querySelector(`input[data-id="${f.id}"]`).closest("li");
    const on = state.enabled[f.id];
    const ml = mlFor(f);
    li.querySelector("input").checked = on;
    li.classList.toggle("off", !on);
    li.classList.toggle("zero", on && ml === 0);
    li.querySelector(".rate").textContent = `${f.mlPerL[state.week]} ml/L`;
    li.querySelector(".result").textContent = on ? `${fmt(ml)} ml` : "–";
    if (on) {
      total += ml;
      active.push({ f, ml });
    }
  }
  totalEl.textContent = `${fmt(total)} ml`;

  scheduleTable.querySelectorAll("[data-week]").forEach((el) => {
    el.classList.toggle("current", Number(el.dataset.week) === state.week);
  });

  updateChart(active);
  saveState();
  if (typeof journalRender === "function") journalRender();
}

// ---- CSV -----------------------------------------------------------------

function downloadCSV() {
  const rows = [["Dünger", "Aktiv", ...Array.from({ length: WEEKS }, (_, w) => (w === 0 ? "Veg (ml/L)" : `Woche ${w} (ml/L)`)),
    `Woche ${state.week} bei ${state.liters} L (ml)`]];
  for (const f of FERTILIZERS) {
    rows.push([f.name, state.enabled[f.id] ? "ja" : "nein", ...f.mlPerL, mlFor(f).toFixed(2)]);
  }
  const csv = "﻿" + rows.map((r) => r.join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `biobizz-woche-${state.week}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---- Events --------------------------------------------------------------

weekInput.addEventListener("input", () => {
  state.week = Number(weekInput.value);
  render();
});

wateringRange.addEventListener("input", () => {
  state.liters = Number(wateringRange.value);
  wateringNumber.value = state.liters;
  render();
});

wateringNumber.addEventListener("input", () => {
  const v = parseFloat(wateringNumber.value.replace(",", "."));
  if (v > 0) {
    state.liters = v;
    render();
  }
});
wateringNumber.addEventListener("blur", render);

document.querySelectorAll("[data-liters]").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.liters = Number(btn.dataset.liters);
    wateringNumber.value = state.liters;
    render();
  })
);

$("downloadCsv").addEventListener("click", downloadCSV);

// ---- Init ----------------------------------------------------------------

loadState();
buildList();
buildSchedule();
render();
