import { Component, input, signal, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Market, StockQuote, StockProfile, KLineData } from '../../../core/models';
import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis,
  ApexPlotOptions, ApexDataLabels, ApexStroke, ApexTooltip,
  ApexGrid, ApexLegend,
} from 'ng-apexcharts';

type ChartRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'YTD';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [RouterLink, NgApexchartsModule],
  templateUrl: './stock-detail.html',
  styleUrl: './stock-detail.scss',
})
export class StockDetail {
  readonly symbol = input.required<string>();

  readonly chartRange = signal<ChartRange>('1M');
  readonly chartRanges: ChartRange[] = ['1D', '5D', '1M', '3M', '6M', '1Y', 'YTD'];

  // ── ApexCharts Options ──
  candleSeries = signal<ApexAxisChartSeries>([]);
  volumeSeries = signal<ApexAxisChartSeries>([]);

  readonly candleChart: ApexChart = { type: 'candlestick', height: 340, toolbar: { show: true, tools: { download: false, selection: true, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } }, background: 'transparent' };
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

  constructor() {
    effect(() => {
      const sym = this.symbol();
      const range = this.chartRange();
      this.buildChartData(sym, range);
    });
  }

  // ── Mock Data ──
  readonly quote = computed<StockQuote>(() => {
    const sym = this.symbol();
    return this.stockData[sym] ?? {
      symbol: sym, name: sym, market: (/^\d/.test(sym) ? 'tw' : 'us') as Market,
      price: 0, change: 0, changePercent: 0, volume: 0, updatedAt: '',
    };
  });

  readonly profile = computed<StockProfile>(() => {
    const sym = this.symbol();
    return this.profileData[sym] ?? {
      symbol: sym, name: sym, market: (/^\d/.test(sym) ? 'tw' : 'us') as Market,
      industry: '—', description: '暫無資料',
    };
  });

