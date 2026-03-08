import { Component, input, signal, computed, effect, inject, DestroyRef } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import {
  Market, StockQuote, StockProfile,
  ApiStockQuote, ApiOhlc, ApiAiIndustryChain, ApiVolumeAnomaly,
  ApiMoneyFlowSummary, ApiMoneyFlowReport, ApiChipAiAnalysis,
  ApiMarginAiAnalysis, ApiFundamentalAttraction,
  ApiInstitutionalTrading, ApiMarginTrading,
} from '../../../core/models';
import { StockApiService } from '../../../core/services/stock-api.service';
import { WatchlistApiService } from '../../../core/services/watchlist-api.service';
import { AiDisclaimer } from '../../../shared/components/ai-disclaimer/ai-disclaimer';
import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis,
  ApexPlotOptions, ApexDataLabels, ApexStroke, ApexTooltip,
  ApexGrid, ApexLegend,
} from 'ng-apexcharts';

type ChartRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'YTD';
type StockTab = 'flow' | 'chip' | 'catalyst';
type FlowDirection = 'inflow' | 'outflow' | 'neutral';
type CatalystStrength = 'strong' | 'medium' | 'weak';
type DimensionSignal = 'positive' | 'neutral' | 'negative';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [RouterLink, NgApexchartsModule, DecimalPipe, SlicePipe, AiDisclaimer],
  templateUrl: './stock-detail.html',
  styleUrl: './stock-detail.scss',
})
export class StockDetail {
  private readonly stockApi = inject(StockApiService);
  private readonly watchlistApi = inject(WatchlistApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly symbol = input.required<string>();

  readonly activeTab = signal<StockTab>('flow');
  readonly chartRange = signal<ChartRange>('1M');
  readonly chartRanges: ChartRange[] = ['1D', '5D', '1M', '3M', '6M', '1Y', 'YTD'];
  readonly isLoading = signal(true);

  // ── ApexCharts Options ──
  candleSeries = signal<ApexAxisChartSeries>([]);
  volumeSeries = signal<ApexAxisChartSeries>([]);

  readonly candleChart: ApexChart = { type: 'candlestick', height: 340, toolbar: { show: true, autoSelected: 'pan', tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } }, background: 'transparent' };
  readonly volumeChart: ApexChart = { type: 'bar', height: 120, toolbar: { show: false }, background: 'transparent' };
  readonly candleOptions: ApexPlotOptions = { candlestick: { colors: { upward: '#E14F4F', downward: '#22C1A1' }, wick: { useFillColor: true } } };
  readonly xAxis: ApexXAxis = { type: 'datetime', labels: { style: { colors: '#999EA2', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }, datetimeUTC: false }, axisBorder: { color: 'rgba(58,99,81,0.12)' }, axisTicks: { color: 'rgba(58,99,81,0.12)' } };
  readonly candleYAxis: ApexYAxis = { tooltip: { enabled: true }, labels: { style: { colors: '#999EA2', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }, formatter: (v: number) => v >= 1000 ? v.toLocaleString() : v.toFixed(2) } };
  readonly volumeYAxis: ApexYAxis = { labels: { style: { colors: '#999EA2', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }, formatter: (v: number) => v >= 1_000_000 ? (v / 1_000_000).toFixed(0) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v.toString() } };
  readonly dataLabels: ApexDataLabels = { enabled: false };
  readonly stroke: ApexStroke = { width: 1 };
  readonly grid: ApexGrid = { borderColor: 'rgba(58,99,81,0.08)', strokeDashArray: 3, xaxis: { lines: { show: false } } };
  readonly legend: ApexLegend = { show: false };
  readonly candleTooltip: ApexTooltip = { theme: 'light', style: { fontFamily: 'Noto Sans TC, sans-serif', fontSize: '11px' } };
  readonly volumeTooltip: ApexTooltip = { enabled: true, theme: 'light', style: { fontFamily: 'Noto Sans TC, sans-serif', fontSize: '11px' }, y: { formatter: (v: number) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M' : v.toLocaleString() } };

  // ── Live data signals ──
  private readonly liveQuote = signal<ApiStockQuote | null>(null);
  private readonly historyData = signal<ApiOhlc[]>([]);

  // ── AI signals ──
  readonly aiIndustryChain = signal<ApiAiIndustryChain | null>(null);
  readonly aiLoading = signal(false);
  readonly volumeAnomaly = signal<ApiVolumeAnomaly | null>(null);

  // ── MFIE signals ──
  readonly mfieSummary = signal<ApiMoneyFlowSummary | null>(null);
  readonly mfieReport = signal<ApiMoneyFlowReport | null>(null);
  readonly mfieLoading = signal(false);
  readonly chipAiAnalysis = signal<ApiChipAiAnalysis | null>(null);
  readonly marginAiAnalysis = signal<ApiMarginAiAnalysis | null>(null);
  readonly fundamentalAttraction = signal<ApiFundamentalAttraction | null>(null);

  // ── Chip data signals ──
  readonly institutionalData = signal<ApiInstitutionalTrading[]>([]);
  readonly marginData = signal<ApiMarginTrading[]>([]);

  // Track which tabs have been loaded to avoid duplicate fetches
  private loadedTabs = new Set<StockTab>();

  constructor() {
    effect(() => {
      const sym = this.symbol();
      this.loadedTabs.clear();
      this.loadStockData(sym);
    });

    effect(() => {
      this.chartRange();
      this.buildChartFromHistory();
    });

    // Lazy-load tab data when user switches tabs
    effect(() => {
      const tab = this.activeTab();
      const sym = this.symbol();
      if (!sym || this.loadedTabs.has(tab)) return;
      this.loadedTabs.add(tab);

      if (tab === 'flow') {
        this.loadFlowTabData(sym);
      } else if (tab === 'chip') {
        this.loadChipTabData(sym);
      }
    });
  }

  private loadStockData(sym: string): void {
    this.isLoading.set(true);
    this.aiLoading.set(true);
    const market = /^\d/.test(sym) ? 'TW' : 'US';

    forkJoin({
      quote: this.stockApi.getQuote(sym, market).pipe(catchError(() => of(null))),
      history: this.stockApi.getHistory(sym, market, 252).pipe(catchError(() => of([] as ApiOhlc[]))),
      watchlist: this.watchlistApi.getWatchlist().pipe(catchError(() => of({ symbols: [] as string[], categories: [] }))),
      aiIndustry: this.stockApi.getAiIndustryChain(sym).pipe(catchError(() => of(null))),
      volumeAnomaly: this.stockApi.getVolumeAnomaly(sym, market).pipe(catchError(() => of(null))),
      mfieSummary: this.stockApi.getMoneyFlowSummary(sym).pipe(catchError(() => of(null))),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ quote, history, watchlist, aiIndustry, volumeAnomaly, mfieSummary }) => {
      this.liveQuote.set(quote);
      this.historyData.set(history);
      this.isInWatchlist.set(watchlist.symbols.includes(sym));
      this.aiIndustryChain.set(aiIndustry);
      this.volumeAnomaly.set(volumeAnomaly);
      this.mfieSummary.set(mfieSummary);
      this.aiLoading.set(false);
      this.isLoading.set(false);
      this.buildChartFromHistory();
    });
  }

  private loadFlowTabData(sym: string): void {
    this.mfieLoading.set(true);
    forkJoin({
      report: this.stockApi.getMoneyFlowReport(sym).pipe(catchError(() => of(null))),
      fundamental: this.stockApi.getFundamentalAttraction(sym).pipe(catchError(() => of(null))),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ report, fundamental }) => {
      this.mfieReport.set(report);
      this.fundamentalAttraction.set(fundamental);
      this.mfieLoading.set(false);
    });
  }

