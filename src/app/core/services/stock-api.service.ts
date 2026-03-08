import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiStockSearchResult, ApiStockQuote, ApiOhlc, ApiMarketOverview, ApiWatchlistQuote,
  ApiAiIndustryChain, ApiVolumeAnomaly,
  ApiMoneyFlowSummary, ApiMoneyFlowReport, ApiChipAiAnalysis, ApiMarginAiAnalysis,
  ApiFundamentalAttraction, ApiInstitutionalTrading, ApiMarginTrading, ApiChipSummary,
  ApiWatchlistFlowStatus, ApiNewsListResponse, ApiNewsArticle,
} from '../models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

@Injectable({ providedIn: 'root' })
export class StockApiService {
  private readonly http = inject(HttpClient);

  search(keyword: string, market?: string, limit = 10): Observable<ApiStockSearchResult[]> {
    let params = new HttpParams().set('keyword', keyword).set('limit', limit);
    if (market) params = params.set('market', market);
    return this.http.get<ApiResponse<ApiStockSearchResult[]>>('/api/stocks/search', { params })
      .pipe(map(r => r.data ?? []));
  }

  getQuote(symbol: string, market = 'TW'): Observable<ApiStockQuote | null> {
    const params = new HttpParams().set('market', market);
    return this.http.get<ApiResponse<ApiStockQuote>>(`/api/stocks/${symbol}/quote`, { params })
      .pipe(map(r => r.data ?? null));
  }

  getHistory(symbol: string, market = 'TW', limit = 120): Observable<ApiOhlc[]> {
    const params = new HttpParams().set('market', market).set('limit', limit);
    return this.http.get<ApiResponse<ApiOhlc[]>>(`/api/stocks/${symbol}/history`, { params })
      .pipe(map(r => r.data ?? []));
  }

  getMarketOverview(): Observable<ApiMarketOverview | null> {
    return this.http.get<ApiResponse<ApiMarketOverview>>('/api/market/overview')
      .pipe(map(r => r.data ?? null));
  }

  getWatchlistQuotes(symbols: string[]): Observable<ApiWatchlistQuote[]> {
    const params = new HttpParams().set('symbols', symbols.join(','));
    return this.http.get<ApiResponse<ApiWatchlistQuote[]>>('/api/market/watchlist', { params })
      .pipe(map(r => r.data ?? []));
  }

  getAiIndustryChain(symbol: string, force = false): Observable<ApiAiIndustryChain | null> {
    let params = new HttpParams();
    if (force) params = params.set('force', 'true');
    return this.http.get<ApiResponse<ApiAiIndustryChain>>(`/api/stocks/${symbol}/ai/industry-chain`, { params })
      .pipe(map(r => r.data ?? null));
  }

  getVolumeAnomaly(symbol: string, market = 'TW'): Observable<ApiVolumeAnomaly | null> {
    const params = new HttpParams().set('market', market);
    return this.http.get<ApiResponse<ApiVolumeAnomaly>>(`/api/stocks/${symbol}/volume-anomaly`, { params })
      .pipe(map(r => r.data ?? null));
  }

  // ── MFIE (資金流向分析) ──

  getMoneyFlowSummary(symbol: string, force = false): Observable<ApiMoneyFlowSummary | null> {
    let params = new HttpParams();
    if (force) params = params.set('force', 'true');
    return this.http.get<ApiResponse<ApiMoneyFlowSummary>>(`/api/stocks/${symbol}/moneyflow/summary`, { params })
      .pipe(map(r => r.data ?? null));
  }

  getMoneyFlowReport(symbol: string, force = false): Observable<ApiMoneyFlowReport | null> {
    let params = new HttpParams();
    if (force) params = params.set('force', 'true');
    return this.http.get<ApiResponse<ApiMoneyFlowReport>>(`/api/stocks/${symbol}/moneyflow`, { params })
      .pipe(map(r => r.data ?? null));
  }

  getFundamentalAttraction(symbol: string, force = false): Observable<ApiFundamentalAttraction | null> {
    let params = new HttpParams();
    if (force) params = params.set('force', 'true');
    return this.http.get<ApiResponse<ApiFundamentalAttraction>>(`/api/stocks/${symbol}/moneyflow/fundamental`, { params })
      .pipe(map(r => r.data ?? null));
  }

  // ── Chip AI ──

  getChipAiAnalysis(symbol: string, force = false): Observable<ApiChipAiAnalysis | null> {
    let params = new HttpParams();
    if (force) params = params.set('force', 'true');
    return this.http.get<ApiResponse<ApiChipAiAnalysis>>(`/api/stocks/${symbol}/chip/ai`, { params })
      .pipe(map(r => r.data ?? null));
  }

  getMarginAiAnalysis(symbol: string, force = false): Observable<ApiMarginAiAnalysis | null> {
    let params = new HttpParams();
    if (force) params = params.set('force', 'true');
    return this.http.get<ApiResponse<ApiMarginAiAnalysis>>(`/api/stocks/${symbol}/chip/margin-ai`, { params })
      .pipe(map(r => r.data ?? null));
  }

  // ── Chip Data ──

  getChipSummary(symbol: string, market = 'TW'): Observable<ApiChipSummary | null> {
    const params = new HttpParams().set('market', market);
    return this.http.get<ApiResponse<ApiChipSummary>>(`/api/stocks/${symbol}/chip`, { params })
      .pipe(map(r => r.data ?? null));
  }

  getInstitutionalTrading(symbol: string, market = 'TW', limit = 20): Observable<ApiInstitutionalTrading[]> {
    const params = new HttpParams().set('market', market).set('limit', limit);
    return this.http.get<ApiResponse<ApiInstitutionalTrading[]>>(`/api/stocks/${symbol}/chip/institutional`, { params })
      .pipe(map(r => r.data ?? []));
  }

  getMarginTrading(symbol: string, market = 'TW', limit = 20): Observable<ApiMarginTrading[]> {
    const params = new HttpParams().set('market', market).set('limit', limit);
    return this.http.get<ApiResponse<ApiMarginTrading[]>>(`/api/stocks/${symbol}/chip/margin`, { params })
      .pipe(map(r => r.data ?? []));
  }

  // ── News (Module B: 資金催化偵測) ──

  getNews(symbol: string, page = 1, pageSize = 20): Observable<ApiNewsListResponse> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<ApiResponse<ApiNewsListResponse>>(`/api/stocks/${symbol}/news`, { params })
      .pipe(map(r => r.data ?? { items: [], totalCount: 0, page: 1, pageSize: 20 }));
  }

  getNewsAi(symbol: string, newsId: number): Observable<ApiNewsArticle | null> {
    const params = new HttpParams().set('newsId', newsId);
    return this.http.get<ApiResponse<ApiNewsArticle>>(`/api/stocks/${symbol}/news/ai`, { params })
      .pipe(map(r => r.data ?? null));
  }

  // ── Watchlist Flow Status ──

  getWatchlistFlowStatus(symbols: string[]): Observable<ApiWatchlistFlowStatus[]> {
    const params = new HttpParams().set('symbols', symbols.join(','));
    return this.http.get<ApiResponse<ApiWatchlistFlowStatus[]>>('/api/watchlist/moneyflow-status', { params })
      .pipe(map(r => r.data ?? []));
  }
}
