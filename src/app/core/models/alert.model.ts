export type AlertType = 'price' | 'volume' | 'institutional' | 'news' | 'earnings' | 'ai';
export type AlertCondition = 'above' | 'below';
export type AlertStatus = 'active' | 'triggered' | 'expired';
export type AlertPriority = 'high' | 'medium' | 'low';

export interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  market: 'tw' | 'us';
  type: AlertType;
  condition: AlertCondition;
  targetPrice: number;
  currentPrice: number;
  status: AlertStatus;
  priority: AlertPriority;
  createdAt: string;
  triggeredAt?: string;
  note?: string;
}

export interface NotificationItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  symbol?: string;
  market?: 'tw' | 'us';
  timestamp: string;
  isRead: boolean;
  priority: AlertPriority;
  actionUrl?: string;
}