  private loadChipTabData(sym: string): void {
    const market = /^\d/.test(sym) ? 'TW' : 'US';
    forkJoin({
      institutional: this.stockApi.getInstitutionalTrading(sym, market).pipe(catchError(() => of([]))),
      margin: this.stockApi.getMarginTrading(sym, market).pipe(catchError(() => of([]))),
      chipAi: this.stockApi.getChipAiAnalysis(sym).pipe(catchError(() => of(null))),
      marginAi: this.stockApi.getMarginAiAnalysis(sym).pipe(catchError(() => of(null))),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ institutional, margin, chipAi, marginAi }) => {
      this.institutionalData.set(institutional);
      this.marginData.set(margin);
      this.chipAiAnalysis.set(chipAi);
      this.marginAiAnalysis.set(marginAi);
    });
  }

  // ── Quote (real data with fallback) ──
  readonly quote = computed<StockQuote>(() => {
    const sym = this.symbol();
    const live = this.liveQuote();
    if (live) {
      return {
        symbol: live.symbol,
        name: live.nameZh ?? live.nameEn,
        market: (live.market === 'TW' ? 'tw' : 'us') as Market,
        price: live.price,
        change: live.change,
        changePercent: live.changePercent,
        volume: live.volume,
        updatedAt: live.timestamp,
      };
    }
    return {
      symbol: sym, name: sym, market: (/^\d/.test(sym) ? 'tw' : 'us') as Market,
      price: 0, change: 0, changePercent: 0, volume: 0, updatedAt: '',
    };
  });

  readonly profile = computed<StockProfile>(() => {
    const sym = this.symbol();
    const live = this.liveQuote();
    const ai = this.aiIndustryChain();
    return {
      symbol: sym,
      name: live?.nameZh ?? live?.nameEn ?? sym,
      market: (/^\d/.test(sym) ? 'tw' : 'us') as Market,
      industry: '—',
      description: '',
      aiIntroduction: ai?.content,
    };
  });

  // ── 資金流向摘要 ──
  readonly moneyFlowSummary = computed(() => {
    const s = this.mfieSummary();
    if (!s) return { direction: 'neutral' as FlowDirection, label: '分析中...', strength: '—', conclusion: '正在取得資金流向分析...' };
    const dirMap: Record<string, FlowDirection> = { Inflow: 'inflow', Outflow: 'outflow', Neutral: 'neutral' };
    const labelMap: Record<string, string> = { Inflow: '資金流入', Outflow: '資金流出', Neutral: '資金中性' };
    const strengthMap: Record<string, string> = { Strong: '強', Moderate: '中', Weak: '弱' };
    return {
      direction: dirMap[s.flowDirection] ?? 'neutral',
      label: labelMap[s.flowDirection] ?? '資金中性',
      strength: strengthMap[s.flowStrength] ?? s.flowStrength,
      conclusion: s.summary,
    };
  });

  // ── Tab: 資金分析 (MFIE Report) ──
  readonly flowReport = computed(() => this.mfieReport());
  readonly flowSignals = computed(() => {
    const s = this.mfieReport()?.signals;
    if (!s) return [];
    const mapSignal = (sig: string): DimensionSignal =>
      sig === 'Positive' ? 'positive' : sig === 'Negative' ? 'negative' : 'neutral';
    return [
      { name: '籌碼面', signal: mapSignal(s.chipSignal), summary: s.chipDetail ?? '—' },
      { name: '融資融券', signal: mapSignal(s.marginSignal), summary: s.marginDetail ?? '—' },
      { name: '基本面', signal: mapSignal(s.fundamentalSignal), summary: s.fundamentalDetail ?? '—' },
      { name: '量能面', signal: mapSignal(s.volumeSignal), summary: s.volumeDetail ?? '—' },
    ];
  });
  readonly flowFundamental = computed(() => this.fundamentalAttraction());

  // ── Tab: 籌碼動態 (real data) ──
  readonly latestInstitutional = computed(() => this.institutionalData()[0] ?? null);
  readonly latestMargin = computed(() => this.marginData()[0] ?? null);

  // ── Tab: 催化事件 (Phase 3 — placeholder) ──
  readonly catalystSummary = { strong: 0, medium: 0, weak: 0 };
  readonly catalysts: { strength: CatalystStrength; title: string; time: string; source: string; aiConclusion: string; aiReason: string; impactType: string; duration: string }[] = [];

  // ── Watchlist & Alert State ──
  readonly isInWatchlist = signal(false);

  // ── Computed ──
  readonly keyMetrics = computed(() => {
    const q = this.quote();
    const live = this.liveQuote();
    const isTw = q.market === 'tw';
    return [
      { label: '成交量', value: isTw ? q.volume.toLocaleString() + ' 張' : this.fmtVol(q.volume) },
      { label: '開盤', value: live?.open != null ? this.fmt(live.open) : '—' },
      { label: '最高', value: live?.high != null ? this.fmt(live.high) : '—' },
      { label: '最低', value: live?.low != null ? this.fmt(live.low) : '—' },
    ];
  });

  // ── Methods ──
  setTab(tab: StockTab): void { this.activeTab.set(tab); }
  setChartRange(range: ChartRange): void { this.chartRange.set(range); }

  regenerateMfie(): void {
    this.mfieLoading.set(true);
    forkJoin({
      summary: this.stockApi.getMoneyFlowSummary(this.symbol(), true).pipe(catchError(() => of(null))),
      report: this.stockApi.getMoneyFlowReport(this.symbol(), true).pipe(catchError(() => of(null))),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ summary, report }) => {
        this.mfieSummary.set(summary);
        this.mfieReport.set(report);
        this.mfieLoading.set(false);
      });
  }

  fmtNet(v: number | null | undefined): string {
    if (v == null) return '—';
    const sign = v > 0 ? '+' : '';
    return `${sign}${v.toLocaleString()}`;
  }

  fmtStreak(days: number | null | undefined): string {
    if (days == null || days === 0) return '—';
    return days > 0 ? `買超${days}天` : `賣超${Math.abs(days)}天`;
  }

  fmtMarginChange(v: number | null | undefined): string {
    if (v == null) return '— 持平';
    if (v === 0) return '─ 持平';
    return v > 0 ? `▲${v.toLocaleString()}` : `▼${Math.abs(v).toLocaleString()}`;
  }

  regenerateAiIndustry(): void {
    this.aiLoading.set(true);
    this.stockApi.getAiIndustryChain(this.symbol(), true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => { this.aiIndustryChain.set(result); this.aiLoading.set(false); },
        error: () => { this.aiLoading.set(false); },
      });
  }
  toggleWatchlist(): void {
    const sym = this.symbol();
    const inList = this.isInWatchlist();
    const op = inList ? this.watchlistApi.removeItem(sym) : this.watchlistApi.addItem(sym);
    op.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.isInWatchlist.set(!inList),
    });
  }

  formatPrice(price: number): string {
    if (price === 0) return '—';
    return price >= 1000 ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : price.toFixed(2);
  }

  formatChange(q: StockQuote): string {
    if (q.price === 0) return '';
    const sign = q.change > 0 ? '+' : '';
    return `${sign}${q.change.toFixed(2)} (${sign}${q.changePercent.toFixed(2)}%)`;
  }

  getSignalClass(signal: DimensionSignal): string {
    if (signal === 'positive') return 'sig-positive';
    if (signal === 'negative') return 'sig-negative';
    return 'sig-neutral';
  }

  getSignalLabel(signal: DimensionSignal): string {
    if (signal === 'positive') return '▲ 正面';
    if (signal === 'negative') return '▼ 負面';
    return '─ 中性';
  }

  getStrengthClass(s: CatalystStrength): string {
    if (s === 'strong') return 'catalyst-strong';
    if (s === 'medium') return 'catalyst-medium';
    return 'catalyst-weak';
  }

  getStrengthLabel(s: CatalystStrength): string {
    if (s === 'strong') return '強催化';
    if (s === 'medium') return '中催化';
    return '弱催化';
  }

  private fmt(n: number): string {
    return n >= 1000 ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : n.toFixed(2);
  }

  private fmtVol(v: number): string {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
    return v.toString();
  }

  // ── Chart from real history ──
  private buildChartFromHistory(): void {
    const allData = this.historyData();
    if (allData.length === 0) return;

    const days = this.getRangeDays(this.chartRange());
    const data = allData.slice(-days);

    this.candleSeries.set([{
      name: 'K線',
      data: data.map(d => ({
        x: new Date(d.tradingDate).getTime(),
        y: [d.open, d.high, d.low, d.close],
      })),
    }]);
    this.volumeSeries.set([{
      name: '成交量',
      data: data.map(d => ({
        x: new Date(d.tradingDate).getTime(),
        y: d.volume,
        fillColor: d.close >= d.open ? '#E14F4F' : '#22C1A1',
      })),
    }]);
  }

  private getRangeDays(range: ChartRange): number {
    switch (range) {
      case '1D': return 1; case '5D': return 5; case '1M': return 22;
      case '3M': return 66; case '6M': return 132; case '1Y': return 252; case 'YTD': return 60;
    }
  }
}
