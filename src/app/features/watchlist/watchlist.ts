import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { WatchlistApiService } from '../../core/services/watchlist-api.service';
import { StockApiService } from '../../core/services/stock-api.service';
import { ApiWatchlistQuote } from '../../core/models';

type FlowStatus = 'inflow' | 'outflow' | 'neutral';
type SortField = 'symbol' | 'price' | 'change' | 'volume';
type SortDir = 'asc' | 'desc';

interface WatchlistStock {
  symbol: string;
  name: string;
  market: 'tw' | 'us';
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  flowStatus: FlowStatus;
  flowLabel: string;
}

interface WatchlistCategory {
  id: number;
  name: string;
  color: string;
  stockSymbols: string[];
}

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './watchlist.html',
  styleUrl: './watchlist.scss',
})
export class Watchlist implements OnInit {
  private readonly watchlistApi = inject(WatchlistApiService);
  private readonly stockApi = inject(StockApiService);

  readonly isLoading = signal(true);

  // ── System Groups (non-deletable) ──
  readonly systemGroups = [
    { id: 'all', name: '全部' },
    { id: 'tw', name: '台股' },
    { id: 'us', name: '美股' },
  ];

  // ── User Categories ──
  readonly categories = signal<WatchlistCategory[]>([]);

  readonly activeGroup = signal('all');
  readonly sortField = signal<SortField>('change');
  readonly sortDir = signal<SortDir>('desc');
  readonly searchQuery = signal('');
  readonly showAddForm = signal(false);
  readonly newSymbol = signal('');

  // ── Category Management State ──
  readonly showCategoryPanel = signal(false);
  readonly editingCategoryId = signal<number | null>(null);
  readonly editingCategoryName = signal('');
  readonly editingCategoryColor = signal('#7C6BF0');
  readonly newCategoryName = signal('');
  readonly newCategoryColor = signal('#7C6BF0');
  readonly showNewCategoryForm = signal(false);

  // ── Stock-to-Category Assignment State ──
  readonly assigningStockSymbol = signal<string | null>(null);

  // ── Context Menu State ──
  readonly contextMenuCategoryId = signal<number | null>(null);
  readonly contextMenuPos = signal({ x: 0, y: 0 });

  // ── Delete Confirmation ──
  readonly deletingCategoryId = signal<number | null>(null);

  readonly categoryColors = [
    '#7C6BF0', '#E0924F', '#3A9EA5', '#D4596A',
    '#6BA368', '#8B7355', '#5B8BD4', '#C5A059',
  ];

  // ── Stock Data ──
  readonly stocks = signal<WatchlistStock[]>([]);

  // ── Computed ──
  readonly stats = computed(() => {
    const all = this.stocks();
    const inflow = all.filter(s => s.flowStatus === 'inflow').length;
    const outflow = all.filter(s => s.flowStatus === 'outflow').length;
    const neutral = all.filter(s => s.flowStatus === 'neutral').length;
    return { total: all.length, inflow, outflow, neutral };
  });

