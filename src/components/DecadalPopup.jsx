import React from 'react';

export default function DecadalPopup({ data, onClose }) {
  if (!data) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(2, 4, 10, 0.8)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      animation: 'fade-in 0.5s ease-out'
    }}>
      <div className="glass-panel" style={{
        width: '95%',
        maxWidth: 540,
        padding: '32px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-bright)',
        boxShadow: '0 0 60px rgba(64, 196, 255, 0.15)',
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(6, 10, 20, 0.9) 0%, rgba(12, 18, 30, 0.95) 100%)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Decorative Grid Line */}
        <div style={{ position: 'absolute', top: 0, left: 24, width: 2, height: 16, background: 'var(--accent-blue)' }} />
        
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
          color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer', transition: 'color 0.2s',
        }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>×</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
           <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 10px var(--accent-blue)' }} />
           <div style={{ fontSize: 10, color: 'var(--accent-blue)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
             Transmission Complete
           </div>
        </div>
        
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
          15-Day Peak Projection
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 32 }}>
          The statistical prediction engine has evaluated the atmospheric corridor. Heat index is projected to reach acute levels over the upcoming timeframe.
        </p>

        <div style={{ display: 'flex', gap: 24, marginBottom: 40, alignItems: 'center' }}>
           <div style={{ flex: 1, padding: '20px 24px', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent Baseline</div>
              </div>
              <div style={{ fontSize: 28, color: '#ff6d00', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: 8 }}>
                {data.baseline.toFixed(1)}<span style={{ fontSize: 18, color: 'var(--text-muted)' }}>°C</span>
              </div>
           </div>
           
           <div style={{ color: 'var(--text-muted)', fontSize: 24, fontWeight: 300 }}>→</div>

           <div style={{ flex: 1, padding: '20px 24px', background: 'rgba(255,23,68,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,23,68,0.3)', boxShadow: '0 0 30px rgba(255,23,68,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff1744', animation: 'pulse-critical 1.5s infinite' }} />
                 <div style={{ fontSize: 11, color: '#ff1744', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>15-Day Max Peak</div>
              </div>
              <div style={{ fontSize: 28, color: '#ff1744', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: 8 }}>
                {data.predictedPeak.toFixed(1)}<span style={{ fontSize: 18, color: 'rgba(255,23,68,0.5)' }}>°C</span>
              </div>
           </div>
        </div>

        <button onClick={onClose} style={{
          width: '100%', padding: '16px', background: '#fff', color: '#000',
          border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 900,
          cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em',
          transition: 'transform 0.1s, box-shadow 0.2s',
          boxShadow: '0 4px 15px rgba(255,255,255,0.2)'
        }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
          Acknowledge & Close
        </button>

      </div>
    </div>
  );
}
