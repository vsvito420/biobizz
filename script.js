// Get the elements from the DOM
const weekInput = document.getElementById("week");
const wateringInput = document.getElementById("watering");
const resultItems = document.querySelectorAll(".fertilizer-item .result");

// Define an object containing the fertilizers with their properties
const fertilizers = {
  rootJuice: { checked: true, mlPerL: [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  bioGrow: { checked: true, mlPerL: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0] },
  bioBloom: { checked: true, mlPerL: [0, 1, 2, 2, 3, 3, 4, 4, 4, 0, 0] },
  bioHeaven: { checked: true, mlPerL: [2, 2, 2, 3, 4, 4, 5, 5, 5, 0, 0] },
  topMax: { checked: true, mlPerL: [0, 1, 1, 1, 1, 4, 4, 4, 4, 0, 0] },
  actiVera: { checked: true, mlPerL: [2, 2, 2, 3, 4, 4, 5, 5, 5, 0, 0] },
};

function convertToCSV() {
  let csv = 'Name,Checked,mlPerL\n';
  for (const [name, { checked, mlPerL }] of Object.entries(fertilizers)) {
    csv += `${name},${checked},${mlPerL.join(',')}\n`;
  }
  return csv;
}

function downloadCSV() {
  const csv = convertToCSV();
  const link = document.createElement('a');
  link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  link.target = '_blank';
  link.download = 'calculation.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// Calculation function
function calculate() {
  const week = parseInt(weekInput.value);
  const watering = parseInt(wateringInput.value);

  // Check if the inputs are valid numbers
  if (isNaN(week) || isNaN(watering)) {
    alert("Bitte geben Sie eine gültige Woche und Wassermenge ein.");
    return;
  }

  // Calculate the fertilizer amounts and display the results
  for (const [name, { checked, mlPerL }] of Object.entries(fertilizers)) {
    if (!checked) continue;

    const ml = (mlPerL[week] / 1000) * watering;
    const resultItem = document.querySelector(`.fertilizer-item input[id="${name}"] + label + .result`);
    resultItem.textContent = `${ml.toFixed(2)} ml`;
  }
}

// Event listeners for the input elements
weekInput.addEventListener("input", calculate);
wateringInput.addEventListener("input", calculate);

// Event listeners for the checkboxes
for (const [name, { checked }] of Object.entries(fertilizers)) {
  const input = document.querySelector(`.fertilizer-item input[id="${name}"]`);
  input.checked = checked;
  input.addEventListener("input", (e) => {
    fertilizers[e.target.id].checked = e.target.checked;
    calculate();
  });
}

// Get the week slider and display its value
const weekSlider = document.getElementById("week");
const weekValue = document.getElementById("weekValue");
weekValue.textContent = weekSlider.value;

// Update the displayed value when the slider value changes
weekSlider.addEventListener("input", () => {
  weekValue.textContent = weekSlider.value;
  calculate();
});

// Get the watering slider and display its value
const wateringSlider = document.getElementById("watering");
const wateringValue = document.getElementById("wateringValue");
wateringValue.textContent = wateringSlider.value;

// Update the displayed value when the slider value changes
wateringSlider.addEventListener("input", () => {
  wateringValue.textContent = wateringSlider.value;
  calculate();
});

calculate();

