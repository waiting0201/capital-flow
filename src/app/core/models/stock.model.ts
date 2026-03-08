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

// ── MFIE (Money Flow Intelligence Engine) DTOs ──

export interface ApiMoneyFlowSummary {
  flowDirection: string;   // "Inflow" | "Outflow" | "Neutral"
  flowStrength: string;    // "Strong" | "Moderate" | "Weak"
  summary: string;
  dominantFund: string | null;
  analysisDate: string;
  generatedAt: string;
  aiProvider: string;
  cached: boolean;
}

export interface ApiSignalBreakdown {
  chipSignal: string;
  chipDetail: string | null;
  marginSignal: string;
  marginDetail: string | null;
  fundamentalSignal: string;
  fundamentalDetail: string | null;
  volumeSignal: string;
  volumeDetail: string | null;
  mediaSignal: string | null;
  mediaDetail: string | null;
}

export interface ApiMoneyFlowReport {
  flowDirection: string;
  flowStrength: string;
  summary: string;
  fullReport: string;
  signals: ApiSignalBreakdown | null;
  dominantFund: string | null;
  analysisDate: string;
  generatedAt: string;
  aiProvider: string;
  cached: boolean;
}

export interface ApiChipAiAnalysis {
  analysis: string;
  analysisDate: string;
  generatedAt: string;
  aiProvider: string;
  cached: boolean;
}

export interface ApiMarginAiAnalysis {
  analysis: string;
  analysisDate: string;
  generatedAt: string;
  aiProvider: string;
  cached: boolean;
}

export interface ApiFundamentalAttraction {
  analysis: string;
  analysisDate: string;
  generatedAt: string;
  aiProvider: string;
  cached: boolean;
}

// ── Chip Data DTOs ──

export interface ApiInstitutionalTrading {
  tradingDate: string;
  foreignBuyVolume: number | null;
  foreignSellVolume: number | null;
  foreignNetVolume: number | null;
  foreignNetAmount: number | null;
  foreignConsecutiveDays: number | null;
  trustBuyVolume: number | null;
  trustSellVolume: number | null;
  trustNetVolume: number | null;
  trustNetAmount: number | null;
  trustConsecutiveDays: number | null;
  dealerBuyVolume: number | null;
  dealerSellVolume: number | null;
  dealerNetVolume: number | null;
  dealerNetAmount: number | null;
  dealerConsecutiveDays: number | null;
  totalNetVolume: number | null;
}

export interface ApiMarginTrading {
  tradingDate: string;
  marginBalance: number | null;
  marginBalanceChange: number | null;
  marginBuy: number | null;
  marginSell: number | null;
  marginRepay: number | null;
  marginLimit: number | null;
  marginUsageRate: number | null;
  shortBalance: number | null;
  shortBalanceChange: number | null;
  shortSell: number | null;
  shortBuy: number | null;
  shortReturn: number | null;
  shortToMarginRatio: number | null;
}

export interface ApiChipSummary {
  latestInstitutional: ApiInstitutionalTrading | null;
  latestMargin: ApiMarginTrading | null;
}

// ── News (Module B: 資金催化偵測) ──

export interface ApiNewsArticle {
  id: number;
  source: string;
  title: string;
  summary: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  relevanceScore: number | null;
  relevanceReason: string | null;
  relationType: string | null;
  moneyFlowImpact: string | null;
  catalystStrength: string | null;
  catalystType: string | null;
  affectedMoneyType: string | null;
  conclusion: string | null;
  reason: string | null;
  evidence: string | null;
}

export interface ApiNewsListResponse {
  items: ApiNewsArticle[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiNewsFetchResult {
  fetched: number;
  newArticles: number;
  aiProcessed: number;
  message: string;
}

// ── Watchlist Flow Status ──

export interface ApiWatchlistFlowStatus {
  symbol: string;
  flowDirection: string;   // "Inflow" | "Outflow" | "Neutral"
  flowStrength: string;    // "Strong" | "Moderate" | "Weak"
  summary: string;
}
