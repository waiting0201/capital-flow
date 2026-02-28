import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Market, StockQuote } from '../../core/models';

type SortField = 'symbol' | 'price' | 'change' | 'volume';
type SortDir = 'asc' | 'desc';

interface WatchlistGroup {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './watchlist.html',
  styleUrl: './watchlist.scss',
})
export class Watchlist {
  // ── Groups / Tabs ──
  readonly groups: WatchlistGroup[] = [
    { id: 'all', name: '全部', icon: 'list' },
    { id: 'tw', name: '台股', icon: 'tw' },
    { id: 'us', name: '美股', icon: 'us' },
    { id: 'ai', name: 'AI 族群', icon: 'cpu' },
    { id: 'dividend', name: '高股息', icon: 'coin' },
  ];

  readonly activeGroup = signal('all');
  readonly marketFilter = signal<'all' | Market>('all');
  readonly sortField = signal<SortField>('change');
  readonly sortDir = signal<SortDir>('desc');
  readonly searchQuery = signal('');
  readonly showAddForm = signal(false);
  readonly newSymbol = signal('');

  // ── Stock Data ──
  readonly stocks = signal<StockQuote[]>([
    { symbol: '2330', name: '台積電 TSMC', market: 'tw', price: 852.00, change: 12.00, changePercent: 1.43, volume: 28543, updatedAt: '2026-02-28T13:30:00' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'us', price: 875.30, change: 15.65, changePercent: 1.82, volume: 41200000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: '2382', name: '廣達電腦', market: 'tw', price: 312.00, change: 12.35, changePercent: 4.12, volume: 15231, updatedAt: '2026-02-28T13:30:00' },
    { symbol: 'AAPL', name: 'Apple Inc.', market: 'us', price: 178.52, change: -0.95, changePercent: -0.53, volume: 52100000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: '3231', name: '緯創資通', market: 'tw', price: 118.50, change: 1.75, changePercent: 1.50, volume: 22874, updatedAt: '2026-02-28T13:30:00' },
    { symbol: '2317', name: '鴻海精密', market: 'tw', price: 178.00, change: -1.50, changePercent: -0.84, volume: 18562, updatedAt: '2026-02-28T13:30:00' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', market: 'us', price: 415.80, change: 3.22, changePercent: 0.78, volume: 22300000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'us', price: 172.35, change: -1.18, changePercent: -0.68, volume: 18900000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: '2454', name: '聯發科技', market: 'tw', price: 1280.00, change: 25.00, changePercent: 1.99, volume: 8421, updatedAt: '2026-02-28T13:30:00' },
    { symbol: 'TSM', name: 'Taiwan Semi ADR', market: 'us', price: 168.42, change: 2.35, changePercent: 1.42, volume: 15600000, updatedAt: '2026-02-27T16:00:00' },
    { symbol: '2603', name: '長榮海運', market: 'tw', price: 178.50, change: -3.50, changePercent: -1.92, volume: 32145, updatedAt: '2026-02-28T13:30:00' },
    { symbol: 'AMD', name: 'AMD Inc.', market: 'us', price: 178.90, change: 5.42, changePercent: 3.13, volume: 35800000, updatedAt: '2026-02-27T16:00:00' },
  ]);

  // ── Computed ──
  readonly stats = computed(() => {
    const all = this.stocks();
    const up = all.filter(s => s.change > 0).length;
    const down = all.filter(s => s.change < 0).length;
    const flat = all.filter(s => s.change === 0).length;
    const avgChange = all.reduce((sum, s) => sum + s.changePercent, 0) / all.length;
    return { total: all.length, up, down, flat, avgChange };
  });

  readonly filteredStocks = computed(() => {
    let list = this.stocks();
    const group = this.activeGroup();
    const search = this.searchQuery().toLowerCase();

    // Group filter
    if (group === 'tw') list = list.filter(s => s.market === 'tw');
    else if (group === 'us') list = list.filter(s => s.market === 'us');
    else if (group === 'ai') list = list.filter(s => ['2330', 'NVDA', '2382', '3231', '2454', 'AMD', 'TSM'].includes(s.symbol));
    else if (group === 'dividend') list = list.filter(s => ['2330', '2317', '2603'].includes(s.symbol));

    // Search filter
    if (search) {
      list = list.filter(s =>
        s.symbol.toLowerCase().includes(search) ||
        s.name.toLowerCase().includes(search)
      );
    }

    // Sort
    const field = this.sortField();
    const dir = this.sortDir();
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (field === 'symbol') cmp = a.symbol.localeCompare(b.symbol);
      else if (field === 'price') cmp = a.price - b.price;
      else if (field === 'change') cmp = a.changePercent - b.changePercent;
      else if (field === 'volume') cmp = a.volume - b.volume;
      return dir === 'desc' ? -cmp : cmp;
    });

    return list;
  });

  readonly marketBreakdown = computed(() => {
    const all = this.stocks();
    const tw = all.filter(s => s.market === 'tw');
    const us = all.filter(s => s.market === 'us');
    return {
      tw: { count: tw.length, avgChange: tw.length ? tw.reduce((s, q) => s + q.changePercent, 0) / tw.length : 0 },
      us: { count: us.length, avgChange: us.length ? us.reduce((s, q) => s + q.changePercent, 0) / us.length : 0 },
    };
  });

  // ── Methods ──
  setGroup(id: string): void {
    this.activeGroup.set(id);
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set(field === 'symbol' ? 'asc' : 'desc');
    }
  }

  removeStock(symbol: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.stocks.update(list => list.filter(s => s.symbol !== symbol));
  }

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) this.newSymbol.set('');
  }

  addStock(): void {
    const sym = this.newSymbol().trim().toUpperCase();
    if (!sym) return;
    if (this.stocks().some(s => s.symbol === sym)) return;

    const isTw = /^\d/.test(sym);
    const newStock: StockQuote = {
      symbol: sym,
      name: sym,
      market: isTw ? 'tw' : 'us',
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      updatedAt: new Date().toISOString(),
    };
    this.stocks.update(list => [newStock, ...list]);
    this.newSymbol.set('');
    this.showAddForm.set(false);
  }

  formatVolume(vol: number, market: Market): string {
    if (market === 'us') {
      if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + 'M';
      if (vol >= 1_000) return (vol / 1_000).toFixed(0) + 'K';
    }
    return vol.toLocaleString();
  }

  formatPrice(price: number): string {
    return price >= 1000 ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : price.toFixed(2);
  }

  formatChange(stock: StockQuote): string {
    const sign = stock.changePercent > 0 ? '+' : '';
    return `${sign}${stock.changePercent.toFixed(2)}%`;
  }

  getStockLink(stock: StockQuote): string {
    return `/stock/${stock.symbol}`;
  }
}
