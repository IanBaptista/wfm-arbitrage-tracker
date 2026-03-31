// src/types/marketApi.d.ts

// Tipagens literais para garantir restrição de valores (Union Types)
export type OrderType = 'sell' | 'buy';
export type UserStatus = 'ingame' | 'online' | 'offline';
export type Platform = 'pc' | 'ps4' | 'xbox' | 'switch';

// Wrapper genérico base da API do Warframe.Market
export interface MarketResponse<T> {
  payload: T;
}

// ==========================================
// 1. Endpoint: /v1/items
// Retorna a lista completa de itens negociáveis (Usado para buscas)
// ==========================================
export interface ItemShort {
  id: string;
  url_name: string;      // ESSENCIAL: É o ID usado nas outras requisições (ex: "glaive_prime_set")
  item_name: string;
  thumb: string;
}

export interface ItemsPayload {
  items: ItemShort[];
}

// ==========================================
// 2. Endpoint: /v1/items/{url_name}/orders
// Retorna o Livro de Ofertas (Order Book) atual
// ==========================================
export interface MarketUser {
  id: string;
  ingame_name: string;
  status: UserStatus;
  region: string;
  reputation: number;
  avatar: string | null;
  last_seen: string;
}

export interface Order {
  id: string;
  platinum: number;      // Preço
  quantity: number;
  order_type: OrderType;
  platform: Platform;
  user: MarketUser;      // Dados de quem está vendendo/comprando
  creation_date: string;
  last_update: string;
  visible: boolean;
  region: string;
}

export interface ItemsPayload {
  orders: ItemShort[];
}

// ==========================================
// 3. Endpoint: /v1/items/{url_name}/statistics
// Retorna os dados históricos (Para o Chart.js)
// ==========================================
export interface DataPoint {
  datetime: string;      // Eixo X do gráfico
  volume: number;
  min_price: number;     // Geralmente usamos o min_price para rastrear Sets
  max_price: number;
  open_price: number;
  closed_price: number;
  avg_price: number;
  wa_price: number;      // Weighted Average (Média ponderada - excelente para evitar outliers)
  median: number;
  moving_avg: number | null;
}

export interface StatisticsPayload {
  statistics_closed: {
    '48hours': DataPoint[];
    '90days': DataPoint[];
  };
  statistics_live: {
    '48hours': DataPoint[];
    '90days': DataPoint[];
  };
}