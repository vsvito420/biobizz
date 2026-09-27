// Gieß-Tagebuch: Pflanzen und Gieß-Einträge, lokal im Browser gespeichert

const JOURNAL_KEY = "biobizz-journal-v1";
const PAGE_SIZE = 10;

const journal = {
  plants: [],
  entries: [],
  activePlant: null,
};

let visibleCount = PAGE_SIZE;

// ---- Speicher ------------------------------------------------------------

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadJournal() {
  try {
    const saved = JSON.parse(localStorage.getItem(JOURNAL_KEY));
    if (saved && Array.isArray(saved.plants) && Array.isArray(saved.entries)) {
      journal.plants = saved.plants;
      journal.entries = saved.entries;
      journal.activePlant = saved.activePlant;
    }
  } catch (_) { /* Speicher nicht verfügbar */ }
  if (!journal.plants.length) journal.plants.push({ id: uid(), name: "Meine Pflanze", start: "" });
  if (!journal.plants.some((p) => p.id === journal.activePlant)) journal.activePlant = journal.plants[0].id;
}

function saveJournal() {
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
  } catch (_) {
    alert("Speichern fehlgeschlagen – ist der Browser-Speicher voll oder deaktiviert?");
  }
}

// ---- Datum ---------------------------------------------------------------

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(fromISO, toISO) {
  return Math.round((parseISO(toISO) - parseISO(fromISO)) / 86400000);
}

