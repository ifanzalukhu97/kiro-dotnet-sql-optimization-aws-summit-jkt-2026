import { Component, Input, Output, EventEmitter } from '@angular/core';
import { LookupItem } from '../../../core/models/lookup-item';

@Component({
  selector: 'app-dropdown-filter',
  templateUrl: './dropdown-filter.component.html',
  styleUrls: ['./dropdown-filter.component.scss']
})
export class DropdownFilterComponent {
  @Input() options: LookupItem[] = [];
  @Input() placeholder = 'Select...';
  @Input() label = '';

  @Output() selectionChange = new EventEmitter<number | null>();

  selectedValue: string = '';

  onSelectionChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedValue = value;

    if (value === '' || value === '0') {
      this.selectionChange.emit(null);
    } else {
      this.selectionChange.emit(Number(value));
    }
  }
}
