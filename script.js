// Get the elements from the DOM
const weekInput = document.getElementById("week");
const wateringInput = document.getElementById("watering");
const resultList = document.getElementById("resultList");
const results = document.getElementById("results");

// Define an object containing the fertilizers with their properties
const fertilizers = {
  rootJuice: { checked: true, mlPerL: [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  bioGrow: { checked: true, mlPerL: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0] },
  bioBloom: { checked: true, mlPerL: [0, 1, 2, 2, 3, 3, 4, 4, 4, 0, 0] },
  bioHeaven: { checked: true, mlPerL: [2, 2, 2, 3, 4, 4, 5, 5, 5, 0, 0] },
  topMax: { checked: true, mlPerL: [0, 1, 1, 1, 1, 4, 4, 4, 4, 0, 0] },
  actiVera: { checked: true, mlPerL: [2, 2, 2, 3, 4, 4, 5, 5, 5, 0, 0] },
};

// Calculation function
function calculate() {
  const week = parseInt(weekInput.value);
  const watering = parseInt(wateringInput.value);

  // Check if the inputs are valid numbers
  if (isNaN(week) || isNaN(watering)) {
    alert("Bitte geben Sie eine gültige Woche und Wassermenge ein.");
    return;
  }

  resultList.innerHTML = "";

  // Calculate the fertilizer amounts and display the results
  for (const [name, { checked, mlPerL }] of Object.entries(fertilizers)) {
    if (!checked) continue;

    const ml = (mlPerL[week] / 1000) * watering;
    const listItem = document.createElement("li");
    listItem.textContent = `${name}: ${ml.toFixed(2)} ml`;
    resultList.appendChild(listItem);
  }

  results.classList.remove("hidden");
}

// Event listeners for the input elements
weekInput.addEventListener("input", calculate);
wateringInput.addEventListener("input", calculate);

// Event listeners for the checkboxes
for (const [name, { checked }] of Object.entries(fertilizers)) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = name;
  input.checked = checked;
  input.addEventListener("input", (e) => {
    fertilizers[e.target.id].checked = e.target.checked;
    calculate();
  });

  const label = document.querySelector(`.fertilizers label[for="${name}"]`);
  label.parentNode.insertBefore(input, label.nextSibling);
}

// Get the week slider and display its value
const weekSlider = document.getElementById("week");
const weekValue = document.getElementById("weekValue");
weekValue.textContent = weekSlider.value;

// Update the displayed value when the slider value changes
weekSlider.addEventListener("input", () => {
  weekValue.textContent = weekSlider.value;
});

// Get the watering slider and display its value
const wateringSlider = document.getElementById("watering");
const wateringValue = document.getElementById("wateringValue");
wateringValue.textContent = wateringSlider.value;

// Update the displayed value when the slider value changes
wateringSlider.addEventListener("input", () => {
  wateringValue.textContent = wateringSlider.value;
});
