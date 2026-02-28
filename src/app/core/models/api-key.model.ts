export type AiProvider = 'anthropic' | 'openai' | 'gemini';
export type DataSourceProvider = 'finnhub' | 'fmp' | 'fred' | 'finmind';
export type MediaProvider = 'newsapi' | 'fugle' | 'polygon';

export interface ApiKeyEntry {
  provider: string;
  maskedKey: string;
  isValid: boolean;
  lastVerified?: string;
}

export interface ApiKeySetupStatus {
  aiProviders: ApiKeyEntry[];
  dataSources: ApiKeyEntry[];
  mediaProviders: ApiKeyEntry[];
  isOnboardingComplete: boolean;
}

export interface AiPreferences {
  preferredProvider: AiProvider;
  simpleTaskModel: string;
  complexTaskModel: string;
  temperature: number;
}
