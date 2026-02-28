import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface OnboardingKey {
  provider: string;
  label: string;
  icon: string;
  description: string;
  keyValue: string;
  isValid: boolean;
  placeholder: string;
}

type AiProvider = 'anthropic' | 'openai' | 'gemini';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding {
  private readonly router = inject(Router);

  readonly currentStep = signal(1);
  readonly totalSteps = 4;

  readonly steps = [
    { num: 1, label: 'AI 模型' },
    { num: 2, label: '金融數據' },
    { num: 3, label: '新聞媒體' },
    { num: 4, label: 'AI 偏好' },
  ];

  // ── Step 1: AI Providers ──
  readonly aiProviders = signal<OnboardingKey[]>([
    { provider: 'anthropic', label: 'Anthropic (Claude)', icon: 'A', description: 'Claude 系列模型，擅長分析與推理', keyValue: '', isValid: false, placeholder: 'sk-ant-api03-...' },
    { provider: 'openai', label: 'OpenAI (GPT)', icon: 'O', description: 'GPT 系列模型，泛用性強', keyValue: '', isValid: false, placeholder: 'sk-...' },
    { provider: 'gemini', label: 'Google (Gemini)', icon: 'G', description: 'Gemini 系列模型，多模態能力佳', keyValue: '', isValid: false, placeholder: 'AIza...' },
  ]);

  // ── Step 2: Data Sources ──
  readonly dataSources = signal<OnboardingKey[]>([
    { provider: 'finnhub', label: 'Finnhub', icon: 'F', description: '美股即時行情、基本面數據', keyValue: '', isValid: false, placeholder: 'ct3p...' },
    { provider: 'fmp', label: 'Financial Modeling Prep', icon: 'M', description: '全球財務數據、歷史價格', keyValue: '', isValid: false, placeholder: 'FMP-...' },
    { provider: 'fred', label: 'FRED (聯準會)', icon: 'R', description: '美國總體經濟指標', keyValue: '', isValid: false, placeholder: 'a1b2...' },
    { provider: 'finmind', label: 'FinMind (台股)', icon: 'T', description: '台灣股市完整數據', keyValue: '', isValid: false, placeholder: 'finmind-...' },
  ]);

  // ── Step 3: Media Providers ──
  readonly mediaProviders = signal<OnboardingKey[]>([
    { provider: 'newsapi', label: 'News API', icon: 'N', description: '全球新聞即時搜尋', keyValue: '', isValid: false, placeholder: 'na-...' },
    { provider: 'fugle', label: 'Fugle (台灣)', icon: '富', description: '台灣股市新聞與資訊', keyValue: '', isValid: false, placeholder: 'fugle-...' },
    { provider: 'polygon', label: 'Polygon.io', icon: 'P', description: '美股新聞與深度數據', keyValue: '', isValid: false, placeholder: 'poly-...' },
  ]);

  // ── Step 4: AI Preferences ──
  readonly aiPrefs = signal({
    preferredProvider: 'anthropic' as AiProvider,
    simpleTaskModel: 'claude-haiku-4-5',
    complexTaskModel: 'claude-sonnet-4-6',
    temperature: 0.3,
    language: 'zh-TW',
    autoAnalysis: true,
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

  readonly currentModels = computed(() => this.providerModels[this.aiPrefs().preferredProvider]);

  // ── Computed ──
  readonly aiConfigured = computed(() => this.aiProviders().filter(p => p.isValid).length);
  readonly dataConfigured = computed(() => this.dataSources().filter(p => p.isValid).length);
  readonly mediaConfigured = computed(() => this.mediaProviders().filter(p => p.isValid).length);

  readonly verifying = signal<string | null>(null);

  // ── Navigation ──
  nextStep(): void {
    if (this.currentStep() < this.totalSteps) this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  goToStep(step: number): void {
    if (step <= this.currentStep()) this.currentStep.set(step);
  }

  canProceed(): boolean {
    const step = this.currentStep();
    if (step === 1) return this.aiConfigured() >= 1;
    if (step === 2) return this.dataConfigured() >= 1;
    return true;
  }

  // ── Key Management ──
  updateKey(list: 'ai' | 'data' | 'media', provider: string, value: string): void {
    const fn = (entries: OnboardingKey[]) =>
      entries.map(e => e.provider === provider ? { ...e, keyValue: value } : e);
    if (list === 'ai') this.aiProviders.update(fn);
    else if (list === 'data') this.dataSources.update(fn);
    else this.mediaProviders.update(fn);
  }

  verifyKey(list: 'ai' | 'data' | 'media', provider: string): void {
    this.verifying.set(provider);
    setTimeout(() => {
      const fn = (entries: OnboardingKey[]) =>
        entries.map(e => e.provider === provider && e.keyValue.length > 5 ? { ...e, isValid: true } : e);
      if (list === 'ai') this.aiProviders.update(fn);
      else if (list === 'data') this.dataSources.update(fn);
      else this.mediaProviders.update(fn);
      this.verifying.set(null);
    }, 1200);
  }

  removeKey(list: 'ai' | 'data' | 'media', provider: string): void {
    const fn = (entries: OnboardingKey[]) =>
      entries.map(e => e.provider === provider ? { ...e, keyValue: '', isValid: false } : e);
    if (list === 'ai') this.aiProviders.update(fn);
    else if (list === 'data') this.dataSources.update(fn);
    else this.mediaProviders.update(fn);
  }

  // ── AI Preferences ──
  updateAiPref(field: string, value: string | number | boolean): void {
    this.aiPrefs.update(p => ({ ...p, [field]: value }));
  }

  getTemperatureLabel(): string {
    const t = this.aiPrefs().temperature;
    if (t <= 0.2) return '精確';
    if (t <= 0.5) return '平衡';
    if (t <= 0.8) return '創意';
    return '發散';
  }

  completeOnboarding(): void {
    this.router.navigate(['/dashboard']);
  }
}
