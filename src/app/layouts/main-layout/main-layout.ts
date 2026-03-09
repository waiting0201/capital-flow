import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertNotificationService } from '../../core/services/alert-notification.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly alertNotification = inject(AlertNotificationService);

  readonly market = signal<'tw' | 'us'>('tw');
  readonly menuOpen = signal(false);
  readonly sidebarOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.sidebarOpen.set(false));
  }

  ngOnInit(): void {
    this.alertNotification.start();
  }

  toggleMarket(m: 'tw' | 'us'): void {
    this.market.set(m);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.menuOpen.set(false);
    this.sidebarOpen.set(false);
    this.alertNotification.reset();
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
