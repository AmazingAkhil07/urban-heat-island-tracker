import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function AnalyticsPanel({ forecast, history, climatology, currentHour }) {
  const chartData = useMemo(() => {
    if (!forecast) return [];
    
    return forecast.map((f, i) => {
      // Find history equivalent for comparison (if available) 
      // Simple mockup: if history data is present, grab value from roughly 1 year ago
      let historicalCompare = null;
      if (history && history.length > 0) {
         const histIdx = i % history.length;
         historicalCompare = history[histIdx].heat_index;
      }
      
      const time = new Date(f.time);
      return {
        index: i,
        time: time,
        label: time.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
        heatIndex: f.predicted_hi || f.heat_index,
        confidenceLower: f.confidence ? (f.predicted_hi - (1-f.confidence)*10) : null,
        confidenceUpper: f.confidence ? (f.predicted_hi + (1-f.confidence)*10) : null,
        historical: historicalCompare
      };
    });
  }, [forecast, history]);

  if (!forecast) {
    return (
      <div style={{ padding: 24, paddingBottom: 0, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Initialize forecast model...
      </div>
    );
  }

  const currentData = chartData[currentHour];
  const maxHI = Math.max(...chartData.map(d => d.heatIndex));
  const minHI = Math.min(...chartData.map(d => d.heatIndex)) - 2;

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
            background: 'rgba(6,10,20,0.9)', border: '1px solid var(--border)', 
            padding: '10px 14px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' 
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: 12, color: 'var(--text-secondary)' }}>{payload[0].payload.label}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
             <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6d00' }} />
             <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>Forecast: {payload[0].value.toFixed(1)}°C</span>
          </div>
          {payload[1] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#40c4ff' }} />
               <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Historical: {payload[1].value?.toFixed(1)}°C</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
           <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
             ERA5 ENSEMBLE FORECAST
           </div>
           <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
             {forecast.length}H Horizon • Holt-Winters Modeling
           </div>
        </div>
        
        {climatology && (
            <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Historical P90</div>
               <div style={{ fontSize: 13, color: '#ff6d00', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{climatology.p90.toFixed(1)}°</div>
            </div>
        )}
      </div>

      {/* Chart Area */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHeat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff6d00" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ff6d00" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#40c4ff" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#40c4ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="index" hide />
            <YAxis domain={[minHI, Math.max(50, maxHI)]} tick={{fontSize: 10, fill: '#5c677d'}} axisLine={false} tickLine={false} />
            <RechartsTooltip content={<CustomTooltip />} />
            
            {/* Historical Compare Line */}
            {history && (
               <Area 
                  type="monotone" 
                  dataKey="historical" 
                  stroke="#40c4ff" 
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#colorHist)" 
                  isAnimationActive={false}
               />
            )}
            
            {/* Main Forecast Line */}
            <Area 
              type="monotone" 
              dataKey="heatIndex" 
              stroke="#ff6d00" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorHeat)" 
            />

            {/* Confidence Bands (only rendering stroke, filling with CSS is tricky in composed chart without custom SVG) */}
            {chartData[0].confidenceUpper && (
               <>
                  <Area type="monotone" dataKey="confidenceUpper" stroke="rgba(255,109,0,0.2)" fill="none" strokeWidth={1} strokeDasharray="2 2" isAnimationActive={false} />
                  <Area type="monotone" dataKey="confidenceLower" stroke="rgba(255,109,0,0.2)" fill="none" strokeWidth={1} strokeDasharray="2 2" isAnimationActive={false} />
               </>
            )}

            {/* Current Time Indicator */}
            {currentData && (
                <ReferenceLine 
                  x={currentHour} 
                  stroke="#fff" 
                  strokeDasharray="3 3" 
                  label={{ value: 'NOW', position: 'insideTopLeft', fill: '#fff', fontSize: 10 }} 
                />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
