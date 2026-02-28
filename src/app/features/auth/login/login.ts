import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['admin@test.com', [Validators.required, Validators.email]],
    password: ['123456', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

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
    this.auth.login(email, password);

    // TODO: replace with real API call + subscribe
    // Simulate login for now
    setTimeout(() => {
      this.isLoading.set(false);
      this.router.navigate(['/home']);
    }, 1200);
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
