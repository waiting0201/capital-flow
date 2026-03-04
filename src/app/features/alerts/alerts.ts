import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

type AlertCategory = 'all' | 'flow-reversal' | 'volume' | 'institutional' | 'price' | 'catalyst';
type AlertTab = 'flow-reversal' | 'volume' | 'institutional' | 'price' | 'catalyst';

interface FlowAlert {
  id: string;
  type: AlertTab;
  symbol: string;
  name: string;
  market: 'tw' | 'us';
  status: 'active' | 'triggered';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  createdAt: string;
  triggeredAt?: string;
}

interface AlertNotification {
  id: string;
  type: AlertTab;
  title: string;
  message: string;
  symbol?: string;
  market?: 'tw' | 'us';
  timestamp: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
})
export class Alerts {
  // ── State ──
  readonly feedFilter = signal<AlertCategory>('all');
  readonly showCreateForm = signal(false);
  readonly alertTab = signal<AlertTab>('flow-reversal');

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

  // ── Active Alerts ──
  readonly flowAlerts = signal<FlowAlert[]>([
    { id: '1', type: 'flow-reversal', symbol: 'NVDA', name: 'NVIDIA', market: 'us', status: 'active', priority: 'high', title: 'AI 偵測資金反轉', description: '外資由買轉賣 + 融資增加 + 量能萎縮，多維度反轉訊號', createdAt: '2026-02-26' },
    { id: '2', type: 'volume', symbol: '2330', name: '台積電', market: 'tw', status: 'active', priority: 'high', title: '量能異常偵測', description: '成交量突破 20 日均量 2.3 倍時通知', createdAt: '2026-02-25' },
    { id: '3', type: 'institutional', symbol: '2382', name: '廣達', market: 'tw', status: 'active', priority: 'medium', title: '法人連續買超追蹤', description: '外資連續買超 ≥ 5 日時通知', createdAt: '2026-02-27' },
    { id: '4', type: 'price', symbol: '2330', name: '台積電', market: 'tw', status: 'active', priority: 'medium', title: '突破壓力區', description: '股價漲破 880 時通知（前高壓力區）', createdAt: '2026-02-25' },
    { id: '5', type: 'catalyst', symbol: 'AAPL', name: 'Apple', market: 'us', status: 'active', priority: 'low', title: '重大催化追蹤', description: 'AI 判斷高催化強度新聞即時推播', createdAt: '2026-02-28' },
  ]);

  // ── Notification Feed ──
  readonly notifications = signal<AlertNotification[]>([
    { id: 'n1', type: 'flow-reversal', title: '資金反轉預警', message: 'NVDA 外資由買轉賣，同時融資增加 12%，AI 判斷資金方向可能反轉。建議關注後續法人動向。', symbol: 'NVDA', market: 'us', timestamp: '2026-02-28T09:32:00', isRead: false, priority: 'high' },
    { id: 'n2', type: 'volume', title: '量能異常偵測', message: '廣達 (2382) 成交量突破 20 日均量 2.3 倍，資金大規模進出信號。', symbol: '2382', market: 'tw', timestamp: '2026-02-28T09:15:00', isRead: false, priority: 'high' },
    { id: 'n3', type: 'institutional', title: '法人動向異動', message: '外資連續 8 日買超台積電 (2330)，累計買超 18,562 張，佔成交比重 32%。籌碼持續向大戶集中。', symbol: '2330', market: 'tw', timestamp: '2026-02-28T08:00:00', isRead: false, priority: 'medium' },
    { id: 'n4', type: 'catalyst', title: '重大催化事件', message: 'NVIDIA 發布 2026 Q1 財報，營收 YoY 成長 78%，超越市場預期。AI 判斷催化強度：高。盤後股價上漲 4.2%。', symbol: 'NVDA', market: 'us', timestamp: '2026-02-27T21:30:00', isRead: true, priority: 'high' },
    { id: 'n5', type: 'flow-reversal', title: '資金反轉確認', message: '鴻海 (2317) 外資連續 3 日由買轉賣，融資餘額同步增加，資金流向已確認反轉。', symbol: '2317', market: 'tw', timestamp: '2026-02-27T13:30:00', isRead: true, priority: 'medium' },
    { id: 'n6', type: 'volume', title: '量能異常偵測', message: '緯創 (3231) 今日成交量為 20 日均量 3.1 倍，短線量價齊揚，資金大規模湧入。', symbol: '3231', market: 'tw', timestamp: '2026-02-27T13:30:00', isRead: true, priority: 'medium' },
    { id: 'n7', type: 'price', title: '到價警示觸發', message: 'Apple (AAPL) 收盤價 178.52，距離目標價 175 僅差 2.0%。', symbol: 'AAPL', market: 'us', timestamp: '2026-02-27T16:00:00', isRead: true, priority: 'medium' },
    { id: 'n8', type: 'institutional', title: '法人動向異動', message: '投信連續 3 日買超廣達 (2382)，累計買超 5,230 張。資金從被動轉為主動加碼。', symbol: '2382', market: 'tw', timestamp: '2026-02-27T08:00:00', isRead: true, priority: 'low' },
  ]);

