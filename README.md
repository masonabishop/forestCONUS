# Tracking Forest Cover Change Across the Lower 48

## Methodology
This project visualizes forest cover change across the continental United States from 2001 to 2021. The data is displayed on a choropleth map, allowing users to explore forest cover percentages by county. The project applies Jenks Natural Breaks for classification and includes a slider for interactive exploration of the data year by year. The user interface is designed to be responsive and intuitive for both mobile and desktop users.

The data was cleaned and processed in Google Sheets and integrated with Leaflet.js for mapping.

## Data Sources
- **County Boundaries:** U.S. Census GeoJSON files for county and state boundaries.
- **Environmental and Health Data:** Sourced from the [CDC's Environmental Public Health Tracking Network](https://ephtracking.cdc.gov/).

## Technology Stack
- **Data Processing:** Google Sheets
- **Mapping Library:** Leaflet.js
- **GeoJSON:** U.S. Counties and States GeoJSON files
- **Data Visualization:** Jenks Natural Breaks classification, UI slider for years 2001-2021
- **Styling:** Custom CSS for map interface and modal styling

## Conclusions and Insights
This project helps visualize the changing landscape of forest cover in the U.S. over two decades. By highlighting regional differences and changes over time, it provides insights into deforestation trends and could potentially guide policy and conservation efforts.

## View the Project
You can view the live version of the project here: [Forest Canopy Trends in the Contiguous United States](https://masonabishop.github.io/forestCONUS/)
