import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownFilterComponent } from './dropdown-filter.component';

@NgModule({
  declarations: [DropdownFilterComponent],
  imports: [CommonModule],
  exports: [DropdownFilterComponent]
})
export class DropdownFilterModule { }
