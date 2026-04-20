export default function ForecastCard({ forecast, currentHour, metrics }) {
  if (!forecast || !forecast[currentHour]) return null;

  const currentData = forecast[currentHour];
  
  // Predict trend for next 6 hours (if available)
  let trend = 'Stable';
  let trendIcon = '—';
  let trendColor = 'var(--text-muted)';
  
  if (currentHour + 6 < forecast.length) {
     const futureHI = forecast[currentHour + 6].predicted_hi || forecast[currentHour + 6].heat_index;
     const currentHI = currentData.predicted_hi || currentData.heat_index;
     
     if (futureHI - currentHI > 2) {
        trend = 'Rising Fast';
        trendIcon = '↑';
        trendColor = '#ff1744';
     } else if (futureHI - currentHI > 0.5) {
        trend = 'Warming';
        trendIcon = '↗';
        trendColor = '#ff6d00';
     } else if (currentHI - futureHI > 1.5) {
        trend = 'Cooling';
        trendIcon = '↓';
        trendColor = '#40c4ff';
     }
  }

  const pillStyle = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '100px',
    padding: '8px 24px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    gap: 16
  };

  return (
    <div className="animate-fade-in forecast-container" style={{
      display: 'flex',
      gap: 16,
      alignItems: 'center',
    }}>
      <style>{`
        @media (max-width: 850px) {
          .forecast-container {
             flex-direction: column !important;
             gap: 8px !important;
             align-items: flex-start !important;
             padding-left: 20px;
          }
          .forecast-pill-secondary {
             display: none !important;
          }
        }
      `}</style>

       {/* 1. Primary Stat Pill */}
       <div style={pillStyle}>
          <div style={{
             width: 32, height: 32, borderRadius: '50%',
             background: currentData.color,
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             boxShadow: `0 0 16px ${currentData.color}88`,
             animation: currentData.level === 'CRITICAL' ? 'pulse-critical 1.5s infinite' : 'none',
             fontSize: 14
          }}>
             {currentData.level === 'CRITICAL' ? '⚠️' : '🌡️'}
          </div>
          <div>
             <div style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Heat Index</div>
             <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                 <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-mono)', color: currentData.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {(currentData.predicted_hi || currentData.heat_index).toFixed(1)}°C
                 </div>
                 <div style={{ fontSize: 11, color: trendColor, fontWeight: 700 }}>{trendIcon} {trend}</div>
             </div>
          </div>
       </div>

       {/* 2. Model Confidence Pill */}
       {metrics.hasPredictions && currentData.confidence && (
         <div style={pillStyle} className="forecast-pill-secondary">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
               <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Confidence</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <div style={{ width: 40, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                     <div style={{ 
                        height: '100%', 
                        width: `${currentData.confidence * 100}%`, 
                        background: currentData.confidence > 0.8 ? '#00e5aa' : (currentData.confidence > 0.5 ? '#ffd600' : '#ff1744')
                     }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{(currentData.confidence * 100).toFixed(0)}%</span>
               </div>
            </div>
         </div>
       )}

       {/* 3. Hotspots Pill */}
       <div style={pillStyle} className="forecast-pill-secondary">
          <div>
             <div style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Hotspots</div>
             <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                 <span style={{ fontSize: 16, fontWeight: 800, color: '#ff1744', lineHeight: 1 }}>{metrics.hotspots}</span>
                 <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>found</span>
             </div>
          </div>
       </div>
    </div>
  );
}
