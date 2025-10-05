import { useState } from "react";
import VisualizationChat from "./VisualizationChat";
import MapPanel from "./MapPanel";
import VisualizationPanel from "./VisualizationPanel";
import { analyzeResponseWithGemini } from "../services/geminiAnalysisService";

function VisualizationWidget() {
  const [mapLocations, setMapLocations] = useState([]);
  const [currentVisualization, setCurrentVisualization] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chartDrawerOpen, setChartDrawerOpen] = useState(false);
  const [chartDrawerWidth, setChartDrawerWidth] = useState(450);
  const [mapDrawerOpen, setMapDrawerOpen] = useState(false);
  const [mapDrawerWidth, setMapDrawerWidth] = useState(450);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);

  const closeChartDrawer = () => {
    setChartDrawerOpen(false);
  };

  const openChartDrawer = () => {
    setChartDrawerOpen(true);
  };

  const closeMapDrawer = () => {
    setMapDrawerOpen(false);
  };

  const openMapDrawer = () => {
    setMapDrawerOpen(true);
  };

  const handleMarkerClick = (markerId) => {
    setSelectedMarkerId(markerId);
  };

  // Handle bot messages from Flask backend responses
  const handleBotMessage = async (message) => {
    setIsAnalyzing(true);

    try {
      // Send to Gemini for analysis
      const analysis = await analyzeResponseWithGemini(message);

      // Update visualizations based on analysis
      if (
        analysis.visualizationType === "map" ||
        analysis.visualizationType === "both"
      ) {
        if (analysis.mapData && analysis.mapData.length > 0) {
          // Clear old markers and set new ones
          setMapLocations(analysis.mapData);
          // Reset selection to first marker
          setSelectedMarkerId(0);
          // Open map drawer
          setMapDrawerOpen(true);
        }
      } else if (analysis.visualizationType === "chart") {
        // If only chart, clear map markers
        setMapLocations([]);
        setSelectedMarkerId(null);
        setMapDrawerOpen(false);
      }

      if (
        analysis.visualizationType === "chart" ||
        analysis.visualizationType === "both"
      ) {
        if (analysis.chartData) {
          // Transform the data structure to match VisualizationPanel expectations
          const visualizationData = {
            canVisualize: true,
            visualizationType: analysis.chartData.type,
            title: analysis.chartData.title,
            subtitle: analysis.chartData.subtitle,
            xAxisLabel: analysis.chartData.xAxisLabel,
            yAxisLabel: analysis.chartData.yAxisLabel,
            data: analysis.chartData.data,
            reasoning:
              analysis.reasoning || "Generated from bot response analysis",
          };
          setCurrentVisualization(visualizationData);
          setChartDrawerOpen(true);
        }
      }
    } catch (error) {
      console.error("Error analyzing bot message:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "auto",
        marginBottom: "20px",
        overflow: "visible",
      }}
    >
      {/* Placeholder/Status Area */}
      <div
        style={{
          width: "100%",
          minHeight: "150px",
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "2px dashed #dee2e6",
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "15px",
        }}
      >
        {isAnalyzing ? (
          <>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Plotting visualizations for you, hang tight
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  animation: "bounce 1.4s infinite ease-in-out",
                }}
              ></div>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  animation: "bounce 1.4s infinite ease-in-out 0.2s",
                }}
              ></div>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  animation: "bounce 1.4s infinite ease-in-out 0.4s",
                }}
              ></div>
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Analyzing data and geocoding locations...
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: "16px", color: "#6c757d" }}>
              {mapLocations.length > 0 || currentVisualization
                ? "Visualizations ready! Click the buttons below to view."
                : "Ask a question below to generate visualizations"}
            </div>
            {(mapLocations.length > 0 || currentVisualization) && (
              <div style={{ display: "flex", gap: "12px" }}>
                {mapLocations.length > 0 && (
                  <button
                    onClick={openMapDrawer}
                    style={{
                      backgroundColor: mapDrawerOpen ? "#4CAF50" : "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "12px 24px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    🗺️ View Map ({mapLocations.length} locations)
                  </button>
                )}
                {currentVisualization && (
                  <button
                    onClick={openChartDrawer}
                    style={{
                      backgroundColor: chartDrawerOpen ? "#4CAF50" : "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "12px 24px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s ease",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    📊 View Chart
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat Interface */}
      <div>
        <VisualizationChat
          onMessageSent={handleBotMessage}
          isAnalyzing={isAnalyzing}
        />
      </div>

      {/* Map Panel Drawer */}
      {mapLocations.length > 0 && mapDrawerOpen && (
        <MapPanel
          mapLocations={mapLocations}
          selectedMarkerId={selectedMarkerId}
          onMarkerClick={handleMarkerClick}
          onClose={closeMapDrawer}
          width={mapDrawerWidth}
          onWidthChange={setMapDrawerWidth}
        />
      )}

      {/* Chart Panel Drawer */}
      {currentVisualization && chartDrawerOpen && (
        <VisualizationPanel
          visualization={currentVisualization}
          onClose={closeChartDrawer}
          width={chartDrawerWidth}
          onWidthChange={setChartDrawerWidth}
        />
      )}
    </div>
  );
}

export default VisualizationWidget;
