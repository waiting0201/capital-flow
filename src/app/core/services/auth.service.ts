import { Injectable, signal, computed } from '@angular/core';
import { User, AuthTokens } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(null);
  private readonly tokens = signal<AuthTokens | null>(this.loadStoredTokens());

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokens());

  private loadStoredTokens(): AuthTokens | null {
    try {
      const raw = localStorage.getItem('auth_tokens');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  login(email: string, password: string): void {
    // TODO: replace with real API call
    const mockTokens: AuthTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };
    const mockUser: User = {
      id: '1',
      email,
      displayName: email.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    this.tokens.set(mockTokens);
    this.currentUser.set(mockUser);
    localStorage.setItem('auth_tokens', JSON.stringify(mockTokens));
  }

  logout(): void {
    this.currentUser.set(null);
    this.tokens.set(null);
    localStorage.removeItem('auth_tokens');
  }

  refreshToken(): void {
    // TODO: implement token refresh
  }
}
