const API_V2 = 'https://api.warframe.market/v2';

// Static lookup table mapping specific multi-part sets to their components and required quantities.
// Bypasses the API V2 UUID discovery for complex sets, enforcing correct multiplier math natively.
const MULTIPLIER_SETS: Record<string, Record<string, number>> = {
  // Daggers, Claws, Fists & Sparring
  'fang_prime_set': { 'fang_prime_blueprint': 1, 'fang_prime_blade': 2, 'fang_prime_handle': 2 },
  'okina_prime_set': { 'okina_prime_blueprint': 1, 'okina_prime_blade': 2, 'okina_prime_handle': 2 },
  'venka_prime_set': { 'venka_prime_blueprint': 1, 'venka_prime_blades': 2, 'venka_prime_gauntlet': 2 },
  'kogake_prime_set': { 'kogake_prime_blueprint': 1, 'kogake_prime_boot': 2, 'kogake_prime_gauntlet': 2 },
  'tekko_prime_set': { 'tekko_prime_blueprint': 1, 'tekko_prime_blade': 2, 'tekko_prime_gauntlet': 2 },
  'ankyros_prime_set': { 'ankyros_prime_blueprint': 1, 'ankyros_prime_blade': 2, 'ankyros_prime_gauntlet': 2 },

  // Dual Swords & Melee
  'dual_kamas_prime_set': { 'dual_kamas_prime_blueprint': 1, 'dual_kamas_prime_blade': 2, 'dual_kamas_prime_handle': 2 },
  'dual_keres_prime_set': { 'dual_keres_prime_blueprint': 1, 'dual_keres_prime_blade': 2, 'dual_keres_prime_handle': 2 },
  'nami_skyla_prime_set': { 'nami_skyla_prime_blueprint': 1, 'nami_skyla_prime_blade': 2, 'nami_skyla_prime_handle': 1 },
  'kronen_prime_set': { 'kronen_prime_blueprint': 1, 'kronen_prime_blade': 2, 'kronen_prime_handle': 2 },
  'ninkondi_prime_set': { 'ninkondi_prime_blueprint': 1, 'ninkondi_prime_chain': 1, 'ninkondi_prime_handle': 2 },

  // Polearms & Staves
  'orthos_prime_set': { 'orthos_prime_blueprint': 1, 'orthos_prime_blade': 2, 'orthos_prime_handle': 1 },
  'guandao_prime_set': { 'guandao_prime_blueprint': 1, 'guandao_prime_blade': 2, 'guandao_prime_handle': 1 },
  'bo_prime_set': { 'bo_prime_blueprint': 1, 'bo_prime_ornament': 2, 'bo_prime_handle': 1 },

  // Thrown Weapons
  'spira_prime_set': { 'spira_prime_blueprint': 1, 'spira_prime_blade': 2, 'spira_prime_pouch': 2 },
  'hikou_prime_set': { 'hikou_prime_blueprint': 1, 'hikou_prime_stars': 2, 'hikou_prime_pouch': 2 },
  'glaive_prime_set': { 'glaive_prime_blueprint': 1, 'glaive_prime_blade': 2, 'glaive_prime_disc': 1 },

  // Dual Pistols (Ak-)
  'akstiletto_prime_set': { 'akstiletto_prime_blueprint': 1, 'akstiletto_prime_barrel': 2, 'akstiletto_prime_receiver': 2, 'akstiletto_prime_link': 1 },
  'akbolto_prime_set': { 'akbolto_prime_blueprint': 1, 'akbolto_prime_barrel': 2, 'akbolto_prime_receiver': 2, 'akbolto_prime_link': 1 },
  'akjagara_prime_set': { 'akjagara_prime_blueprint': 1, 'akjagara_prime_barrel': 2, 'akjagara_prime_receiver': 2, 'akjagara_prime_link': 1 },
  'aksomati_prime_set': { 'aksomati_prime_blueprint': 1, 'aksomati_prime_barrel': 2, 'aksomati_prime_receiver': 2, 'aksomati_prime_link': 1 },
  'afuris_prime_set': { 'afuris_prime_blueprint': 1, 'afuris_prime_barrel': 2, 'afuris_prime_receiver': 2, 'afuris_prime_link': 1 }
};

