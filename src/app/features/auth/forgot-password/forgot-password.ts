import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** 1 = enter email, 2 = enter code, 3 = new password, 4 = success */
  protected readonly step = signal<1 | 2 | 3 | 4>(1);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly sentEmail = signal('');
  protected readonly cooldown = signal(0);
  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly codeDigits = signal<string[]>(['', '', '', '', '', '']);

  protected readonly passwordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;
  private resetCode = '';

  // ── Step 1: Send reset code ──
  protected onSubmitEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    const email = this.emailForm.controls.email.value;

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.sentEmail.set(email);
        this.step.set(2);
        this.startCooldown();
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || '發送失敗，請稍後重試';
        const code = err.error?.errorCode;
        if (code === 'ERR_TOO_FREQUENT') {
          this.errorMessage.set('請稍後再重新發送');
          this.startCooldown();
        } else {
          this.errorMessage.set(msg);
        }
      },
    });
  }

  // ── Step 2: Code input ──
  protected onCodeInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    const digits = [...this.codeDigits()];

    if (value.length > 1) {
      // Handle paste
      const chars = value.slice(0, 6).split('');
      chars.forEach((ch, i) => {
        if (i < 6) digits[i] = ch;
      });
      this.codeDigits.set(digits);
      const nextIdx = Math.min(chars.length, 5);
      this.focusCodeInput(nextIdx);
      if (chars.length === 6) this.submitCode();
      return;
    }

    digits[index] = value;
    this.codeDigits.set(digits);

    if (value && index < 5) {
      this.focusCodeInput(index + 1);
    }

    if (digits.every(d => d.length === 1)) {
      this.submitCode();
    }
  }

  protected onCodeKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.codeDigits()[index] && index > 0) {
      const digits = [...this.codeDigits()];
      digits[index - 1] = '';
      this.codeDigits.set(digits);
      this.focusCodeInput(index - 1);
    }
  }

  protected onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text')?.replace(/\D/g, '') || '';
    if (!text) return;
    const chars = text.slice(0, 6).split('');
    const digits = ['', '', '', '', '', ''];
    chars.forEach((ch, i) => { digits[i] = ch; });
    this.codeDigits.set(digits);
    const nextIdx = Math.min(chars.length, 5);
    this.focusCodeInput(nextIdx);
    if (chars.length === 6) this.submitCode();
  }

  private submitCode(): void {
    const code = this.codeDigits().join('');
    if (code.length !== 6) return;
    this.resetCode = code;
    this.errorMessage.set('');
    this.step.set(3);
  }

  private focusCodeInput(index: number): void {
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`.code-input-${index}`);
      el?.focus();
      el?.select();
    });
  }

  // ── Step 3: Set new password ──
  protected onSubmitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.passwordForm.getRawValue();
    if (password !== confirmPassword) {
      this.errorMessage.set('兩次密碼輸入不一致');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.auth.resetPassword(this.sentEmail(), this.resetCode, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.step.set(4);
      },
      error: (err) => {
        this.isLoading.set(false);
        const code = err.error?.errorCode;
        if (code === 'ERR_CODE_EXPIRED' || code === 'ERR_INVALID_CODE') {
          this.errorMessage.set(err.error?.message || '驗證碼無效');
          this.step.set(2);
          this.codeDigits.set(['', '', '', '', '', '']);
        } else {
          this.errorMessage.set(err.error?.message || '重設失敗，請稍後重試');
        }
      },
    });
  }

  // ── Resend ──
  protected resendCode(): void {
    if (this.cooldown() > 0 || this.isLoading()) return;

    this.isLoading.set(true);
    this.auth.forgotPassword(this.sentEmail()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.startCooldown();
        this.codeDigits.set(['', '', '', '', '', '']);
        this.errorMessage.set('');
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  protected goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private startCooldown(): void {
    this.cooldown.set(60);
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.cooldown.update(v => {
        if (v <= 1) {
          clearInterval(this.cooldownTimer!);
          this.cooldownTimer = null;
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  // ── Password helpers ──
  protected get passwordStrength(): number {
    const pw = this.passwordForm.controls.password.value;
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    return s;
  }

  protected get strengthLabel(): string {
    return ['', '弱', '普通', '良好', '強'][this.passwordStrength];
  }

  protected get emailInvalid(): boolean {
    const ctrl = this.emailForm.controls.email;
    return ctrl.touched && ctrl.invalid;
  }

  protected get passwordMismatch(): boolean {
    const { password, confirmPassword } = this.passwordForm.getRawValue();
    return this.passwordForm.controls.confirmPassword.touched && password !== confirmPassword;
  }
}
