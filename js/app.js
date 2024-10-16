// Initialize the map
const map = L.map("map", { scrollWheelZoom: true }).setView([39.8283, -98.5795], 5);

// Define map panes
const addMapPanes = {
  tiles: {
    base: {
      url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
      options: {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        opacity: 0.7,
        pane: "bottom",
      },
    },
    labels: {
      url: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
      options: {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        pane: "labels",
      },
    },
  },
  panes: ["bottom", "data", "states", "labels"],
};

// Create map panes and z-index for layers
addMapPanes.panes.forEach((pane, i) => {
  map.createPane(pane);
  map.getPane(pane).style.zIndex = 401 + i;
});

// Add base and label tile layers
L.tileLayer(addMapPanes.tiles.base.url, addMapPanes.tiles.base.options).addTo(map);
L.tileLayer(addMapPanes.tiles.labels.url, addMapPanes.tiles.labels.options).addTo(map);

// Add the Info button functionality
document.getElementById("info-button").addEventListener("click", function () {
  document.getElementById("modal").style.display = "block";
});

// Close modal functionality
document.getElementById("close-modal").addEventListener("click", function () {
  document.getElementById("modal").style.display = "none";
});

window.onclick = function (event) {
  const modal = document.getElementById("modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Function to add state boundaries
function drawStateBoundaries(stateGeojson) {
  L.geoJson(stateGeojson, {
    style: {
      color: "#000", // State boundary color
      weight: 2,     // State boundary thickness
      fillOpacity: 0, // No fill color, just boundaries
      interactive: false, // Disable interaction with state boundaries
    },
    pane: "states", // Add to states pane
  }).addTo(map);
}

// Update map fill color based on the selected year
function updateMap(dataLayer, colorize, currentYear) {
  dataLayer.eachLayer(function (layer) {
    const props = layer.feature.properties.landData;
    const fillColor = props && props[currentYear] ? colorize(Number(props[currentYear])).hex() : "#555";
    layer.setStyle({ fillColor });
  });
}

// Create the slider UI and update display
function createSliderUI(dataLayer, colorize) {
  const slider = document.getElementById("year-slider");
  const yearDisplay = document.getElementById("current-year");
  slider.addEventListener("input", function (e) {
    const currentYear = e.target.value;
    yearDisplay.textContent = currentYear; // Update year display
    updateMap(dataLayer, colorize, currentYear);
  });
}

// Draw the map
function drawMap(counties, colorize) {
  const dataLayer = L.geoJson(counties, {
    style: function (feature) {
      return { color: "#36454F", weight: 0.5, fillOpacity: 0.7 };
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: function (e) {
          const layer = e.target;
          const props = feature.properties.landData;
          const currentYear = document.getElementById("year-slider").value;
          const countyName = feature.properties.County ? feature.properties.County : "Unknown"; // Fetch County from CSV
          const popupContent = `${countyName} County: ${
            props && props[currentYear] ? props[currentYear] + "%" : "No data"
          }`; // Display county name and data
          layer.bindTooltip(popupContent).openTooltip();
        },
        mouseout: function () {
          layer.closeTooltip();
        },
      });
    },
    pane: "data",
  }).addTo(map);

  createSliderUI(dataLayer, colorize);
  updateMap(dataLayer, colorize, "2001");
}

// Draw the legend
// Draw the legend
function drawLegend(breaks, colorize) {
  const legend = document.getElementById("legend");
  let legendHTML = "<strong>Forest Cover</strong><br/>";
  
  // Add each color break
  breaks.forEach((breakpoint, i) => {
    const next = breaks[i + 1];
    if (next) {
      legendHTML += `<span style="background:${colorize(breakpoint).hex()}"></span> ${breakpoint.toFixed(
        2
      )}% – ${next.toFixed(2)}%<br/>`;
    }
  });

  // Add "No Data" entry
  legendHTML += `<span style="background:#555"></span> No data<br/>`;

  // Set the legend HTML
  legend.innerHTML = legendHTML;
}


// Process data and join with GeoJSON
function processData(counties, data) {
  counties.features.forEach((county) => {
    const matchingRow = data.data.find((csvRow) => {
      return county.properties.GEOID === csvRow.CountyFIPS; // Match CountyFIPS with GEOID
    });

    if (matchingRow) {
      county.properties.landData = {
        2001: Number(matchingRow["2001"]),
        2006: Number(matchingRow["2006"]),
        2011: Number(matchingRow["2011"]),
        2016: Number(matchingRow["2016"]),
        2021: Number(matchingRow["2021"]),
      };
      county.properties.County = matchingRow.County; // Store the county name
    }
  });

  const landRates = [];
  counties.features.forEach((county) => {
    if (county.properties.landData) {
      Object.values(county.properties.landData).forEach((value) => landRates.push(value));
    }
  });

  const breaks = chroma.limits(landRates, "q", 5); // Quantile breaks
  const colorize = chroma.scale(chroma.brewer.BuGn).classes(breaks).mode("lab");

  drawMap(counties, colorize);
  drawLegend(breaks, colorize);
}

// Fetch GeoJSON and landcover CSV data
fetch("data/us-counties.json")
  .then((response) => response.json())
  .then((counties) => {
    Papa.parse("data/landcover.csv", {
      download: true,
      header: true,
      complete: function (data) {
        processData(counties, data);
      },
    });
  });

// Fetch state boundaries and draw them on the map
fetch("data/us_states_20m.geojson")
  .then((response) => response.json())
  .then((stateGeojson) => {
    drawStateBoundaries(stateGeojson);
  });
