// 與後端 AlertType enum 對齊（system-analysis.md §3 Entity 定義）
export type AlertType =
  | 'PriceAbove'           // 股價突破目標價
  | 'PriceBelow'           // 股價跌破目標價
  | 'VolumeSpike'          // 成交量爆量（資金大規模進出信號）
  | 'InstitutionalBuy'     // 三大法人連續買超N天
  | 'InstitutionalSell'    // 三大法人連續賣超N天
  | 'MoneyFlowReversal'    // MFIE 偵測多維度資金反轉訊號共振
  | 'HighCatalystNews';    // AI 判斷高資金催化強度新聞

export type AlertStatus = 'active' | 'triggered' | 'expired';
export type AlertPriority = 'high' | 'medium' | 'low';

// 對應後端 AlertDto（system-analysis.md §3.4.8）
export interface Alert {
  id: string;
  stockId: number;
  symbol: string;
  nameZh?: string;
  alertType: AlertType;
  targetPrice?: number;
  volumeMultiplier?: number;
  consecutiveDays?: number;
  notifyWeb: boolean;
  notifyPush: boolean;
  isEnabled: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

// 對應後端 AlertHistoryDto
export interface AlertHistoryItem {
  id: string;
  alertId: string;
  stockId: number;
  symbol: string;
  nameZh?: string;
  alertType: AlertType;
  triggerPrice?: number;
  message: string;
  isRead: boolean;
  triggeredAt: string;
}

// 對應後端 CreateAlertRequest
export interface CreateAlertRequest {
  stockId: number;
  alertType: AlertType;
  targetPrice?: number;
  volumeMultiplier?: number;
  consecutiveDays?: number;
  notifyWeb?: boolean;
  notifyPush?: boolean;
}

// UI 層級的篩選分類（前端 alerts 頁面使用，與 API AlertType 的映射）
export type AlertUICategory = 'all' | 'flow-reversal' | 'volume' | 'institutional' | 'price' | 'catalyst';

// AlertType → UI Category 映射
export const ALERT_TYPE_TO_UI_CATEGORY: Record<AlertType, AlertUICategory> = {
  PriceAbove: 'price',
  PriceBelow: 'price',
  VolumeSpike: 'volume',
  InstitutionalBuy: 'institutional',
  InstitutionalSell: 'institutional',
  MoneyFlowReversal: 'flow-reversal',
  HighCatalystNews: 'catalyst',
};
