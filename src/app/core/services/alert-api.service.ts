import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Alert, AlertHistoryItem, CreateAlertRequest } from '../models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UpdateAlertRequest {
  targetPrice?: number;
  volumeMultiplier?: number;
  consecutiveDays?: number;
  notifyWeb?: boolean;
  notifyPush?: boolean;
  isEnabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AlertApiService {
  private readonly http = inject(HttpClient);

  getAlerts(): Observable<Alert[]> {
    return this.http.get<ApiResponse<Alert[]>>('/api/user/alerts')
      .pipe(map(r => r.data ?? []));
  }

  createAlert(req: CreateAlertRequest): Observable<Alert> {
    return this.http.post<ApiResponse<Alert>>('/api/user/alerts', req)
      .pipe(map(r => r.data));
  }

  updateAlert(id: string, req: UpdateAlertRequest): Observable<Alert> {
    return this.http.put<ApiResponse<Alert>>(`/api/user/alerts/${id}`, req)
      .pipe(map(r => r.data));
  }

  deleteAlert(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`/api/user/alerts/${id}`)
      .pipe(map(() => void 0));
  }

  getHistory(page = 1, pageSize = 20): Observable<AlertHistoryItem[]> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<ApiResponse<AlertHistoryItem[]>>('/api/user/alerts/history', { params })
      .pipe(map(r => r.data ?? []));
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<ApiResponse<{ count: number }>>('/api/user/alerts/unread-count')
      .pipe(map(r => r.data?.count ?? 0));
  }

  markAsRead(ids: string[]): Observable<void> {
    return this.http.put<ApiResponse<void>>('/api/user/alerts/read', { ids })
      .pipe(map(() => void 0));
  }
}
