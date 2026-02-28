import { Component, signal } from '@angular/core';

interface IndexData {
  flag: string;
  name: string;
  value: string;
  change: number;
  changePercent: number;
  status: 'open' | 'closed';
}

interface SectorItem {
  name: string;
  change: number;
  volume: string;
  leader: string;
}

interface InstitutionalFlow {
  name: string;
  buy: number;
  sell: number;
  net: number;
}

interface MacroIndicator {
  label: string;
  value: string;
  prev: string;
  trend: 'up' | 'down' | 'flat';
  region: string;
  date: string;
}

interface GlobalIndex {
  flag: string;
  name: string;
  value: string;
  change: number;
  changePercent: number;
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [],
  templateUrl: './market.html',
  styleUrl: './market.scss',
})
export class Market {
  readonly activeTab = signal<'tw' | 'us'>('tw');

  // ── Indices ──
  readonly twIndices: IndexData[] = [
    { flag: '🇹🇼', name: '加權指數', value: '22,156.38', change: 268.45, changePercent: 1.23, status: 'open' },
    { flag: '🇹🇼', name: '櫃買指數', value: '235.82', change: 1.87, changePercent: 0.80, status: 'open' },
    { flag: '🇹🇼', name: '電子類指數', value: '1,128.56', change: 18.92, changePercent: 1.70, status: 'open' },
    { flag: '🇹🇼', name: '金融類指數', value: '1,842.10', change: 5.32, changePercent: 0.29, status: 'open' },
    { flag: '🇹🇼', name: '台灣50', value: '168.25', change: 1.85, changePercent: 1.11, status: 'open' },
  ];

  readonly usIndices: IndexData[] = [
    { flag: '🇺🇸', name: 'S&P 500', value: '5,842.15', change: -17.53, changePercent: -0.30, status: 'closed' },
    { flag: '🇺🇸', name: 'NASDAQ', value: '18,523.40', change: 92.67, changePercent: 0.50, status: 'closed' },
    { flag: '🇺🇸', name: '道瓊工業', value: '42,156.80', change: 84.31, changePercent: 0.20, status: 'closed' },
    { flag: '🇺🇸', name: '費城半導體', value: '4,892.35', change: 78.20, changePercent: 1.62, status: 'closed' },
    { flag: '🇺🇸', name: 'Russell 2000', value: '2,045.12', change: -12.38, changePercent: -0.60, status: 'closed' },
  ];

  // ── Market Breadth ──
  readonly breadth = {
    advancers: 523, decliners: 312, unchanged: 89,
    limitUp: 8, limitDown: 2,
    advancersPct: 56.6, declinersPct: 33.8, unchangedPct: 9.6,
  };

  // ── Institutional Flow (億) ──
  readonly institutions: InstitutionalFlow[] = [
    { name: '外資', buy: 482.5, sell: 396.2, net: 86.3 },
    { name: '投信', buy: 68.4, sell: 42.1, net: 26.3 },
    { name: '自營商', buy: 125.8, sell: 138.5, net: -12.7 },
  ];

  readonly institutionalTotal = 99.9; // net

  // ── Sector Performance ──
  readonly sectors: SectorItem[] = [
    { name: '半導體', change: 2.80, volume: '1,245 億', leader: '台積電 +1.43%' },
    { name: '電腦週邊', change: 2.10, volume: '682 億', leader: '廣達 +4.12%' },
    { name: '光電業', change: 1.50, volume: '234 億', leader: '大立光 +2.1%' },
    { name: '通信網路', change: 1.20, volume: '156 億', leader: '智邦 +2.48%' },
    { name: '生技醫療', change: 0.80, volume: '98 億', leader: '藥華藥 +1.8%' },
    { name: '金融保險', change: 0.30, volume: '312 億', leader: '富邦金 +0.95%' },
    { name: '食品工業', change: -0.20, volume: '45 億', leader: '統一 -0.3%' },
    { name: '營建', change: -0.60, volume: '87 億', leader: '興富發 -1.2%' },
    { name: '航運業', change: -1.20, volume: '198 億', leader: '長榮 -2.1%' },
    { name: '鋼鐵工業', change: -1.80, volume: '76 億', leader: '中鋼 -1.5%' },
  ];

