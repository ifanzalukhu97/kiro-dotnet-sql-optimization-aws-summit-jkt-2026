# Project Structure

```
.
├── backend/
│   ├── WideWorldImporters.Api/           # ASP.NET Core Web API
│   │   ├── Controllers/                  # 14 API controllers (route: /api/[controller])
│   │   ├── Data/                         # EF Core DbContext with Fluent API config
│   │   ├── Models/
│   │   │   ├── Entities/                 # EF Core entity classes (map to DB tables)
│   │   │   └── Dtos/                     # Response DTOs (one file per domain area)
│   │   ├── Middleware/                   # ExceptionHandlingMiddleware
│   │   ├── Exceptions/                   # Custom exception types
│   │   ├── Startup.cs                    # DI container + middleware pipeline
│   │   └── WideWorldImporters.Api.csproj
│   ├── WideWorldImporters.IntegrationTests/  # xUnit + FsCheck tests
│   │   ├── Controllers/                  # Per-controller test classes
│   │   └── TestWebApplicationFactory.cs  # WebApplicationFactory<Startup> for real DB testing
│   └── WideWorldImporters.sln
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                     # Singleton services, interceptors, models
│   │   │   │   ├── services/             # ApiService, TimingService
│   │   │   │   ├── interceptors/         # TimingInterceptor (HTTP response timing)
│   │   │   │   └── models/               # Shared TypeScript interfaces
│   │   │   ├── shared/                   # Reusable UI: DataTable, ResponseTimeBadge, DropdownFilter, ErrorMessage
│   │   │   │   ├── components/
│   │   │   │   ├── models/
│   │   │   │   └── pipes/
│   │   │   └── pages/                    # 12 lazy-loaded feature modules
│   │   │       ├── dashboard/
│   │   │       ├── orders/
│   │   │       ├── customers/
│   │   │       ├── suppliers/
│   │   │       ├── invoices/
│   │   │       ├── deliveries/
│   │   │       ├── inventory/
│   │   │       ├── payments/
│   │   │       ├── purchase-orders/
│   │   │       ├── product-search/
│   │   │       ├── sales-report/
│   │   │       └── warehouse/
│   │   ├── environments/                 # environment.ts / environment.prod.ts (gitignored)
│   │   └── styles.scss                   # Global theme variables + base styles
│   ├── e2e/                              # Playwright E2E tests
│   ├── angular.json
│   ├── playwright.config.ts
│   └── package.json
├── scripts/
│   ├── audit/                            # 6 DMV-based SQL audit scripts (numbered 01-06)
│   ├── reset/                            # demo-reset.sql (idempotent index cleanup)
│   └── init/                             # restore-database.sh (Docker entrypoint)
├── docker-compose.yml                    # SQL Server 2022 container
└── global.json                           # .NET SDK version pin
```

## Architecture Patterns

### Backend
- **No service layer**: Controllers inject `WideWorldImportersContext` directly and handle queries inline
- **Pagination**: All list endpoints accept `page` and `pageSize` query params, return `PaginatedResponse<T>` with `data`, `page`, `pageSize`, `totalCount`
- **Error handling**: Global `ExceptionHandlingMiddleware` catches exceptions and returns consistent JSON error bodies
- **Entity mapping**: Fluent API in `OnModelCreating`, entities map to multi-schema DB (Sales, Purchasing, Warehouse, Application)
- **No authentication**: Demo app has open CORS and no auth

### Frontend
- **Module-per-page**: Each page is a lazy-loaded NgModule with its own routing and component(s)
- **Shared module**: Exports reusable components (DataTable, ResponseTimeBadge, DropdownFilter, ErrorMessage)
- **Core module**: Singleton services (ApiService, TimingService) and HTTP interceptor
- **Path aliases**: `@core/*`, `@shared/*`, `@pages/*`, `@environments/*` (tsconfig paths)
- **Inline templates**: Components use inline `template` and `styles` (not separate .html/.css files)

### Database
- **Schemas**: Sales, Purchasing, Warehouse, Application
- **Index naming**: Demo indexes must be named `IX_Demo_*` or `IX_Optimization_*`
