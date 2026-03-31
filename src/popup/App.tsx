import { useEffect, useState } from 'react';

export default function App() {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(['wtm_enabled'], (res) => {
      setIsEnabled(res.wtm_enabled !== false);
    });
  }, []);

  const toggleApp = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.local.set({ wtm_enabled: newState });
  };

  return (
    <div style={{ width: '220px', padding: '20px', background: '#111319', color: '#c2c4c8', fontFamily: 'Segoe UI, Roboto, sans-serif', textAlign: 'center' }}>
      <h2 style={{ fontSize: '14px', margin: '0 0 20px 0', color: '#e0e0e0', letterSpacing: '1px' }}>WTM TRACKER</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={toggleApp}
          style={{
            background: isEnabled ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 77, 77, 0.1)',
            border: `1px solid ${isEnabled ? '#4CAF50' : '#ff4d4d'}`,
            color: isEnabled ? '#4CAF50' : '#ff4d4d',
            padding: '10px 24px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            width: '100%',
            letterSpacing: '1px'
          }}>
          {isEnabled ? 'LIGADO' : 'DESLIGADO'}
        </button>
        <span style={{ fontSize: '10px', color: '#7a7d85' }}>
          {isEnabled ? 'Injetando análise no site.' : 'Extensão em pausa.'}
        </span>
      </div>
    </div>
  );
}