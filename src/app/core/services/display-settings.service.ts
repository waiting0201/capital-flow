import { Injectable, signal } from '@angular/core';

export type TextSize = 'sm' | 'md' | 'lg';

@Injectable({ providedIn: 'root' })
export class DisplaySettingsService {
  private readonly _textSize = signal<TextSize>(this.loadTextSize());

  readonly textSize = this._textSize.asReadonly();

  constructor() {
    this.applyTextSize(this._textSize());
  }

  setTextSize(size: TextSize): void {
    this._textSize.set(size);
    this.applyTextSize(size);
    localStorage.setItem('text_size', size);
  }

  private loadTextSize(): TextSize {
    try {
      const stored = localStorage.getItem('text_size');
      return (stored === 'sm' || stored === 'lg') ? stored : 'md';
    } catch {
      return 'md';
    }
  }

  private applyTextSize(size: TextSize): void {
    if (size === 'md') {
      document.documentElement.removeAttribute('data-text-size');
    } else {
      document.documentElement.setAttribute('data-text-size', size);
    }
  }
}
