import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import RideMap from './components/RideMap'
import SimpleChatInterface from './components/SimpleChatInterface'
import VisualizationPanel from './components/VisualizationPanel'
import { analyzeResponseWithGemini } from './services/geminiAnalysisService'
import './index.css'

function App() {
  const [mapLocations, setMapLocations] = useState([])
  const [currentVisualization, setCurrentVisualization] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerWidth, setDrawerWidth] = useState(450)
  const [selectedMarkerId, setSelectedMarkerId] = useState(null)

  const closeVisualization = () => {
    setDrawerOpen(false)
    // Keep currentVisualization so we can reopen the drawer
  }

  const openDrawer = () => {
    setDrawerOpen(true)
  }

  const handleMarkerClick = (markerId) => {
    setSelectedMarkerId(markerId)
  }



  // Handle bot messages from webhook responses
  const handleBotMessage = async (message) => {
    setIsAnalyzing(true)

    try {
      // Send to Gemini for analysis
      const analysis = await analyzeResponseWithGemini(message)

      // Update visualizations based on analysis
      if (analysis.visualizationType === 'map' || analysis.visualizationType === 'both') {
        if (analysis.mapData && analysis.mapData.length > 0) {
          // Clear old markers and set new ones
          setMapLocations(analysis.mapData)
          // Reset selection to first marker
          setSelectedMarkerId(0)
        }
      } else if (analysis.visualizationType === 'chart') {
        // If only chart, clear map markers
        setMapLocations([])
        setSelectedMarkerId(null)
      }

      if (analysis.visualizationType === 'chart' || analysis.visualizationType === 'both') {
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
            reasoning: analysis.reasoning || 'Generated from bot response analysis'
          }
          setCurrentVisualization(visualizationData)
          setDrawerOpen(true)
        }
      }

    } catch (error) {
      console.error('Error analyzing bot message:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Fetii AI</h1>
      </header>

      <div className="main-content" style={{ height: 'calc(100vh - 80px)' }}>


        <div className="map-container" style={{ 
          width: '100%', 
          height: '100%',
          marginLeft: drawerOpen ? `${drawerWidth}px` : '0',
          transition: 'margin-left 0.3s ease',
          position: 'relative'
        }}>
          {/* Horizontal Marker Bar */}
          {mapLocations.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              zIndex: 1000,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '12px',
                paddingBottom: '4px'
              }}>
                {mapLocations.map((location, index) => (
                  <div
                    key={index}
                    onClick={() => handleMarkerClick(index)}
                    style={{
                      minWidth: '200px',
                      backgroundColor: selectedMarkerId === index ? '#4CAF50' : 'white',
                      color: selectedMarkerId === index ? 'white' : '#333',
                      border: selectedMarkerId === index ? '2px solid #4CAF50' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedMarkerId === index ? '0 4px 12px rgba(76, 175, 80, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedMarkerId !== index) {
                        e.target.style.borderColor = '#4CAF50'
                        e.target.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedMarkerId !== index) {
                        e.target.style.borderColor = '#e5e7eb'
                        e.target.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {location.name || 'Location'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      opacity: 0.8,
                      marginBottom: '6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {location.address}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      {location.category && (
                        <span style={{
                          backgroundColor: selectedMarkerId === index ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                          color: selectedMarkerId === index ? 'white' : '#6b7280',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '500',
                          textTransform: 'uppercase'
                        }}>
                          {location.category}
                        </span>
                      )}
                      <span style={{
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        {location.visits} visits
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <RideMap 
            locations={mapLocations} 
            selectedMarkerId={selectedMarkerId}
            onMarkerFocus={handleMarkerClick}
          />

          {/* Visualization Loading Overlay - positioned to not cover chat */}
          {isAnalyzing && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: '390px', // Leave space for chat (350px width + 40px margin)
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999, // Lower than chat's z-index of 1000
              backdropFilter: 'blur(2px)'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '32px 40px',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                textAlign: 'center',
                maxWidth: '400px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '16px',
                  lineHeight: '1.4'
                }}>
                  Plotting visualizations for you, hang tight
                </div>
                
                {/* Loading Spinner */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    animation: 'bounce 1.4s infinite ease-in-out'
                  }}></div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                  }}></div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                  }}></div>
                </div>

                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginTop: '12px'
                }}>
                  Analyzing data and geocoding locations...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Toggle Button */}
        {currentVisualization && !drawerOpen && (
          <button
            onClick={openDrawer}
            style={{
              position: 'fixed',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '0 8px 8px 0',
              padding: '15px 10px',
              cursor: 'pointer',
              zIndex: 1001,
              fontSize: '16px',
              boxShadow: '2px 0 10px rgba(0,0,0,0.2)'
            }}
          >
            📊
          </button>
        )}

        <SimpleChatInterface onMessageSent={handleBotMessage} isAnalyzing={isAnalyzing} />
      </div>

      {currentVisualization && drawerOpen && (
        <VisualizationPanel
          visualization={currentVisualization}
          onClose={closeVisualization}
          width={drawerWidth}
          onWidthChange={setDrawerWidth}
        />
      )}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)