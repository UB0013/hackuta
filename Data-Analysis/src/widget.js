import React from "react";
import ReactDOM from "react-dom/client";
import VisualizationWidget from "./components/VisualizationWidget";
import "./index.css";
import "leaflet/dist/leaflet.css";

// Make the widget available globally
window.initVisualizationWidget = function (elementId) {
  const container = document.getElementById(elementId);
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <VisualizationWidget />
      </React.StrictMode>
    );
  } else {
    console.error(`Element with id '${elementId}' not found`);
  }
};

// Auto-initialize if element exists
if (document.getElementById("visualization-widget-root")) {
  window.initVisualizationWidget("visualization-widget-root");
}
