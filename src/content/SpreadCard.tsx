import { useEffect, useState } from 'react';

export default function SpreadCard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isValidItem, setIsValidItem] = useState(false);
  const [currentSlug, setCurrentSlug] = useState('');
  const [tradeMode, setTradeMode] = useState<'sell' | 'buy'>('sell');
  const [isVaulted, setIsVaulted] = useState(false);
  const [isAppEnabled, setIsAppEnabled] = useState(true);

  // Listens for extension toggle state changes in Chrome storage.
  useEffect(() => {
    chrome.storage.local.get(['wtm_enabled'], (res) => {
      setIsAppEnabled(res.wtm_enabled !== false);
    });
    const listener = (changes: any) => {
      if (changes.wtm_enabled) setIsAppEnabled(Boolean(changes.wtm_enabled.newValue));
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // URL watcher to bypass SPA routing limitations and detect item changes.
  useEffect(() => {
    const checkUrl = () => {
      const parts = window.location.pathname.split('/');
      const slug = parts[parts.length - 1];
      if (slug && slug !== currentSlug) setCurrentSlug(slug);
    };
    const interval = setInterval(checkUrl, 500);
    return () => clearInterval(interval);
  }, [currentSlug]);

  // Fetches market data whenever the URL slug or trade mode changes.
  useEffect(() => {
    if (!currentSlug) return;
    setLoading(true);
    setData(null);
    chrome.runtime.sendMessage(
      { action: 'GET_ITEM_DATA', payload: { itemName: currentSlug, orderType: tradeMode } },
      (res) => {
        if (res?.success) {
          setData(res.comparison);
          setIsVaulted(res.isVaulted || false);
          setIsValidItem(true);
        } else {
          setIsValidItem(false);
        }
        setLoading(false);
      }
    );
  }, [currentSlug, tradeMode]);

  if (!isAppEnabled || !isValidItem) return null;

  const isSet = currentSlug.endsWith('_set');

  const getSpreadColor = (spread: number) => {
    if (tradeMode === 'sell') return spread < 0 ? '#4CAF50' : '#ff4d4d';
    return spread > 0 ? '#4CAF50' : '#ff4d4d';
  };

  const getTip = (spread: number) => {
    if (tradeMode === 'sell') {
      return spread < 0 ? 'Vender pecas separado e melhor' : 'Vender o set e melhor';
    }
    return spread > 0 ? 'Comprar pecas separado e mais barato' : 'Comprar o set e mais barato';
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '10px', color: '#379c9c', fontWeight: 'bold' }}>
          Calculando...
        </div>
      );
    }

    if (!isSet) {
      return (
        <div style={{ textAlign: 'center', padding: '10px', color: '#7a7d85', fontSize: '12px' }}>
          Item individual (Sem arbitragem)
        </div>
      );
    }

    if (!data || data.state === 'none') {
      return (
        <div style={{ textAlign: 'center', padding: '10px', color: '#7a7d85', fontSize: '12px' }}>
          Sem ofertas online no momento
        </div>
      );
    }

    // State: Set has offers, but individual parts are missing.
    if (data.state === 'setOnly') {
      return (
        <>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', color: '#7a7d85' }}>PRECO SET</span>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#e5c57a' }}>
              {data.setPrice}pl
            </div>
          </div>
          <div style={{
            background: 'rgba(229, 197, 122, 0.07)', border: '1px solid #a6843c',
            borderRadius: '4px', padding: '8px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#e5c57a', marginBottom: '2px' }}>
              Spread indisponivel
            </div>
            <div style={{ fontSize: '10px', color: '#7a7d85' }}>
              {data.missingParts + '/' + data.totalParts + ' pecas sem oferta de ' + (tradeMode === 'sell' ? 'venda' : 'compra')}
            </div>
          </div>
        </>
      );
    }

    // State: Partial parts have offers, but the Set has none.
    if (data.state === 'partsPartial') {
      return (
        <>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', color: '#7a7d85' }}>SOMA PARCIAL DAS PECAS</span>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#8ca6cc' }}>
              {data.partsSumPartial}pl
            </div>
          </div>
          <div style={{
            background: 'rgba(140, 166, 204, 0.07)', border: '1px solid #4a5a70',
            borderRadius: '4px', padding: '8px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#8ca6cc', marginBottom: '2px' }}>
              Oferta parcial
            </div>
            <div style={{ fontSize: '10px', color: '#7a7d85' }}>
              {data.missingParts + '/' + data.totalParts + ' pecas sem oferta | Set sem oferta'}
            </div>
          </div>
        </>
      );
    }

    // State: Full availability for reliable spread calculation.
    return (
      <>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          borderBottom: '1px solid #232630', paddingBottom: '12px', marginBottom: '12px'
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <span style={{ fontSize: '10px', color: '#7a7d85' }}>PRECO SET</span>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e5c57a' }}>
              {data.setPrice}pl
            </div>
          </div>
          <div style={{ width: '1px', background: '#232630' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <span style={{ fontSize: '10px', color: '#7a7d85' }}>SOMA PECAS</span>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8ca6cc' }}>
              {data.partsPrice}pl
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#7a7d85' }}>DIFERENCA</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: getSpreadColor(data.spread) }}>
            {Math.abs(data.spread)}pl
          </div>
          <div style={{ fontSize: '11px', color: '#7a7d85', marginTop: '4px' }}>
            {getTip(data.spread)}
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '130px', zIndex: 9999,
      background: 'rgba(24, 27, 36, 0.95)', backdropFilter: 'blur(8px)',
      border: '1px solid #232630', borderRadius: '6px', width: '260px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.8)', fontFamily: 'Segoe UI, Roboto, sans-serif',
      color: '#c2c4c8', overflow: 'hidden'
    }}>

      <div style={{ display: 'flex', background: '#111319', borderBottom: '1px solid #232630' }}>
        {(['sell', 'buy'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setTradeMode(mode)}
            style={{
              flex: 1, padding: '10px 0', background: 'transparent', border: 'none',
              color: tradeMode === mode ? '#379c9c' : '#7a7d85', fontWeight: 'bold',
              fontSize: '11px', cursor: 'pointer', letterSpacing: '1px',
              borderBottom: tradeMode === mode ? '2px solid #379c9c' : '2px solid transparent'
            }}>
            {mode === 'sell' ? 'VENDER' : 'COMPRAR'}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', minHeight: '22px' }}>
          {isVaulted && (
            <span style={{
              background: 'rgba(229, 197, 122, 0.1)', border: '1px solid #a6843c',
              color: '#e5c57a', padding: '2px 8px', borderRadius: '4px',
              fontSize: '11px', fontWeight: 'bold'
            }}>
              Vaulted
            </span>
          )}
        </div>
        {renderContent()}
      </div>
    </div>
  );
}