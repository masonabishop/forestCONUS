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

// Create map panes
addMapPanes.panes.forEach((pane, i) => {
  map.createPane(pane);
  map.getPane(pane).style.zIndex = 401 + i;
});

// Add base and label tile layers
L.tileLayer(addMapPanes.tiles.base.url, addMapPanes.tiles.base.options).addTo(map);
L.tileLayer(addMapPanes.tiles.labels.url, addMapPanes.tiles.labels.options).addTo(map);

// Add the Info button
document.getElementById("info-button").addEventListener("click", function () {
  document.getElementById("modal").style.display = "block";
});

// Close modal with the close button
document.getElementById("close-modal").addEventListener("click", function () {
  document.getElementById("modal").style.display = "none";
});

// Close the modal when clicking outside modal
map.on("click", function () {
  const modal = document.getElementById("modal");
  if (modal.style.display === "block") {
    modal.style.display = "none";
  }
});

// Function to calculate the difference in forest cover from 2001
// Generated from ChatGPT, 10/16/2024, OpenA!, https://chat.openai.com
function calculateDifferenceFrom2001(props, currentYear) {
  const cover2001 = props && props["2001"] ? Number(props["2001"]) : null;
  const coverCurrent = props && props[currentYear] ? Number(props[currentYear]) : null;

  if (cover2001 !== null && coverCurrent !== null) {
    const difference = coverCurrent - cover2001;
    return difference.toFixed(2);
  }
  return "No data";
}

// Function to calculate the difference from the previous 5 years; 
// Generated from ChatGPT, 10/16/2024, OpenA!, https://chat.openai.com
function calculateDifferenceFromPrevious5Years(props, currentYear) {
  const previousYear = (parseInt(currentYear) - 5).toString();
  const coverPrevious = props && props[previousYear] ? Number(props[previousYear]) : null;
  const coverCurrent = props && props[currentYear] ? Number(props[currentYear]) : null;

  if (coverPrevious !== null && coverCurrent !== null) {
    const difference = coverCurrent - coverPrevious;
    return difference.toFixed(2);
  }
  return "No data";
}

// Update map fill color based on the selected year
function updateMap(dataLayer, colorize, currentYear) {
  dataLayer.eachLayer(function (layer) {
    const props = layer.feature.properties.landData;
    const value = props && props[currentYear] ? Number(props[currentYear]) : null;

    const fillColor = value !== null && !isNaN(value)
      ? colorize(value).hex()
      : "#555";

    layer.setStyle({ fillColor });
  });
}

// Function to add state boundaries
function drawStateBoundaries(stateGeojson) {
  L.geoJson(stateGeojson, {
    style: {
      color: "#000",
      weight: 2,
      fillOpacity: 0,
      interactive: false,
    },
    pane: "states",
  }).addTo(map);
}

// Draw the map
function drawMap(counties, colorize) {
  const dataLayer = L.geoJson(counties, {
    style: function (feature) {
      const hasData = feature.properties.landData && feature.properties.landData["2001"];
      return {
        color: "#36454F",
        weight: 0.5,
        fillOpacity: 0.7,
        fillColor: hasData ? colorize(Number(feature.properties.landData["2001"])).hex() : "#555" // Gray for "no data"
      };
    },
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseover: function (e) {
          const layer = e.target;
          const props = feature.properties.landData;
          const currentYear = document.getElementById("year-slider").value;
          const countyName = feature.properties.County ? feature.properties.County : "Unknown"; // Fetch County name

          // Calculate the difference from 2001 and from previous 5 years
          const differenceFrom2001 = calculateDifferenceFrom2001(props, currentYear);
          const differenceFromPrevious5Years = calculateDifferenceFromPrevious5Years(props, currentYear);

          // Ensure percentages are shown correctly or display "No Data"
          const differenceFrom2001Display = isNaN(differenceFrom2001) || differenceFrom2001 === "No data"
            ? differenceFrom2001
            : `${differenceFrom2001}%`;

          const differenceFromPrevious5YearsDisplay = isNaN(differenceFromPrevious5Years) || differenceFromPrevious5Years === "No data"
            ? differenceFromPrevious5Years
            : `${differenceFromPrevious5Years}%`;

          // Tooltip content
          const popupContent = `
            <strong>${countyName} County</strong><br/>
            Forest Cover in ${currentYear}: ${props && props[currentYear] ? props[currentYear] + "%" : "No data"}<br/>
            Difference in Forest Cover from 2001: ${differenceFrom2001Display}<br/>
            Difference in Forest Cover from 5 Years Ago: ${differenceFromPrevious5YearsDisplay}
          `;

          // Bind the tooltip with the content
          layer.bindTooltip(popupContent).openTooltip();

          // Highlight the county on hover
          layer.setStyle({
            weight: 3,
            color: '#666',
            fillOpacity: 0.9
          });

          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
          }
        },
        mouseout: function (e) {
          const layer = e.target;
          layer.closeTooltip();

          // Revert to the original style after hover
          layer.setStyle({
            weight: 0.5,
            color: "#36454F",
            fillOpacity: 0.7
          });
        }
      });
    },
    pane: "data",
  }).addTo(map);

  createSliderUI(dataLayer, colorize);
  updateMap(dataLayer, colorize, "2001");
}

// Function to create the slider UI and update display
function createSliderUI(dataLayer, colorize) {
  const slider = document.getElementById("year-slider");
  const yearDisplay = document.getElementById("current-year");
  
  slider.addEventListener("input", function (e) {
    const currentYear = e.target.value;
    yearDisplay.textContent = currentYear;
    updateMap(dataLayer, colorize, currentYear);
  });
}

// Draw the legend
function drawLegend(breaks, colorize) {
  const legend = document.getElementById("legend");
  let legendHTML = "<h3>Forest Cover</h3><br/>";

  // Add each color break
  breaks.forEach((breakpoint, i) => {
    const next = breaks[i + 1];
    if (next) {
      legendHTML += `<span style="background:${colorize(breakpoint).hex()}"></span> 
        ${breakpoint.toFixed(2)}% – ${next.toFixed(2)}%<br/>`;
    }
  });

  // Add "No Data" entry
  legendHTML += `<span style="background:#555"></span> No data<br/>`;

  // Set the legend HTML
  legend.innerHTML = legendHTML;

  legend.addTo(map);
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
      county.properties.County = matchingRow.County;
    }
  });

  const landRates = [];
  counties.features.forEach((county) => {
    if (county.properties.landData) {
      Object.values(county.properties.landData).forEach((value) => landRates.push(value));
    }
  });

  // Use Jenks Natural Breaks (k)
  const breaks = chroma.limits(landRates, "k", 5);
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
