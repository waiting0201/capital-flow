export type Market = 'tw' | 'us';

export interface StockQuote {
  symbol: string;
  name: string;
  market: Market;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  updatedAt: string;
}

export interface StockProfile {
  symbol: string;
  name: string;
  market: Market;
  industry: string;
  description: string;
  aiIntroduction?: string;
  establishedDate?: string;
  capital?: number;
  chairman?: string;
  ceo?: string;
  mainBusiness?: string;
}

export interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface MarketBreadth {
  advancers: number;
  decliners: number;
  unchanged: number;
  limitUp: number;
  limitDown: number;
}

// ── Watchlist DTOs ──

export interface ApiWatchlistData {
  symbols: string[];
  categories: ApiWatchlistCategory[];
}

export interface ApiWatchlistCategory {
  id: number;
  name: string;
  color: string;
  stockSymbols: string[];
}

// ── Market Overview DTOs ──

export interface ApiMarketOverview {
  breadth: { up: number; down: number; flat: number; limitUp: number; limitDown: number; total: number };
  institutional: { foreignNet: number; sitcNet: number; dealerNet: number; totalNet: number };
  margin: { marginNetChange: number; label: string };
  volume: { totalBillion: number };
}

export interface ApiWatchlistQuote {
  symbol: string;
  name: string | null;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

// ── Backend API DTOs ──

export interface ApiStockSearchResult {
  stockId: number;
  symbol: string;
  market: string;
  exchange: string;
  nameZh: string | null;
  nameEn: string;
  industry: string | null;
}

export interface ApiStockQuote {
  stockId: number;
  symbol: string;
  market: string;
  nameZh: string | null;
  nameEn: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number | null;
  low: number | null;
  open: number | null;
  timestamp: string;
}

export interface ApiOhlc {
  tradingDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma5: number | null;
  ma10: number | null;
  ma20: number | null;
  ma60: number | null;
  change: number | null;
  changePercent: number | null;
}

// ── AI API DTOs ──

export interface ApiAiIndustryChain {
  content: string;
  generatedAt: string;
  provider: string;
  cached: boolean;
}

export interface ApiVolumeAnomaly {
  currentVolume: number;
  avgVolume: number;
  avgDays: number;
  ratio: number;
  isAnomaly: boolean;
  tradingDate: string;
  aiAnalysis: string | null;
}
