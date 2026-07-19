# Tech Stack & Build

## Backend

- **Runtime**: .NET 5 (pinned via `global.json` to SDK 5.0.408, rollForward: latestPatch)
- **Framework**: ASP.NET Core 5 Web API
- **ORM**: Entity Framework Core 5 with SQL Server provider (`Microsoft.EntityFrameworkCore.SqlServer` 5.0.17)
- **API Docs**: Swashbuckle/Swagger (`Swashbuckle.AspNetCore` 6.2.3)
- **Serialization**: System.Text.Json with camelCase naming policy
- **Database**: SQL Server 2022 (WideWorldImporters sample DB, ~200K+ rows in key tables)

## Frontend

- **Framework**: Angular 18
- **Language**: TypeScript 5.4 (strict mode enabled)
- **Styling**: SCSS with dark-mode theme (`#121212` background, `#aaff00` accent)
- **Charting**: chart.js 4.x with ng2-charts 5.x
- **Component prefix**: `app`

## Testing

| Layer | Framework | Runner |
|-------|-----------|--------|
| Backend integration | xUnit 2.4 + FsCheck 2.16 | `dotnet test` |
| Frontend unit | Jasmine 5.1 + Karma 6.4 | `ng test --watch=false` |
| Frontend E2E | Playwright 1.40+ | `npx playwright test` |

## Infrastructure

- **Docker Compose**: SQL Server 2022 container with auto-restore of `.bak` file on first startup
- **No CI/CD pipeline** in the repo (conference demo only)

## Common Commands

```bash
# Database
docker-compose up -d                     # Start SQL Server container
docker-compose down                      # Stop container (data persists in volume)

# Backend (requires .NET 5 SDK — see "CRITICAL: .NET SDK Verification" section below)
# ALWAYS run `dotnet --version` first to confirm .NET 5.0.4xx is active.
cd backend
dotnet build                             # Build solution
dotnet run --project WideWorldImporters.Api  # Run API on http://localhost:5000
dotnet test                              # Run integration + property tests

# Frontend
cd frontend
npm install                              # Install dependencies
ng serve                                 # Dev server on http://localhost:4200
ng test --watch=false                    # Unit tests (single run)
npx playwright test                      # E2E tests (requires backend + frontend running)
ng build                                 # Production build

# SQL Audit Scripts
sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd' -d WideWorldImporters \
  -i scripts/audit/01-wait-stats.sql

# Demo Reset
sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd' -d WideWorldImporters \
  -i scripts/reset/demo-reset.sql
```

## Environment Configuration

- Backend connection string: set via `CONNECTION_STRING` env var, or `ConnectionStrings__DefaultConnection`, or `appsettings.Development.json`
- Frontend API URL: configured in `src/environments/environment.ts` (gitignored; use `.example` files as templates)
- Apple Silicon Macs: use `direnv` with `.envrc` to point to x86_64 .NET SDK (see `.envrc.example`)

## CRITICAL: .NET SDK Verification

This project requires .NET 5 SDK (pinned to 5.0.408 via `global.json`). Many developer machines will NOT have this SDK installed (e.g. only .NET 6/7/8/9/10 is available).

**Before running any `dotnet` command**, ALWAYS run this check first:

```bash
dotnet --version
```

If the output is NOT `5.0.4xx`, the build will fail. In that case:

1. Do NOT attempt `dotnet build`, `dotnet test`, or `dotnet run` — they will error out.
2. Validate code changes structurally instead (correct syntax, follows patterns in existing files).
3. Inform the user that you cannot run the build/tests because the required .NET 5 SDK is not available.
4. NEVER claim tests "pass" or "build succeeds" without actually executing them successfully.

**Platform-specific SDK notes:**
- Apple Silicon Macs: .NET 5 has no arm64 build. Install the x86_64 SDK and use `direnv` (see `.envrc.example`) to override `DOTNET_ROOT`.
- Windows/Linux/Intel Mac: Install .NET 5 SDK normally from https://dotnet.microsoft.com/en-us/download/dotnet/5.0
