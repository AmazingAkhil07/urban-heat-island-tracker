import { useState, useEffect, useCallback, useMemo } from 'react';
import SearchBar from './components/SearchBar';
import ZonePanel from './components/ZonePanel';
import MapView from './components/MapView';
import AlertsPanel from './components/AlertsPanel';
import TimelineControl from './components/TimelineControl';
import AnalyticsPanel from './components/AnalyticsPanel';
import ForecastCard from './components/ForecastCard';
import DecadalPopup from './components/DecadalPopup';

export default function App() {
  const [cityData, setCityData] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [activeForecast, setActiveForecast] = useState(null);
  const [hotspots, setHotspots] = useState(null);
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [climatology, setClimatology] = useState(null);
  const [timelineLength, setTimelineLength] = useState(360); // 15 days default
  
  // Forecast playback state
  const [currentHour, setCurrentHour] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);

  // Prediction model state
  const [isPredicting, setIsPredicting] = useState(false);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [predictionData, setPredictionData] = useState(null);

  // Decadal projection state
  const [showDecadalProjection, setShowDecadalProjection] = useState(false);
  const [decadalData, setDecadalData] = useState(null);

  // Mobile navigation state
  const [activeTab, setActiveTab] = useState('MAP'); // 'MAP', 'MONITOR', 'ANALYTICS'

  const fetchCityData = async (cityName) => {
    setLoading(true);
    setError(null);
    setGridData(null);
    setActiveForecast(null);
    setHotspots(null);
    setNews(null);
    setSelectedZone(null);
    setCurrentHour(0);
    setIsPlaying(false);
    setAiPredictions(null);
    setPredictionData(null);
    setHistoricalData(null);
    setShowDecadalProjection(false);

    try {
      // 1. Geocode City
      const searchRes = await fetch(`/api/search/?city=${encodeURIComponent(cityName)}`);
      if (!searchRes.ok) throw new Error('City not found');
      const city = await searchRes.json();
      setCityData(city);

      // 2. Fetch Zone Grid & 16-day Forecast
      const zonesRes = await fetch(`/api/zones/?lat=${city.lat}&lng=${city.lng}&tz=${city.timezone}`);
      if (!zonesRes.ok) throw new Error('Failed to fetch weather grid');
      const grid = await zonesRes.json();
      setGridData(grid.zones);
      setActiveForecast(grid.forecast);
      setTimelineLength(grid.forecast_hours || 360);

      // 3. Fetch Hotspots
      const hotspotsRes = await fetch(`/api/hotspots/?lat=${city.lat}&lng=${city.lng}`);
      if (hotspotsRes.ok) {
        const hs = await hotspotsRes.json();
        setHotspots(hs.hotspots);
      }
      
      // 4. Fetch Local Weather News via Twitter
      const newsRes = await fetch(`/api/news/?city=${encodeURIComponent(city.name)}`);
      if (newsRes.ok) {
        const newsContent = await newsRes.json();
        setNews(newsContent.tweets);
      }

      // 5. Fetch Historical Data Context (30 days)
      const histRes = await fetch(`/api/historical/?lat=${city.lat}&lng=${city.lng}&days=30`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistoricalData(histData.history);
        setClimatology(histData.climatology);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPrediction = async () => {
    if (!cityData) return;
    setIsPredicting(true);
    setAiPredictions(null);
    try {
      const resp = await fetch(`/api/predict/?lat=${cityData.lat}&lng=${cityData.lng}&tz=${cityData.timezone}`);
      if (resp.ok) {
        const data = await resp.json();
        setPredictionData(data.predictions);
        setAiPredictions(data.scatter_points);
        setActiveForecast(data.predictions.center_forecast);
        setTimelineLength(data.predictions.horizon_hours);
        setCurrentHour(0);

        // 15-day projection
        const currentPeak = Math.max(...data.predictions.center_forecast.slice(0, 48).map(f => f.predicted_hi)) || 35;
        const highest15DayForecast = Math.max(...data.predictions.center_forecast.map(f => f.predicted_hi));
        setDecadalData({ 
            label: "15-Day Projection",
            predictedPeak: highest15DayForecast,
            baseline: currentPeak
        });
        
        setTimeout(() => setShowDecadalProjection(true), 600);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPredicting(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCityData('Delhi');
  }, []);

  const handleZoneSelect = useCallback(zone => {
    // Determine the actual zone object to set
    const objToSet = (z => z?.id === zone?.id ? null : zone);
    setSelectedZone(objToSet);
  }, []);

  // Playback engine
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentHour(h => {
        const maxH = timelineLength - 1;
        if (h >= maxH) { setIsPlaying(false); return maxH; }
        return h + 1;
      });
    }, 150); // Fast simulation for 15 days
    return () => clearInterval(id);
  }, [isPlaying, timelineLength]);

  const maxHeatIndex = useMemo(() => {
    if (!activeForecast || !activeForecast[currentHour]) return null;
    return activeForecast[currentHour].heat_index || activeForecast[currentHour].predicted_hi;
  }, [activeForecast, currentHour]);

  return (
    <div 
      className="main-layout"
      style={{
        display: 'grid',
        gridTemplateRows: '60px 1fr 140px',
        gridTemplateColumns: 'var(--left-col, 350px) 1fr var(--right-col, 400px)',
        height: '100dvh',
        width: '100vw',
        position: 'relative',
        '--left-col': 'minmax(320px, 350px)',
        '--right-col': 'minmax(320px, 400px)'
      }}
    >
      <style>{`
        @media (max-width: 850px) {
          .main-layout {
            grid-template-columns: 1fr !important;
            grid-template-rows: 60px 1fr !important;
          }
          .sidebar-left {
            position: fixed !important;
            top: 60px;
            left: 0;
            right: 0;
            bottom: 60px;
            z-index: 100 !important;
            transform: ${activeTab === 'MONITOR' ? 'translateX(0)' : 'translateX(-100%)'};
            opacity: ${activeTab === 'MONITOR' ? 1 : 0};
            pointer-events: ${activeTab === 'MONITOR' ? 'all' : 'none'};
          }
          .sidebar-right {
            position: fixed !important;
            top: 60px;
            left: 0;
            right: 0;
            bottom: 60px;
            z-index: 100 !important;
            transform: ${activeTab === 'ANALYTICS' ? 'translateX(0)' : 'translateX(100%)'};
            opacity: ${activeTab === 'ANALYTICS' ? 1 : 0};
            pointer-events: ${activeTab === 'ANALYTICS' ? 'all' : 'none'};
          }
          .bottom-dock {
             position: fixed !important;
             bottom: 70px;
             left: 0;
             right: 0;
             z-index: 90 !important;
             margin: 0 !important;
             border-radius: 0 !important;
             display: ${activeTab === 'MAP' ? 'block' : 'none'} !important;
             height: auto !important;
          }
          .center-hud {
             top: 80px !important;
             transform: scale(0.85);
             display: ${activeTab === 'MAP' ? 'flex' : 'none'} !important;
          }
        }
      `}</style>

      {/* Background Map layer spanning entire screen under panels */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <MapView 
          cityData={cityData}
          zones={gridData || []}
          forecastData={activeForecast}
          currentHour={currentHour}
          hotspots={hotspots || []}
          aiPredictions={aiPredictions}
          selectedZone={selectedZone}
          onZoneSelect={handleZoneSelect}
          predictionData={predictionData}
        />
      </div>

      {/* Header Overlay */}
      <div style={{ gridColumn: '1 / -1', zIndex: 110 }}>
        <SearchBar onSearch={fetchCityData} loading={loading} error={error} cityData={cityData} />
      </div>

      {/* Left Sidebar - Monitoring & Predict */}
      <div className="glass-panel sidebar-left" style={{ 
        gridRow: '2 / 3', 
        gridColumn: '1 / 2', 
        zIndex: 10,
        margin: '16px 0 16px 16px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        <ZonePanel 
          cityData={cityData}
          zones={gridData} 
          selectedZone={selectedZone}
          onZoneSelect={handleZoneSelect}
          isPredicting={isPredicting}
          onRunPrediction={handleRunPrediction}
          predictionData={predictionData}
        />
      </div>

      {/* Center Top Floating HUD */}
      <div className="center-hud" style={{ 
        gridRow: '2 / 3', 
        gridColumn: '2 / 3', 
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 24,
        position: 'relative'
      }}>
        <ForecastCard 
          forecast={activeForecast} 
          currentHour={currentHour} 
          metrics={{
            hotspots: hotspots?.length || 0,
            hasPredictions: !!predictionData
          }}
        />
      </div>

      {/* Right Sidebar - Analytics & Social */}
      <div className="glass-panel sidebar-right" style={{ 
        gridRow: '2 / 3', 
        gridColumn: '3 / 4', 
        zIndex: 10,
        margin: '16px 16px 16px 0',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ flex: 1.2, borderBottom: '1px solid var(--border)' }}>
          <AnalyticsPanel 
            forecast={activeForecast}
            history={historicalData}
            climatology={climatology} 
            currentHour={currentHour}
          />
        </div>
        <div style={{ flex: 1 }}>
          <AlertsPanel 
            news={news} 
            loading={loading} 
            cityData={cityData} 
            forecastData={activeForecast}
          />
        </div>
      </div>

      {/* Bottom Dock - Timeline */}
      <div className="glass-panel bottom-dock" style={{ 
        gridRow: '3 / 4', 
        gridColumn: '1 / -1', 
        zIndex: 15,
        margin: '0 16px 16px 16px',
        borderRadius: 'var(--radius-md)'
      }}>
        <TimelineControl 
          forecastData={activeForecast}
          currentHour={currentHour}
          onHourChange={setCurrentHour}
          isPlaying={isPlaying}
          onPlayToggle={() => setIsPlaying(p => !p)}
          timelineLength={timelineLength}
        />
      </div>

      {/* Mobile Navigation Bar */}
      <div className="mobile-nav mobile-only">
        <button 
          className={`nav-item ${activeTab === 'MONITOR' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'MONITOR' ? 'MAP' : 'MONITOR')}
        >
          <div className="nav-icon">📊</div>
          <span>MONITOR</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'MAP' ? 'active' : ''}`}
          onClick={() => setActiveTab('MAP')}
        >
          <div className="nav-icon">🌍</div>
          <span>MAP</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'ANALYTICS' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'ANALYTICS' ? 'MAP' : 'ANALYTICS')}
        >
          <div className="nav-icon">📈</div>
          <span>FORECAST</span>
        </button>
      </div>

      {/* Decadal Projection Popup */}
      {showDecadalProjection && (
        <DecadalPopup data={decadalData} onClose={() => setShowDecadalProjection(false)} />
      )}
    </div>
  );
}
