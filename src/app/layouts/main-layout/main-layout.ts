import { Component, inject, signal, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly market = signal<'tw' | 'us'>('tw');
  readonly menuOpen = signal(false);

  toggleMarket(m: 'tw' | 'us'): void {
    this.market.set(m);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  goToSearch(): void {
    this.router.navigate(['/search']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.avatar-wrapper')) {
      this.menuOpen.set(false);
    }
  }
}
