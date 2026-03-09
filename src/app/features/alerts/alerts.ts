import { Component, signal, computed, inject, DestroyRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import { Alert, AlertHistoryItem, AlertType, ALERT_TYPE_TO_UI_CATEGORY } from '../../core/models';
import { AlertApiService } from '../../core/services/alert-api.service';
import { AlertNotificationService } from '../../core/services/alert-notification.service';
import { StockApiService } from '../../core/services/stock-api.service';

type AlertCategory = 'all' | 'flow-reversal' | 'volume' | 'institutional' | 'price' | 'catalyst';
type AlertTab = 'flow-reversal' | 'volume' | 'institutional' | 'price' | 'catalyst';

// Map backend AlertType → UI AlertTab
const ALERT_TYPE_TO_TAB: Record<AlertType, AlertTab> = {
  MoneyFlowReversal: 'flow-reversal',
  VolumeSpike: 'volume',
  InstitutionalBuy: 'institutional',
  InstitutionalSell: 'institutional',
  PriceAbove: 'price',
  PriceBelow: 'price',
  HighCatalystNews: 'catalyst',
};

// Map UI form → backend AlertType
function resolveAlertType(tab: AlertTab, extra?: { condition?: string; institution?: string }): AlertType {
  switch (tab) {
    case 'flow-reversal': return 'MoneyFlowReversal';
    case 'volume': return 'VolumeSpike';
    case 'institutional': return extra?.institution === 'sell' ? 'InstitutionalSell' : 'InstitutionalBuy';
    case 'price': return extra?.condition === 'below' ? 'PriceBelow' : 'PriceAbove';
    case 'catalyst': return 'HighCatalystNews';
  }
}

function alertTitle(type: AlertType): string {
  const map: Record<AlertType, string> = {
    MoneyFlowReversal: 'AI 偵測資金反轉',
    VolumeSpike: '量能異常偵測',
    InstitutionalBuy: '法人連續買超追蹤',
    InstitutionalSell: '法人連續賣超追蹤',
    PriceAbove: '突破目標價',
    PriceBelow: '跌破目標價',
    HighCatalystNews: '重大催化追蹤',
  };
  return map[type] ?? type;
}

function alertDescription(alert: Alert): string {
  switch (alert.alertType as AlertType) {
    case 'MoneyFlowReversal': return 'AI 偵測多維度反轉訊號（外資、融資、量能）';
    case 'VolumeSpike': return `成交量突破均量 ${alert.volumeMultiplier ?? 2} 倍時通知`;
    case 'InstitutionalBuy': return `外資連續買超 ≥ ${alert.consecutiveDays ?? 5} 日時通知`;
    case 'InstitutionalSell': return `外資連續賣超 ≥ ${alert.consecutiveDays ?? 5} 日時通知`;
    case 'PriceAbove': return `股價漲破 ${alert.targetPrice ?? '—'} 時通知`;
    case 'PriceBelow': return `股價跌破 ${alert.targetPrice ?? '—'} 時通知`;
    case 'HighCatalystNews': return 'AI 判斷高催化強度新聞即時推播';
    default: return '';
  }
}

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
})
export class Alerts implements OnInit {
  private readonly alertApi = inject(AlertApiService);
  private readonly alertNotification = inject(AlertNotificationService);
  private readonly stockApi = inject(StockApiService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ──
  readonly feedFilter = signal<AlertCategory>('all');
  readonly showCreateForm = signal(false);
  readonly alertTab = signal<AlertTab>('flow-reversal');
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  readonly alertTabs: { key: AlertTab; label: string }[] = [
    { key: 'flow-reversal', label: '資金反轉' },
    { key: 'volume', label: '量能異常' },
    { key: 'institutional', label: '法人動向' },
    { key: 'price', label: '到價警示' },
    { key: 'catalyst', label: '重大催化' },
  ];

  readonly filterTabs: { key: AlertCategory; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'flow-reversal', label: '資金反轉' },
    { key: 'volume', label: '量能異常' },
    { key: 'institutional', label: '法人動向' },
    { key: 'price', label: '到價' },
    { key: 'catalyst', label: '催化' },
  ];

  // ── Data from API ──
  readonly alerts = signal<Alert[]>([]);
  readonly notifications = signal<AlertHistoryItem[]>([]);
  readonly unreadCount = signal(0);