  // ── New Alert Forms ──
  readonly newFlowReversalAlert = signal({ symbol: '', note: '' });
  readonly newVolumeAlert = signal({ symbol: '', multiplier: '2', avgDays: '20', note: '' });
  readonly newInstitutionalAlert = signal({ symbol: '', institution: 'foreign' as 'foreign' | 'investment' | 'dealer', days: '5', note: '' });
  readonly newPriceAlert = signal({ symbol: '', condition: 'above' as 'above' | 'below', targetPrice: '', note: '' });
  readonly newCatalystAlert = signal({ symbol: '', note: '' });

  // ── Computed ──
  readonly stats = computed(() => {
    const alerts = this.flowAlerts();
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
    const groups: { label: string; items: AlertNotification[] }[] = [];
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
  setFilter(filter: AlertCategory): void {
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
    this.flowAlerts.update(list => list.filter(a => a.id !== id));
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
  submitFlowReversalAlert(): void {
    const form = this.newFlowReversalAlert();
    if (!form.symbol) return;
    this.flowAlerts.update(list => [{
      id: `fr-${Date.now()}`, type: 'flow-reversal' as const, symbol: form.symbol.toUpperCase(),
      name: form.symbol.toUpperCase(), market: (/^\d/.test(form.symbol) ? 'tw' : 'us') as 'tw' | 'us',
      status: 'active' as const, priority: 'high' as const,
      title: 'AI 偵測資金反轉', description: 'AI 偵測多維度反轉訊號（外資、融資、量能）',
      createdAt: '2026-02-28',
    }, ...list]);
    this.newFlowReversalAlert.set({ symbol: '', note: '' });
    this.showCreateForm.set(false);
  }

  submitVolumeAlert(): void {
    const form = this.newVolumeAlert();
    if (!form.symbol) return;
    this.flowAlerts.update(list => [{
      id: `va-${Date.now()}`, type: 'volume' as const, symbol: form.symbol.toUpperCase(),
      name: form.symbol.toUpperCase(), market: (/^\d/.test(form.symbol) ? 'tw' : 'us') as 'tw' | 'us',
      status: 'active' as const, priority: 'medium' as const,
      title: '量能異常偵測', description: `成交量突破 ${form.avgDays} 日均量 ${form.multiplier} 倍時通知`,
      createdAt: '2026-02-28',
    }, ...list]);
    this.newVolumeAlert.set({ symbol: '', multiplier: '2', avgDays: '20', note: '' });
    this.showCreateForm.set(false);
  }

  submitInstitutionalAlert(): void {
    const form = this.newInstitutionalAlert();
    if (!form.symbol) return;
    const instLabel = form.institution === 'foreign' ? '外資' : form.institution === 'investment' ? '投信' : '自營商';
    this.flowAlerts.update(list => [{
      id: `ia-${Date.now()}`, type: 'institutional' as const, symbol: form.symbol.toUpperCase(),
      name: form.symbol.toUpperCase(), market: (/^\d/.test(form.symbol) ? 'tw' : 'us') as 'tw' | 'us',
      status: 'active' as const, priority: 'medium' as const,
      title: '法人動向追蹤', description: `${instLabel}連續買超/賣超 ≥ ${form.days} 日時通知`,
      createdAt: '2026-02-28',
    }, ...list]);
    this.newInstitutionalAlert.set({ symbol: '', institution: 'foreign', days: '5', note: '' });
    this.showCreateForm.set(false);
  }

  submitPriceAlert(): void {
    const form = this.newPriceAlert();
    if (!form.symbol || !form.targetPrice) return;
    const condLabel = form.condition === 'above' ? '漲破' : '跌破';
    this.flowAlerts.update(list => [{
      id: `pa-${Date.now()}`, type: 'price' as const, symbol: form.symbol.toUpperCase(),
      name: form.symbol.toUpperCase(), market: (/^\d/.test(form.symbol) ? 'tw' : 'us') as 'tw' | 'us',
      status: 'active' as const, priority: 'medium' as const,
      title: `${condLabel}目標價`, description: `股價${condLabel} ${form.targetPrice} 時通知`,
      createdAt: '2026-02-28',
    }, ...list]);
    this.newPriceAlert.set({ symbol: '', condition: 'above', targetPrice: '', note: '' });
    this.showCreateForm.set(false);
  }

  submitCatalystAlert(): void {
    const form = this.newCatalystAlert();
    if (!form.symbol) return;
    this.flowAlerts.update(list => [{
      id: `ca-${Date.now()}`, type: 'catalyst' as const, symbol: form.symbol.toUpperCase(),
      name: form.symbol.toUpperCase(), market: (/^\d/.test(form.symbol) ? 'tw' : 'us') as 'tw' | 'us',
      status: 'active' as const, priority: 'low' as const,
      title: '重大催化追蹤', description: 'AI 判斷高催化強度新聞即時推播',
      createdAt: '2026-02-28',
    }, ...list]);
    this.newCatalystAlert.set({ symbol: '', note: '' });
    this.showCreateForm.set(false);
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
