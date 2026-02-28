import { Injectable, signal, computed } from '@angular/core';
import { User, AuthTokens } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(null);
  private readonly tokens = signal<AuthTokens | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokens());

  login(email: string, password: string): void {
    // TODO: implement API call
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
