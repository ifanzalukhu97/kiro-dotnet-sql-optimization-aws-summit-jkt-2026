import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableModule } from './components/data-table/data-table.module';
import { ResponseTimeBadgeModule } from './components/response-time-badge/response-time-badge.module';
import { DropdownFilterModule } from './components/dropdown-filter/dropdown-filter.module';
import { ErrorMessageModule } from './components/error-message/error-message.module';

@NgModule({
  imports: [
    CommonModule,
    DataTableModule,
    ResponseTimeBadgeModule,
    DropdownFilterModule,
    ErrorMessageModule
  ],
  exports: [
    DataTableModule,
    ResponseTimeBadgeModule,
    DropdownFilterModule,
    ErrorMessageModule
  ]
})
export class SharedModule { }