  // ── Adapted for template (same interface shape) ──
  readonly flowAlerts = computed(() =>
    this.alerts().map(a => ({
      id: a.id,
      type: ALERT_TYPE_TO_TAB[a.alertType as AlertType] ?? 'price' as AlertTab,
      symbol: a.symbol,
      name: a.nameZh ?? a.symbol,
      market: (/^\d/.test(a.symbol) ? 'tw' : 'us') as 'tw' | 'us',
      status: (a.isEnabled ? 'active' : 'triggered') as 'active' | 'triggered',
      priority: 'medium' as 'high' | 'medium' | 'low',
      title: alertTitle(a.alertType as AlertType),
      description: alertDescription(a),
      createdAt: a.createdAt?.slice(0, 10) ?? '',
    }))
  );

  readonly notificationsFeed = computed(() =>
    this.notifications().map(h => ({
      id: h.id,
      type: ALERT_TYPE_TO_TAB[h.alertType as AlertType] ?? 'price' as AlertTab,
      title: alertTitle(h.alertType as AlertType),
      message: h.message,
      symbol: h.symbol,
      market: (/^\d/.test(h.symbol) ? 'tw' : 'us') as 'tw' | 'us',
      timestamp: h.triggeredAt,
      isRead: h.isRead,
      priority: 'medium' as 'high' | 'medium' | 'low',
    }))
  );

  // ── New Alert Forms ──
  readonly newFlowReversalAlert = signal({ symbol: '', note: '' });
  readonly newVolumeAlert = signal({ symbol: '', multiplier: '2', avgDays: '20', note: '' });
  readonly newInstitutionalAlert = signal({ symbol: '', institution: 'foreign' as 'foreign' | 'investment' | 'dealer', days: '5', note: '' });
  readonly newPriceAlert = signal({ symbol: '', condition: 'above' as 'above' | 'below', targetPrice: '', note: '' });
  readonly newCatalystAlert = signal({ symbol: '', note: '' });

  // ── Computed ──
  readonly stats = computed(() => {
    const alerts = this.flowAlerts();
    const notifs = this.notificationsFeed();
    const today = new Date().toISOString().slice(0, 10);
    return {
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      unread: this.unreadCount(),
      triggeredToday: notifs.filter(n => n.timestamp.startsWith(today)).length,
      totalNotifs: notifs.length,
    };
  });

  readonly filteredNotifications = computed(() => {
    const filter = this.feedFilter();
    const notifs = this.notificationsFeed();
    if (filter === 'all') return notifs;
    return notifs.filter(n => n.type === filter);
  });

