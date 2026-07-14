import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss']
})
export class ErrorMessageComponent implements OnChanges {
  @Input() message: string | null = null;
  @Input() show: boolean = true;
  @Output() dismissed = new EventEmitter<void>();

  private _dismissed = false;

  get visible(): boolean {
    return this.show && this.message !== null && !this._dismissed;
  }

  get displayMessage(): string {
    return this.message || 'An error occurred while loading data. Please try again.';
  }

  dismiss(): void {
    this._dismissed = true;
    this.dismissed.emit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reset dismissed state when message changes
    if (changes['message']) {
      this._dismissed = false;
    }
  }
}
