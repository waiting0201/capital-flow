import { Component } from '@angular/core';

interface SectorFlow {
  name: string;
  amount: number;
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [],
  templateUrl: './market.html',
  styleUrl: './market.scss',
})
export class Market {

  // ── 今日資金水位 ──
  readonly capitalLevel = {
    foreign: { value: 182, streak: 3, direction: 'buy' as const },
    marketVolume: { value: 2850, avg20Ratio: 1.2 },
    marginChange: { value: 12, label: '散戶持續加碼' },
    breadth: { up: 523, down: 312, flat: 89, limitUp: 8, limitDown: 2 },
  };

  get breadthTotal(): number {
    const b = this.capitalLevel.breadth;
    return b.up + b.down + b.flat;
  }

  // ── AI 板塊資金輪動分析 ──
  readonly rotation = {
    conclusion: '資金正從 防禦型(食品/電信) 流向 成長型(半導體/AI)',
    reason: 'Fed 暗示降息路徑明確 → 市場風險偏好上升 → 資金從防禦型板塊撤出，轉向高成長板塊。目前輪動處於「成長復甦初期」階段。',
    basis: '各板塊法人淨買賣變化 + 量能分佈 + Fed 最新利率聲明',
  };

  readonly sectorInflows: SectorFlow[] = [
    { name: '半導體', amount: 85 },
    { name: '電腦週邊', amount: 42 },
    { name: '光電', amount: 28 },
    { name: '生技醫療', amount: 15 },
  ];

  readonly sectorOutflows: SectorFlow[] = [
    { name: '航運', amount: 32 },
    { name: '鋼鐵', amount: 28 },
    { name: '紡織', amount: 15 },
    { name: '食品', amount: 12 },
  ];

  readonly maxSectorFlow = Math.max(
    ...this.sectorInflows.map(s => s.amount),
    ...this.sectorOutflows.map(s => s.amount),
  );

  // ── AI 總經資金環境解讀 ──
  readonly macroIndicators = [
    { label: 'Fed 利率', value: '4.25%' },
    { label: '美元指數', value: '104.2' },
    { label: 'VIX 恐慌', value: '15.8' },
  ];

  readonly macroAnalysis = {
    conclusion: '目前總經環境對股市資金流入「中性偏有利」。',
    causalChain: 'Fed 維持利率但暗示明年降息 → 美債殖利率下滑 → 資金從債市部分流向股市 → 但美元仍強勢 → 外資匯入新興市場的意願受限',
    judgment: '外資不會大幅撤出，但加碼力道有限。對個股的影響：取決於個別基本面，而非大盤資金。',
    basis: 'Fed 利率聲明 + 美債殖利率走勢 + 美元指數 + VIX 波動率',
  };

  getFlowBarWidth(amount: number): number {
    return (amount / this.maxSectorFlow) * 100;
  }
}
