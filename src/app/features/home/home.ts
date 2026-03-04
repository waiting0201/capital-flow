import { Component, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

type FlowStatus = 'inflow' | 'outflow' | 'neutral';
type AlertLevel = 'critical' | 'warning';

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  flowStatus: FlowStatus;
  flowLabel: string;
  aiSummary: string;
}

interface SectorFlow {
  name: string;
  amount: number;
}

interface FlowAlert {
  level: AlertLevel;
  symbol: string;
  message: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

  // ── 大盤資金水位 ──
  readonly capitalLevel = {
    foreignFlow: { value: 182, direction: 'buy' as 'buy' | 'sell', streak: 3 },
    marketVolume: { value: 2850, avg20Ratio: 1.2 },
    marginChange: { value: 12, label: '散戶持續加碼' },
    breadth: { up: 523, down: 312, flat: 89, limitUp: 8, limitDown: 2 },
  };

  readonly breadthUpPct = computed(() => {
    const b = this.capitalLevel.breadth;
    const total = b.up + b.down + b.flat;
    return (b.up / total) * 100;
  });

  readonly breadthFlatPct = computed(() => {
    const b = this.capitalLevel.breadth;
    const total = b.up + b.down + b.flat;
    return (b.flat / total) * 100;
  });

  readonly breadthDownPct = computed(() => {
    const b = this.capitalLevel.breadth;
    const total = b.up + b.down + b.flat;
    return (b.down / total) * 100;
  });

  // ── AI 板塊資金輪動 ──
  readonly sectorRotation = {
    conclusion: '今日資金正從 傳產(鋼鐵/航運) 流向 科技(半導體/AI伺服器)',
    reason: '輝達財報超預期 → AI 供應鏈資金全面湧入，傳產因景氣放緩資金持續撤出。',
    basis: '各板塊法人淨買賣變化 + 量能分佈 + 產業動態',
  };

  readonly sectorInflows: SectorFlow[] = [
    { name: '半導體', amount: 85 },
    { name: '電腦週邊', amount: 42 },
    { name: '光電', amount: 28 },
    { name: '生技醫療', amount: 15 },
  ];

  readonly sectorOutflows: SectorFlow[] = [
    { name: '航運', amount: 32 },
    { name: '鋼鐵', amount: 28 },
    { name: '紡織', amount: 15 },
    { name: '食品', amount: 12 },
  ];

  readonly maxSectorFlow = computed(() => {
    const max = Math.max(
      ...this.sectorInflows.map(s => s.amount),
      ...this.sectorOutflows.map(s => s.amount),
    );
    return max || 1;
  });

  // ── 我的自選股 ──
  readonly watchlist: WatchlistItem[] = [
    { symbol: '2330', name: '台積電', price: 850, change: 2.3, flowStatus: 'inflow', flowLabel: '資金流入', aiSummary: '外資連續8日買超，籌碼向大戶集中' },
    { symbol: 'AAPL', name: 'Apple', price: 178, change: -0.5, flowStatus: 'neutral', flowLabel: '資金觀望', aiSummary: '法人買賣分歧，量能萎縮' },
    { symbol: '2382', name: '廣達', price: 312, change: 4.1, flowStatus: 'inflow', flowLabel: '資金流入', aiSummary: '投信連續加碼，AI 伺服器訂單催化' },
    { symbol: 'NVDA', name: 'NVIDIA', price: 875, change: 1.8, flowStatus: 'outflow', flowLabel: '資金流出', aiSummary: '財報利多出盡，外資獲利了結中' },
    { symbol: '3231', name: '緯創', price: 118, change: 1.5, flowStatus: 'neutral', flowLabel: '資金觀望', aiSummary: '法人買賣分歧，等待營收數據確認' },
  ];

  // ── 資金預警 ──
  readonly alerts: FlowAlert[] = [
    { level: 'critical', symbol: 'NVDA', message: '資金流向反轉：外資由買轉賣 + 量能萎縮' },
    { level: 'warning', symbol: '2330', message: '量能異常：成交量為 20 日均量 2.3 倍' },
  ];

  getFlowBarWidth(amount: number): number {
    return (amount / this.maxSectorFlow()) * 100;
  }
}
