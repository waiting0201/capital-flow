import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ai-disclaimer',
  standalone: true,
  template: `
    @if (variant() === 'inline') {
      <span class="ai-disc ai-disc--inline">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        僅供參考，非投資建議
      </span>
    } @else {
      <div class="ai-disc ai-disc--block">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <p>本頁面所有 AI 分析內容均由大型語言模型自動產生，僅供投資參考，不構成任何形式之投資建議或推薦。投資人應自行評估風險，並對其投資決策負全責。</p>
      </div>
    }
  `,
  styleUrl: './ai-disclaimer.scss',
})
export class AiDisclaimer {
  readonly variant = input<'inline' | 'block'>('inline');
}
