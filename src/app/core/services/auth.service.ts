import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { User, AuthTokens, AuthResponse, RefreshTokenResponse } from '../models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUser = signal<User | null>(this.loadStoredUser());
  private readonly tokens = signal<AuthTokens | null>(this.loadStoredTokens());

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokens());

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>('/api/auth/login', { email, password }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.handleAuthResponse(res.data);
        }
      }),
    );
  }

  register(email: string, password: string, displayName: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>('/api/auth/register', { email, password, displayName }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.handleAuthResponse(res.data);
        }
      }),
    );
  }

  refreshToken(): Observable<ApiResponse<RefreshTokenResponse> | null> {
    const stored = this.tokens();
    if (!stored?.refreshToken) return of(null);

    return this.http.post<ApiResponse<RefreshTokenResponse>>('/api/auth/refresh', {
      refreshToken: stored.refreshToken,
    }).pipe(
      tap(res => {
        if (res.success && res.data) {
          const newTokens: AuthTokens = {
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
            accessTokenExpiresAt: res.data.accessTokenExpiresAt,
          };
          this.tokens.set(newTokens);
          localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        }
      }),
      catchError(() => {
        this.clearAuth();
        return of(null);
      }),
    );
  }

  logout(): void {
    const stored = this.tokens();
    if (stored?.refreshToken) {
      this.http.post('/api/auth/logout', { refreshToken: stored.refreshToken }).subscribe();
    }
    this.clearAuth();
  }

  getAccessToken(): string | null {
    return this.tokens()?.accessToken ?? null;
  }

  private handleAuthResponse(data: AuthResponse): void {
    const tokens: AuthTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpiresAt: data.accessTokenExpiresAt,
    };
    this.tokens.set(tokens);
    this.currentUser.set(data.user);
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    localStorage.setItem('auth_user', JSON.stringify(data.user));
  }

  private clearAuth(): void {
    this.currentUser.set(null);
    this.tokens.set(null);
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
  }

  private loadStoredTokens(): AuthTokens | null {
    try {
      const raw = localStorage.getItem('auth_tokens');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private loadStoredUser(): User | null {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
