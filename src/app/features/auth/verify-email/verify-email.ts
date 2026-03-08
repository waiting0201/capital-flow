import { Component, inject, signal, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  protected readonly email = signal('');
  protected readonly digits = signal<string[]>(['', '', '', '', '', '']);
  protected readonly isLoading = signal(false);
  protected readonly isResending = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly countdown = signal(0);

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    if (!email) {
      this.router.navigate(['/auth/register']);
      return;
    }
    this.email.set(email);
    this.startCountdown(60);
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }

  protected onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    const current = [...this.digits()];
    current[index] = value.slice(-1);
    this.digits.set(current);

    if (value && index < 5) {
      this.focusInput(index + 1);
    }

    // Auto-submit when all 6 digits entered
    if (current.every(d => d !== '')) {
      this.onSubmit();
    }
  }

  protected onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      const current = [...this.digits()];
      current[index - 1] = '';
      this.digits.set(current);
      this.focusInput(index - 1);
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '') ?? '';
    if (pasted.length >= 6) {
      const current = pasted.slice(0, 6).split('');
      this.digits.set(current);
      this.focusInput(5);
      this.onSubmit();
    }
  }

  protected onSubmit(): void {
    const code = this.digits().join('');
    if (code.length !== 6) {
      this.errorMessage.set('請輸入完整的 6 位數驗證碼');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.auth.verifyEmail(this.email(), code).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.router.navigate(['/home']);
        } else {
          this.errorMessage.set(res.message ?? '驗證失敗');
          this.clearDigits();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message ?? '驗證失敗，請稍後再試';
        this.errorMessage.set(msg);
        this.clearDigits();
      },
    });
  }

  protected resendCode(): void {
    if (this.countdown() > 0 || this.isResending()) return;

    this.isResending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.auth.resendVerification(this.email()).subscribe({
      next: (res) => {
        this.isResending.set(false);
        if (res.success) {
          this.successMessage.set('驗證碼已重新發送，請查收信箱');
          this.startCountdown(60);
          this.clearDigits();
        } else {
          this.errorMessage.set(res.message ?? '重新發送失敗');
        }
      },
      error: (err) => {
        this.isResending.set(false);
        const msg = err.error?.message ?? '重新發送失敗，請稍後再試';
        this.errorMessage.set(msg);
      },
    });
  }

  protected get maskedEmail(): string {
    const email = this.email();
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const masked = local.length <= 2
      ? local[0] + '***'
      : local[0] + '***' + local[local.length - 1];
    return `${masked}@${domain}`;
  }

  private focusInput(index: number): void {
    setTimeout(() => {
      const inputs = this.codeInputs.toArray();
      inputs[index]?.nativeElement.focus();
    });
  }

  private clearDigits(): void {
    this.digits.set(['', '', '', '', '', '']);
    this.focusInput(0);
  }

  private startCountdown(seconds: number): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdown.set(seconds);
    this.countdownTimer = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        this.countdown.set(0);
        if (this.countdownTimer) clearInterval(this.countdownTimer);
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }
}
