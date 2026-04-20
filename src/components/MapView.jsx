import { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer, TextLayer, ColumnLayer } from '@deck.gl/layers';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW = {
  longitude: 77.21,
  latitude: 28.60,
  zoom: 10.2,
  pitch: 45, // Angled for 3D
  bearing: 0,
};

const HEAT_COLOR_RANGE = [
  [0, 20, 80, 0],
  [0, 120, 255, 60],
  [0, 220, 200, 120],
  [255, 214, 0, 180],
  [255, 109, 0, 220],
  [255, 23, 68, 245],
];

export default function MapView({ cityData, zones, hotspots, aiPredictions, selectedZone, onZoneSelect, forecastData, currentHour, predictionData }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [tooltip, setTooltip] = useState(null);

  // Fly to new city
  useEffect(() => {
    if (cityData) {
      setViewState(v => ({
        ...v,
        longitude: cityData.lng,
        latitude: cityData.lat,
        zoom: 10.5,
        transitionDuration: 2000,
      }));
    }
  }, [cityData]);

  // Fly to selected zone
  useEffect(() => {
    if (selectedZone) {
      setViewState(v => ({
        ...v,
        longitude: selectedZone.lng,
        latitude: selectedZone.lat,
        zoom: Math.max(v.zoom, 12.5),
        pitch: 60,
        transitionDuration: 1000,
      }));
    } else {
       if (cityData) {
         setViewState(v => ({
            ...v,
            longitude: cityData.lng,
            latitude: cityData.lat,
            zoom: 10.5,
            pitch: 45,
            transitionDuration: 1000,
         }));
       }
    }
  }, [selectedZone, cityData]);

  const heatPoints = useMemo(() => {
    return zones.map(z => {
      let dynamicHeatIndex = z.heat_index;
      
      // If we have AI prediction data, use that for the current hour
      if (predictionData && predictionData.zone_forecasts && predictionData.zone_forecasts[z.id]) {
         const zf = predictionData.zone_forecasts[z.id];
         if (zf[currentHour]) {
            dynamicHeatIndex = zf[currentHour].predicted_hi;
         }
      } else if (forecastData && forecastData.length > 0 && forecastData[currentHour]) {
        // Fallback to simple Open-Meteo forecast delta
        const currentHI = forecastData[currentHour].heat_index;
        const baseHI = forecastData[0].heat_index;
        if(currentHI !== undefined && baseHI !== undefined) {
           const delta = currentHI - baseHI;
           dynamicHeatIndex = z.heat_index + delta;
        }
      }
      
      return {
        ...z,
        position: [z.lng, z.lat],
        weight: Math.max(0, (dynamicHeatIndex - 30) / 25), // normalize 30–55°C => 0–1
        dynamicHeatIndex,
      };
    });
  }, [zones, forecastData, currentHour, predictionData]);

  const layers = useMemo(() => [
    
    // 1. Column Layer (3D extrusions)
    new ColumnLayer({
      id: 'uhi-columns',
      data: heatPoints,
      diskResolution: 12,
      radius: 1200, // ~1.2km radius columns
      extruded: true,
      pickable: true,
      elevationScale: 150,
      getPosition: d => d.position,
      getFillColor: d => {
        let r=40, g=40, b=40, a=200;
        if(d.dynamicHeatIndex >= 50) { r=255; g=23; b=68; }
        else if(d.dynamicHeatIndex >= 44) { r=255; g=109; b=0; }
        else if(d.dynamicHeatIndex >= 38) { r=255; g=214; b=0; }
        else if(d.dynamicHeatIndex >= 32) { r=0; g=229; b=170; }
        else { r=64; g=196; b=255; }
        return [r, g, b, 230];
      },
      getLineColor: [0, 0, 0, 100],
      getElevation: d => Math.max(0, d.dynamicHeatIndex - 30), // Height based on heat
      onClick: ({ object }) => object && onZoneSelect(object),
      onHover: ({ object, x, y }) => setTooltip(object ? { type: 'ZONE', zone: object, x, y } : null),
      transitions: {
        getElevation: { duration: 300, easing: t => t },
        getFillColor: { duration: 300 }
      }
    }),

    // 2. Base Heatmap (Soft Glow)
    new HeatmapLayer({
      id: 'uhi-heatmap',
      data: heatPoints,
      getPosition: d => d.position,
      getWeight: d => d.weight,
      radiusPixels: 150,
      intensity: 1.5,
      threshold: 0.05,
      colorRange: HEAT_COLOR_RANGE,
      aggregation: 'SUM',
      transitions: {
        getWeight: { duration: 300 }
      }
    }),

    // 3. NASA FIRMS Hotspots (Raw VIIRS Data)
    new ScatterplotLayer({
      id: 'firms-hotspots',
      data: hotspots,
      getPosition: d => [d.lng, d.lat],
      getRadius: 300,
      getFillColor: [255, 23, 68, 220],
      getLineColor: [255, 255, 255, 255],
      lineWidthMinPixels: 2,
      stroked: true,
      filled: true,
      pickable: true,
      onHover: ({ object, x, y }) => {
        setTooltip(object ? { type: 'FIRMS', ...object, x, y } : null);
      },
      radiusUnits: 'meters',
    }),

    // 4. AI Prediction Scatter (Shows spatial spread)
    ...(aiPredictions && aiPredictions.length > 0 ? [
      new ScatterplotLayer({
        id: 'ai-predictions-layer',
        data: aiPredictions,
        getPosition: d => [d.lng, d.lat],
        getFillColor: d => {
          if (d.risk_label === "CRITICAL") return [255, 23, 68, 150];
          if (d.risk_label === "HIGH") return [255, 109, 0, 150];
          return [255, 214, 0, 150];
        },
        getLineColor: [255, 255, 255, 100],
        getLineWidth: 1,
        getRadius: 800,
        radiusUnits: 'meters',
        stroked: true,
        filled: true,
        pickable: true,
        onHover: ({ object, x, y }) => {
          setTooltip(object ? { type: 'AI', ...object, x, y } : null);
        },
      })
    ] : [])
  ], [heatPoints, zones, hotspots, aiPredictions, selectedZone, onZoneSelect]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#02040a' }}>
      <DeckGL
        viewState={viewState}
        controller={{ dragRotate: true }}
        layers={layers}
        onViewStateChange={({ viewState: vs }) => setViewState(vs)}
        getCursor={({ isDragging }) => isDragging ? 'grabbing' : 'default'}
      >
        <Map mapStyle={MAP_STYLE} reuseMaps />
      </DeckGL>

      {/* Map Legend (Bottom Right HUD-style) */}
      <div className="glass-card" style={{
        position: 'absolute', bottom: 180, right: 380,
        padding: '12px 16px',
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>
          HEAT INDEX VISUALIZATION
        </div>
        <div style={{
          height: 12, width: 140, borderRadius: 6,
          background: 'linear-gradient(90deg, #40c4ff, #00e5aa, #ffd600, #ff6d00, #ff1744)',
          marginBottom: 6,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>
          <span>30°C</span>
          <span>50°C+</span>
        </div>
        
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff1744', border: '1px solid #fff' }} />
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>NASA FIRMS Hotspot</span>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', background: '#ff6d00' }} />
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ERA5 Forecast Matrix</span>
           </div>
        </div>
      </div>

      {/* Tooltip Overlay */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x + 15,
          top: tooltip.y - 15,
          pointerEvents: 'none',
          background: 'rgba(6,10,20,0.95)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '12px 16px',
          minWidth: 180,
          boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
          zIndex: 200,
          backdropFilter: 'blur(4px)'
        }}>
          {tooltip.type === 'FIRMS' ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ff1744', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                 <span>🛸</span> NASA VIIRS Anomaly
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span>Brightness</span><strong style={{color:'#fff'}}>{tooltip.brightness}K</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span>FRP</span><strong style={{color:'#fff'}}>{tooltip.frp} MW</strong>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 4 }}>
                   {tooltip.acq_date} {tooltip.acq_time} UTC
                </div>
              </div>
            </>
          ) : tooltip.type === 'AI' ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: tooltip.color, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                 <span>🧠</span> Statistical Prediction
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                <span>Future Heat Index</span>
                <strong style={{color: tooltip.color, fontSize: 13}}>{tooltip.predicted_heat_index.toFixed(1)}°C</strong>
              </div>
              <div style={{ marginTop: 8 }}><span className={`badge`}>{tooltip.risk_label}</span></div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#fff' }}>{tooltip.zone.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                <span>Forecasted Heat</span>
                <strong style={{color: '#ff6d00', fontSize: 14}}>{tooltip.dynamicHeatIndex.toFixed(1)}°C</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                <span>Base Air Temp</span>
                <strong style={{color: '#fff'}}>{tooltip.zone.temperature.toFixed(1)}°C</strong>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
