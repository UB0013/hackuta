
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const COLORS = ['#3498db', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c', '#e67e22', '#34495e']

function VisualizationPanel({ visualization, onClose, width = 450, onWidthChange }) {
  const [isResizing, setIsResizing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(width)
  const panelRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return

      const newWidth = startWidth + (e.clientX - startX)
      const minWidth = 350
      const maxWidth = window.innerWidth * 0.6

      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth)
      onWidthChange(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, startX, startWidth, onWidthChange])

  const handleResizeStart = (e) => {
    setIsResizing(true)
    setStartX(e.clientX)
    setStartWidth(width)
  }
  if (!visualization || !visualization.canVisualize) {
    return null
  }

  const renderChart = () => {
    switch (visualization.visualizationType) {
      case 'bar':
        return (
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={visualization.data}
                margin={{ top: 20, right: 30, left: 40, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={11}
                  interval={0}
                  label={{ 
                    value: visualization.xAxisLabel || 'Categories', 
                    position: 'insideBottom', 
                    offset: -10,
                    style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '600' }
                  }}
                />
                <YAxis 
                  label={{ 
                    value: visualization.yAxisLabel || 'Values', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fontSize: '12px', fontWeight: '600' }
                  }}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#3498db" />
              </BarChart>
            </ResponsiveContainer>
            {visualization.subtitle && (
              <div style={{
                textAlign: 'center',
                marginTop: '10px',
                fontSize: '14px',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                {visualization.subtitle}
              </div>
            )}
          </div>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={visualization.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {visualization.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={visualization.data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={11}
              />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3498db" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="no-chart">Chart type not supported</div>
    }
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: `${width}px`,
        backgroundColor: 'white',
        boxShadow: '2px 0 15px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        transition: isResizing ? 'none' : 'width 0.3s ease'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          {visualization.title}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            color: '#6b7280'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <X size={20} />
        </button>
      </div>

      {/* Chart Content */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflow: 'auto',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ flex: 1 }}>
          {renderChart()}
        </div>
        
        {/* Disclaimer Note */}
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '14px' }}>⚠️</span>
            <span>Note - Some graphical visualizations might not be meaningful</span>
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#3b82f6' : 'transparent',
          transition: 'background-color 0.2s'
        }}
        onMouseDown={handleResizeStart}
        onMouseEnter={(e) => {
          if (!isResizing) e.target.style.backgroundColor = '#e5e7eb'
        }}
        onMouseLeave={(e) => {
          if (!isResizing) e.target.style.backgroundColor = 'transparent'
        }}
      />
    </div>
  )
}

export default VisualizationPanel