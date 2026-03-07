import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { StockApiService } from '../../core/services/stock-api.service';

interface SectorFlow {
  name: string;
  amount: number;
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [],
  templateUrl: './market.html',
  styleUrl: './market.scss',
})
export class Market implements OnInit {
  private readonly stockApi = inject(StockApiService);

  readonly isLoading = signal(true);

  // ── 今日資金水位 ──
  readonly capitalLevel = signal({
    foreign: { value: 0, streak: 0, direction: 'buy' as 'buy' | 'sell' },
    sitc: { value: 0, direction: 'buy' as 'buy' | 'sell' },
    dealer: { value: 0, direction: 'buy' as 'buy' | 'sell' },
    marketVolume: { value: 0 },
    marginChange: { value: 0, label: '' },
    breadth: { up: 0, down: 0, flat: 0, limitUp: 0, limitDown: 0 },
  });

  readonly breadthTotal = computed(() => {
    const b = this.capitalLevel().breadth;
    return b.up + b.down + b.flat || 1;
  });

  // ── AI 板塊資金輪動分析（placeholder） ──
  readonly rotation = signal({
    conclusion: '資金輪動分析載入中...',
    reason: '待 AI 分析模組上線後，將根據即時法人籌碼自動生成。',
    basis: '各板塊法人淨買賣變化 + 量能分佈 + 產業動態',
  });

  readonly sectorInflows = signal<SectorFlow[]>([]);
  readonly sectorOutflows = signal<SectorFlow[]>([]);

  readonly maxSectorFlow = computed(() => {
    const max = Math.max(
      ...this.sectorInflows().map(s => s.amount),
      ...this.sectorOutflows().map(s => s.amount),
      0,
    );
    return max || 1;
  });

  // ── AI 總經資金環境解讀（placeholder） ──
  readonly macroIndicators = signal([
    { label: 'Fed 利率', value: '--' },
    { label: '美元指數', value: '--' },
    { label: 'VIX 恐慌', value: '--' },
  ]);

  readonly macroAnalysis = {
    conclusion: '待總經數據 API 串接後自動更新。',
    causalChain: '目前尚未串接總經數據來源，後續將整合 Fed 利率、美債殖利率、美元指數等指標。',
    judgment: '請參考其他總經資訊平台取得即時數據。',
    basis: 'Fed 利率聲明 + 美債殖利率走勢 + 美元指數 + VIX 波動率',
  };

  ngOnInit(): void {
    this.loadMarketData();
  }

  private loadMarketData(): void {
    this.isLoading.set(true);

    this.stockApi.getMarketOverview().subscribe({
      next: (overview) => {
        if (overview) {
          const fNet = overview.institutional.foreignNet;
          const sNet = overview.institutional.sitcNet;
          const dNet = overview.institutional.dealerNet;

          this.capitalLevel.set({
            foreign: {
              value: Math.abs(fNet),
              streak: 0,
              direction: fNet >= 0 ? 'buy' : 'sell',
            },
            sitc: {
              value: Math.abs(sNet),
              direction: sNet >= 0 ? 'buy' : 'sell',
            },
            dealer: {
              value: Math.abs(dNet),
              direction: dNet >= 0 ? 'buy' : 'sell',
            },
            marketVolume: { value: overview.volume.totalBillion },
            marginChange: {
              value: Math.round(overview.margin.marginNetChange / 1000),
              label: overview.margin.label,
            },
            breadth: {
              up: overview.breadth.up,
              down: overview.breadth.down,
              flat: overview.breadth.flat,
              limitUp: overview.breadth.limitUp,
              limitDown: overview.breadth.limitDown,
            },
          });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  getFlowBarWidth(amount: number): number {
    return (amount / this.maxSectorFlow()) * 100;
  }
}
