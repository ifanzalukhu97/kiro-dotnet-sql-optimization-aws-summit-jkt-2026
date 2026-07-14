# SQL Server Query Optimization Demo

A demonstration application for AWS Summit Jakarta 2026 showcasing SQL Server query optimization on .NET Core, assisted by Kiro AI. The app features an ASP.NET Core Web API backend connected to the WideWorldImporters database and an Angular 18 frontend with a dark-mode UI that displays query performance before and after optimization.

## Folder Structure

```
.
├── backend/                           # ASP.NET Core 5 Web API
│   ├── WideWorldImporters.Api/        # Main API project
│   │   ├── Controllers/               # 12 API controllers
│   │   ├── Data/                      # EF Core DbContext
│   │   ├── Models/                    # Entities and DTOs
│   │   ├── Middleware/                # Exception handling
│   │   └── Exceptions/               # Custom exception types
│   ├── WideWorldImporters.IntegrationTests/  # Integration + property tests
│   └── WideWorldImporters.sln
├── frontend/                          # Angular 18 SPA
│   ├── src/                           # Application source
│   │   ├── app/
│   │   │   ├── core/                  # Services, interceptors, models
│   │   │   ├── shared/                # Reusable components
│   │   │   └── pages/                 # 12 page modules
│   │   └── environments/             # Environment configs
│   ├── e2e/                           # Playwright E2E tests
│   └── playwright.config.ts
├── scripts/
│   ├── audit/                         # 6 DMV-based SQL audit scripts
│   ├── reset/                         # Demo reset script
│   └── init/                          # Docker DB initialization
└── docker-compose.yml                 # Local SQL Server container
```

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker Desktop | Latest | Run SQL Server locally |
| .NET SDK | 5.0 | Build and run the backend |
| Node.js | 18+ | Build and run the frontend |
| Angular CLI | 18.x | Frontend development (`npm install -g @angular/cli`) |

## Getting Started

### 1. Database Setup

The project uses a Docker container running SQL Server 2019 with the WideWorldImporters sample database.

```bash
# Start the SQL Server container
docker-compose up -d

# Wait for the container to be healthy (~60 seconds on first run)
docker-compose ps
```

Place the `WideWorldImporters-Full.bak` backup file in the container's data directory. The init script at `scripts/init/restore-database.sh` handles the restore automatically on first startup.

The database will be accessible at `localhost:1433` with the default credentials defined in `docker-compose.yml`.

### 2. Backend Setup

```bash
cd backend

# Copy the example config and fill in your connection details
cp WideWorldImporters.Api/appsettings.Development.json.example \
   WideWorldImporters.Api/appsettings.Development.json

# Build the solution
dotnet build

# Run the API (default: http://localhost:5000)
dotnet run --project WideWorldImporters.Api
```

The backend exposes 12 API controllers at `/api/{resource}` and a health check at `/health`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server (default: http://localhost:4200)
ng serve
```

The frontend connects to the backend API URL configured in `src/environments/environment.ts`.

## Running Tests

### Backend Integration Tests

Requires a running SQL Server instance (via Docker).

```bash
cd backend
dotnet test
```

This runs all integration tests and property-based tests (FsCheck) against a real database.

### Frontend Unit Tests

```bash
cd frontend
ng test --watch=false
```

### Frontend E2E Tests (Playwright)

Requires both backend and frontend to be running.

```bash
cd frontend
npx playwright test
```

## Running Audit Scripts

The `scripts/audit/` folder contains 6 SQL scripts designed to analyze query performance using SQL Server DMVs. Execute them in order against the WideWorldImporters database:

| Script | Purpose |
|--------|---------|
| `01-wait-stats.sql` | Wait statistics from `sys.dm_os_wait_stats` |
| `02-top-io-queries.sql` | Top I/O queries from `sys.dm_exec_query_stats` |
| `03-current-indexes.sql` | Existing indexes from `sys.indexes` |
| `04-index-usage-stats.sql` | Index usage from `sys.dm_db_index_usage_stats` |
| `05-missing-indexes.sql` | Missing index recommendations |
| `06-index-fragmentation.sql` | Index fragmentation analysis |

Run them using any SQL client (SSMS, Azure Data Studio, sqlcmd):

```bash
# Example using sqlcmd
sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd' -d WideWorldImporters \
  -i scripts/audit/01-wait-stats.sql
```

## Demo Reset

Between demo sessions, reset the database to its original slow-query state:

```bash
sqlcmd -S localhost -U sa -P 'YourStrong!Passw0rd' -d WideWorldImporters \
  -i scripts/reset/demo-reset.sql
```

The reset script:
- Drops all indexes added during optimization demos
- Clears the SQL Server procedure cache (`DBCC FREEPROCCACHE`)
- Clears the buffer pool (`DBCC DROPCLEANBUFFERS`)
- Is idempotent and safe to run multiple times

## Demo Flow

1. Start with the reset database state (run the reset script)
2. Open the frontend and navigate between pages, noting response times
3. Run the audit scripts to identify slow queries
4. Use Kiro AI to analyze and fix performance issues
5. Refresh the frontend to see improved response times via the green badges

## Architecture

- **Backend**: ASP.NET Core 5 Web API with EF Core, 12 controllers (some with intentionally naive query patterns for demo purposes)
- **Frontend**: Angular 18 with dark-mode UI (`#121212` background, `#aaff00` accent), response time badges, dropdown filters
- **Database**: SQL Server 2019 with WideWorldImporters (Full backup, 200K+ rows in key tables)
- **Testing**: xUnit + FsCheck (backend), Jasmine + Karma (frontend unit), Playwright (E2E)