export const fetchItemOrders = async (itemRef: string, orderType: 'sell' | 'buy'): Promise<any[]> => {
  try {
    const response = await fetch(API_V2 + '/orders/item/' + itemRef);
    if (!response.ok) return [];
    
    const json = await response.json();
    const orders: any[] = json.data || [];
    
    return orders
      .filter((o: any) =>
        o.type === orderType &&
        (o.user.status === 'ingame' || o.user.status === 'online')
      )
      .sort((a: any, b: any) =>
        orderType === 'sell' ? a.platinum - b.platinum : b.platinum - a.platinum
      );
  } catch (err) {
    return [];
  }
};

export const fetchSetComparison = async (setItemName: string, orderType: 'sell' | 'buy') => {
  const targetSlug = setItemName.trim().toLowerCase();
  if (!targetSlug.endsWith('_set')) return null;

  try {
    let partSlugsOrIds: string[] = [];
    let multipliers: number[] = [];

    // 1. Static Resolution: Injects predefined components for complex dual/multi-part sets.
    if (MULTIPLIER_SETS[targetSlug]) {
      const partsDict = MULTIPLIER_SETS[targetSlug];
      partSlugsOrIds = Object.keys(partsDict);
      multipliers = Object.values(partsDict);
    } 
    // 2. Dynamic Resolution: Fetches UUIDs via V2 API for standard items (Warframes, single weapons).
    else {
      const infoRes = await fetch(API_V2 + '/items/' + targetSlug);
      if (!infoRes.ok) return null;

      const infoJson = await infoRes.json();
      const setId: string = infoJson.data?.id ?? '';
      const allPartIds: string[] = infoJson.data?.setParts ?? [];
      
      partSlugsOrIds = allPartIds.filter((id: string) => id !== setId);
      if (partSlugsOrIds.length === 0) return null;

      multipliers = Array(partSlugsOrIds.length).fill(1);
    }

    // Executes simultaneous parallel requests for the main Set and all resolved components.
    const allOrders = await Promise.all([
      fetchItemOrders(targetSlug, orderType),
      ...partSlugsOrIds.map((idOrSlug: string) => fetchItemOrders(idOrSlug, orderType))
    ]);

    const setOrders = allOrders[0];
    const partsOrders = allOrders.slice(1);
    const setPrice = setOrders[0]?.platinum ?? 0;

    let partsSum = 0;
    let missingParts = 0;
    
    // Calculates total parts cost applying the resolved multipliers.
    partsOrders.forEach((orders: any[], index: number) => {
      const best = orders[0]?.platinum ?? 0;
      const multiplier = multipliers[index];

      if (best === 0) {
        missingParts++;
      } else {
        partsSum += (best * multiplier);
      }
    });

    const totalParts = partSlugsOrIds.length;
    const partsComplete = missingParts === 0;
    const hasAnyPartOffer = partsSum > 0;
    const hasSetOffer = setPrice > 0;

    let state: 'full' | 'setOnly' | 'partsPartial' | 'none' = 'none';

    // Evaluates the market availability state to determine UI rendering.
    if (hasSetOffer && partsComplete) {
      state = 'full';
    } else if (hasSetOffer && !partsComplete) {
      state = 'setOnly';
    } else if (!hasSetOffer && hasAnyPartOffer) {
      state = 'partsPartial';
    } else {
      state = 'none';
    }

    console.log('[WFM Tracker] State:', state, '| Set:', setPrice, '| Parts:', partsSum, '| Missing:', missingParts, '/', totalParts);

    return {
      state,
      setPrice,
      partsPrice: partsComplete ? partsSum : 0,
      partsSumPartial: partsSum,
      spread: setPrice - partsSum,
      missingParts,
      totalParts,
      partsComplete
    };
  } catch (err) {
    console.error('[WFM Tracker] Runtime exception in fetchSetComparison:', err);
    return null;
  }
};