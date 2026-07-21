import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
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
  @Input() multiple = false;

  @Output() selectionChange = new EventEmitter<number | null>();
  @Output() multiSelectionChange = new EventEmitter<number[]>();

  selectedValue: string = '';
  selectedValues = new Set<number>();
  panelOpen = false;
  searchTerm: string = '';

  get filteredOptions(): LookupItem[] {
    if (!this.searchTerm) return this.options;
    const term = this.searchTerm.toLowerCase();
    return this.options.filter(o => o.name.toLowerCase().includes(term));
  }

  constructor(private elementRef: ElementRef) {}

  // Single-select handler (existing behavior)
  onSelectionChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedValue = value;

    if (value === '' || value === '0') {
      this.selectionChange.emit(null);
    } else {
      this.selectionChange.emit(Number(value));
    }
  }

  // Multi-select handlers
  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
  }

  toggleOption(id: number): void {
    if (this.selectedValues.has(id)) {
      this.selectedValues.delete(id);
    } else {
      this.selectedValues.add(id);
    }
    this.emitMultiSelection();
  }

  isSelected(id: number): boolean {
    return this.selectedValues.has(id);
  }

  clearSelection(): void {
    this.selectedValues.clear();
    this.emitMultiSelection();
  }

  get triggerLabel(): string {
    const count = this.selectedValues.size;
    return count === 0 ? this.placeholder : `${count} selected`;
  }

  private emitMultiSelection(): void {
    this.multiSelectionChange.emit(Array.from(this.selectedValues));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.panelOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.panelOpen = false;
    }
  }
}
