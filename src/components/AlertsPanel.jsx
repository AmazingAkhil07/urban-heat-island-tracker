import { useState } from 'react';

export default function AlertsPanel({ news, loading, cityData, forecastData }) {
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Auto-post handler (simulated or real depending on backend auth)
  const handleAutoPost = async () => {
     if (!cityData || !forecastData) return;
     
     setIsPosting(true);
     setPostSuccess(false);

     try {
       // Ideally we would send to a Django endpoint like /api/alerts/post/
       // For now, simulate the network request and update UI
       await new Promise(resolve => setTimeout(resolve, 1500));
       
       setPostSuccess(true);
       setTimeout(() => setPostSuccess(false), 5000);
     } catch (e) {
       console.error("Failed to post alert:", e);
     } finally {
       setIsPosting(false);
     }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 16, letterSpacing: '0.1em' }}>LOCAL SENSORS & ALERTS</div>
        <div className="skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 6 }}></div>
        <div className="skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 6 }}></div>
        <div className="skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 6 }}></div>
      </div>
    );
  }

  if (!cityData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Initialize scanning module
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Panel Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
             COMMUNITY ALERTS
           </div>
           <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
             {cityData.name} Network
           </div>
        </div>
        
        {/* Auto-post trigger */}
        {forecastData && (
           <button 
             onClick={handleAutoPost}
             disabled={isPosting}
             style={{
                background: postSuccess ? 'var(--c-moderate)' : 'rgba(64,196,255,0.1)',
                border: `1px solid ${postSuccess ? 'transparent' : 'rgba(64,196,255,0.3)'}`,
                color: postSuccess ? '#000' : 'var(--accent-blue)',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 800,
                cursor: isPosting ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s'
             }}
           >
              {isPosting ? 'TRANSMITTING...' : postSuccess ? '✓ BROADCASTED' : '📡 BROADCAST CRITICAL ALERTS'}
           </button>
        )}
      </div>

      {/* Tweets List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {news && news.length > 0 ? (
          news.map((tweet) => (
            <div key={tweet.id} style={{
               background: 'rgba(255,255,255,0.02)',
               border: '1px solid rgba(255,255,255,0.05)',
               borderRadius: 8,
               padding: 12,
               marginBottom: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {tweet.author.profile_image_url ? (
                   <img src={tweet.author.profile_image_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                ) : (
                   <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                      {tweet.author.name.charAt(0)}
                   </div>
                )}
                <div>
                   <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{tweet.author.name}</div>
                   <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>@{tweet.author.username}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: 10, color: 'var(--text-muted)' }}>
                  {new Date(tweet.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5 }}>
                {tweet.text}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>❤️ {tweet.metrics.like_count}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🔄 {tweet.metrics.retweet_count}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center', fontSize: 12 }}>
            No recent thermal anomalies discussed.
          </div>
        )}
      </div>
    </div>
  );
}
