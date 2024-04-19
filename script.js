// Get the elements from the DOM
const weekInput = document.getElementById("week"); // Input for week
const wateringInput = document.getElementById("watering"); // Input for watering
const calculateButton = document.getElementById("calculate"); // Button to calculate the result
const resultList = document.getElementById("resultList"); // List to display the result
const results = document.getElementById("results"); // Section to display the results

// Define an object containing the fertilizers with their properties
const fertilizers = {
  rootJuice: { checked: true, mlPerL: [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }, // rootJuice fertilizer
  bioGrow: { checked: true, mlPerL: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0] }, // bioGrow fertilizer
  bioBloom: { checked: true, mlPerL: [0, 1, 2, 2, 3, 3, 4, 4, 4, 0, 0] }, // bioBloom fertilizer
  bioHeaven: { checked: true, mlPerL: [2, 2, 2, 3, 4, 4, 5, 5, 5, 0, 0] }, // bioHeaven fertilizer
  topMax: { checked: true, mlPerL: [0, 1, 1, 1, 1, 4, 4, 4, 4, 0, 0] }, // topMax fertilizer
  actiVera: { checked: true, mlPerL: [2, 2, 2, 3, 4, 4, 5, 5, 5, 0, 0] }, // actiVera fertilizer
};

// Add an event listener to the calculate button
calculateButton.addEventListener("click", () => {
  const week = parseInt(weekInput.value); // Get the value of the week input
  const watering = parseInt(wateringInput.value); // Get the value of the watering input

  // Check if the inputs are valid numbers
  if (isNaN(week) || isNaN(watering)) {
    alert("Bitte geben Sie eine gültige Woche und Wassermenge ein."); // Display an error message if not
    return;
  }

  resultList.innerHTML = ""; // Clear the result list

  // Loop through the fertilizers
  for (const [name, { checked, mlPerL }] of Object.entries(fertilizers)) {
    if (!checked) continue; // Skip the fertilizer if it's not checked

    const ml = (mlPerL[week] / 1000) * watering; // Calculate the amount of fertilizer needed
    const listItem = document.createElement("li"); // Create a new list item
    listItem.textContent = `${name}: ${ml.toFixed(2)} ml`; // Set the text of the list item
    resultList.appendChild(listItem); // Add the list item to the result list
  }

  results.classList.remove("hidden"); // Show the results section
});

// Loop through the fertilizers
for (const [name, { checked }] of Object.entries(fertilizers)) {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = name;
  input.checked = checked;
  input.addEventListener("change", (e) => {
    fertilizers[e.target.id].checked = e.target.checked;
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
