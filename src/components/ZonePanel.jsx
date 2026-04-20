import { useMemo } from 'react';

function ZoneRow({ zone, isSelected, onClick, predictionData }) {
  const isCritical = zone.level === 'CRITICAL';
  
  // If we have prediction data, grab the max predicted temp for this zone
  let maxTemp = zone.heat_index;
  let sparklinePts = '';
  
  if (predictionData && predictionData.zone_forecasts && predictionData.zone_forecasts[zone.id]) {
      const zf = predictionData.zone_forecasts[zone.id];
      maxTemp = Math.max(...zf.map(h => h.predicted_hi));
      
      // Generate miniature sparkline path
      const minT = Math.min(...zf.map(h => h.predicted_hi));
      const range = Math.max(1, maxTemp - minT);
      
      sparklinePts = zf.map((h, i) => {
         const x = (i / zf.length) * 40;
         const y = 20 - ((h.predicted_hi - minT) / range) * 20;
         return `${x},${y}`;
      }).join(' ');
  }
  
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        cursor: 'pointer',
        background: isSelected ? 'rgba(64,196,255,0.1)' : 'transparent',
        borderLeft: isSelected ? `3px solid ${zone.color}` : '3px solid transparent',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: zone.color,
        boxShadow: `0 0 10px ${zone.color}88`,
        animation: isCritical ? 'pulse-critical 1.5s infinite' : 'none',
      }} />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>{zone.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
           <span>{zone.temperature}°C base</span>
           {predictionData && <span style={{ color: '#ff6d00' }}>Peak: {maxTemp.toFixed(1)}°</span>}
        </div>
      </div>

      {/* Sparkline (if prediction data exists) */}
      {predictionData && (
          <div style={{ width: 40, height: 20 }}>
             <svg width="40" height="20" style={{ overflow: 'visible' }}>
                 <polyline points={sparklinePts} fill="none" stroke={zone.color} strokeWidth="1.5" opacity="0.8" />
             </svg>
          </div>
      )}

      <div style={{ textAlign: 'right', width: 60 }}>
        <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: zone.color }}>
          {zone.heat_index.toFixed(1)}°
        </div>
        <span className={`badge badge-${zone.level}`}>{zone.level}</span>
      </div>
    </div>
  );
}

export default function ZonePanel({ cityData, zones, selectedZone, onZoneSelect, isPredicting, onRunPrediction, predictionData }) {
  const sortedZones = useMemo(() => {
    if (!zones) return [];
    
    // Sort logic depends on predictionData availability
    return [...zones].sort((a, b) => {
       let valA = a.heat_index;
       let valB = b.heat_index;
       if (predictionData && predictionData.zone_forecasts) {
           const zfA = predictionData.zone_forecasts[a.id];
           const zfB = predictionData.zone_forecasts[b.id];
           if(zfA && zfB) {
              valA = Math.max(...zfA.map(h => h.predicted_hi));
              valB = Math.max(...zfB.map(h => h.predicted_hi));
           }
       }
       return valB - valA;
    });
  }, [zones, predictionData]);

  if (!cityData || !zones) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Awaiting orbital targeting
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search Result Overview + Predict Button */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
           <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
                SURFACE GRID ARRAY
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {zones.length} active nodes targeting {cityData.name}
              </div>
           </div>
        </div>
        
        <button 
          onClick={onRunPrediction}
          disabled={isPredicting}
          style={{
            width: '100%',
            background: isPredicting ? 'var(--bg-card)' : 'rgba(255,23,68,0.1)',
            border: isPredicting ? '1px solid var(--border)' : '1px solid rgba(255,23,68,0.3)',
            borderRadius: 6, padding: '12px 16px', 
            color: isPredicting ? 'var(--text-muted)' : '#ff1744',
            fontWeight: 800, fontSize: 12, cursor: isPredicting ? 'wait' : 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', letterSpacing: '0.1em',
            boxShadow: isPredicting ? 'none' : 'inset 0 0 12px rgba(255,23,68,0.1)'
          }}
          onMouseEnter={e => { if(!isPredicting) { e.target.style.background='rgba(255,23,68,0.15)'; e.target.style.boxShadow='inset 0 0 20px rgba(255,23,68,0.2)'; } }}
          onMouseLeave={e => { if(!isPredicting) { e.target.style.background='rgba(255,23,68,0.1)'; e.target.style.boxShadow='inset 0 0 12px rgba(255,23,68,0.1)'; } }}
        >
          {isPredicting ? 'PROCESSING MATRICES...' : 'INITIATE 15-DAY PREDICTION ENGINE'}
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sortedZones.map((zone) => (
          <ZoneRow 
            key={zone.id} 
            zone={zone} 
            isSelected={selectedZone?.id === zone.id}
            onClick={() => onZoneSelect(zone)}
            predictionData={predictionData}
          />
        ))}
      </div>

      {/* Selected Detail */}
      {selectedZone && (
        <div className="animate-fade-in" style={{
          padding: '16px',
          background: 'rgba(6,10,20,0.95)',
          borderTop: '1px solid var(--border)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: selectedZone.color, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>LOC: {selectedZone.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: {selectedZone.id.toString().padStart(4, '0')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>HUMIDITY</div>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedZone.humidity}%</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>WIND SPEED</div>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedZone.wind_speed} <span style={{fontSize: 10}}>km/h</span></div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SURFACE TEMP</div>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedZone.surface_temp}°C</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PRECIPITATION</div>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedZone.precipitation} <span style={{fontSize: 10}}>mm</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
