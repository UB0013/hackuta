import { X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import RideMap from "./RideMap";

function MapPanel({
  mapLocations,
  selectedMarkerId,
  onMarkerClick,
  onClose,
  width = 450,
  onWidthChange,
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(width);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = startWidth + (e.clientX - startX);
      const minWidth = 350;
      const maxWidth = window.innerWidth * 0.6;

      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, startX, startWidth, onWidthChange]);

  const handleResizeStart = (e) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(width);
  };

  if (!mapLocations || mapLocations.length === 0) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: `${width}px`,
        backgroundColor: "white",
        boxShadow: "2px 0 15px rgba(0,0,0,0.1)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        transition: isResizing ? "none" : "width 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          Location Map
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
            color: "#6b7280",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#f3f4f6")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
        >
          <X size={20} />
        </button>
      </div>

      {/* Map Content */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "white",
        }}
      >
        {/* Horizontal Marker Bar */}
        {mapLocations.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              right: "20px",
              zIndex: 1000,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(10px)",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {mapLocations.map((location, index) => (
                <div
                  key={index}
                  onClick={() => onMarkerClick(index)}
                  style={{
                    backgroundColor:
                      selectedMarkerId === index ? "#4CAF50" : "white",
                    color: selectedMarkerId === index ? "white" : "#333",
                    border:
                      selectedMarkerId === index
                        ? "2px solid #4CAF50"
                        : "2px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      selectedMarkerId === index
                        ? "0 4px 12px rgba(76, 175, 80, 0.3)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    {location.name || "Location"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.8,
                      marginBottom: "6px",
                    }}
                  >
                    {location.address}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {location.category && (
                      <span
                        style={{
                          backgroundColor:
                            selectedMarkerId === index
                              ? "rgba(255,255,255,0.2)"
                              : "#f3f4f6",
                          color:
                            selectedMarkerId === index ? "white" : "#6b7280",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "10px",
                          fontWeight: "500",
                          textTransform: "uppercase",
                        }}
                      >
                        {location.category}
                      </span>
                    )}
                    <span
                      style={{
                        fontWeight: "600",
                        fontSize: "12px",
                      }}
                    >
                      {location.visits} visits
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        <div style={{ width: "100%", height: "100%" }}>
          <RideMap
            locations={mapLocations}
            selectedMarkerId={selectedMarkerId}
            onMarkerFocus={onMarkerClick}
          />
        </div>
      </div>

      {/* Resize Handle */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          cursor: "col-resize",
          backgroundColor: isResizing ? "#3b82f6" : "transparent",
          transition: "background-color 0.2s",
        }}
        onMouseDown={handleResizeStart}
        onMouseEnter={(e) => {
          if (!isResizing) e.target.style.backgroundColor = "#e5e7eb";
        }}
        onMouseLeave={(e) => {
          if (!isResizing) e.target.style.backgroundColor = "transparent";
        }}
      />
    </div>
  );
}

export default MapPanel;
