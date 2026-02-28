import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Market, StockQuote } from '../../core/models';

interface ThemeConcept {
  name: string;
  icon: string;
  count: number;
  change: number;
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
  readonly query = signal('');
  readonly marketFilter = signal<'all' | Market>('all');

  // ── Mock Data ──
  private readonly allStocks: StockQuote[] = [
    { symbol: '2330', name: '台積電 TSMC', market: 'tw', price: 852.00, change: 12.00, changePercent: 1.43, volume: 28543, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '2317', name: '鴻海精密', market: 'tw', price: 178.00, change: -1.50, changePercent: -0.84, volume: 18562, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '2382', name: '廣達電腦', market: 'tw', price: 312.00, change: 12.35, changePercent: 4.12, volume: 15231, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '2454', name: '聯發科技', market: 'tw', price: 1280.00, change: 25.00, changePercent: 1.99, volume: 8421, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '3034', name: '聯詠科技', market: 'tw', price: 528.00, change: 8.00, changePercent: 1.54, volume: 5234, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '2303', name: '聯華電子', market: 'tw', price: 52.30, change: -0.40, changePercent: -0.76, volume: 42150, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '3231', name: '緯創資通', market: 'tw', price: 118.50, change: 1.50, changePercent: 1.28, volume: 22874, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '2345', name: '智邦科技', market: 'tw', price: 620.00, change: 15.00, changePercent: 2.48, volume: 3120, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '2308', name: '台達電子', market: 'tw', price: 385.00, change: -3.50, changePercent: -0.90, volume: 7850, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '2881', name: '富邦金控', market: 'tw', price: 85.20, change: 0.80, changePercent: 0.95, volume: 15680, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '2884', name: '玉山金控', market: 'tw', price: 28.45, change: 0.15, changePercent: 0.53, volume: 28340, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '0050', name: '元大台灣50', market: 'tw', price: 168.25, change: 1.85, changePercent: 1.11, volume: 9870, updatedAt: '2026-02-28T13:30:00' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'us', price: 875.30, change: 15.65, changePercent: 1.82, volume: 41200000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: 'AAPL', name: 'Apple Inc.', market: 'us', price: 178.52, change: -0.95, changePercent: -0.53, volume: 52100000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', market: 'us', price: 415.80, change: 3.20, changePercent: 0.78, volume: 22800000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'us', price: 174.65, change: 2.15, changePercent: 1.25, volume: 18500000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'us', price: 185.30, change: -1.20, changePercent: -0.64, volume: 32100000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: 'META', name: 'Meta Platforms', market: 'us', price: 502.15, change: 8.40, changePercent: 1.70, volume: 15400000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: 'TSM', name: 'Taiwan Semiconductor ADR', market: 'us', price: 168.92, change: 2.45, changePercent: 1.47, volume: 12300000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', market: 'us', price: 178.40, change: 4.80, changePercent: 2.76, volume: 28600000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', market: 'us', price: 1685.20, change: 28.50, changePercent: 1.72, volume: 4200000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: 'TSLA', name: 'Tesla Inc.', market: 'us', price: 195.40, change: -5.60, changePercent: -2.79, volume: 68500000, updatedAt: '2026-02-27T16:00:00' },
  ];

  readonly themes: ThemeConcept[] = [
    { name: 'AI 人工智慧', icon: '🧠', count: 42, change: 2.8, stocks: ['2330', 'NVDA', '2382', '3231', 'AVGO'] },
    { name: '半導體', icon: '💎', count: 38, change: 1.9, stocks: ['2330', '2303', '3034', '2454', 'TSM', 'AMD'] },
    { name: '電動車', icon: '⚡', count: 25, change: -0.5, stocks: ['TSLA', '2308', '2317'] },
    { name: '雲端運算', icon: '☁️', count: 31, change: 1.2, stocks: ['MSFT', 'GOOGL', 'AMZN', '2382'] },
    { name: '金融科技', icon: '🏦', count: 18, change: 0.6, stocks: ['2881', '2884'] },
    { name: '高股息', icon: '💰', count: 22, change: 0.3, stocks: ['0050', '2881', '2884'] },
    { name: '元宇宙', icon: '🌐', count: 15, change: 1.5, stocks: ['META', 'AAPL', 'MSFT'] },
    { name: '網路安全', icon: '🛡️', count: 12, change: 0.8, stocks: ['MSFT', 'GOOGL'] },
  ];

  readonly trendingKeywords = ['台積電', 'NVIDIA', 'AI 伺服器', '廣達', 'Apple', '高股息 ETF', '半導體設備', 'CoWoS'];

  readonly recentSearches = signal<string[]>(['2330', 'NVDA', '2382', 'AAPL', 'AI 人工智慧']);

  // ── Computed ──
  readonly hasQuery = computed(() => this.query().trim().length > 0);

  readonly filteredStocks = computed(() => {
    const q = this.query().trim().toLowerCase();
    const mkt = this.marketFilter();
    if (!q) return [];

    // Collect stock symbols from matching themes
    const themeSymbols = new Set<string>();
    for (const t of this.themes) {
      if (t.name.toLowerCase().includes(q)) {
        t.stocks.forEach(sym => themeSymbols.add(sym));
      }
    }

    return this.allStocks
      .filter(s => {
        if (mkt !== 'all' && s.market !== mkt) return false;
        return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || themeSymbols.has(s.symbol);
      })
      .slice(0, 12);
  });

  readonly filteredThemes = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    return this.themes.filter(t => t.name.toLowerCase().includes(q));
  });

  readonly totalResults = computed(() => this.filteredStocks().length + this.filteredThemes().length);

  // ── Methods ──
  setMarketFilter(f: 'all' | Market): void {
    this.marketFilter.set(f);
  }

  onSearch(value: string): void {
    this.query.set(value);
  }

  addToRecent(term: string): void {
    const current = this.recentSearches();
    const updated = [term, ...current.filter(s => s !== term)].slice(0, 8);
    this.recentSearches.set(updated);
  }

  removeRecent(term: string): void {
    this.recentSearches.set(this.recentSearches().filter(s => s !== term));
  }

  clearRecent(): void {
    this.recentSearches.set([]);
  }

  applyKeyword(keyword: string): void {
    this.query.set(keyword);
    this.addToRecent(keyword);
  }

  getStockLink(stock: StockQuote): string {
    return `/stock/${stock.symbol}`;
  }

  formatPrice(price: number): string {
    return price >= 1000 ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : price.toFixed(2);
  }

  formatChange(q: StockQuote): string {
    const sign = q.change > 0 ? '+' : '';
    return `${sign}${q.changePercent.toFixed(2)}%`;
  }

  formatVolume(q: StockQuote): string {
    if (q.market === 'us') {
      if (q.volume >= 1_000_000) return (q.volume / 1_000_000).toFixed(1) + 'M';
      return (q.volume / 1_000).toFixed(0) + 'K';
    }
    return q.volume.toLocaleString() + ' 張';
  }
}
