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
