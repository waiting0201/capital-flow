import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { StockApiService } from '../../core/services/stock-api.service';
import { AiDisclaimer } from '../../shared/components/ai-disclaimer/ai-disclaimer';
import {
  ApiSectorPerformance, ApiSectorRotation, ApiMacroEnvironment, ApiCrossMarket,
} from '../../core/models';


@Component({
  selector: 'app-market',
  standalone: true,
  imports: [AiDisclaimer, DecimalPipe],
  templateUrl: './market.html',
  styleUrl: './market.scss',
})
export class Market implements OnInit {
  private readonly stockApi = inject(StockApiService);
  readonly Math = Math;

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

  // ── 類股資金流向排行 ──
  readonly sectors = signal<ApiSectorPerformance[]>([]);
  readonly sectorSortKey = signal<'changePercent' | 'foreignNetBuy'>('changePercent');
  readonly sectorSortAsc = signal(false);

  readonly sortedSectors = computed(() => {
    const key = this.sectorSortKey();
    const asc = this.sectorSortAsc();
    return [...this.sectors()].sort((a, b) => {
      const va = key === 'foreignNetBuy' ? (a.foreignNetBuy ?? 0) : a.changePercent;
      const vb = key === 'foreignNetBuy' ? (b.foreignNetBuy ?? 0) : b.changePercent;
      return asc ? va - vb : vb - va;
    });
  });

  // ── AI 板塊資金輪動分析 ──
  readonly rotation = signal<ApiSectorRotation | null>(null);
  readonly rotationLoading = signal(false);

  // ── AI 總經資金環境 ──
  readonly macro = signal<ApiMacroEnvironment | null>(null);
  readonly macroLoading = signal(false);

  // ── AI 跨市場資金偏好 ──
  readonly crossMarket = signal<ApiCrossMarket | null>(null);
  readonly crossMarketLoading = signal(false);

  ngOnInit(): void {
    this.loadMarketData();
    this.loadSectors();
    this.loadRotation();
    this.loadMacro();
    this.loadCrossMarket();
  }

  // ── Data Loading ──

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
      error: () => this.isLoading.set(false),
    });
  }

  private loadSectors(): void {
    this.stockApi.getSectorPerformance().subscribe({
      next: (data) => this.sectors.set(data),
    });
  }

  private loadRotation(): void {
    this.rotationLoading.set(true);
    this.stockApi.getSectorRotation().subscribe({
      next: (data) => {
        this.rotation.set(data);
        this.rotationLoading.set(false);
      },
      error: () => this.rotationLoading.set(false),
    });
  }

  private loadMacro(): void {
    this.macroLoading.set(true);
    this.stockApi.getMacroEnvironment().subscribe({
      next: (data) => {
        this.macro.set(data);
        this.macroLoading.set(false);
      },
      error: () => this.macroLoading.set(false),
    });
  }

  private loadCrossMarket(): void {
    this.crossMarketLoading.set(true);
    this.stockApi.getCrossMarket().subscribe({
      next: (data) => {
        this.crossMarket.set(data);
        this.crossMarketLoading.set(false);
      },
      error: () => this.crossMarketLoading.set(false),
    });
  }

  // ── Actions ──

  refreshRotation(): void {
    this.rotationLoading.set(true);
    this.stockApi.getSectorRotation('TW', true).subscribe({
      next: (data) => {
        this.rotation.set(data);
        this.rotationLoading.set(false);
      },
      error: () => this.rotationLoading.set(false),
    });
  }

  refreshMacro(): void {
    this.macroLoading.set(true);
    this.stockApi.getMacroEnvironment(true).subscribe({
      next: (data) => {
        this.macro.set(data);
        this.macroLoading.set(false);
      },
      error: () => this.macroLoading.set(false),
    });
  }

  refreshCrossMarket(): void {
    this.crossMarketLoading.set(true);
    this.stockApi.getCrossMarket(true).subscribe({
      next: (data) => {
        this.crossMarket.set(data);
        this.crossMarketLoading.set(false);
      },
      error: () => this.crossMarketLoading.set(false),
    });
  }

  sortSectors(key: 'changePercent' | 'foreignNetBuy'): void {
    if (this.sectorSortKey() === key) {
      this.sectorSortAsc.update(v => !v);
    } else {
      this.sectorSortKey.set(key);
      this.sectorSortAsc.set(false);
    }
  }

  getRotationStageLabel(stage: string): string {
    const map: Record<string, string> = {
      'Accumulation': '吸籌期',
      'Momentum': '動能期',
      'Acceleration': '加速期',
      'Reversal': '反轉期',
    };
    return map[stage] ?? stage;
  }

  getFlowIntensityLabel(intensity: string): string {
    const map: Record<string, string> = {
      'High': '強',
      'Medium': '中',
      'Low': '弱',
    };
    return map[intensity] ?? intensity;
  }

  getRiskLabel(level: string): string {
    const map: Record<string, string> = {
      'High': '高風險',
      'Medium': '中風險',
      'Low': '低風險',
    };
    return map[level] ?? level;
  }
}
