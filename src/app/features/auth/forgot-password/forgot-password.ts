import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly emailSent = signal(false);
  protected readonly sentEmail = signal('');
  protected readonly cooldown = signal(0);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const email = this.form.controls.email.value;

    // TODO: replace with real API call
    setTimeout(() => {
      this.isLoading.set(false);
      this.emailSent.set(true);
      this.sentEmail.set(email);
      this.startCooldown();
    }, 1200);
  }

  protected resendEmail(): void {
    if (this.cooldown() > 0) return;

    this.isLoading.set(true);

    setTimeout(() => {
      this.isLoading.set(false);
      this.startCooldown();
    }, 800);
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

  protected get emailInvalid(): boolean {
    const ctrl = this.form.controls.email;
    return ctrl.touched && ctrl.invalid;
  }
}