  readonly groupedNotifications = computed(() => {
    const notifs = this.filteredNotifications();
    const groups: { label: string; items: typeof notifs }[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const todayItems = notifs.filter(n => n.timestamp.startsWith(today));
    const yesterdayItems = notifs.filter(n => n.timestamp.startsWith(yesterday));
    const olderItems = notifs.filter(n => !n.timestamp.startsWith(today) && !n.timestamp.startsWith(yesterday));

    if (todayItems.length) groups.push({ label: '今天', items: todayItems });
    if (yesterdayItems.length) groups.push({ label: '昨天', items: yesterdayItems });
    if (olderItems.length) groups.push({ label: '更早', items: olderItems });

    return groups;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    forkJoin({
      alerts: this.alertApi.getAlerts().pipe(catchError(() => of([] as Alert[]))),
      history: this.alertApi.getHistory(1, 50).pipe(catchError(() => of([] as AlertHistoryItem[]))),
      unread: this.alertApi.getUnreadCount().pipe(catchError(() => of(0))),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ alerts, history, unread }) => {
        this.alerts.set(alerts);
        this.notifications.set(history);
        this.unreadCount.set(unread);
        this.isLoading.set(false);
      });
  }

  // ── Methods ──
  setFilter(filter: AlertCategory): void {
    this.feedFilter.set(filter);
  }

  markAsRead(id: string): void {
    this.alertApi.markAsRead([id]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.notifications.update(list =>
        list.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      this.unreadCount.update(c => Math.max(0, c - 1));
      this.alertNotification.refresh();
    });
  }

  markAllRead(): void {
    const unreadIds = this.notifications().filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;
    this.alertApi.markAsRead(unreadIds).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.notifications.update(list =>
        list.map(n => ({ ...n, isRead: true }))
      );
      this.unreadCount.set(0);
      this.alertNotification.refresh();
    });
  }

  deleteNotification(id: string): void {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  removeAlert(id: string): void {
    this.alertApi.deleteAlert(id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.alerts.update(list => list.filter(a => a.id !== id));
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
  }

  setAlertTab(tab: AlertTab): void {
    this.alertTab.set(tab);
  }

  getTypeLabel(type: AlertTab): string {
    const labels: Record<AlertTab, string> = {
      'flow-reversal': '資金反轉', volume: '量能異常', institutional: '法人動向',
      price: '到價', catalyst: '催化',
    };
    return labels[type];
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  // ── Submit Handlers ──
  private createAlertFromForm(alertType: AlertType, stockSymbol: string, opts?: {
    targetPrice?: number; volumeMultiplier?: number; consecutiveDays?: number;
  }): void {
    this.isSubmitting.set(true);
    // First resolve stockId via search
    this.stockApi.search(stockSymbol, undefined, 1).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(results => {
      if (results.length === 0) {
        this.isSubmitting.set(false);
        return;
      }
      const stock = results[0];
      this.alertApi.createAlert({
        stockId: stock.stockId,
        alertType,
        targetPrice: opts?.targetPrice,
        volumeMultiplier: opts?.volumeMultiplier,
        consecutiveDays: opts?.consecutiveDays,
      }).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (alert) => {
            this.alerts.update(list => [alert, ...list]);
            this.showCreateForm.set(false);
            this.isSubmitting.set(false);
          },
          error: () => { this.isSubmitting.set(false); },
        });
    });
  }

  submitFlowReversalAlert(): void {
    const form = this.newFlowReversalAlert();
    if (!form.symbol) return;
    this.createAlertFromForm('MoneyFlowReversal', form.symbol);
    this.newFlowReversalAlert.set({ symbol: '', note: '' });
  }

  submitVolumeAlert(): void {
    const form = this.newVolumeAlert();
    if (!form.symbol) return;
    this.createAlertFromForm('VolumeSpike', form.symbol, {
      volumeMultiplier: parseFloat(form.multiplier),
    });
    this.newVolumeAlert.set({ symbol: '', multiplier: '2', avgDays: '20', note: '' });
  }

  submitInstitutionalAlert(): void {
    const form = this.newInstitutionalAlert();
    if (!form.symbol) return;
    const alertType = resolveAlertType('institutional', { institution: form.institution });
    this.createAlertFromForm(alertType, form.symbol, {
      consecutiveDays: parseInt(form.days, 10),
    });
    this.newInstitutionalAlert.set({ symbol: '', institution: 'foreign', days: '5', note: '' });
  }

  submitPriceAlert(): void {
    const form = this.newPriceAlert();
    if (!form.symbol || !form.targetPrice) return;
    const alertType = resolveAlertType('price', { condition: form.condition });
    this.createAlertFromForm(alertType, form.symbol, {
      targetPrice: parseFloat(form.targetPrice),
    });
    this.newPriceAlert.set({ symbol: '', condition: 'above', targetPrice: '', note: '' });
  }

  submitCatalystAlert(): void {
    const form = this.newCatalystAlert();
    if (!form.symbol) return;
    this.createAlertFromForm('HighCatalystNews', form.symbol);
    this.newCatalystAlert.set({ symbol: '', note: '' });
  }

  updateForm(form: 'flowReversal' | 'volume' | 'institutional' | 'price' | 'catalyst', field: string, value: string): void {
    switch (form) {
      case 'flowReversal': this.newFlowReversalAlert.update(a => ({ ...a, [field]: value })); break;
      case 'volume': this.newVolumeAlert.update(a => ({ ...a, [field]: value })); break;
      case 'institutional': this.newInstitutionalAlert.update(a => ({ ...a, [field]: value })); break;
      case 'price': this.newPriceAlert.update(a => ({ ...a, [field]: value })); break;
      case 'catalyst': this.newCatalystAlert.update(a => ({ ...a, [field]: value })); break;
    }
  }
}
