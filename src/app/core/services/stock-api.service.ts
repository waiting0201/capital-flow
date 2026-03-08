import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiStockSearchResult, ApiStockQuote, ApiOhlc, ApiMarketOverview, ApiWatchlistQuote, ApiAiIndustryChain, ApiVolumeAnomaly } from '../models';

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
}
