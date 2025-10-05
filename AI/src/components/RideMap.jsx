import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet'
import { useEffect, useRef } from 'react'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const getCategoryColor = (category) => {
  const colors = {
    'Music Venue': '#9b59b6',
    'Restaurant': '#e74c3c',
    'Entertainment': '#f39c12',
    'Recreation': '#27ae60',
    'Event Space': '#3498db',
    'Park': '#2ecc71',
    'Festival': '#e67e22',
    'Brewery': '#d35400',
    'Shopping': '#8e44ad',
    'Sports': '#c0392b',
    'Scenic': '#16a085',
    'Education': '#2980b9',
    'Transportation': '#34495e'
  }
  return colors[category] || '#95a5a6'
}

const createCustomIcon = (visits) => {
  const getColor = (visits) => {
    if (visits >= 200) return '#e74c3c'
    if (visits >= 150) return '#f39c12'
    if (visits >= 100) return '#f1c40f'
    if (visits >= 50) return '#3498db'
    return '#95a5a6'
  }

  const getSize = (visits) => {
    if (visits >= 200) return [50, 50]
    if (visits >= 150) return [45, 45]
    if (visits >= 100) return [40, 40]
    if (visits >= 50) return [35, 35]
    return [30, 30]
  }

  const color = getColor(visits)
  const [width, height] = getSize(visits)
  const fontSize = width > 40 ? '14px' : width > 35 ? '13px' : width > 30 ? '12px' : '11px'
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
      width: ${width}px;
      height: ${height}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${fontSize};
      position: relative;
    ">${visits}</div>`,
    iconSize: [width, height],
    iconAnchor: [width/2, height/2]
  })
}

// Component to handle map focusing and zoom control cleanup
function MapController({ locations, selectedMarkerId, onMarkerFocus, markerRefs }) {
  const map = useMap()

  useEffect(() => {
    // Remove any existing zoom controls from top-left
    const zoomControls = document.querySelectorAll('.leaflet-control-zoom')
    zoomControls.forEach(control => {
      if (control.parentElement?.classList.contains('leaflet-top') && 
          control.parentElement?.classList.contains('leaflet-left')) {
        control.remove()
      }
    })
  }, [])

  useEffect(() => {
    if (locations && locations.length > 0) {
      // Focus on the first marker when new locations are loaded
      const firstLocation = locations[0]
      if (firstLocation.lat && firstLocation.lng) {
        map.setView([firstLocation.lat, firstLocation.lng], 14, {
          animate: true,
          duration: 1
        })
        // Don't call onMarkerFocus here - let App.jsx handle the selection
      }
    }
  }, [locations, map])

  useEffect(() => {
    // Focus on selected marker when selectedMarkerId changes
    if (selectedMarkerId !== null && locations && locations[selectedMarkerId]) {
      const selectedLocation = locations[selectedMarkerId]
      if (selectedLocation.lat && selectedLocation.lng) {
        // Close all existing popups first
        markerRefs.current.forEach(marker => {
          if (marker) {
            marker.closePopup()
          }
        })
        
        map.setView([selectedLocation.lat, selectedLocation.lng], 15, {
          animate: true,
          duration: 0.8
        })
        
        // Open popup for selected marker after a short delay
        setTimeout(() => {
          const marker = markerRefs.current[selectedMarkerId]
          if (marker) {
            marker.openPopup()
          }
        }, 1000) // Wait for map animation to complete
      }
    }
  }, [selectedMarkerId, locations, map])

  return null
}

function RideMap({ locations = [], selectedMarkerId, onMarkerFocus }) {
  const austinCenter = [30.2672, -97.7431]
  const markerRefs = useRef([])
  
  return (
    <MapContainer
      center={austinCenter}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      maxBounds={[
        [30.0000, -98.0000],
        [30.6000, -97.4000]
      ]}
      minZoom={10}
      maxZoom={16}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController 
        locations={locations} 
        selectedMarkerId={selectedMarkerId}
        onMarkerFocus={onMarkerFocus}
        markerRefs={markerRefs}
      />
      <ZoomControl position="bottomleft" />
      
      {locations.map((location, index) => (
        <Marker
          key={index}
          ref={(ref) => {
            markerRefs.current[index] = ref
          }}
          position={[location.lat, location.lng]}
          icon={createCustomIcon(location.visits)}
          eventHandlers={{
            click: () => {
              if (onMarkerFocus) {
                onMarkerFocus(index)
              }
            },
            mouseover: (e) => {
              // Close all other popups first
              markerRefs.current.forEach((marker, idx) => {
                if (marker && idx !== index) {
                  marker.closePopup()
                }
              })
              e.target.openPopup()
            },
            mouseout: (e) => {
              e.target.closePopup()
            }
          }}
        >
          <Popup closeButton={false} autoClose={false} closeOnClick={false}>
            <div className="location-popup">
              <h3>{location.name || 'Location'}</h3>
              <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                {location.address}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {location.category && (
                  <span style={{ 
                    background: getCategoryColor(location.category), 
                    color: 'white', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '12px', 
                    fontSize: '0.7rem',
                    textTransform: 'uppercase'
                  }}>
                    {location.category}
                  </span>
                )}
                <div className="visit-count">{location.visits} visits</div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default RideMap