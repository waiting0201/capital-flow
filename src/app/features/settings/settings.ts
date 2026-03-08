import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DisplaySettingsService, TextSize } from '../../core/services/display-settings.service';
import { UserApiService } from '../../core/services/user-api.service';
import { ApiKeyConfigDto, AiPreferenceDto, UpdateAiPreferenceRequest, AiModelDto } from '../../core/models/api-key.model';

type SettingsTab = 'profile' | 'apiKeys' | 'aiPrefs' | 'display' | 'security' | 'notifications';

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
export class Settings implements OnInit {
  // ── Services ──
  private readonly displaySettings = inject(DisplaySettingsService);
  private readonly userApi = inject(UserApiService);

  // ── Tab State ──
  readonly activeTab = signal<SettingsTab>('profile');

  readonly tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'profile', label: '個人檔案', icon: 'user' },
    { key: 'apiKeys', label: 'API 金鑰', icon: 'key' },
    { key: 'aiPrefs', label: 'AI 偏好', icon: 'brain' },
    { key: 'display', label: '顯示設定', icon: 'monitor' },
    { key: 'security', label: '安全設定', icon: 'shield' },
    { key: 'notifications', label: '通知偏好', icon: 'bell' },
  ];

  // ── Display Settings ──
  readonly currentTextSize = this.displaySettings.textSize;

  readonly textSizeOptions: { key: TextSize; label: string; description: string }[] = [
    { key: 'sm', label: '小', description: '精緻緊湊' },
    { key: 'md', label: '中', description: '舒適閱讀' },
    { key: 'lg', label: '大', description: '清晰醒目' },
  ];

  setTextSize(size: TextSize): void {
    this.displaySettings.setTextSize(size);
  }

  // ── Profile ──
  readonly profile = signal({
    displayName: '',
    email: '',
    phone: '',
    bio: '',
    avatarUrl: '',
    memberSince: '',
    plan: 'Free',
  });

  readonly avatarInitial = computed(() => {
    const name = this.profile().displayName;
    return name ? name.charAt(0).toUpperCase() : 'U';
  });

  // ── Provider metadata for display ──
  private static readonly providerMeta: Record<string, { label: string; icon: string; group: 'ai' | 'data' | 'media' }> = {
    Claude: { label: 'Anthropic (Claude)', icon: 'A', group: 'ai' },
    OpenAI: { label: 'OpenAI (GPT)', icon: 'O', group: 'ai' },
    Gemini: { label: 'Google (Gemini)', icon: 'G', group: 'ai' },
    Finnhub: { label: 'Finnhub', icon: 'F', group: 'data' },
    FMP: { label: 'Financial Modeling Prep', icon: 'M', group: 'data' },
    FRED: { label: 'FRED (聯準會)', icon: 'R', group: 'data' },
    FinMind: { label: 'FinMind (台股)', icon: 'T', group: 'data' },
    NewsAPI: { label: 'News API', icon: 'N', group: 'media' },
    Fugle: { label: 'Fugle (台灣)', icon: '富', group: 'media' },
    Polygon: { label: 'Polygon.io', icon: 'P', group: 'media' },
  };

  // ── API Keys ──
  readonly aiProviders = signal<ApiKeyEntry[]>([]);
  readonly dataSources = signal<ApiKeyEntry[]>([]);
  readonly mediaProviders = signal<ApiKeyEntry[]>([]);

  readonly apiKeySetupProgress = computed(() => {
    const all = [...this.aiProviders(), ...this.dataSources(), ...this.mediaProviders()];
    const configured = all.filter(k => k.isValid).length;
    return { configured, total: all.length, percent: all.length > 0 ? Math.round((configured / all.length) * 100) : 0 };
  });

  // ── AI Preferences ──
  private readonly providerToFrontend: Record<string, string> = { Claude: 'anthropic', OpenAI: 'openai', Gemini: 'gemini' };
  private readonly frontendToProvider: Record<string, string> = { anthropic: 'Claude', openai: 'OpenAI', gemini: 'Gemini' };

  readonly aiPrefs = signal({
    preferredProvider: 'anthropic' as 'anthropic' | 'openai' | 'gemini',
    simpleTaskModel: 'claude-haiku-4-5-20251001',
    complexTaskModel: 'claude-sonnet-4-6',
    temperature: 0.3,
    language: 'zh-TW',
    autoAnalysis: true,
    showConfidence: true,
  });

  // Models fetched from API: { provider -> { simple: AiModelDto[], complex: AiModelDto[] } }
  readonly providerModels = signal<Record<string, { simple: AiModelDto[]; complex: AiModelDto[] }>>({});

  readonly currentModels = computed(() => {
    const provider = this.aiPrefs().preferredProvider;
    const models = this.providerModels()[provider];
    return models ?? { simple: [], complex: [] };
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
  readonly saveError = signal<string | null>(null);
  readonly editingApiKey = signal<string | null>(null);
  readonly newApiKeyValue = signal('');
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);

  // ── Lifecycle ──

  ngOnInit(): void {
    this.loadProviders();
    this.loadSettings();
  }

  private loadProviders(): void {
    this.userApi.getProviders().subscribe({
      next: providers => {
        const modelsMap: Record<string, { simple: AiModelDto[]; complex: AiModelDto[] }> = {};
        for (const p of providers.ai) {
          if (!p.models?.length) continue;
          const frontendKey = this.providerToFrontend[p.name] ?? p.name.toLowerCase();
          modelsMap[frontendKey] = {
            simple: p.models.filter(m => m.tier === 'simple'),
            complex: p.models.filter(m => m.tier === 'complex'),
          };
        }
        this.providerModels.set(modelsMap);
      },
    });
  }

  private loadSettings(): void {
    this.userApi.getSettings().subscribe({
      next: settings => {
        // Profile
        this.profile.set({
          displayName: settings.profile.displayName,
          email: settings.profile.email,
          phone: '',
          bio: '',
          avatarUrl: settings.profile.avatarUrl ?? '',
          memberSince: '',
          plan: 'Free',
        });
        // API Keys
        this.applyApiKeys(settings.apiKeys);
        // AI Preference
        this.applyAiPreference(settings.aiPreference);
      },
    });
  }

  private applyApiKeys(apiKeys: ApiKeyConfigDto[]): void {
    const toEntry = (dto: ApiKeyConfigDto): ApiKeyEntry => {
      const meta = Settings.providerMeta[dto.provider] ?? { label: dto.provider, icon: dto.provider[0], group: 'data' as const };
      return {
        provider: dto.provider,
        label: meta.label,
        icon: meta.icon,
        maskedKey: dto.maskedKey ?? '',
        isValid: dto.isConfigured && dto.isValid,
        lastVerified: dto.lastValidatedAt ? dto.lastValidatedAt.split('T')[0] : '',
      };
    };

    const ai: ApiKeyEntry[] = [];
    const data: ApiKeyEntry[] = [];
    const media: ApiKeyEntry[] = [];

    for (const dto of apiKeys) {
      const group = Settings.providerMeta[dto.provider]?.group ?? 'data';
      const entry = toEntry(dto);
      if (group === 'ai') ai.push(entry);
      else if (group === 'data') data.push(entry);
      else media.push(entry);
    }

    this.aiProviders.set(ai);
    this.dataSources.set(data);
    this.mediaProviders.set(media);
  }

  private applyAiPreference(pref: AiPreferenceDto): void {
    const frontendProvider = this.providerToFrontend[pref.preferredAiProvider] ?? 'anthropic';
    let simpleModel = '';
    let complexModel = '';

    if (frontendProvider === 'anthropic') {
      simpleModel = pref.claudeSimpleModel ?? 'claude-haiku-4-5-20251001';
      complexModel = pref.claudeComplexModel ?? 'claude-sonnet-4-6';
    } else if (frontendProvider === 'openai') {
      simpleModel = pref.openAiSimpleModel ?? 'gpt-4o-mini';
      complexModel = pref.openAiComplexModel ?? 'gpt-4o';
    } else if (frontendProvider === 'gemini') {
      simpleModel = pref.geminiSimpleModel ?? 'gemini-2.0-flash';
      complexModel = pref.geminiComplexModel ?? 'gemini-2.5-pro';
    }

    this.aiPrefs.set({
      preferredProvider: frontendProvider as 'anthropic' | 'openai' | 'gemini',
      simpleTaskModel: simpleModel,
      complexTaskModel: complexModel,
      temperature: pref.temperature,
      language: 'zh-TW',
      autoAnalysis: true,
      showConfidence: true,
    });
  }

  // ── Methods ──
  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
    this.saveSuccess.set(false);
    this.saveError.set(null);
  }

  updateProfile(field: string, value: string): void {
    this.profile.update(p => ({ ...p, [field]: value }));
  }

  saveProfile(): void {
    this.saving.set(true);
    this.saveError.set(null);
    const p = this.profile();

    this.userApi.updateProfile({
      displayName: p.displayName || undefined,
      avatarUrl: p.avatarUrl || undefined,
    }).subscribe({
      next: user => {
        this.profile.update(prev => ({
          ...prev,
          displayName: user.displayName,
          email: user.email,
          avatarUrl: user.avatarUrl ?? '',
        }));
        this.saving.set(false);
        this.showSaveToast();
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('儲存失敗，請稍後再試');
      },
    });
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

    this.saving.set(true);
    this.userApi.setApiKey(provider, value).subscribe({
      next: result => {
        const updateFn = (entries: ApiKeyEntry[]) =>
          entries.map(e =>
            e.provider === provider
              ? {
                  ...e,
                  maskedKey: result.maskedKey ?? '',
                  isValid: result.isConfigured && result.isValid,
                  lastVerified: result.lastValidatedAt ? result.lastValidatedAt.split('T')[0] : '',
                }
              : e
          );

        if (list === 'ai') this.aiProviders.update(updateFn);
        else if (list === 'data') this.dataSources.update(updateFn);
        else this.mediaProviders.update(updateFn);

        this.editingApiKey.set(null);
        this.newApiKeyValue.set('');
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('API Key 儲存失敗');
      },
    });
  }

  removeApiKey(provider: string, list: 'ai' | 'data' | 'media'): void {
    this.userApi.removeApiKey(provider).subscribe({
      next: () => {
        const updateFn = (entries: ApiKeyEntry[]) =>
          entries.map(e =>
            e.provider === provider
              ? { ...e, maskedKey: '', isValid: false, lastVerified: '' }
              : e
          );

        if (list === 'ai') this.aiProviders.update(updateFn);
        else if (list === 'data') this.dataSources.update(updateFn);
        else this.mediaProviders.update(updateFn);
      },
    });
  }

  updateAiPref(field: string, value: string | number | boolean): void {
    this.aiPrefs.update(p => ({ ...p, [field]: value }));
  }

  saveAiPrefs(): void {
    this.saving.set(true);
    this.saveError.set(null);
    const prefs = this.aiPrefs();
    const backendProvider = this.frontendToProvider[prefs.preferredProvider] ?? 'Claude';

    const request: UpdateAiPreferenceRequest = {
      preferredAiProvider: backendProvider,
      temperature: prefs.temperature,
    };

    if (prefs.preferredProvider === 'anthropic') {
      request.claudeSimpleModel = prefs.simpleTaskModel;
      request.claudeComplexModel = prefs.complexTaskModel;
    } else if (prefs.preferredProvider === 'openai') {
      request.openAiSimpleModel = prefs.simpleTaskModel;
      request.openAiComplexModel = prefs.complexTaskModel;
    } else if (prefs.preferredProvider === 'gemini') {
      request.geminiSimpleModel = prefs.simpleTaskModel;
      request.geminiComplexModel = prefs.complexTaskModel;
    }

    this.userApi.updateAiPreference(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.showSaveToast();
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('儲存失敗，請稍後再試');
      },
    });
  }

  updatePasswordField(field: string, value: string): void {
    this.passwordForm.update(f => ({ ...f, [field]: value }));
  }

  changePassword(): void {
    const form = this.passwordForm();
    if (form.newPassword !== form.confirmPassword) {
      this.saveError.set('新密碼與確認密碼不一致');
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    this.userApi.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.passwordForm.set({ currentPassword: '', newPassword: '', confirmPassword: '' });
        this.showSaveToast();
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.error?.message ?? '密碼變更失敗');
      },
    });
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
      this.showSaveToast();
    }, 800);
  }

  getTemperatureLabel(): string {
    const t = this.aiPrefs().temperature;
    if (t <= 0.2) return '精確';
    if (t <= 0.5) return '平衡';
    if (t <= 0.8) return '創意';
    return '發散';
  }

  private showSaveToast(): void {
    this.saveSuccess.set(true);
    setTimeout(() => this.saveSuccess.set(false), 3000);
  }
}
