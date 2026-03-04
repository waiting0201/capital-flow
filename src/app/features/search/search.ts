import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Market, StockQuote } from '../../core/models';

type FlowStatus = 'inflow' | 'outflow' | 'neutral';

interface SearchStock extends StockQuote {
  flowStatus: FlowStatus;
  flowLabel: string;
  aiFlowSummary: string;
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
  readonly query = signal('');
  readonly marketFilter = signal<'all' | Market>('all');

  // ── Stock Data with Flow Status ──
  private readonly allStocks: SearchStock[] = [
    { symbol: '2330', name: '台積電 TSMC', market: 'tw', price: 852.00, change: 12.00, changePercent: 1.43, volume: 28543, updatedAt: '2026-02-28T13:30:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: '外資連續8日買超，籌碼向大戶集中', tags: ['AI', 'HPC', '晶圓代工'] },
    { symbol: '2317', name: '鴻海精密', market: 'tw', price: 178.00, change: -1.50, changePercent: -0.84, volume: 18562, updatedAt: '2026-02-28T13:30:00', flowStatus: 'outflow', flowLabel: '資金流出', aiFlowSummary: '外資連續賣超，電子組裝毛利壓力', tags: ['電子組裝', '電動車'] },
    { symbol: '2382', name: '廣達電腦', market: 'tw', price: 312.00, change: 12.35, changePercent: 4.12, volume: 15231, updatedAt: '2026-02-28T13:30:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: '投信連續加碼，AI 伺服器訂單催化', tags: ['AI', '伺服器', '雲端'] },
    { symbol: '2454', name: '聯發科技', market: 'tw', price: 1280.00, change: 25.00, changePercent: 1.99, volume: 8421, updatedAt: '2026-02-28T13:30:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: '天璣晶片需求回溫，外資轉買超', tags: ['IC 設計', '5G', 'AI'] },
    { symbol: '3034', name: '聯詠科技', market: 'tw', price: 528.00, change: 8.00, changePercent: 1.54, volume: 5234, updatedAt: '2026-02-28T13:30:00', flowStatus: 'neutral', flowLabel: '觀望', aiFlowSummary: '面板驅動 IC 需求回穩，法人觀望', tags: ['IC 設計', '面板'] },
    { symbol: '2303', name: '聯華電子', market: 'tw', price: 52.30, change: -0.40, changePercent: -0.76, volume: 42150, updatedAt: '2026-02-28T13:30:00', flowStatus: 'outflow', flowLabel: '資金流出', aiFlowSummary: '成熟製程競爭加劇，外資持續減碼', tags: ['半導體', '晶圓代工'] },
    { symbol: '3231', name: '緯創資通', market: 'tw', price: 118.50, change: 1.50, changePercent: 1.28, volume: 22874, updatedAt: '2026-02-28T13:30:00', flowStatus: 'neutral', flowLabel: '觀望', aiFlowSummary: '法人買賣分歧，等待營收數據確認', tags: ['AI', '伺服器', '代工'] },
    { symbol: '2345', name: '智邦科技', market: 'tw', price: 620.00, change: 15.00, changePercent: 2.48, volume: 3120, updatedAt: '2026-02-28T13:30:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: '網通設備需求成長，外資加碼', tags: ['網通', '5G'] },
    { symbol: '2308', name: '台達電子', market: 'tw', price: 385.00, change: -3.50, changePercent: -0.90, volume: 7850, updatedAt: '2026-02-28T13:30:00', flowStatus: 'neutral', flowLabel: '觀望', aiFlowSummary: '電源管理穩定但成長放緩', tags: ['電源', '電動車', 'AI'] },
    { symbol: '2881', name: '富邦金控', market: 'tw', price: 85.20, change: 0.80, changePercent: 0.95, volume: 15680, updatedAt: '2026-02-28T13:30:00', flowStatus: 'neutral', flowLabel: '觀望', aiFlowSummary: '金融股資金中性，等待升息訊號', tags: ['金融', '壽險'] },
    { symbol: '0050', name: '元大台灣50', market: 'tw', price: 168.25, change: 1.85, changePercent: 1.11, volume: 9870, updatedAt: '2026-02-28T13:30:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: 'ETF 資金持續淨流入，被動配置需求', tags: ['ETF', '高股息'] },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'us', price: 875.30, change: 15.65, changePercent: 1.82, volume: 41200000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'outflow', flowLabel: '資金流出', aiFlowSummary: '財報利多出盡，外資獲利了結中', tags: ['AI', 'GPU', '資料中心'] },
    { symbol: 'AAPL', name: 'Apple Inc.', market: 'us', price: 178.52, change: -0.95, changePercent: -0.53, volume: 52100000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'neutral', flowLabel: '觀望', aiFlowSummary: '法人買賣分歧，量能萎縮觀望', tags: ['消費電子', '生態系'] },
    { symbol: 'MSFT', name: 'Microsoft Corp.', market: 'us', price: 415.80, change: 3.20, changePercent: 0.78, volume: 22800000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: 'Azure 雲端成長強勁，機構加碼', tags: ['雲端', 'AI', 'SaaS'] },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'us', price: 174.65, change: 2.15, changePercent: 1.25, volume: 18500000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'neutral', flowLabel: '觀望', aiFlowSummary: '廣告營收穩定但 AI 投資回報待驗證', tags: ['廣告', 'AI', '雲端'] },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'us', price: 185.30, change: -1.20, changePercent: -0.64, volume: 32100000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'outflow', flowLabel: '資金流出', aiFlowSummary: '電商成長放緩，外資減持', tags: ['電商', '雲端', 'AI'] },
    { symbol: 'META', name: 'Meta Platforms', market: 'us', price: 502.15, change: 8.40, changePercent: 1.70, volume: 15400000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: 'Reels 廣告變現改善，機構加碼', tags: ['社群', '元宇宙', 'AI'] },
    { symbol: 'TSM', name: 'Taiwan Semiconductor ADR', market: 'us', price: 168.92, change: 2.45, changePercent: 1.47, volume: 12300000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: '追蹤台積電母股，法人同步買超', tags: ['半導體', 'AI'] },
    { symbol: 'AMD', name: 'Advanced Micro Devices', market: 'us', price: 178.40, change: 4.80, changePercent: 2.76, volume: 28600000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: 'MI300 訂單成長，AI 競爭力提升', tags: ['AI', 'GPU', '半導體'] },
    { symbol: 'AVGO', name: 'Broadcom Inc.', market: 'us', price: 1685.20, change: 28.50, changePercent: 1.72, volume: 4200000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'inflow', flowLabel: '資金流入', aiFlowSummary: 'AI 網路晶片需求爆發，機構追捧', tags: ['AI', '半導體', '網通'] },
    { symbol: 'TSLA', name: 'Tesla Inc.', market: 'us', price: 195.40, change: -5.60, changePercent: -2.79, volume: 68500000, updatedAt: '2026-02-27T16:00:00', flowStatus: 'outflow', flowLabel: '資金流出', aiFlowSummary: '銷量增速放緩，機構持續減持', tags: ['電動車', '能源', 'AI'] },
  ];

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

  readonly recentSearches = signal<string[]>(['2330', 'NVDA', '2382', 'AAPL', 'AI 人工智慧']);

  // ── Computed ──
  readonly hasQuery = computed(() => this.query().trim().length > 0);

  readonly filteredStocks = computed(() => {
    const q = this.query().trim().toLowerCase();
    const mkt = this.marketFilter();
    if (!q) return [];

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

  getStockLink(stock: SearchStock): string {
    return `/stock/${stock.symbol}`;
  }

  formatPrice(price: number): string {
    return price >= 1000 ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : price.toFixed(2);
  }

  formatChange(q: SearchStock): string {
    const sign = q.change > 0 ? '+' : '';
    return `${sign}${q.changePercent.toFixed(2)}%`;
  }
}
