export type AiProvider = 'Claude' | 'OpenAI' | 'Gemini';

export interface ApiKeyConfigDto {
  provider: string;
  isConfigured: boolean;
  isValid: boolean;
  maskedKey: string | null;
  lastValidatedAt: string | null;
}

export interface AiPreferenceDto {
  preferredAiProvider: string;
  claudeSimpleModel: string | null;
  claudeComplexModel: string | null;
  openAiSimpleModel: string | null;
  openAiComplexModel: string | null;
  geminiSimpleModel: string | null;
  geminiComplexModel: string | null;
  temperature: number;
}

export interface UpdateAiPreferenceRequest {
  preferredAiProvider?: string;
  claudeSimpleModel?: string;
  claudeComplexModel?: string;
  openAiSimpleModel?: string;
  openAiComplexModel?: string;
  geminiSimpleModel?: string;
  geminiComplexModel?: string;
  temperature?: number;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  preferredMarket?: string;
  preferredLang?: string;
  defaultKPeriod?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserSettingsDto {
  apiKeys: ApiKeyConfigDto[];
  aiPreference: AiPreferenceDto;
  profile: import('./user.model').User;
}

export interface AiModelDto {
  id: string;
  displayName: string;
  tier: 'simple' | 'complex';
}

export interface ProviderInfoDto {
  name: string;
  displayName: string;
  category: string;
  required: boolean;
  keyFormatHint: string | null;
  docsUrl: string | null;
  models: AiModelDto[] | null;
}

export interface ProvidersDto {
  ai: ProviderInfoDto[];
  dataSource: ProviderInfoDto[];
  media: ProviderInfoDto[];
}
