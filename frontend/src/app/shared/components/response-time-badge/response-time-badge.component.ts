import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-response-time-badge',
  templateUrl: './response-time-badge.component.html',
  styleUrls: ['./response-time-badge.component.scss']
})
export class ResponseTimeBadgeComponent implements OnChanges {
  @Input() timeMs: number | null = null;
  @Input() error: boolean = false;

  highlight = false;

  get displayText(): string {
    if (this.error) {
      return 'Request failed';
    }
    if (this.timeMs !== null) {
      return `Loaded in ${Math.round(this.timeMs)}ms`;
    }
    return '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeMs'] || changes['error']) {
      this.triggerHighlight();
    }
  }

  private triggerHighlight(): void {
    this.highlight = false;
    // Force reflow to restart animation
    requestAnimationFrame(() => {
      this.highlight = true;
    });
  }
}
