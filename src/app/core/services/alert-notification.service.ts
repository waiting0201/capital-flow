import { Injectable, inject, signal, DestroyRef, OnDestroy } from '@angular/core';
import { AlertApiService } from './alert-api.service';
import { AuthService } from './auth.service';
import { Subscription, interval, switchMap, filter, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertNotificationService implements OnDestroy {
  private readonly alertApi = inject(AlertApiService);
  private readonly auth = inject(AuthService);

  /** Current unread alert count */
  readonly unreadCount = signal(0);

  private pollSub?: Subscription;
  private readonly POLL_INTERVAL = 60_000; // 1 minute

  /** Start polling for unread count. Call once from main layout. */
  start(): void {
    if (this.pollSub) return;

    // Fetch immediately
    this.fetchCount();

    // Then poll every minute
    this.pollSub = interval(this.POLL_INTERVAL).pipe(
      filter(() => this.auth.isAuthenticated()),
      switchMap(() => this.alertApi.getUnreadCount().pipe(catchError(() => of(0)))),
    ).subscribe(count => this.unreadCount.set(count));
  }

  /** Force refresh (e.g. after marking alerts as read) */
  refresh(): void {
    this.fetchCount();
  }

  /** Reset count (e.g. on logout) */
  reset(): void {
    this.unreadCount.set(0);
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private fetchCount(): void {
    if (!this.auth.isAuthenticated()) return;
    this.alertApi.getUnreadCount().pipe(
      catchError(() => of(0)),
    ).subscribe(count => this.unreadCount.set(count));
  }
}
