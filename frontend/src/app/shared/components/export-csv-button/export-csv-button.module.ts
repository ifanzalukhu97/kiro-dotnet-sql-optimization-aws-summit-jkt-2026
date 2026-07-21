import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportCsvButtonComponent } from './export-csv-button.component';

@NgModule({
  declarations: [ExportCsvButtonComponent],
  imports: [CommonModule],
  exports: [ExportCsvButtonComponent]
})
export class ExportCsvButtonModule { }
