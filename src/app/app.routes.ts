import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Auth routes (no guard)
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
      },
    ],
  },

  // Onboarding (requires auth)
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./features/onboarding/onboarding').then(m => m.Onboarding),
    canActivate: [authGuard],
  },

  // Main app routes (requires auth)
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home').then(m => m.Home),
      },
      {
        path: 'stock',
        loadChildren: () =>
          import('./features/stock/stock.routes').then(m => m.STOCK_ROUTES),
      },
      {
        path: 'market',
        loadComponent: () =>
          import('./features/market/market').then(m => m.Market),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search').then(m => m.Search),
      },
      {
        path: 'watchlist',
        loadComponent: () =>
          import('./features/watchlist/watchlist').then(m => m.Watchlist),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./features/alerts/alerts').then(m => m.Alerts),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings').then(m => m.Settings),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
