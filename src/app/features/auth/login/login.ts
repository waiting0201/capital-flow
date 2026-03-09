import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { environment } from '../../../core/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly googleAuth = inject(GoogleAuthService);

  protected readonly showPassword = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['admin@test.com', [Validators.required, Validators.email]],
    password: ['12345678', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  ngOnInit(): void {
    if (environment.googleClientId) {
      this.googleAuth.initialize(environment.googleClientId);
    }
  }

  protected onGoogleLogin(): void {
    this.googleAuth.signIn();
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.router.navigate(['/home']);
        } else {
          this.errorMessage.set(res.message ?? '登入失敗');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.error?.errorCode === 'ERR_EMAIL_NOT_VERIFIED') {
          const { email } = this.form.getRawValue();
          this.router.navigate(['/auth/verify-email'], { queryParams: { email } });
          return;
        }
        const msg = err.error?.message ?? '登入失敗，請稍後再試';
        this.errorMessage.set(msg);
      },
    });
  }

  protected get emailInvalid(): boolean {
    const ctrl = this.form.controls.email;
    return ctrl.touched && ctrl.invalid;
  }

  protected get passwordInvalid(): boolean {
    const ctrl = this.form.controls.password;
    return ctrl.touched && ctrl.invalid;
  }
}
