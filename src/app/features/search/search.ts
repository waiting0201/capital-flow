import { Component, signal, computed, inject, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, switchMap, of, catchError, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Market, ApiStockSearchResult, ApiStockQuote } from '../../core/models';
import { StockApiService } from '../../core/services/stock-api.service';

interface SearchStock {
  symbol: string;
  name: string;
  market: Market;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  industry: string | null;
  tags?: string[];
}

interface ThemeConcept {
  name: string;
  count: number;
  flowTrend: string;
  stocks: string[];
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class Search {
  private readonly stockApi = inject(StockApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  readonly query = signal('');
  readonly marketFilter = signal<'all' | Market>('all');
  readonly isLoading = signal(false);
  readonly searchResults = signal<SearchStock[]>([]);

  readonly themes: ThemeConcept[] = [
    { name: 'AI 人工智慧', count: 42, flowTrend: '▲ 資金大幅流入', stocks: ['2330', 'NVDA', '2382', '3231', 'AVGO'] },
    { name: '半導體', count: 38, flowTrend: '▲ 資金流入', stocks: ['2330', '2303', '3034', '2454', 'TSM', 'AMD'] },
    { name: '電動車', count: 25, flowTrend: '▼ 資金流出', stocks: ['TSLA', '2308', '2317'] },
    { name: '雲端運算', count: 31, flowTrend: '▲ 資金流入', stocks: ['MSFT', 'GOOGL', 'AMZN', '2382'] },
    { name: '金融科技', count: 18, flowTrend: '─ 觀望', stocks: ['2881'] },
    { name: '高股息 ETF', count: 22, flowTrend: '▲ 資金流入', stocks: ['0050'] },
    { name: '元宇宙', count: 15, flowTrend: '▲ 資金流入', stocks: ['META', 'AAPL', 'MSFT'] },
    { name: '網通設備', count: 12, flowTrend: '▲ 資金流入', stocks: ['2345', 'AVGO'] },
  ];

  readonly trendingKeywords = ['台積電', 'NVIDIA', 'AI 伺服器', '廣達', 'Apple', '高股息 ETF', '半導體', 'CoWoS'];

  readonly recentSearches = signal<string[]>(this.loadRecentSearches());

  // ── Computed ──
  readonly hasQuery = computed(() => this.query().trim().length > 0);

  readonly filteredStocks = computed(() => {
    const mkt = this.marketFilter();
    const results = this.searchResults();
    if (mkt === 'all') return results;
    return results.filter(s => s.market === mkt);
  });

  readonly filteredThemes = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    return this.themes.filter(t => t.name.toLowerCase().includes(q));
  });

  readonly totalResults = computed(() => this.filteredStocks().length + this.filteredThemes().length);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(keyword => {
        if (!keyword.trim()) {
          this.searchResults.set([]);
          this.isLoading.set(false);
          return of(null);
        }
        this.isLoading.set(true);
        return this.stockApi.search(keyword, undefined, 12).pipe(
          catchError(() => of([] as ApiStockSearchResult[])),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(results => {
      if (!results) return;
      const stocks: SearchStock[] = results.map(r => ({
        symbol: r.symbol,
        name: r.nameZh ?? r.nameEn,
        market: (r.market === 'TW' ? 'tw' : 'us') as Market,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        industry: r.industry,
        tags: r.industry ? [r.industry] : undefined,
      }));
      this.searchResults.set(stocks);
      this.isLoading.set(false);
      this.fetchQuotes(stocks);
    });
  }

  private fetchQuotes(stocks: SearchStock[]): void {
    if (stocks.length === 0) return;
    const requests = stocks.map(s =>
      this.stockApi.getQuote(s.symbol, s.market === 'tw' ? 'TW' : 'US').pipe(
        catchError(() => of(null as ApiStockQuote | null)),
      )
    );
    forkJoin(requests).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(quotes => {
      const updated = this.searchResults().map((s, i) => {
        const q = quotes[i];
        if (!q) return s;
        return { ...s, price: q.price, change: q.change, changePercent: q.changePercent, volume: q.volume };
      });
      this.searchResults.set(updated);
    });
  }

  // ── Methods ──
  setMarketFilter(f: 'all' | Market): void {
    this.marketFilter.set(f);
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.searchSubject.next(value);
  }

  addToRecent(term: string): void {
    const current = this.recentSearches();
    const updated = [term, ...current.filter(s => s !== term)].slice(0, 8);
    this.recentSearches.set(updated);
    this.saveRecentSearches(updated);
  }

  removeRecent(term: string): void {
    const updated = this.recentSearches().filter(s => s !== term);
    this.recentSearches.set(updated);
    this.saveRecentSearches(updated);
  }

  clearRecent(): void {
    this.recentSearches.set([]);
    this.saveRecentSearches([]);
  }

  applyKeyword(keyword: string): void {
    this.query.set(keyword);
    this.addToRecent(keyword);
    this.searchSubject.next(keyword);
  }

  getStockLink(stock: SearchStock): string {
    return `/stock/${stock.symbol}`;
  }

  formatPrice(price: number): string {
    if (price === 0) return '—';
    return price >= 1000 ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : price.toFixed(2);
  }

  formatChange(q: SearchStock): string {
    if (q.price === 0) return '';
    const sign = q.change > 0 ? '+' : '';
    return `${sign}${q.changePercent.toFixed(2)}%`;
  }

  private loadRecentSearches(): string[] {
    try {
      const raw = localStorage.getItem('recent_searches');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private saveRecentSearches(items: string[]): void {
    localStorage.setItem('recent_searches', JSON.stringify(items));
  }
}
