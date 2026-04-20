import { useState } from 'react';

export default function SearchBar({ onSearch, loading, error, cityData }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
      setInput('');
    }
  };

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px',
      height: 60,
      background: 'rgba(2, 4, 10, 0.85)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(24px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      {/* Logo Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ 
            fontSize: 24, background: 'linear-gradient(135deg, #ff1744, #ff6d00)', 
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 8px rgba(255,23,68,0.5))'
        }}>
           🛰️
        </div>
        <div className="desktop-only">
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.05em' }}>
            <span style={{ color: '#fff' }}>ORBITAL</span>
            <span style={{ color: '#ff6d00' }}>THERMAL</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--accent-blue)', letterSpacing: '0.1em', fontWeight: 600 }}>
            GLOBAL UHI PREDICTION ENGINE
          </div>
        </div>
      </div>

      {/* Main Search Input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 480, margin: '0 8px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            type="text" 
            placeholder="Search city..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              height: 38,
              padding: '0 12px 0 32px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(100,140,255,0.2)',
              color: '#fff',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
            }}
            onFocus={e => {
               e.target.style.background = 'rgba(255,255,255,0.08)';
               e.target.style.border = '1px solid var(--accent-blue)';
               e.target.style.boxShadow = '0 0 16px rgba(64,196,255,0.2)';
            }}
            onBlur={e => {
               e.target.style.background = 'rgba(255,255,255,0.03)';
               e.target.style.border = '1px solid rgba(100,140,255,0.2)';
               e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5)';
            }}
          />
          <span style={{ position: 'absolute', left: 10, top: 11, fontSize: 13, color: 'var(--accent-blue)' }}>⌕</span>
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          style={{
            height: 38,
            padding: '0 16px',
            borderRadius: 6,
            background: loading ? '#222' : 'var(--accent-blue)',
            color: loading ? '#888' : '#000',
            border: 'none',
            fontSize: 11,
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.05em',
            boxShadow: loading ? 'none' : '0 0 12px rgba(64,196,255,0.4)',
          }}
        >
          {loading ? '...' : 'SCAN'}
        </button>
      </form>
      
      {/* Search Error below */}
      {error && <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', background: '#ff1744', color: '#fff', padding: '4px 12px', fontSize: 11, fontWeight: 700, borderRadius: '0 0 6px 6px', zIndex: 120 }}>{error}</div>}

      {/* Quick Access Area - Desktop only */}
      <div className="desktop-only" style={{ width: 280, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
        {cityData ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
               <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5aa', boxShadow: '0 0 8px #00e5aa' }} />
               <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>{cityData.name}</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
               {cityData.lat.toFixed(4)}°N, {cityData.lng.toFixed(4)}°E
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
             /// AWAITING TARGET COORDINATES
          </div>
        )}
      </div>
    </header>
  );
}