function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function formatDate(iso) {
  return parseISO(iso).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

function relativeDays(n) {
  if (n === 0) return "heute";
  if (n === 1) return "gestern";
  if (n < 0) return `in ${-n} Tag${n === -1 ? "" : "en"}`;
  return `vor ${n} Tagen`;
}

// Woche laut Blütebeginn: davor Veg (0), danach 1..max
function weekFromStart(start, dateISO = todayISO()) {
  if (!start) return null;
  const days = daysBetween(start, dateISO);
  if (days < 0) return 0;
  return Math.min(WEEKS - 1, Math.floor(days / 7) + 1);
}

// ---- Helfer --------------------------------------------------------------

const activePlant = () => journal.plants.find((p) => p.id === journal.activePlant);
const plantEntries = () =>
  journal.entries
    .filter((e) => e.plantId === journal.activePlant)
    .sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---- DOM -----------------------------------------------------------------

const plantSelect = $("plantSelect");
const plantForm = $("plantForm");
const plantName = $("plantName");
const plantStart = $("plantStart");
const plantEditBtn = $("plantEdit");
const autoWeekEl = $("autoWeek");
const logForm = $("logForm");
const logDate = $("logDate");
const logNote = $("logNote");
const logSubmit = $("logSubmit");
const logSummary = $("logSummary");
const lastWatered = $("lastWatered");
const streakEl = $("streak");
const logList = $("logList");
const logMore = $("logMore");

function renderPlants() {
  plantSelect.innerHTML = journal.plants
    .map((p) => `<option value="${p.id}">${escapeHTML(p.name)}</option>`)
    .join("");
  plantSelect.value = journal.activePlant;
}

function openPlantForm(open) {
  plantForm.hidden = !open;
  plantEditBtn.setAttribute("aria-expanded", String(open));
  if (open) {
    const p = activePlant();
    plantName.value = p.name;
    plantStart.value = p.start || "";
    $("plantDelete").hidden = journal.plants.length < 2;
    plantName.focus();
  }
}

function renderAutoWeek() {
  const p = activePlant();
  const w = weekFromStart(p.start);
  if (w === null) {
    autoWeekEl.hidden = true;
    return;
  }
  autoWeekEl.hidden = false;
  const label = w === 0 ? "Vegetationsphase" : `Woche ${w}`;
  const days = daysBetween(p.start, todayISO());
  const info = days < 0 ? `Blüte startet ${relativeDays(days)}` : `Tag ${days + 1} der Blüte`;
  autoWeekEl.innerHTML = w === state.week
    ? `📅 ${info} · heute <strong>${label}</strong> ✓`
    : `📅 ${info} · heute <strong>${label}</strong> <button type="button" class="link-btn" id="applyWeek">übernehmen</button>`;
  const btn = $("applyWeek");
  if (btn) btn.addEventListener("click", () => { state.week = w; render(); });
}

function entryFertilizerText(e) {
  const parts = FERTILIZERS
    .filter((f) => e.ml[f.id] > 0)
    .map((f) => `<span class="chip" style="--c:${f.color}">${f.name} ${fmt(e.ml[f.id])} ml</span>`);
  return parts.length ? parts.join("") : `<span class="chip chip-water">nur Wasser</span>`;
}

function renderLog() {
  const entries = plantEntries();
  const today = todayISO();

  // Zuletzt gegossen
  if (entries.length) {
    const n = daysBetween(entries[0].date, today);
    lastWatered.textContent = `Zuletzt gegossen: ${relativeDays(n)}`;
    lastWatered.classList.toggle("warn", n >= 4);
  } else {
    lastWatered.textContent = "Noch nicht gegossen";
    lastWatered.classList.remove("warn");
  }

  // Button-Beschriftung passend zur aktuellen Mischung
  const total = FERTILIZERS.reduce((sum, f) => sum + (state.enabled[f.id] ? mlFor(f) : 0), 0);
  logSummary.textContent = total > 0
    ? `Wird eingetragen: ${fmt(state.liters)} L Wasser mit ${fmt(total)} ml Dünger (${state.week === 0 ? "Veg" : "Woche " + state.week}).`
    : `Wird eingetragen: ${fmt(state.liters)} L klares Wasser.`;
  const already = entries.some((e) => e.date === logDate.value);
  logSubmit.textContent = already ? "✓ Nochmal eintragen" : "✓ Gegossen";

  // Letzte 28 Tage
  const byDate = new Map();
  for (const e of entries) byDate.set(e.date, (byDate.get(e.date) || 0) + (e.total > 0 ? 2 : 1));
  let cells = "";
  for (let i = 27; i >= 0; i--) {
    const d = addDays(today, -i);
    const v = byDate.get(d) || 0;
    const cls = v >= 2 ? "fed" : v === 1 ? "water" : "";
    const title = `${formatDate(d)}: ${v >= 2 ? "gedüngt" : v === 1 ? "nur Wasser" : "nicht gegossen"}`;
    cells += `<span class="day ${cls}${i === 0 ? " today" : ""}" title="${title}"></span>`;
  }
  streakEl.innerHTML = `<div class="days">${cells}</div>
    <div class="legend"><span><i class="day fed"></i>gedüngt</span><span><i class="day water"></i>nur Wasser</span><span>letzte 28 Tage</span></div>`;

  // Liste
  if (!entries.length) {
    logList.innerHTML = `<li class="empty">Noch keine Einträge. Trag nach dem Gießen einfach „Gegossen“ ein.</li>`;
    logMore.hidden = true;
    return;
  }
  logList.innerHTML = entries.slice(0, visibleCount).map((e) => `
    <li class="log-item" data-id="${e.id}">
      <div class="log-top">
        <span class="log-when">${formatDate(e.date)} <small>${relativeDays(daysBetween(e.date, today))}</small></span>
        <span class="log-amount">${fmt(e.liters)} L${e.total > 0 ? ` · ${fmt(e.total)} ml` : ""}</span>
        <button type="button" class="icon-btn small delete" title="Eintrag löschen" aria-label="Eintrag löschen">✕</button>
      </div>
      <div class="log-meta"><span class="chip chip-week">${e.week === 0 ? "Veg" : "W" + e.week}</span>${entryFertilizerText(e)}</div>
      ${e.note ? `<p class="log-note-text">${escapeHTML(e.note)}</p>` : ""}
    </li>`).join("");
  logMore.hidden = entries.length <= visibleCount;
  logMore.textContent = `Mehr anzeigen (${entries.length - visibleCount} weitere)`;
}

function journalRender() {
  renderAutoWeek();
  renderLog();
}

// ---- Aktionen ------------------------------------------------------------

function addEntry() {
  const ml = {};
  let total = 0;
  for (const f of FERTILIZERS) {
    const v = state.enabled[f.id] ? Math.round(mlFor(f) * 100) / 100 : 0;
    ml[f.id] = v;
    total += v;
  }
  journal.entries.push({
    id: uid(),
    plantId: journal.activePlant,
    date: logDate.value || todayISO(),
    created: Date.now(),
    week: state.week,
    liters: state.liters,
    ml,
    total: Math.round(total * 100) / 100,
    note: logNote.value.trim(),
  });
  saveJournal();
  logNote.value = "";
  renderLog();
  logSubmit.classList.add("done");
  setTimeout(() => logSubmit.classList.remove("done"), 700);
}

function deleteEntry(id) {
  const e = journal.entries.find((x) => x.id === id);
  if (!e || !confirm(`Eintrag vom ${formatDate(e.date)} löschen?`)) return;
  journal.entries = journal.entries.filter((x) => x.id !== id);
  saveJournal();
  renderLog();
}

function switchPlant(id) {
  journal.activePlant = id;
  visibleCount = PAGE_SIZE;
  saveJournal();
  const w = weekFromStart(activePlant().start);
  if (w !== null) state.week = w;
  renderPlants();
  openPlantForm(false);
  render();
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportLogCSV() {
  const header = ["Pflanze", "Datum", "Woche", "Wasser (L)", ...FERTILIZERS.map((f) => `${f.name} (ml)`), "Gesamt (ml)", "Notiz"];
  const rows = [...journal.entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const plant = journal.plants.find((p) => p.id === e.plantId);
      return [plant ? plant.name : "?", e.date, e.week, e.liters, ...FERTILIZERS.map((f) => e.ml[f.id] || 0), e.total, e.note]
        .map((v) => {
          const s = String(v ?? "");
          return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        });
    });
  const csv = "﻿" + [header, ...rows].map((r) => r.join(";")).join("\n");
  download(`biobizz-tagebuch-${todayISO()}.csv`, csv, "text/csv;charset=utf-8");
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.plants) || !Array.isArray(data.entries) || !data.plants.length) throw new Error();
      const merge = journal.entries.length > 0 && confirm(
        "Backup mit vorhandenen Daten zusammenführen?\n\nOK = zusammenführen\nAbbrechen = vorhandene Daten ersetzen"
      );
      if (merge) {
        const plantIds = new Set(journal.plants.map((p) => p.id));
        const entryIds = new Set(journal.entries.map((e) => e.id));
        journal.plants.push(...data.plants.filter((p) => !plantIds.has(p.id)));
        journal.entries.push(...data.entries.filter((e) => !entryIds.has(e.id)));
      } else {
        journal.plants = data.plants;
        journal.entries = data.entries;
        journal.activePlant = data.activePlant;
      }
      if (!journal.plants.some((p) => p.id === journal.activePlant)) journal.activePlant = journal.plants[0].id;
      saveJournal();
      renderPlants();
      render();
      alert(`Backup geladen: ${data.entries.length} Einträge.`);
    } catch (_) {
      alert("Die Datei ist kein gültiges Backup.");
    }
  };
  reader.readAsText(file);
}

