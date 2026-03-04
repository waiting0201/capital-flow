import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockQuote } from '../../core/models';

type FlowStatus = 'inflow' | 'outflow' | 'neutral';
type SortField = 'symbol' | 'price' | 'change' | 'volume';
type SortDir = 'asc' | 'desc';

interface WatchlistStock extends StockQuote {
  flowStatus: FlowStatus;
  flowLabel: string;
  aiFlowSummary: string;
}

interface WatchlistCategory {
  id: string;
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
export class Watchlist {
  // ── System Groups (non-deletable) ──
  readonly systemGroups = [
    { id: 'all', name: '全部' },
    { id: 'tw', name: '台股' },
    { id: 'us', name: '美股' },
  ];

  // ── User Categories ──
  readonly categories = signal<WatchlistCategory[]>([
    { id: 'cat-ai', name: 'AI 族群', color: '#7C6BF0', stockSymbols: ['2330', 'NVDA', '2382', '3231', '2454', 'AMD', 'TSM'] },
    { id: 'cat-div', name: '高股息', color: '#E0924F', stockSymbols: ['2330', '2317', '2603'] },
    { id: 'cat-core', name: '核心持股', color: '#3A9EA5', stockSymbols: ['2330', 'AAPL', 'MSFT', '2454'] },
  ]);

  readonly activeGroup = signal('all');
  readonly sortField = signal<SortField>('change');
  readonly sortDir = signal<SortDir>('desc');
  readonly searchQuery = signal('');
  readonly showAddForm = signal(false);
  readonly newSymbol = signal('');

  // ── Category Management State ──
  readonly showCategoryPanel = signal(false);
  readonly editingCategoryId = signal<string | null>(null);
  readonly editingCategoryName = signal('');
  readonly editingCategoryColor = signal('#7C6BF0');
  readonly newCategoryName = signal('');
  readonly newCategoryColor = signal('#7C6BF0');
  readonly showNewCategoryForm = signal(false);

  // ── Stock-to-Category Assignment State ──
  readonly assigningStockSymbol = signal<string | null>(null);

  // ── Context Menu State ──
  readonly contextMenuCategoryId = signal<string | null>(null);
  readonly contextMenuPos = signal({ x: 0, y: 0 });

  // ── Delete Confirmation ──
  readonly deletingCategoryId = signal<string | null>(null);

  readonly categoryColors = [
    '#7C6BF0', '#E0924F', '#3A9EA5', '#D4596A',
    '#6BA368', '#8B7355', '#5B8BD4', '#C5A059',
  ];

