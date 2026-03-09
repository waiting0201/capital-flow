import { Injectable, inject, signal, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

declare const google: any;

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  private initialized = false;
  private clientId = '';

  /**
   * Initialize Google Identity Services.
   * Call this in ngOnInit of login/register components.
   * @param clientId Google OAuth Client ID
   */
  initialize(clientId: string): void {
    if (this.initialized || !clientId) return;
    this.clientId = clientId;

    if (typeof google !== 'undefined' && google.accounts) {
      this.initGis();
      return;
    }

    // Avoid duplicate script injection
    if (document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)) {
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => this.initGis();
    script.onerror = () => {
      this.ngZone.run(() => {
        this.errorMessage.set('無法載入 Google 登入服務，請檢查網路連線');
      });
    };
    document.head.appendChild(script);
  }

  private initGis(): void {
    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response: { credential: string }) => {
        this.ngZone.run(() => this.handleCredentialResponse(response.credential));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    this.initialized = true;
  }

  /**
   * Trigger Google sign-in popup
   */
  signIn(): void {
    if (!this.initialized) {
      this.errorMessage.set('Google 登入尚未初始化，請確認 Google Client ID 已設定');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    google.accounts.id.prompt((notification: any) => {
      this.ngZone.run(() => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          this.isLoading.set(false);
          this.triggerButtonClick();
        } else if (notification.isDismissedMoment()) {
          this.isLoading.set(false);
        }
      });
    });
  }

  private triggerButtonClick(): void {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
    document.body.appendChild(container);

    google.accounts.id.renderButton(container, {
      type: 'standard',
      size: 'large',
    });

    // Wait for Google to render the iframe button, then click it
    const tryClick = (attempts: number): void => {
      const btn = container.querySelector('div[role=button]') as HTMLElement;
      if (btn) {
        btn.click();
        setTimeout(() => container.remove(), 10000);
      } else if (attempts > 0) {
        setTimeout(() => tryClick(attempts - 1), 100);
      } else {
        container.remove();
        this.errorMessage.set('Google 登入彈窗無法開啟，請重新整理頁面後再試');
      }
    };
    tryClick(5);
  }

  private handleCredentialResponse(idToken: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.auth.googleOAuth(idToken).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.router.navigate(['/home']);
        } else {
          this.errorMessage.set(res.message ?? 'Google 登入失敗');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Google 登入失敗，請稍後再試');
      },
    });
  }
}