  private readonly stockData: Record<string, StockQuote> = {
    '2330': { symbol: '2330', name: '台積電 TSMC', market: 'tw', price: 852.00, change: 12.00, changePercent: 1.43, volume: 28543, updatedAt: '2026-02-28T13:30:00' },
    'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'us', price: 875.30, change: 15.65, changePercent: 1.82, volume: 41200000, updatedAt: '2026-02-27T16:00:00' },
    '2382': { symbol: '2382', name: '廣達電腦', market: 'tw', price: 312.00, change: 12.35, changePercent: 4.12, volume: 15231, updatedAt: '2026-02-28T13:30:00' },
    'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', market: 'us', price: 178.52, change: -0.95, changePercent: -0.53, volume: 52100000, updatedAt: '2026-02-27T16:00:00' },
    '2317': { symbol: '2317', name: '鴻海精密', market: 'tw', price: 178.00, change: -1.50, changePercent: -0.84, volume: 18562, updatedAt: '2026-02-28T13:30:00' },
    '2454': { symbol: '2454', name: '聯發科技', market: 'tw', price: 1280.00, change: 25.00, changePercent: 1.99, volume: 8421, updatedAt: '2026-02-28T13:30:00' },
  };

  private readonly profileData: Record<string, StockProfile> = {
    '2330': { symbol: '2330', name: '台積電 TSMC', market: 'tw', industry: '半導體', description: '全球最大專業積體電路製造服務公司，為蘋果、NVIDIA、AMD 等國際大廠代工先進製程晶片。在 5nm/3nm 製程技術全球領先，市佔率超過 55%。', chairman: '魏哲家', mainBusiness: '積體電路製造、先進封裝（CoWoS）、封裝測試', capital: 259303, establishedDate: '1987-02-21' },
    'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'us', industry: 'Semiconductors', description: 'AI 運算晶片龍頭，H100/H200/B200 系列 GPU 主導全球資料中心 AI 加速市場，市佔率超過 80%。同時佈局自動駕駛、機器人與醫療 AI 領域。', ceo: 'Jensen Huang', mainBusiness: 'GPU、AI 加速器、資料中心、自動駕駛平台', capital: 2100000, establishedDate: '1993-01-01' },
    '2382': { symbol: '2382', name: '廣達電腦', market: 'tw', industry: '電腦週邊', description: '全球最大筆記型電腦代工廠，近年積極轉型雲端伺服器與 AI 伺服器業務，為 Meta、Google 等科技巨頭供應 AI 伺服器。', chairman: '林百里', mainBusiness: '筆記型電腦、AI 伺服器、雲端設備', capital: 38680, establishedDate: '1988-05-01' },
  };

  formatCapital(capital: number | undefined, market: Market): string {
    if (!capital) return '—';
    if (market === 'us') return '$' + (capital / 1000).toFixed(0) + 'B';
    if (capital >= 10000) return (capital / 10000).toFixed(1) + ' 兆';
    return capital.toLocaleString() + ' 億';
  }

  formatEstDate(date: string | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    return `${d.getFullYear()} 年`;
  }

  readonly keyMetrics = computed(() => {
    const q = this.quote();
    const isTw = q.market === 'tw';
    return [
      { label: '開盤', value: this.fmt(q.price - q.change * 0.3) },
      { label: '昨收', value: this.fmt(q.price - q.change) },
      { label: '最高', value: this.fmt(q.price + Math.abs(q.change) * 0.5) },
      { label: '最低', value: this.fmt(q.price - Math.abs(q.change) * 0.8) },
      { label: '成交量', value: isTw ? q.volume.toLocaleString() + ' 張' : this.fmtVol(q.volume) },
      { label: '本益比', value: isTw ? '22.4x' : '35.2x' },
      { label: '殖利率', value: isTw ? '1.89%' : '0.52%' },
      { label: '市值', value: isTw ? '22.08 兆' : '$2.15T' },
    ];
  });

  readonly financialData = [
    { period: '2025 Q4', revenue: '8,684', grossMargin: '59.2%', operatingMargin: '49.0%', eps: '14.25', yoy: '+35.2%' },
    { period: '2025 Q3', revenue: '7,596', grossMargin: '57.8%', operatingMargin: '47.5%', eps: '12.36', yoy: '+39.6%' },
    { period: '2025 Q2', revenue: '6,735', grossMargin: '53.2%', operatingMargin: '42.6%', eps: '10.12', yoy: '+40.1%' },
    { period: '2025 Q1', revenue: '5,926', grossMargin: '56.0%', operatingMargin: '45.8%', eps: '9.54', yoy: '+28.7%' },
  ];

  readonly institutionalData = [
    { date: '02/28', foreign: '+3,250', investment: '+820', dealer: '-410', total: '+3,660' },
    { date: '02/27', foreign: '+2,815', investment: '+540', dealer: '-225', total: '+3,130' },
    { date: '02/26', foreign: '+4,120', investment: '-310', dealer: '+180', total: '+3,990' },
    { date: '02/25', foreign: '+1,985', investment: '+720', dealer: '-560', total: '+2,145' },
    { date: '02/24', foreign: '-820', investment: '+1,350', dealer: '+230', total: '+760' },
  ];

  // ── Media Data ──
  readonly mediaSentiment = {
    positive: 68, neutral: 22, negative: 10,
    buzzScore: 87, buzzTrend: 'up' as 'up' | 'down' | 'flat',
    weeklyMentions: 342, weeklyChange: '+24%',
  };

  readonly analystRatings = [
    { firm: '摩根士丹利', rating: '加碼', target: 950, date: '02/26' },
    { firm: '高盛', rating: '買進', target: 920, date: '02/24' },
    { firm: '花旗', rating: '買進', target: 900, date: '02/20' },
    { firm: '瑞銀', rating: '中立', target: 860, date: '02/18' },
    { firm: 'JP Morgan', rating: '加碼', target: 930, date: '02/15' },
  ];

  readonly newsItems = [
    { time: '14:30', title: '台積電法說會釋出正面展望，AI 晶片需求強勁', source: '經濟日報', tag: 'positive', category: 'analysis' },
    { time: '11:20', title: '外資連五買台積電，累計買超逾 1.8 萬張', source: '工商時報', tag: 'positive', category: 'institutional' },
    { time: '09:45', title: '半導體產業鏈庫存調整近尾聲，下半年展望樂觀', source: '鉅亨網', tag: 'neutral', category: 'industry' },
    { time: '08:00', title: 'NVIDIA 財報超預期，帶動亞洲半導體供應鏈走強', source: 'Reuters', tag: 'positive', category: 'global' },
    { time: '昨天', title: '台積電先進封裝產能滿載至 2027 年', source: 'DigiTimes', tag: 'positive', category: 'company' },
    { time: '昨天', title: '美國晶片出口管制新規可能衝擊中國業務', source: 'Bloomberg', tag: 'negative', category: 'policy' },
    { time: '02/26', title: '法人看好台積電 CoWoS 產能擴張效益', source: '財訊', tag: 'positive', category: 'analysis' },
    { time: '02/25', title: '台積電 3 奈米良率突破新高', source: '電子時報', tag: 'positive', category: 'company' },
  ];

  readonly socialBuzz = [
    { platform: 'PTT', mentions: 156, sentiment: 82, trend: 'up' as const },
    { platform: 'Mobile01', mentions: 43, sentiment: 75, trend: 'flat' as const },
    { platform: 'X/Twitter', mentions: 89, sentiment: 78, trend: 'up' as const },
    { platform: 'StockDog', mentions: 54, sentiment: 70, trend: 'down' as const },
  ];

  // ── AI Investment Data ──
  readonly aiAnalysis = {
    score: 82,
    rating: '正向偏多',
    updatedAt: '2026-02-28 13:30',
    summary: '綜合基本面、技術面與籌碼面分析，台積電目前處於多頭格局。AI 晶片需求持續增長，先進製程技術領先優勢明顯。外資持續買超顯示機構投資者看好後市。',
    factors: [
      { label: '基本面', score: 88, detail: '營收 YoY 成長 35%，毛利率維持 59% 高檔' },
      { label: '技術面', score: 78, detail: '站穩 5 日均線，月線翻揚，MACD 金叉' },
      { label: '籌碼面', score: 85, detail: '外資連五買超，投信同步加碼' },
      { label: '消息面', score: 75, detail: 'AI 需求利多持續，出口管制為潛在風險' },
    ],
  };

  readonly aiInvestment = {
    action: '分批買進' as string,
    confidence: 78,
    horizon: '中期（3-6 個月）',
    riskLevel: '中低',
    entryZone: { low: 820, high: 835 },
    targetPrice: 920,
    stopLoss: 790,
    expectedReturn: '+8.0% ~ +10.8%',
    riskRewardRatio: '1 : 1.4',
    positionSuggestion: '建議佔投資組合 8-12%，分 3 批進場',
    strategy: '當前價位偏高，建議等回測 820-835 區間時分批佈局。第一批 30%，跌破 810 加碼 40%，反彈突破 860 再加碼 30%。',
    catalysts: [
      { event: 'Q1 法說會', date: '2026/04/17', impact: 'high' as const },
      { event: '美國出口管制政策更新', date: '2026/03 中旬', impact: 'medium' as const },
      { event: 'CoWoS 產能擴充時程', date: '2026/Q2', impact: 'high' as const },
    ],
    reasons: [
      { type: 'bull' as const, text: 'AI 晶片需求持續高速成長，先進製程訂單能見度高' },
      { type: 'bull' as const, text: '外資與投信同步加碼，籌碼面穩定偏多' },
      { type: 'bull' as const, text: 'CoWoS 先進封裝產能擴張將帶來新營收動能' },
      { type: 'bear' as const, text: '美國晶片出口管制政策不確定性' },
      { type: 'bear' as const, text: '全球經濟放緩可能影響非 AI 相關業務' },
    ],
    scenarios: [
      { label: '樂觀', probability: '35%', target: '950-980', trigger: 'AI 需求超預期、地緣風險降溫' },
      { label: '基準', probability: '45%', target: '880-920', trigger: '維持現有成長趨勢' },
      { label: '悲觀', probability: '20%', target: '780-820', trigger: '出口管制升級、需求不如預期' },
    ],
  };

  getImpactColor(impact: string): string {
    if (impact === 'high') return 'var(--up)';
    if (impact === 'medium') return 'var(--amber)';
    return 'var(--gray-light)';
  }

  getRatingColor(rating: string): string {
    if (['加碼', '買進', 'Buy', 'Overweight'].includes(rating)) return 'var(--up)';
    if (['減碼', '賣出', 'Sell', 'Underweight'].includes(rating)) return 'var(--down)';
    return 'var(--amber)';
  }

  getSentimentColor(val: number): string {
    if (val >= 70) return 'var(--up)';
    if (val >= 40) return 'var(--amber)';
    return 'var(--down)';
  }

  // ── Chart Data Generator ──
  private buildChartData(sym: string, range: ChartRange): void {
    const kline = this.generateKLineData(sym, range);
    this.candleSeries.set([{
      name: 'K線',
      data: kline.map(d => ({ x: new Date(d.date).getTime(), y: [d.open, d.high, d.low, d.close] })),
    }]);
    this.volumeSeries.set([{
      name: '成交量',
      data: kline.map(d => ({
        x: new Date(d.date).getTime(),
        y: d.volume,
        fillColor: d.close >= d.open ? '#E14F4F' : '#22C1A1',
      })),
    }]);
  }

  private generateKLineData(sym: string, range: ChartRange): KLineData[] {
    const basePrice = this.stockData[sym]?.price ?? 100;
    const days = this.getRangeDays(range);
    const data: KLineData[] = [];
    let price = basePrice * 0.92;

    for (let i = days; i >= 0; i--) {
      const date = new Date(2026, 1, 28);
      date.setDate(date.getDate() - i);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const volatility = basePrice * 0.018;
      const drift = (basePrice - price) * 0.03;
      const open = price + drift + (Math.random() - 0.48) * volatility;
      const close = open + (Math.random() - 0.45) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const baseVol = this.stockData[sym]?.market === 'tw' ? 25000 : 35000000;
      const volume = Math.round(baseVol * (0.6 + Math.random() * 0.8));

      data.push({
        date: date.toISOString().slice(0, 10),
        open: +open.toFixed(2),
        high: +high.toFixed(2),
        low: +low.toFixed(2),
        close: +close.toFixed(2),
        volume,
      });
      price = close;
    }
    return data;
  }

  private getRangeDays(range: ChartRange): number {
    switch (range) {
      case '1D': return 1;
      case '5D': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '6M': return 180;
      case '1Y': return 365;
      case 'YTD': return 59;
    }
  }

  // ── Methods ──
  setChartRange(range: ChartRange): void {
    this.chartRange.set(range);
  }

  formatPrice(price: number): string {
    return price >= 1000 ? price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : price.toFixed(2);
  }

  formatChange(q: StockQuote): string {
    const sign = q.change > 0 ? '+' : '';
    return `${sign}${q.change.toFixed(2)} (${sign}${q.changePercent.toFixed(2)}%)`;
  }

  formatVolume(q: StockQuote): string {
    if (q.market === 'us') {
      if (q.volume >= 1_000_000) return (q.volume / 1_000_000).toFixed(1) + 'M';
      if (q.volume >= 1_000) return (q.volume / 1_000).toFixed(0) + 'K';
    }
    return q.volume.toLocaleString();
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'var(--up)';
    if (score >= 60) return 'var(--amber)';
    return 'var(--down)';
  }

  private fmt(n: number): string {
    return n >= 1000 ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : n.toFixed(2);
  }

  private fmtVol(v: number): string {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
    return v.toString();
  }
}
