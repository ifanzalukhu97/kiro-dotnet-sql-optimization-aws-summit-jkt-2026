import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-search-input',
  template: `
    <div class="search-input-wrapper">
      <input
        type="text"
        class="search-input"
        placeholder="Search..."
        [value]="searchTerm"
        (input)="onInput($event)"
      />
      <button
        *ngIf="searchTerm"
        class="clear-btn"
        (click)="clear()"
        aria-label="Clear search"
      >&times;</button>
    </div>
  `,
  styles: [`
    .search-input-wrapper {
      position: relative;
      display: inline-block;
    }

    .search-input {
      background: #2a2a2a;
      color: #fff;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 8px 32px 8px 12px;
      font-size: 14px;
      width: 220px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input::placeholder {
      color: #888;
    }

    .search-input:focus {
      border-color: #aaff00;
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #888;
      font-size: 18px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }

    .clear-btn:hover {
      color: #fff;
    }
  `]
})
export class SearchInputComponent implements OnInit, OnDestroy {
  @Output() searchChange = new EventEmitter<string>();

  searchTerm = '';
  private input$ = new Subject<string>();
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.input$.pipe(debounceTime(400)).subscribe(term => {
      this.searchChange.emit(term);
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.input$.next(this.searchTerm);
  }

  clear(): void {
    this.searchTerm = '';
    this.input$.next('');
    this.searchChange.emit('');
  }
}
