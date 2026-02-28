import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertType, PriceAlert, NotificationItem } from '../../core/models';

type FeedFilter = 'all' | 'price' | 'volume' | 'institutional' | 'news' | 'earnings' | 'ai';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
})
export class Alerts {
  // ── Filter State ──
  readonly feedFilter = signal<FeedFilter>('all');
  readonly showCreateForm = signal(false);

  readonly filterTabs: { key: FeedFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'price', label: '到價' },
    { key: 'volume', label: '量能' },
    { key: 'institutional', label: '法人' },
    { key: 'news', label: '新聞' },
    { key: 'earnings', label: '財報' },
    { key: 'ai', label: 'AI' },
  ];

  // ── Active Price Alerts ──
  readonly priceAlerts = signal<PriceAlert[]>([
    { id: '1', symbol: '2330', name: '台積電', market: 'tw', type: 'price', condition: 'above', targetPrice: 880, currentPrice: 852, status: 'active', priority: 'high', createdAt: '2026-02-25', note: '突破前高壓力區' },
    { id: '2', symbol: 'NVDA', name: 'NVIDIA', market: 'us', type: 'price', condition: 'below', targetPrice: 850, currentPrice: 875.3, status: 'active', priority: 'medium', createdAt: '2026-02-26' },
    { id: '3', symbol: '2382', name: '廣達', market: 'tw', type: 'price', condition: 'above', targetPrice: 320, currentPrice: 312, status: 'active', priority: 'medium', createdAt: '2026-02-27' },
    { id: '4', symbol: 'AAPL', name: 'Apple', market: 'us', type: 'price', condition: 'below', targetPrice: 175, currentPrice: 178.52, status: 'active', priority: 'low', createdAt: '2026-02-20' },
    { id: '5', symbol: '2317', name: '鴻海', market: 'tw', type: 'price', condition: 'above', targetPrice: 185, currentPrice: 178, status: 'active', priority: 'medium', createdAt: '2026-02-28' },
  ]);

  // ── Notification Feed ──
  readonly notifications = signal<NotificationItem[]>([
    { id: 'n1', type: 'price', title: '到價警示觸發', message: '台積電 (2330) 盤中觸及 850.00，接近您設定的目標價 880。', symbol: '2330', market: 'tw', timestamp: '2026-02-28T09:32:00', isRead: false, priority: 'high' },
    { id: 'n2', type: 'volume', title: '異常量能偵測', message: '廣達 (2382) 成交量突破 5 日均量 2.3 倍，目前量能持續放大中。', symbol: '2382', market: 'tw', timestamp: '2026-02-28T09:15:00', isRead: false, priority: 'high' },
    { id: 'n3', type: 'ai', title: 'AI 盤前分析', message: '台股加權指數預估今日開高走高，半導體族群受 NVIDIA 財報利多帶動，建議關注 AI 伺服器供應鏈。', timestamp: '2026-02-28T08:30:00', isRead: false, priority: 'medium' },
    { id: 'n4', type: 'institutional', title: '法人動向異動', message: '外資連續 5 日買超台積電 (2330)，累計買超 18,562 張，佔成交比重 32%。', symbol: '2330', market: 'tw', timestamp: '2026-02-28T08:00:00', isRead: true, priority: 'medium' },
    { id: 'n5', type: 'news', title: '重大新聞', message: 'NVIDIA 發布 2026 Q1 財報，營收 YoY 成長 78%，超越市場預期。盤後股價上漲 4.2%。', symbol: 'NVDA', market: 'us', timestamp: '2026-02-27T21:30:00', isRead: true, priority: 'high' },
    { id: 'n6', type: 'earnings', title: '財報提醒', message: '鴻海 (2317) 將於 3 月 14 日公布 2025 年度財務報告，建議提前檢視持股部位。', symbol: '2317', market: 'tw', timestamp: '2026-02-27T18:00:00', isRead: true, priority: 'low' },
    { id: 'n7', type: 'price', title: '到價警示觸發', message: 'Apple (AAPL) 收盤價 178.52，距離您的目標價 175 僅差 2.0%。', symbol: 'AAPL', market: 'us', timestamp: '2026-02-27T16:00:00', isRead: true, priority: 'medium' },
    { id: 'n8', type: 'volume', title: '異常量能偵測', message: '緯創 (3231) 今日成交量為過去 20 日均量的 3.1 倍，短線量價齊揚。', symbol: '3231', market: 'tw', timestamp: '2026-02-27T13:30:00', isRead: true, priority: 'medium' },
    { id: 'n9', type: 'institutional', title: '法人動向異動', message: '投信連續 3 日買超廣達 (2382)，累計買超 5,230 張。', symbol: '2382', market: 'tw', timestamp: '2026-02-27T08:00:00', isRead: true, priority: 'low' },
    { id: 'n10', type: 'ai', title: 'AI 週報摘要', message: '本週台股加權指數上漲 1.8%，您的自選股組合平均漲幅 2.4%，跑贏大盤。表現最佳：廣達 +4.1%。', timestamp: '2026-02-23T20:00:00', isRead: true, priority: 'low' },
  ]);

  // ── New Alert Form ──
  readonly newAlert = signal({
    symbol: '',
    condition: 'above' as 'above' | 'below',
    targetPrice: '',
    note: '',
  });

  // ── Computed ──
  readonly stats = computed(() => {
    const alerts = this.priceAlerts();
    const notifs = this.notifications();
    return {
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      unread: notifs.filter(n => !n.isRead).length,
      triggeredToday: notifs.filter(n => n.timestamp.startsWith('2026-02-28')).length,
      totalNotifs: notifs.length,
    };
  });

  readonly filteredNotifications = computed(() => {
    const filter = this.feedFilter();
    const notifs = this.notifications();
    if (filter === 'all') return notifs;
    return notifs.filter(n => n.type === filter);
  });

  readonly groupedNotifications = computed(() => {
    const notifs = this.filteredNotifications();
    const groups: { label: string; items: NotificationItem[] }[] = [];
    const today = '2026-02-28';
    const yesterday = '2026-02-27';

    const todayItems = notifs.filter(n => n.timestamp.startsWith(today));
    const yesterdayItems = notifs.filter(n => n.timestamp.startsWith(yesterday));
    const olderItems = notifs.filter(n => !n.timestamp.startsWith(today) && !n.timestamp.startsWith(yesterday));

    if (todayItems.length) groups.push({ label: '今天', items: todayItems });
    if (yesterdayItems.length) groups.push({ label: '昨天', items: yesterdayItems });
    if (olderItems.length) groups.push({ label: '更早', items: olderItems });

    return groups;
  });

  // ── Methods ──
  setFilter(filter: FeedFilter): void {
    this.feedFilter.set(filter);
  }

  markAsRead(id: string): void {
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }

  markAllRead(): void {
    this.notifications.update(list =>
      list.map(n => ({ ...n, isRead: true }))
    );
  }

  deleteNotification(id: string): void {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  removeAlert(id: string): void {
    this.priceAlerts.update(list => list.filter(a => a.id !== id));
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
  }

  updateNewAlert(field: string, value: string): void {
    this.newAlert.update(a => ({ ...a, [field]: value }));
  }

  submitNewAlert(): void {
    const form = this.newAlert();
    if (!form.symbol || !form.targetPrice) return;

    const newEntry: PriceAlert = {
      id: `new-${Date.now()}`,
      symbol: form.symbol.toUpperCase(),
      name: form.symbol.toUpperCase(),
      market: /^\d/.test(form.symbol) ? 'tw' : 'us',
      type: 'price',
      condition: form.condition,
      targetPrice: parseFloat(form.targetPrice),
      currentPrice: 0,
      status: 'active',
      priority: 'medium',
      createdAt: '2026-02-28',
      note: form.note || undefined,
    };

    this.priceAlerts.update(list => [newEntry, ...list]);
    this.newAlert.set({ symbol: '', condition: 'above', targetPrice: '', note: '' });
    this.showCreateForm.set(false);
  }

  getAlertProgress(alert: PriceAlert): number {
    if (alert.condition === 'above') {
      return Math.min(100, (alert.currentPrice / alert.targetPrice) * 100);
    }
    return Math.min(100, (alert.targetPrice / alert.currentPrice) * 100);
  }

  getAlertDistance(alert: PriceAlert): string {
    const diff = ((alert.targetPrice - alert.currentPrice) / alert.currentPrice) * 100;
    return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
  }

  getTypeIcon(type: AlertType): string {
    const icons: Record<AlertType, string> = {
      price: 'target', volume: 'bar', institutional: 'building',
      news: 'newspaper', earnings: 'calendar', ai: 'brain',
    };
    return icons[type];
  }

  getTypeLabel(type: AlertType): string {
    const labels: Record<AlertType, string> = {
      price: '到價', volume: '量能', institutional: '法人',
      news: '新聞', earnings: '財報', ai: 'AI',
    };
    return labels[type];
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