  readonly filteredStocks = computed(() => {
    let list = this.stocks();
    const group = this.activeGroup();
    const search = this.searchQuery().toLowerCase();

    if (group === 'tw') list = list.filter(s => s.market === 'tw');
    else if (group === 'us') list = list.filter(s => s.market === 'us');
    else if (typeof group === 'number' || (typeof group === 'string' && /^\d+$/.test(group))) {
      const catId = typeof group === 'number' ? group : parseInt(group, 10);
      const cat = this.categories().find(c => c.id === catId);
      if (cat) list = list.filter(s => cat.stockSymbols.includes(s.symbol));
    }

    if (search) {
      list = list.filter(s =>
        s.symbol.toLowerCase().includes(search) ||
        s.name.toLowerCase().includes(search)
      );
    }

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

  readonly activeGroupStockCount = computed(() => {
    const group = this.activeGroup();
    if (group === 'all') return this.stocks().length;
    if (group === 'tw') return this.stocks().filter(s => s.market === 'tw').length;
    if (group === 'us') return this.stocks().filter(s => s.market === 'us').length;
    const catId = typeof group === 'string' && /^\d+$/.test(group) ? parseInt(group, 10) : group;
    const cat = this.categories().find(c => c.id === catId);
    return cat ? cat.stockSymbols.length : 0;
  });

  ngOnInit(): void {
    this.loadWatchlist();
  }

  private loadWatchlist(): void {
    this.isLoading.set(true);

    this.watchlistApi.getWatchlist().subscribe({
      next: (data) => {
        // Set categories
        this.categories.set(data.categories);

        // Fetch quotes for all symbols
        if (data.symbols.length > 0) {
          this.stockApi.getWatchlistQuotes(data.symbols).subscribe({
            next: (quotes) => {
              this.stocks.set(this.mapQuotesToStocks(quotes));
              this.isLoading.set(false);
            },
            error: () => {
              // Still show stocks without quotes
              this.stocks.set(data.symbols.map(s => this.emptyStock(s)));
              this.isLoading.set(false);
            },
          });
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private mapQuotesToStocks(quotes: ApiWatchlistQuote[]): WatchlistStock[] {
    return quotes.map(q => {
      const isTw = /^\d/.test(q.symbol);
      const flowStatus: FlowStatus = q.changePercent > 1 ? 'inflow' : q.changePercent < -1 ? 'outflow' : 'neutral';
      return {
        symbol: q.symbol,
        name: q.name ?? q.symbol,
        market: isTw ? 'tw' as const : 'us' as const,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        volume: q.volume,
        flowStatus,
        flowLabel: flowStatus === 'inflow' ? '上漲' : flowStatus === 'outflow' ? '下跌' : '持平',
      };
    });
  }

  private emptyStock(symbol: string): WatchlistStock {
    const isTw = /^\d/.test(symbol);
    return {
      symbol,
      name: symbol,
      market: isTw ? 'tw' : 'us',
      price: 0, change: 0, changePercent: 0, volume: 0,
      flowStatus: 'neutral', flowLabel: '持平',
    };
  }

  // ── Methods ──
  setGroup(id: string): void {
    this.activeGroup.set(id);
    this.closeAllOverlays();
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

    this.watchlistApi.removeItem(symbol).subscribe({
      next: () => {
        this.stocks.update(list => list.filter(s => s.symbol !== symbol));
        this.categories.update(cats => cats.map(c => ({
          ...c,
          stockSymbols: c.stockSymbols.filter(s => s !== symbol),
        })));
      },
      error: () => alert('移除股票失敗，請確認已登入後再試'),
    });
  }

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) this.newSymbol.set('');
  }

  addStock(): void {
    const sym = this.newSymbol().trim().toUpperCase();
    if (!sym) return;
    if (this.stocks().some(s => s.symbol === sym)) return;

    this.watchlistApi.addItem(sym).subscribe({
      next: () => {
        // Fetch quote for the new stock
        this.stockApi.getWatchlistQuotes([sym]).subscribe({
          next: (quotes) => {
            if (quotes.length > 0) {
              this.stocks.update(list => [...this.mapQuotesToStocks(quotes), ...list]);
            } else {
              this.stocks.update(list => [this.emptyStock(sym), ...list]);
            }
          },
          error: () => {
            this.stocks.update(list => [this.emptyStock(sym), ...list]);
          },
        });

        // Auto-add to active category if viewing one
        const group = this.activeGroup();
        if (/^\d+$/.test(group)) {
          const catId = parseInt(group, 10);
          const cat = this.categories().find(c => c.id === catId);
          if (cat && !cat.stockSymbols.includes(sym)) {
            const newSymbols = [...cat.stockSymbols, sym];
            this.watchlistApi.setCategoryStocks(catId, newSymbols).subscribe();
            this.categories.update(cats => cats.map(c =>
              c.id === catId ? { ...c, stockSymbols: newSymbols } : c
            ));
          }
        }

        this.newSymbol.set('');
        this.showAddForm.set(false);
      },
      error: () => alert('新增股票失敗，請確認已登入後再試'),
    });
  }

  // ── Category CRUD ──
  toggleCategoryPanel(): void {
    this.showCategoryPanel.update(v => !v);
    if (!this.showCategoryPanel()) this.resetCategoryForm();
  }

  openNewCategoryForm(): void {
    this.showNewCategoryForm.set(true);
    this.newCategoryName.set('');
    this.newCategoryColor.set(this.getNextColor());
  }

  createCategory(): void {
    const name = this.newCategoryName().trim();
    if (!name) return;
    const color = this.newCategoryColor();

    this.watchlistApi.createCategory(name, color).subscribe({
      next: (cat) => {
        this.categories.update(cats => [...cats, {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          stockSymbols: [],
        }]);
        this.showNewCategoryForm.set(false);
        this.newCategoryName.set('');
      },
      error: (err) => {
        console.error('建立分類失敗:', err);
        alert('建立分類失敗，請確認已登入後再試');
      },
    });
  }

  startEditCategory(cat: WatchlistCategory, event: Event): void {
    event.stopPropagation();
    this.editingCategoryId.set(cat.id);
    this.editingCategoryName.set(cat.name);
    this.editingCategoryColor.set(cat.color);
    this.contextMenuCategoryId.set(null);
  }

  saveEditCategory(): void {
    const id = this.editingCategoryId();
    if (!id) return;
    const name = this.editingCategoryName().trim();
    if (!name) return;
    const color = this.editingCategoryColor();

    this.watchlistApi.updateCategory(id, name, color).subscribe({
      next: () => {
        this.categories.update(cats => cats.map(c =>
          c.id === id ? { ...c, name, color } : c
        ));
        this.editingCategoryId.set(null);
      },
      error: () => alert('更新分類失敗，請確認已登入後再試'),
    });
  }

  cancelEditCategory(): void {
    this.editingCategoryId.set(null);
  }

  confirmDeleteCategory(id: number, event: Event): void {
    event.stopPropagation();
    this.deletingCategoryId.set(id);
    this.contextMenuCategoryId.set(null);
  }

  deleteCategory(id: number): void {
    this.watchlistApi.deleteCategory(id).subscribe({
      next: () => {
        this.categories.update(cats => cats.filter(c => c.id !== id));
        if (this.activeGroup() === String(id)) this.activeGroup.set('all');
        this.deletingCategoryId.set(null);
      },
      error: () => {
        this.deletingCategoryId.set(null);
        alert('刪除分類失敗，請確認已登入後再試');
      },
    });
  }

  cancelDelete(): void {
    this.deletingCategoryId.set(null);
  }

  // ── Stock ↔ Category Assignment ──
  readonly assignPanelPos = signal({ x: 0, y: 0 });

  toggleAssignPanel(symbol: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.assigningStockSymbol() === symbol) {
      this.assigningStockSymbol.set(null);
    } else {
      const el = event.target as HTMLElement;
      const rect = el.closest('button')?.getBoundingClientRect() ?? el.getBoundingClientRect();
      this.assignPanelPos.set({ x: rect.left, y: rect.bottom + 6 });
      this.assigningStockSymbol.set(symbol);
    }
  }

  isStockInCategory(symbol: string, categoryId: number): boolean {
    const cat = this.categories().find(c => c.id === categoryId);
    return cat ? cat.stockSymbols.includes(symbol) : false;
  }

  toggleStockCategory(symbol: string, categoryId: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const cat = this.categories().find(c => c.id === categoryId);
    if (!cat) return;

    const has = cat.stockSymbols.includes(symbol);
    const newSymbols = has
      ? cat.stockSymbols.filter(s => s !== symbol)
      : [...cat.stockSymbols, symbol];

    this.watchlistApi.setCategoryStocks(categoryId, newSymbols).subscribe({
      next: () => {
        this.categories.update(cats => cats.map(c =>
          c.id === categoryId ? { ...c, stockSymbols: newSymbols } : c
        ));
      },
    });
  }

  getStockCategories(symbol: string): WatchlistCategory[] {
    return this.categories().filter(c => c.stockSymbols.includes(symbol));
  }

  getCategoryStockCount(categoryId: number): number {
    const cat = this.categories().find(c => c.id === categoryId);
    return cat ? cat.stockSymbols.length : 0;
  }

  // ── Context Menu ──
  openContextMenu(catId: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuCategoryId.set(catId);
    this.contextMenuPos.set({ x: event.clientX, y: event.clientY });
  }

  closeContextMenu(): void {
    this.contextMenuCategoryId.set(null);
  }

  // ── Helpers ──
  closeAllOverlays(): void {
    this.assigningStockSymbol.set(null);
    this.contextMenuCategoryId.set(null);
  }

  resetCategoryForm(): void {
    this.showNewCategoryForm.set(false);
    this.editingCategoryId.set(null);
    this.newCategoryName.set('');
  }

  getNextColor(): string {
    const used = this.categories().map(c => c.color);
    return this.categoryColors.find(c => !used.includes(c)) || this.categoryColors[0];
  }

  onBackdropClick(): void {
    this.assigningStockSymbol.set(null);
    this.contextMenuCategoryId.set(null);
    this.deletingCategoryId.set(null);
  }

  formatPrice(price: number): string {
    return price >= 1000 ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : price.toFixed(2);
  }

  formatChange(stock: WatchlistStock): string {
    const sign = stock.changePercent > 0 ? '+' : '';
    return `${sign}${stock.changePercent.toFixed(2)}%`;
  }

  getStockLink(stock: WatchlistStock): string {
    return `/stock/${stock.symbol}`;
  }
}