// ---- Events --------------------------------------------------------------

plantSelect.addEventListener("change", () => switchPlant(plantSelect.value));

$("plantAdd").addEventListener("click", () => {
  const name = prompt("Name der neuen Pflanze:", `Pflanze ${journal.plants.length + 1}`);
  if (!name || !name.trim()) return;
  const p = { id: uid(), name: name.trim().slice(0, 40), start: "" };
  journal.plants.push(p);
  switchPlant(p.id);
  openPlantForm(true);
});

plantEditBtn.addEventListener("click", () => openPlantForm(plantForm.hidden));

plantForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const p = activePlant();
  p.name = plantName.value.trim().slice(0, 40) || p.name;
  p.start = plantStart.value;
  saveJournal();
  switchPlant(p.id);
});

$("plantDelete").addEventListener("click", () => {
  const p = activePlant();
  const count = journal.entries.filter((e) => e.plantId === p.id).length;
  if (!confirm(`„${p.name}“ und ${count} Einträge löschen?`)) return;
  journal.plants = journal.plants.filter((x) => x.id !== p.id);
  journal.entries = journal.entries.filter((e) => e.plantId !== p.id);
  switchPlant(journal.plants[0].id);
});

logForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addEntry();
});

logDate.addEventListener("change", renderLog);

logList.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete");
  if (btn) deleteEntry(btn.closest(".log-item").dataset.id);
});

logMore.addEventListener("click", () => {
  visibleCount += PAGE_SIZE;
  renderLog();
});

$("exportJson").addEventListener("click", () =>
  download(`biobizz-backup-${todayISO()}.json`, JSON.stringify(journal, null, 2), "application/json")
);
$("exportLogCsv").addEventListener("click", exportLogCSV);
$("importJson").addEventListener("change", (e) => {
  if (e.target.files[0]) importJSON(e.target.files[0]);
  e.target.value = "";
});

// ---- Init ----------------------------------------------------------------

loadJournal();
logDate.value = todayISO();
logDate.max = todayISO();
renderPlants();
journalRender();
