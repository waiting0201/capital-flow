import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiWatchlistData, ApiWatchlistCategory, ApiWatchlistQuote } from '../models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class WatchlistApiService {
  private readonly http = inject(HttpClient);

  getWatchlist(): Observable<ApiWatchlistData> {
    return this.http.get<ApiResponse<ApiWatchlistData>>('/api/watchlist')
      .pipe(map(r => r.data ?? { symbols: [], categories: [] }));
  }

  addItem(symbol: string): Observable<void> {
    return this.http.post<ApiResponse<void>>('/api/watchlist/items', { symbol })
      .pipe(map(() => undefined));
  }

  removeItem(symbol: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`/api/watchlist/items/${symbol}`)
      .pipe(map(() => undefined));
  }

  createCategory(name: string, color: string): Observable<ApiWatchlistCategory> {
    return this.http.post<ApiResponse<ApiWatchlistCategory>>('/api/watchlist/categories', { name, color })
      .pipe(map(r => r.data));
  }

  updateCategory(id: number, name: string, color: string): Observable<ApiWatchlistCategory> {
    return this.http.put<ApiResponse<ApiWatchlistCategory>>(`/api/watchlist/categories/${id}`, { name, color })
      .pipe(map(r => r.data));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`/api/watchlist/categories/${id}`)
      .pipe(map(() => undefined));
  }

  setCategoryStocks(categoryId: number, symbols: string[]): Observable<void> {
    return this.http.put<ApiResponse<void>>(`/api/watchlist/categories/${categoryId}/stocks`, { symbols })
      .pipe(map(() => undefined));
  }
}