  // ── Stock Data (with flow status) ──
  readonly stocks = signal<WatchlistStock[]>([
    { symbol: '2330', name: '台積電 TSMC', market: 'tw', price: 852.00, change: 12.00, changePercent: 1.43, volume: 28543, updatedAt: '2026-02-28T13:30:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: '外資連續8日買超，籌碼向大戶集中' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'us', price: 875.30, change: 15.65, changePercent: 1.82, volume: 41200000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'outflow', flowLabel: '資金流出', aiFlowSummary: '財報利多出盡，外資獲利了結中' },
    { symbol: '2382', name: '廣達電腦', market: 'tw', price: 312.00, change: 12.35, changePercent: 4.12, volume: 15231, updatedAt: '2026-02-28T13:30:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: '投信連續加碼，AI 伺服器訂單催化' },
    { symbol: 'AAPL', name: 'Apple Inc.', market: 'us', price: 178.52, change: -0.95, changePercent: -0.53, volume: 52100000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'neutral', flowLabel: '資金觀望', aiFlowSummary: '法人買賣分歧，量能萎縮觀望' },
    { symbol: '3231', name: '緯創資通', market: 'tw', price: 118.50, change: 1.75, changePercent: 1.50, volume: 22874, updatedAt: '2026-02-28T13:30:00', flowStatus: 'neutral', flowLabel: '資金觀望', aiFlowSummary: '法人買賣分歧，等待營收數據確認' },
    { symbol: '2317', name: '鴻海精密', market: 'tw', price: 178.00, change: -1.50, changePercent: -0.84, volume: 18562, updatedAt: '2026-02-28T13:30:00', flowStatus: 'outflow', flowLabel: '資金流出', aiFlowSummary: '外資連續賣超，電子組裝毛利壓力' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', market: 'us', price: 415.80, change: 3.22, changePercent: 0.78, volume: 22300000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: 'Azure 雲端營收成長強勁，機構加碼' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'us', price: 172.35, change: -1.18, changePercent: -0.68, volume: 18900000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'neutral', flowLabel: '資金觀望', aiFlowSummary: '廣告營收穩定但 AI 投資回報待驗證' },
    { symbol: '2454', name: '聯發科技', market: 'tw', price: 1280.00, change: 25.00, changePercent: 1.99, volume: 8421, updatedAt: '2026-02-28T13:30:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: '天璣晶片需求回溫，外資轉買超' },
    { symbol: 'TSM', name: 'Taiwan Semi ADR', market: 'us', price: 168.42, change: 2.35, changePercent: 1.42, volume: 15600000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: '追蹤台積電母股，法人同步買超' },
    { symbol: '2603', name: '長榮海運', market: 'tw', price: 178.50, change: -3.50, changePercent: -1.92, volume: 32145, updatedAt: '2026-02-28T13:30:00', flowStatus: 'outflow', flowLabel: '資金流出', aiFlowSummary: '運價回落，外資持續減碼航運股' },
    { symbol: 'AMD', name: 'AMD Inc.', market: 'us', price: 178.90, change: 5.42, changePercent: 3.13, volume: 35800000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: 'MI300 晶片訂單成長，AI 競爭力提升' },
  ]);

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

    // System group filter
    if (group === 'tw') list = list.filter(s => s.market === 'tw');
    else if (group === 'us') list = list.filter(s => s.market === 'us');
    // User category filter
    else if (group.startsWith('cat-')) {
      const cat = this.categories().find(c => c.id === group);
      if (cat) list = list.filter(s => cat.stockSymbols.includes(s.symbol));
    }

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

  readonly activeGroupStockCount = computed(() => {
    const group = this.activeGroup();
    if (group === 'all') return this.stocks().length;
    if (group === 'tw') return this.stocks().filter(s => s.market === 'tw').length;
    if (group === 'us') return this.stocks().filter(s => s.market === 'us').length;
    const cat = this.categories().find(c => c.id === group);
    return cat ? cat.stockSymbols.length : 0;
  });

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
    this.stocks.update(list => list.filter(s => s.symbol !== symbol));
    // Also remove from all categories
    this.categories.update(cats => cats.map(c => ({
      ...c,
      stockSymbols: c.stockSymbols.filter(s => s !== symbol),
    })));
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
    const newStock: WatchlistStock = {
      symbol: sym,
      name: sym,
      market: isTw ? 'tw' : 'us',
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      updatedAt: new Date().toISOString(),
      flowStatus: 'neutral',
      flowLabel: '資金觀望',
      aiFlowSummary: '尚無資金流向分析',
    };
    this.stocks.update(list => [newStock, ...list]);

    // If current view is a category, auto-add to that category
    const group = this.activeGroup();
    if (group.startsWith('cat-')) {
      this.categories.update(cats => cats.map(c =>
        c.id === group && !c.stockSymbols.includes(sym)
          ? { ...c, stockSymbols: [...c.stockSymbols, sym] }
          : c
      ));
    }

    this.newSymbol.set('');
    this.showAddForm.set(false);
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
    const id = 'cat-' + Date.now().toString(36);
    const color = this.newCategoryColor();
    this.categories.update(cats => [...cats, { id, name, color, stockSymbols: [] }]);
    this.showNewCategoryForm.set(false);
    this.newCategoryName.set('');
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
    this.categories.update(cats => cats.map(c =>
      c.id === id ? { ...c, name, color } : c
    ));
    this.editingCategoryId.set(null);
  }

  cancelEditCategory(): void {
    this.editingCategoryId.set(null);
  }

  confirmDeleteCategory(id: string, event: Event): void {
    event.stopPropagation();
    this.deletingCategoryId.set(id);
    this.contextMenuCategoryId.set(null);
  }

  deleteCategory(id: string): void {
    this.categories.update(cats => cats.filter(c => c.id !== id));
    if (this.activeGroup() === id) this.activeGroup.set('all');
    this.deletingCategoryId.set(null);
  }

  cancelDelete(): void {
    this.deletingCategoryId.set(null);
  }

  // ── Stock ↔ Category Assignment ──
  toggleAssignPanel(symbol: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.assigningStockSymbol.update(v => v === symbol ? null : symbol);
  }

  isStockInCategory(symbol: string, categoryId: string): boolean {
    const cat = this.categories().find(c => c.id === categoryId);
    return cat ? cat.stockSymbols.includes(symbol) : false;
  }

  toggleStockCategory(symbol: string, categoryId: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.categories.update(cats => cats.map(c => {
      if (c.id !== categoryId) return c;
      const has = c.stockSymbols.includes(symbol);
      return {
        ...c,
        stockSymbols: has
          ? c.stockSymbols.filter(s => s !== symbol)
          : [...c.stockSymbols, symbol],
      };
    }));
  }

  getStockCategories(symbol: string): WatchlistCategory[] {
    return this.categories().filter(c => c.stockSymbols.includes(symbol));
  }

  getCategoryStockCount(categoryId: string): number {
    const cat = this.categories().find(c => c.id === categoryId);
    return cat ? cat.stockSymbols.length : 0;
  }

  // ── Context Menu ──
  openContextMenu(catId: string, event: MouseEvent): void {
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
