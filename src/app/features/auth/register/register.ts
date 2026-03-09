import { Component, inject, signal, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { environment } from '../../../core/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly googleAuth = inject(GoogleAuthService);

  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly agreedTerms = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.passwordMatchValidator] },
  );

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pw === confirm ? null : { passwordMismatch: true };
  }

  ngOnInit(): void {
    if (environment.googleClientId) {
      this.googleAuth.initialize(environment.googleClientId);
    }
  }

  protected onGoogleRegister(): void {
    this.googleAuth.signIn();
  }

  protected togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  protected toggleConfirm(): void {
    this.showConfirm.update(v => !v);
  }

  protected toggleTerms(): void {
    this.agreedTerms.update(v => !v);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.agreedTerms()) {
      this.errorMessage.set('請先同意服務條款與隱私權政策');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password, displayName } = this.form.getRawValue();
    this.auth.register(email, password, displayName).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.router.navigate(['/auth/verify-email'], { queryParams: { email } });
        } else {
          this.errorMessage.set(res.message ?? '註冊失敗');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message ?? '註冊失敗，請稍後再試';
        this.errorMessage.set(msg);
      },
    });
  }

  protected get nameInvalid(): boolean {
    const ctrl = this.form.controls.displayName;
    return ctrl.touched && ctrl.invalid;
  }

  protected get emailInvalid(): boolean {
    const ctrl = this.form.controls.email;
    return ctrl.touched && ctrl.invalid;
  }

  protected get passwordInvalid(): boolean {
    const ctrl = this.form.controls.password;
    return ctrl.touched && ctrl.invalid;
  }

  protected get confirmInvalid(): boolean {
    const ctrl = this.form.controls.confirmPassword;
    return ctrl.touched && (ctrl.invalid || this.form.hasError('passwordMismatch'));
  }

  protected get passwordStrength(): number {
    const pw = this.form.controls.password.value;
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  }

  protected get strengthLabel(): string {
    const labels = ['', '弱', '尚可', '良好', '強'];
    return labels[this.passwordStrength];
  }

  protected get strengthColor(): string {
    const colors = ['', 'var(--up)', 'var(--amber)', 'var(--moss-light)', 'var(--moss)'];
    return colors[this.passwordStrength];
  }
}
