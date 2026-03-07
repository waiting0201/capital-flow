import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { StockApiService } from '../../core/services/stock-api.service';
import { WatchlistApiService } from '../../core/services/watchlist-api.service';
import { ApiMarketOverview, ApiWatchlistQuote } from '../../core/models';

type FlowStatus = 'inflow' | 'outflow' | 'neutral';
type AlertLevel = 'critical' | 'warning';

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  flowStatus: FlowStatus;
  flowLabel: string;
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
export class Home implements OnInit {
  private readonly stockApi = inject(StockApiService);
  private readonly watchlistApi = inject(WatchlistApiService);

  // ── Loading state ──
  readonly isLoading = signal(true);

  // ── 大盤資金水位 ──
  readonly capitalLevel = signal({
    foreignFlow: { value: 0, direction: 'buy' as 'buy' | 'sell', streak: 0 },
    marketVolume: { value: 0 },
    marginChange: { value: 0, label: '' },
    breadth: { up: 0, down: 0, flat: 0, limitUp: 0, limitDown: 0 },
    institutional: { sitcNet: 0, dealerNet: 0 },
  });

  readonly breadthUpPct = computed(() => {
    const b = this.capitalLevel().breadth;
    const total = b.up + b.down + b.flat;
    return total > 0 ? (b.up / total) * 100 : 0;
  });

  readonly breadthFlatPct = computed(() => {
    const b = this.capitalLevel().breadth;
    const total = b.up + b.down + b.flat;
    return total > 0 ? (b.flat / total) * 100 : 0;
  });

  readonly breadthDownPct = computed(() => {
    const b = this.capitalLevel().breadth;
    const total = b.up + b.down + b.flat;
    return total > 0 ? (b.down / total) * 100 : 0;
  });

  // ── AI 板塊資金輪動（暫保留靜態，待 AI 分析功能上線） ──
  readonly sectorRotation = {
    conclusion: '資金輪動分析載入中...',
    reason: '待 AI 分析模組上線後，將根據即時法人籌碼自動生成。',
    basis: '各板塊法人淨買賣變化 + 量能分佈 + 產業動態',
  };

  readonly sectorInflows: SectorFlow[] = [];
  readonly sectorOutflows: SectorFlow[] = [];

  readonly maxSectorFlow = computed(() => {
    const max = Math.max(
      ...this.sectorInflows.map(s => s.amount),
      ...this.sectorOutflows.map(s => s.amount),
      0,
    );
    return max || 1;
  });

  // ── 我的自選股 ──
  readonly watchlist = signal<WatchlistItem[]>([]);

  // ── 資金預警（暫保留靜態） ──
  readonly alerts: FlowAlert[] = [];

  ngOnInit(): void {
    this.loadMarketData();
  }

  private loadMarketData(): void {
    this.isLoading.set(true);

    // Fetch market overview + watchlist symbols in parallel
    forkJoin({
      overview: this.stockApi.getMarketOverview(),
      watchlistData: this.watchlistApi.getWatchlist(),
    }).pipe(
      switchMap(({ overview, watchlistData }) => {
        // Apply market overview
        if (overview) {
          this.applyOverview(overview);
        }

        // Fetch quotes for watchlist symbols
        const symbols = watchlistData.symbols;
        if (symbols.length > 0) {
          return this.stockApi.getWatchlistQuotes(symbols);
        }
        return [];
      }),
    ).subscribe({
      next: (quotes: ApiWatchlistQuote[]) => {
        if (quotes.length > 0) {
          this.watchlist.set(quotes.map(q => ({
            symbol: q.symbol,
            name: q.name ?? q.symbol,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            flowStatus: (q.changePercent > 1 ? 'inflow' : q.changePercent < -1 ? 'outflow' : 'neutral') as FlowStatus,
            flowLabel: q.changePercent > 1 ? '上漲' : q.changePercent < -1 ? '下跌' : '持平',
          })));
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private applyOverview(overview: ApiMarketOverview): void {
    const foreignNet = overview.institutional.foreignNet;
    this.capitalLevel.set({
      foreignFlow: {
        value: Math.abs(foreignNet),
        direction: foreignNet >= 0 ? 'buy' : 'sell',
        streak: 0,
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
      institutional: {
        sitcNet: overview.institutional.sitcNet,
        dealerNet: overview.institutional.dealerNet,
      },
    });
  }

  getFlowBarWidth(amount: number): number {
    return (amount / this.maxSectorFlow()) * 100;
  }
}