  // ── Macro Indicators ──
  readonly macroTW: MacroIndicator[] = [
    { label: 'GDP 成長率', value: '3.12%', prev: '2.93%', trend: 'up', region: 'tw', date: '2025 Q4' },
    { label: 'CPI 年增率', value: '2.18%', prev: '2.35%', trend: 'down', region: 'tw', date: '2026/01' },
    { label: '失業率', value: '3.42%', prev: '3.48%', trend: 'down', region: 'tw', date: '2026/01' },
    { label: '外銷訂單(億美)', value: '538.2', prev: '512.8', trend: 'up', region: 'tw', date: '2026/01' },
    { label: 'M1B 年增率', value: '6.85%', prev: '6.12%', trend: 'up', region: 'tw', date: '2026/01' },
    { label: '重貼現率', value: '2.00%', prev: '2.00%', trend: 'flat', region: 'tw', date: '2025/12' },
  ];

  readonly macroUS: MacroIndicator[] = [
    { label: 'GDP 成長率', value: '2.80%', prev: '3.10%', trend: 'down', region: 'us', date: '2025 Q4' },
    { label: 'CPI 年增率', value: '2.95%', prev: '3.10%', trend: 'down', region: 'us', date: '2026/01' },
    { label: '核心 PCE', value: '2.65%', prev: '2.72%', trend: 'down', region: 'us', date: '2026/01' },
    { label: '非農就業(萬)', value: '22.8', prev: '25.6', trend: 'down', region: 'us', date: '2026/01' },
    { label: 'ISM 製造 PMI', value: '50.9', prev: '49.2', trend: 'up', region: 'us', date: '2026/01' },
    { label: 'Fed 利率', value: '4.25–4.50%', prev: '4.50–4.75%', trend: 'down', region: 'us', date: '2026/01' },
  ];

  // ── Global Markets ──
  readonly globalIndices: GlobalIndex[] = [
    { flag: '🇯🇵', name: '日經 225', value: '39,156.20', change: 285.40, changePercent: 0.73 },
    { flag: '🇰🇷', name: 'KOSPI', value: '2,642.80', change: -18.25, changePercent: -0.69 },
    { flag: '🇭🇰', name: '恆生指數', value: '20,812.45', change: 156.30, changePercent: 0.76 },
    { flag: '🇨🇳', name: '上證綜合', value: '3,285.60', change: 22.15, changePercent: 0.68 },
    { flag: '🇬🇧', name: 'FTSE 100', value: '7,892.30', change: 42.15, changePercent: 0.54 },
    { flag: '🇩🇪', name: 'DAX', value: '18,245.80', change: -65.20, changePercent: -0.36 },
  ];

  // ── AI Insight ──
  readonly aiInsight = {
    summary: '台股加權指數站穩 22,000 點上方，短線多方格局確立。外資連續第三日買超合計 186 億，資金集中流入 AI 與半導體族群。技術面觀察，指數站上 5 日均線且月線翻揚，短線偏多操作。但量能尚未有效放大至 3,500 億以上，中線仍需觀察。',
    keyPoints: [
      '外資連三買，集中半導體與 AI 供應鏈',
      '電子權值股領漲，台積電站穩 850 元',
      '美國 ISM PMI 重回擴張，有利科技股',
      '短線支撐 21,800，壓力 22,500',
    ],
    sentiment: 'bullish' as const,
    updatedAt: '2026-02-28 13:45',
  };

  // ── Methods ──
  setTab(tab: 'tw' | 'us'): void {
    this.activeTab.set(tab);
  }

  getSign(val: number): string {
    return val > 0 ? '+' : '';
  }

  getDir(val: number): string {
    return val > 0 ? 'up' : val < 0 ? 'down' : 'flat';
  }

  getBarWidth(val: number): string {
    const maxChange = 3;
    return Math.min(Math.abs(val) / maxChange * 100, 100) + '%';
  }

  getFlowBarWidth(val: number): string {
    const max = 500;
    return Math.min(val / max * 100, 100) + '%';
  }

  abs(val: number): number {
    return Math.abs(val);
  }
}
