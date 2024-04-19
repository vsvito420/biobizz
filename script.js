const weekInput = document.getElementById("week");
const wateringInput = document.getElementById("watering");
const calculateButton = document.getElementById("calculate");
const resultList = document.getElementById("resultList");
const results = document.getElementById("results");

const fertilizers = {
  rootJuice: { checked: true, mlPerL: [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  bioGrow: { checked: true, mlPerL: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0] },
  bioBloom: { checked: true, mlPerL: [0, 1, 2, 2, 3, 3, 4, 4, 4, 0, 0] },
  bioHeaven: { checked: true, mlPerL: [2, 2, 2, 3, 4, 4, 5, 5, 5, 0, 0] },
  topMax: { checked: true, mlPerL: [0, 1, 1, 1, 1, 4, 4, 4, 4, 0, 0] },
  actiVera: { checked: true, mlPerL: [2, 2, 2, 3, 4, 4, 5, 5, 5, 0, 0] },
};

calculateButton.addEventListener("click", () => {
  const week = parseInt(weekInput.value);
  const watering = parseInt(wateringInput.value);

  if (isNaN(week) || isNaN(watering)) {
    alert("Bitte geben Sie eine gültige Woche und Wassermenge ein.");
    return;
  }

  resultList.innerHTML = "";

  for (const [name, { checked, mlPerL }] of Object.entries(fertilizers)) {
    if (!checked) continue;

    const ml = (mlPerL[week] / 1000) * watering;
    const listItem = document.createElement("li");
    listItem.textContent = `${name}: ${ml.toFixed(2)} ml`;
    resultList.appendChild(listItem);
  }

  results.classList.remove("hidden");
});

for (const [name, { checked }] of Object.entries(fertilizers)) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = name;
  input.checked = checked;
  input.addEventListener("change", (e) => {
    fertilizers[e.target.id].checked = e.target.checked;
  });

  document.querySelector(`.fertilizers label[for="${name}"]`).appendChild(input);
}
