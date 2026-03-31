import { fetchSetComparison, fetchItemOrders } from '../api/marketService';

const EVERGREEN_PRIMES = [
  'nyx prime', 'valkyr prime', 'braton prime', 'burston prime',
  'fang prime', 'lex prime', 'orthos prime', 'paris prime'
];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'GET_ITEM_DATA') {
    const { itemName, orderType } = message.payload;
    const isSet = itemName.endsWith('_set');
    const cleanName = itemName
      .replace('_set', '')
      .replace(/_/g, ' ')
      .toLowerCase();

    // Vault status verification bypassing permanently unvaulted (Evergreen) items.
    const fetchVault = EVERGREEN_PRIMES.includes(cleanName)
      ? Promise.resolve(false)
      : fetch(`https://api.warframestat.us/items/search/${encodeURIComponent(cleanName.replace(' and ', ' & '))}`)
          .then(r => r.json())
          .then(json =>
            Array.isArray(json) && json.length > 0
              ? json.some((i: any) => i.vaulted === true)
              : false
          )
          .catch(() => false);

    // Asynchronous execution of market data retrieval and vault status evaluation.
    Promise.all([
      isSet
        ? fetchSetComparison(itemName, orderType)
        : fetchItemOrders(itemName, orderType),
      fetchVault
    ]).then(([comparisonOrOrders, isVaulted]) => {
      if (isSet) {
        sendResponse({ success: true, orders: [], comparison: comparisonOrOrders, isVaulted });
      } else {
        sendResponse({ success: true, orders: comparisonOrOrders, comparison: null, isVaulted });
      }
    }).catch(err => {
      console.error('[WFM Tracker] Service worker exception:', err);
      sendResponse({ success: false, error: err.message });
    });

    return true; 
  }
});