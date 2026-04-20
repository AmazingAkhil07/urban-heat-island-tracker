import { useMemo } from 'react';

export default function TimelineControl({ forecastData, currentHour, onHourChange, isPlaying, onPlayToggle, timelineLength }) {
  const snapshots = forecastData || [];

  const maxTemp = useMemo(() => {
    if (!snapshots.length) return 40;
    return Math.max(...snapshots.map(s => s.heat_index || s.predicted_hi)) + 2;
  }, [snapshots]);
  
  const minTemp = useMemo(() => {
    if (!snapshots.length) return 20;
    return Math.min(...snapshots.map(s => s.heat_index || s.predicted_hi)) - 2;
  }, [snapshots]);

  // Points for the SVG visualization chart
  const points = useMemo(() => {
    if (!snapshots.length) return '';
    return snapshots.map((s, idx) => {
      const val = s.heat_index || s.predicted_hi;
      const x = (idx / (timelineLength - 1)) * 100;
      const y = 100 - ((val - minTemp) / (maxTemp - minTemp)) * 100;
      return `${x},${y}`;
    }).join(' ');
  }, [snapshots, minTemp, maxTemp, timelineLength]);

  if (!snapshots.length) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Awaiting temporal forecast stream.
      </div>
    );
  }

  const currentSnapshot = snapshots[currentHour];
  if (!currentSnapshot) return null;

  return (
    <div className="timeline-container" style={{ padding: '16px 24px', display: 'flex', gap: 32, alignItems: 'center' }}>
      <style>{`
        @media (max-width: 850px) {
          .timeline-container {
             gap: 16px !important;
             padding: 12px 16px !important;
          }
          .timeline-meta {
             min-width: unset !important;
          }
          .timeline-meta h2 {
             font-size: 18px !important;
          }
          .timeline-chart-container {
             display: none !important;
          }
        }
      `}</style>
      
      {/* Play Controls & Time */}
      <div className="timeline-meta" style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 200 }}>
        <button 
          onClick={onPlayToggle}
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: isPlaying ? 'var(--bg-secondary)' : 'var(--accent-blue)',
            border: isPlaying ? '1px solid var(--border)' : 'none',
            color: isPlaying ? '#fff' : '#000',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isPlaying ? 'inset 0 2px 4px rgba(0,0,0,0.5)' : '0 0 16px rgba(64,196,255,0.4)',
            transition: 'all 0.2s',
            paddingLeft: isPlaying ? 0 : 4 // optical center for play icon
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div>
          <div style={{ fontSize: 10, color: 'var(--accent-blue)', letterSpacing: '0.1em', fontWeight: 600 }}>T+{currentHour}H HORIZON</div>
          <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fff' }}>
            {new Date(currentSnapshot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {new Date(currentSnapshot.time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* SVG Timeline Chart + Input Slider */}
      <div className="timeline-chart-container" style={{ position: 'relative', flex: 1, height: 60, display: 'flex', alignItems: 'center' }}>
        
        {/* Background line chart */}
        <svg width="100%" height="80" preserveAspectRatio="none" style={{ position: 'absolute', top: -10, left: 0, opacity: 0.8 }}>
           <defs>
            <linearGradient id="chart-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#40c4ff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#40c4ff" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow">
               <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
               <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
               </feMerge>
            </filter>
          </defs>
          <polygon points={`0,100 ${points} 100,100`} fill="url(#chart-gradient)" />
          <polyline points={points} fill="none" stroke="var(--border-bright)" strokeWidth="1.5" filter="url(#glow)" />
          
          {/* Vertical indicator line for current hour */}
          <line
            x1={`${(currentHour / (timelineLength - 1)) * 100}%`}
            y1="0"
            x2={`${(currentHour / (timelineLength - 1)) * 100}%`}
            y2="100"
            stroke="#fff"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        </svg>

        {/* HTML Range Slider Overlay */}
        <input 
          type="range"
          min="0" max={timelineLength - 1}
          value={currentHour}
          onChange={e => onHourChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '100%',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 10
          }}
        />

        {/* Custom Range Thumb (CSS visual) */}
        <div style={{
          position: 'absolute',
          left: `calc(${(currentHour / (timelineLength - 1)) * 100}%)`,
          transform: 'translate(-50%, 0)',
          bottom: 10,
          pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 4
        }}>
          <div style={{
            padding: '3px 6px',
            background: currentSnapshot.color,
            color: '#000',
            fontWeight: 900,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            borderRadius: 4,
            boxShadow: `0 0 12px ${currentSnapshot.color}`
          }}>
            {(currentSnapshot.heat_index || currentSnapshot.predicted_hi).toFixed(1)}°
          </div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #fff' }} />
        </div>

        {/* Days markings along the bottom */}
        <div style={{ position: 'absolute', bottom: -16, width: '100%', display: 'flex', justifyContent: 'space-between', opacity: 0.5, pointerEvents: 'none' }}>
           {[...Array(Math.floor(timelineLength / 24) + 1)].map((_, i) => (
             <span key={i} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', position: 'absolute', left: `${(i*24 / (timelineLength - 1)) * 100}%`, transform: 'translateX(-50%)' }}>D+{i}</span>
           ))}
        </div>

      </div>
    </div>
  );
}
