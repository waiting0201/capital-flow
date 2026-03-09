import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { StockApiService } from '../../core/services/stock-api.service';
import { WatchlistApiService } from '../../core/services/watchlist-api.service';
import { ApiMarketOverview, ApiWatchlistQuote, ApiInstitutionalRankingItem, ApiSectorRotation } from '../../core/models';

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

  // ── AI 板塊資金輪動 ──
  readonly rotation = signal<ApiSectorRotation | null>(null);
  readonly rotationLoading = signal(false);

  // ── 三大法人買賣超排行 ──
  readonly buyRanking = signal<ApiInstitutionalRankingItem[]>([]);
  readonly sellRanking = signal<ApiInstitutionalRankingItem[]>([]);
  readonly rankingDate = signal('');

  // ── 我的自選股 ──
  readonly watchlist = signal<WatchlistItem[]>([]);

  // ── 資金預警（暫保留靜態） ──
  readonly alerts: FlowAlert[] = [];

  ngOnInit(): void {
    this.loadMarketData();
    this.loadRotation();
  }

  private loadMarketData(): void {
    this.isLoading.set(true);

    // Fetch market overview + watchlist + ranking in parallel
    forkJoin({
      overview: this.stockApi.getMarketOverview().pipe(catchError(() => of(null))),
      watchlistData: this.watchlistApi.getWatchlist().pipe(catchError(() => of({ symbols: [] as string[], categories: [] as never[] }))),
      ranking: this.stockApi.getInstitutionalRanking().pipe(catchError(() => of(null))),
    }).pipe(
      switchMap(({ overview, watchlistData, ranking }) => {
        // Apply market overview
        if (overview) {
          this.applyOverview(overview);
        }

        // Apply ranking data
        if (ranking) {
          this.buyRanking.set(ranking.buyRanking);
          this.sellRanking.set(ranking.sellRanking);
          this.rankingDate.set(ranking.tradingDate);
        }

        // Fetch quotes for watchlist symbols
        const symbols = watchlistData.symbols;
        if (symbols.length > 0) {
          return this.stockApi.getWatchlistQuotes(symbols).pipe(catchError(() => of([] as ApiWatchlistQuote[])));
        }
        return of([] as ApiWatchlistQuote[]);
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

  private loadRotation(): void {
    this.rotationLoading.set(true);
    this.stockApi.getSectorRotation().pipe(catchError(() => of(null))).subscribe({
      next: (data) => {
        this.rotation.set(data);
        this.rotationLoading.set(false);
      },
      error: () => this.rotationLoading.set(false),
    });
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

  getConsecutiveBadge(item: ApiInstitutionalRankingItem): string | null {
    const fd = item.foreignConsecutiveDays;
    const td = item.trustConsecutiveDays;
    if (fd && fd >= 3) return `外資連${fd}買`;
    if (fd && fd <= -3) return `外資連${Math.abs(fd)}賣`;
    if (td && td >= 3) return `投信連${td}買`;
    if (td && td <= -3) return `投信連${Math.abs(td)}賣`;
    return null;
  }
}
