import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

type SettingsTab = 'profile' | 'apiKeys' | 'aiPrefs' | 'security' | 'notifications';
type AiProvider = 'anthropic' | 'openai' | 'gemini';

interface ApiKeyEntry {
  provider: string;
  label: string;
  icon: string;
  maskedKey: string;
  isValid: boolean;
  lastVerified: string;
}

interface NotificationPref {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  // ── Tab State ──
  readonly activeTab = signal<SettingsTab>('profile');

  readonly tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'profile', label: '個人檔案', icon: 'user' },
    { key: 'apiKeys', label: 'API 金鑰', icon: 'key' },
    { key: 'aiPrefs', label: 'AI 偏好', icon: 'brain' },
    { key: 'security', label: '安全設定', icon: 'shield' },
    { key: 'notifications', label: '通知偏好', icon: 'bell' },
  ];

  // ── Profile ──
  readonly profile = signal({
    displayName: 'Tim Chen',
    email: 'tim.chen@capitalflow.io',
    phone: '+886 912-345-678',
    bio: '專注於台股半導體與美股科技股的價值投資者',
    avatarUrl: '',
    memberSince: '2024-08-15',
    plan: 'Professional',
  });

  readonly avatarInitial = computed(() => {
    const name = this.profile().displayName;
    return name ? name.charAt(0).toUpperCase() : 'U';
  });

  // ── API Keys ──
  readonly aiProviders = signal<ApiKeyEntry[]>([
    { provider: 'anthropic', label: 'Anthropic (Claude)', icon: 'A', maskedKey: 'sk-ant-••••••••7f3x', isValid: true, lastVerified: '2026-02-27' },
    { provider: 'openai', label: 'OpenAI (GPT)', icon: 'O', maskedKey: '', isValid: false, lastVerified: '' },
    { provider: 'gemini', label: 'Google (Gemini)', icon: 'G', maskedKey: '', isValid: false, lastVerified: '' },
  ]);

  readonly dataSources = signal<ApiKeyEntry[]>([
    { provider: 'finnhub', label: 'Finnhub', icon: 'F', maskedKey: 'ct3p••••••q8v1', isValid: true, lastVerified: '2026-02-26' },
    { provider: 'fmp', label: 'Financial Modeling Prep', icon: 'M', maskedKey: '', isValid: false, lastVerified: '' },
    { provider: 'fred', label: 'FRED (聯準會)', icon: 'R', maskedKey: 'a1b2••••••9z0x', isValid: true, lastVerified: '2026-02-25' },
    { provider: 'finmind', label: 'FinMind (台股)', icon: 'T', maskedKey: '', isValid: false, lastVerified: '' },
  ]);

  readonly mediaProviders = signal<ApiKeyEntry[]>([
    { provider: 'newsapi', label: 'News API', icon: 'N', maskedKey: 'na-••••••••k2m4', isValid: true, lastVerified: '2026-02-27' },
    { provider: 'fugle', label: 'Fugle (台灣)', icon: '富', maskedKey: '', isValid: false, lastVerified: '' },
    { provider: 'polygon', label: 'Polygon.io', icon: 'P', maskedKey: '', isValid: false, lastVerified: '' },
  ]);

  readonly apiKeySetupProgress = computed(() => {
    const all = [...this.aiProviders(), ...this.dataSources(), ...this.mediaProviders()];
    const configured = all.filter(k => k.isValid).length;
    return { configured, total: all.length, percent: Math.round((configured / all.length) * 100) };
  });

  // ── AI Preferences ──
  readonly aiPrefs = signal({
    preferredProvider: 'anthropic' as AiProvider,
    simpleTaskModel: 'claude-haiku-4-5',
    complexTaskModel: 'claude-sonnet-4-6',
    temperature: 0.3,
    language: 'zh-TW',
    autoAnalysis: true,
    showConfidence: true,
  });

  readonly providerModels: Record<AiProvider, { simple: string[]; complex: string[] }> = {
    anthropic: {
      simple: ['claude-haiku-4-5', 'claude-sonnet-4-6'],
      complex: ['claude-sonnet-4-6', 'claude-opus-4-6'],
    },
    openai: {
      simple: ['gpt-4o-mini', 'gpt-4o'],
      complex: ['gpt-4o', 'o1', 'o3-mini'],
    },
    gemini: {
      simple: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
      complex: ['gemini-2.5-pro', 'gemini-2.0-flash'],
    },
  };

  readonly currentModels = computed(() => {
    const provider = this.aiPrefs().preferredProvider;
    return this.providerModels[provider];
  });

  // ── Security ──
  readonly passwordForm = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  readonly twoFactorEnabled = signal(false);
  readonly sessions = signal([
    { device: 'MacBook Pro — Chrome', location: '台北, 台灣', lastActive: '目前使用中', isCurrent: true },
    { device: 'iPhone 15 Pro — Safari', location: '台北, 台灣', lastActive: '2 小時前', isCurrent: false },
    { device: 'Windows PC — Edge', location: '新竹, 台灣', lastActive: '3 天前', isCurrent: false },
  ]);

  // ── Notifications ──
  readonly notifications = signal<NotificationPref[]>([
    { key: 'priceAlert', label: '價格警示', description: '自選股達到設定的價格目標時通知', enabled: true },
    { key: 'volumeSpike', label: '異常量能', description: '偵測到自選股成交量暴增時通知', enabled: true },
    { key: 'aiInsight', label: 'AI 洞察', description: '每日開盤前 AI 大盤分析摘要', enabled: true },
    { key: 'newsAlert', label: '重大新聞', description: '自選股相關重大新聞即時推播', enabled: false },
    { key: 'earningsReminder', label: '財報提醒', description: '自選股財報公佈日前一天提醒', enabled: true },
    { key: 'weeklyReport', label: '週報', description: '每週日發送投資組合績效摘要', enabled: false },
  ]);

  readonly notifyChannels = signal({
    inApp: true,
    email: true,
    push: false,
  });

  // ── UI State ──
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);
  readonly editingApiKey = signal<string | null>(null);
  readonly newApiKeyValue = signal('');
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);

  // ── Methods ──
  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
    this.saveSuccess.set(false);
  }

  updateProfile(field: string, value: string): void {
    this.profile.update(p => ({ ...p, [field]: value }));
  }

  saveProfile(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    }, 800);
  }

  startEditApiKey(provider: string): void {
    this.editingApiKey.set(provider);
    this.newApiKeyValue.set('');
  }

  cancelEditApiKey(): void {
    this.editingApiKey.set(null);
    this.newApiKeyValue.set('');
  }

  saveApiKey(provider: string, list: 'ai' | 'data' | 'media'): void {
    const value = this.newApiKeyValue();
    if (!value) return;

    const masked = value.substring(0, 4) + '••••••••' + value.slice(-4);
    const updateFn = (entries: ApiKeyEntry[]) =>
      entries.map(e =>
        e.provider === provider
          ? { ...e, maskedKey: masked, isValid: true, lastVerified: '2026-02-28' }
          : e
      );

    if (list === 'ai') this.aiProviders.update(updateFn);
    else if (list === 'data') this.dataSources.update(updateFn);
    else this.mediaProviders.update(updateFn);

    this.editingApiKey.set(null);
    this.newApiKeyValue.set('');
  }

  removeApiKey(provider: string, list: 'ai' | 'data' | 'media'): void {
    const updateFn = (entries: ApiKeyEntry[]) =>
      entries.map(e =>
        e.provider === provider
          ? { ...e, maskedKey: '', isValid: false, lastVerified: '' }
          : e
      );

    if (list === 'ai') this.aiProviders.update(updateFn);
    else if (list === 'data') this.dataSources.update(updateFn);
    else this.mediaProviders.update(updateFn);
  }

  updateAiPref(field: string, value: string | number | boolean): void {
    this.aiPrefs.update(p => ({ ...p, [field]: value }));
  }

  saveAiPrefs(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    }, 800);
  }

  updatePasswordField(field: string, value: string): void {
    this.passwordForm.update(f => ({ ...f, [field]: value }));
  }

  changePassword(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.passwordForm.set({ currentPassword: '', newPassword: '', confirmPassword: '' });
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    }, 800);
  }

  toggleTwoFactor(): void {
    this.twoFactorEnabled.update(v => !v);
  }

  revokeSession(index: number): void {
    this.sessions.update(s => s.filter((_, i) => i !== index));
  }

  toggleNotification(key: string): void {
    this.notifications.update(list =>
      list.map(n => n.key === key ? { ...n, enabled: !n.enabled } : n)
    );
  }

  toggleChannel(channel: string): void {
    this.notifyChannels.update(c => ({ ...c, [channel]: !c[channel as keyof typeof c] }));
  }

  saveNotifications(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    }, 800);
  }

  getTemperatureLabel(): string {
    const t = this.aiPrefs().temperature;
    if (t <= 0.2) return '精確';
    if (t <= 0.5) return '平衡';
    if (t <= 0.8) return '創意';
    return '發散';
  }
}
