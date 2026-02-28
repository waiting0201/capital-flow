import { Routes } from '@angular/router';

export const STOCK_ROUTES: Routes = [
  {
    path: ':symbol',
    loadComponent: () => import('./stock-detail/stock-detail').then(m => m.StockDetail),
  },
];
