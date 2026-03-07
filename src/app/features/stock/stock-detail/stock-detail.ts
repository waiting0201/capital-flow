import { Component, input, signal, computed, effect, inject, DestroyRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import { Market, StockQuote, StockProfile, KLineData, ApiStockQuote, ApiOhlc } from '../../../core/models';
import { StockApiService } from '../../../core/services/stock-api.service';
import { WatchlistApiService } from '../../../core/services/watchlist-api.service';
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
  imports: [RouterLink, NgApexchartsModule, DecimalPipe],
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

  constructor() {
    effect(() => {
      const sym = this.symbol();
      this.loadStockData(sym);
    });

    effect(() => {
      this.chartRange();
      this.buildChartFromHistory();
    });
  }

  private loadStockData(sym: string): void {
    this.isLoading.set(true);
    const market = /^\d/.test(sym) ? 'TW' : 'US';
    const limitMap: Record<ChartRange, number> = { '1D': 1, '5D': 5, '1M': 22, '3M': 66, '6M': 132, '1Y': 252, 'YTD': 60 };

    forkJoin({
      quote: this.stockApi.getQuote(sym, market).pipe(catchError(() => of(null))),
      history: this.stockApi.getHistory(sym, market, 252).pipe(catchError(() => of([] as ApiOhlc[]))),
      watchlist: this.watchlistApi.getWatchlist().pipe(catchError(() => of({ symbols: [] as string[], categories: [] }))),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ quote, history, watchlist }) => {
      this.liveQuote.set(quote);
      this.historyData.set(history);
      this.isInWatchlist.set(watchlist.symbols.includes(sym));
      this.isLoading.set(false);
      this.buildChartFromHistory();
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
    return {
      symbol: sym,
      name: live?.nameZh ?? live?.nameEn ?? sym,
      market: (/^\d/.test(sym) ? 'tw' : 'us') as Market,
      industry: '—',
      description: '',
    };
  });

  // ── 資金流向摘要 ──
  readonly moneyFlowSummary = computed(() => {
    return {
      direction: 'inflow' as FlowDirection,
      label: '資金流入',
      strength: '強',
      conclusion: '外資連續 8 日買超 + Q3 營收年增 42% 吸引法人加碼，籌碼持續向大戶集中。量價配合，短期動能仍在。',
    };
  });

  // ── Tab: 資金分析 ──
  readonly flowAnalysis = {
    conclusion: {
      direction: 'inflow' as FlowDirection,
      strength: '強',
      mainForce: '外資（連續 8 日買超，累計 +28,500 張）',
      basis: '法人買賣超數據 + 集保分散表大戶比例上升',
    },
    whyIn: {
      factors: [
        { title: '基本面吸引力高', basis: '財務數據', detail: 'Q3 營收年增 42%，AI 相關營收佔比提升至 15%，毛利率維持 57% → 成長動能強勁，吸引法人持續加碼配置。' },
        { title: '催化事件共振', basis: '新聞 + 產業動態', detail: 'NVIDIA 追加 CoWoS 訂單 + 法說會上調財測，兩個正面催化在同一週出現，加速資金進場。' },
        { title: '籌碼面確認', basis: '法人買賣超 + 集保', detail: '外資與投信同步買進，大戶持股比例連 3 週上升，代表「聰明錢」正在進場。' },
      ],
    },
    whyOut: {
      factors: [
        { title: '融資斷頭', basis: '融資餘額變化', detail: '融資餘額從上週 15,000 張降至 12,500 張，顯示前期追高的散戶在近期震盪中被迫出場。' },
        { title: '自營商短線獲利了結', basis: '法人買賣超', detail: '自營商今日小幅賣超 120 張，屬於正常短線操作，不影響中期趨勢。' },
      ],
    },
    dimensions: [
      { name: '籌碼面', signal: 'positive' as DimensionSignal, summary: '外資+投信連買，大戶持股↑' },
      { name: '基本面', signal: 'positive' as DimensionSignal, summary: '營收年增42%，毛利率57%' },
      { name: '消息面', signal: 'positive' as DimensionSignal, summary: '法說會上調財測，NVIDIA加單' },
      { name: '技術面', signal: 'positive' as DimensionSignal, summary: '量價配合，站穩所有均線上方' },
      { name: '總經面', signal: 'neutral' as DimensionSignal, summary: 'Fed利率持平，外資持續匯入' },
    ],
    sustainability: '目前四個維度同時偏多，資金流入動能強勁。預估可持續 2-4 週，除非出現以下轉折條件：外資轉為連續賣超 3 日以上、成交量連續萎縮至均量以下、出現高催化強度的負面新聞。',
    timing: { label: '合理持有', color: 'amber' as const, detail: '股價位於近一年 75% 位置，不算便宜但考量成長動能與資金持續流入，估值仍在合理範圍。', support: '$780～$800', resistance: '$880～$900' },
    risks: [
      { name: '地緣政治', severity: '高', detail: '台海局勢可能衝擊外資' },
      { name: '景氣循環', severity: '中', detail: '半導體庫存需持續觀察' },
      { name: '股價已高', severity: '低', detail: '短線漲多，回檔風險存在' },
    ],
  };

  // ── Tab: 籌碼動態 ──
  readonly chipAnalysis = {
    institutional: {
      conclusion: '法人資金集體進場中。',
      reason: '外資連續 8 天買超台積電，累計 +28,500 張。投信同步加碼（連買 5 天），代表內外資法人看法一致，這通常是資金流入的強訊號。',
      basis: '外資買賣超連續性 + 投信買賣方向一致性 + 自營商僅小幅賣超（不構成反向訊號）',
    },
    institutionalData: [
      { date: '02/28', foreign: '+3,250', investment: '+850', dealer: '-120', total: '+3,980', foreignStreak: '買超8天', investmentStreak: '買超5天' },
      { date: '02/27', foreign: '+2,815', investment: '+540', dealer: '-225', total: '+3,130', foreignStreak: '', investmentStreak: '' },
      { date: '02/26', foreign: '+4,120', investment: '-310', dealer: '+180', total: '+3,990', foreignStreak: '', investmentStreak: '' },
      { date: '02/25', foreign: '+1,985', investment: '+720', dealer: '-560', total: '+2,145', foreignStreak: '', investmentStreak: '' },
      { date: '02/24', foreign: '-820', investment: '+1,350', dealer: '+230', total: '+760', foreignStreak: '', investmentStreak: '' },
    ],
    margin: {
      conclusion: '散戶槓桿資金正在被清洗。',
      reason: '融資餘額從 15,000 張降至 12,500 張，代表前期追高的散戶在近日震盪中斷頭出場。但融券餘額穩定在 850 張，空頭沒有大幅增加，代表市場沒有形成看空共識。',
      basis: '融資餘額變化率 + 券資比穩定性',
    },
    marginData: {
      marginBalance: 12500,
      marginChange: -2500,
      shortBalance: 850,
      shortChange: 0,
      marginShortRatio: 6.8,
      marginUsageRate: 28.5,
    },
    shareholder: {
      conclusion: '籌碼持續向大戶集中，資金流入前兆。',
      reason: '大戶持股比例連 3 週上升（71.8% → 72.3%），散戶持股比例同步下降（9.8% → 9.5%）。這代表散戶在賣出，大戶在接貨。歷史上這種模式通常出現在股價上漲的前期。',
      basis: '連續 3 週的集保分散表趨勢',
    },
    shareholderData: [
      { range: '大戶（400張↑）', pct: 72.3, change: '+0.5%' },
      { range: '中實戶', pct: 18.2, change: '-0.2%' },
      { range: '散戶（10張↓）', pct: 9.5, change: '-0.3%' },
    ],
  };

  // ── Tab: 催化事件 ──
  readonly catalystSummary = { strong: 2, medium: 3, weak: 5 };

  readonly catalysts = [
    {
      strength: 'strong' as CatalystStrength,
      title: '台積電法說會報喜：全年營收上修 25%',
      time: '2 小時前', source: '經濟日報',
      aiConclusion: '這則新聞會驅動資金流入。',
      aiReason: '法說會上調全年營收目標，代表公司對未來訂單充滿信心。這類利多消息通常會吸引外資與投信在 1-2 週內持續加碼買進，因為他們需要重新調高目標價與持股比重。',
      impactType: '外資（主要）+ 投信（次要）',
      duration: '預估 1-2 週',
    },
    {
      strength: 'strong' as CatalystStrength,
      title: 'NVIDIA 下單 CoWoS 產能翻倍',
      time: '5 小時前', source: '工商時報',
      aiConclusion: '這則新聞會驅動資金流入。',
      aiReason: 'NVIDIA 增加先進封裝訂單，直接增加台積電營收，且驗證 AI 晶片需求持續強勁。這對法人估算明年營收有正面影響。',
      impactType: '外資（主要，需重新計算目標價）',
      duration: '預估 2-3 週',
    },
    {
      strength: 'medium' as CatalystStrength,
      title: '美國考慮擴大晶片出口管制範圍',
      time: '1 天前', source: 'Reuters',
      aiConclusion: '這則新聞可能驅動部分資金觀望。',
      aiReason: '出口管制可能影響對中國客戶的出貨，但目前影響範圍未定。歷史上類似新聞通常導致外資暫停加碼 1-3 天，等待政策細節明朗。不構成大規模資金撤退的理由，因為台積電非中國營收佔比已降至 10%。',
      impactType: '外資（短期觀望）',
      duration: '1-3 天觀望',
    },
  ];

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
