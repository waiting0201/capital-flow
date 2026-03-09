import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';
import {
  ApiKeyConfigDto,
  AiPreferenceDto,
  UpdateAiPreferenceRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserSettingsDto,
  ProvidersDto,
} from '../models/api-key.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);

  // ── Profile ──

  getProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>('/api/user/profile')
      .pipe(map(r => r.data));
  }

  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.put<ApiResponse<User>>('/api/user/profile', request)
      .pipe(map(r => r.data));
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<ApiResponse<void>>('/api/user/change-password', request)
      .pipe(map(() => void 0));
  }

  // ── Settings (aggregate) ──

  getSettings(): Observable<UserSettingsDto> {
    return this.http.get<ApiResponse<UserSettingsDto>>('/api/user/settings')
      .pipe(map(r => r.data));
  }

  // ── API Keys ──

  getApiKeys(): Observable<ApiKeyConfigDto[]> {
    return this.http.get<ApiResponse<ApiKeyConfigDto[]>>('/api/user/settings/api-keys')
      .pipe(map(r => r.data));
  }

  setApiKey(provider: string, apiKey: string): Observable<ApiKeyConfigDto> {
    return this.http.put<ApiResponse<ApiKeyConfigDto>>('/api/user/settings/api-keys', { provider, apiKey })
      .pipe(map(r => r.data));
  }

  removeApiKey(provider: string): Observable<void> {
    const params = new HttpParams().set('provider', provider);
    return this.http.delete('/api/user/settings/api-keys', { params, responseType: 'text' })
      .pipe(map(() => void 0));
  }

  validateApiKey(provider: string, apiKey: string): Observable<{ isValid: boolean }> {
    return this.http.post<ApiResponse<{ isValid: boolean }>>('/api/user/settings/api-keys/validate', { provider, apiKey })
      .pipe(map(r => r.data));
  }

  // ── AI Preference ──

  getAiPreference(): Observable<AiPreferenceDto> {
    return this.http.get<ApiResponse<AiPreferenceDto>>('/api/user/settings/ai-preference')
      .pipe(map(r => r.data));
  }

  updateAiPreference(request: UpdateAiPreferenceRequest): Observable<AiPreferenceDto> {
    return this.http.put<ApiResponse<AiPreferenceDto>>('/api/user/settings/ai-preference', request)
      .pipe(map(r => r.data));
  }

  // ── Providers ──

  getProviders(): Observable<ProvidersDto> {
    return this.http.get<ApiResponse<ProvidersDto>>('/api/user/settings/providers')
      .pipe(map(r => r.data));
  }
}
