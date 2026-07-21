---
inclusion: auto
name: e2e-testing
description: >-
  Guide for running frontend E2E tests with Playwright.
  Activates when user asks to run E2E tests, Playwright tests, frontend tests,
  integration tests, or verify the application end-to-end.
---

# Running Frontend E2E Tests

E2E tests require both backend and frontend to be running. Follow this procedure every time before running Playwright tests.

## Subagent Strategy (IMPORTANT)

Maximize subagent usage for speed and context efficiency:

### Use subagents for:
- **Pre-flight checks** — Dispatch a subagent to verify backend and frontend are running (curl checks). This keeps health-check output out of the main context.
- **Running tests** — Dispatch a subagent to execute `npx playwright test`. Test output can be large; keeping it in a subagent prevents context pollution.
- **Fixing failures** — If tests fail, dispatch a subagent to analyze failures and fix the relevant test/component files. The subagent can read test output, inspect source files, and apply fixes without bloating the main context.
- **Parallel investigation** — When multiple test files fail, dispatch separate subagents per test file to diagnose and fix in parallel.

### Pattern: Pre-flight → Test → Fix

```
Main Agent:
  1. Dispatch subagent: "Check if backend (port 5000) and frontend (port 4200) are running. 
     Run: curl -sf http://localhost:5000/health && curl -sf http://localhost:4200. 
     Report which services are up/down."
  
  2. If services down → either start them or ask user to start manually.
  
  3. Dispatch subagent: "Run E2E tests: cd frontend && npx playwright test --reporter=list. 
     Report results: total passed, failed, and list of failed test names with error summaries."
  
  4. If failures → Dispatch subagent(s) to fix: "Analyze and fix the failing test(s). 
     The failures are: [list]. Read the test files, identify the issue, and fix."
```

### Why subagents?
- Test output is verbose (100+ lines) — subagents keep main context clean
- Pre-flight checks are independent — subagent can run without blocking reasoning
- Multiple fixes can run in parallel — faster than sequential
- Failed test analysis needs file reads — subagent handles this without polluting main context

## Pre-flight Checks (MANDATORY)

Before running `npx playwright test`, you MUST verify both services are up:

### Step 1: Check if backend is running

```bash
curl -sf http://localhost:5000/health || echo "BACKEND_DOWN"
```

- If response is OK → backend is running, proceed to Step 2.
- If `BACKEND_DOWN` → start the backend (see "Starting the Backend" below).

### Step 2: Check if frontend is running

```bash
curl -sf http://localhost:4200 || echo "FRONTEND_DOWN"
```

- If response contains HTML → frontend is running, proceed to Step 3.
- If `FRONTEND_DOWN` → start the frontend (see "Starting the Frontend" below).

### Step 3: Run the E2E tests

```bash
cd /Users/ifanzalukhu97/Playground/demo-booth-aws-summit-jkt-2026/frontend
npx playwright test --reporter=list
```

To run a specific test file:
```bash
npx playwright test e2e/list-enhancements.spec.ts --reporter=list
```

To run in a single browser (faster):
```bash
npx playwright test --project=chromium --reporter=list
```

## Starting the Backend

The backend requires .NET 5 SDK. First verify the SDK:

```bash
dotnet --version
```

If it shows `5.0.4xx`, start the backend:

```bash
cd /Users/ifanzalukhu97/Playground/demo-booth-aws-summit-jkt-2026/backend
dotnet run --project WideWorldImporters.Api &
```

Wait ~5 seconds, then verify: `curl -sf http://localhost:5000/health`

If the .NET 5 SDK is NOT available, inform the user:
> "The .NET 5 SDK is not available on this machine. Please start the backend manually with `cd backend && dotnet run --project WideWorldImporters.Api`."

## Starting the Frontend

```bash
cd /Users/ifanzalukhu97/Playground/demo-booth-aws-summit-jkt-2026/frontend
ng serve &
```

Wait ~10-15 seconds for compilation, then verify: `curl -sf http://localhost:4200`

If `ng` is not found, use npx:
```bash
npx ng serve &
```

## Database Dependency

E2E tests depend on data from the SQL Server database. If backend returns errors about database connections:

```bash
docker-compose -f /Users/ifanzalukhu97/Playground/demo-booth-aws-summit-jkt-2026/docker-compose.yml up -d
```

Wait ~30 seconds for SQL Server to be ready.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Tests timeout waiting for data | Backend is down or DB not running | Check backend + docker-compose status |
| `ERR_CONNECTION_REFUSED` on port 4200 | Frontend not started | Run `ng serve` in frontend/ |
| `ERR_CONNECTION_REFUSED` on port 5000 | Backend not started | Run `dotnet run` in backend/ |
| Database connection errors | SQL Server container not running | Run `docker-compose up -d` |
| "browser not found" | Playwright browsers not installed | Run `npx playwright install` |
| Flaky tests on Firefox | Dashboard heavy aggregation query | Use `--project=chromium` for faster runs |

## Test Files Overview

All test files are in `frontend/e2e/`:

| File | Coverage |
|------|----------|
| `navigation.spec.ts` | Nav menu links to all 12 pages |
| `data-loading.spec.ts` | Tables load data within 10s |
| `filters.spec.ts` | Multi-select dropdown filter interaction |
| `list-enhancements.spec.ts` | Search, sorting, row numbers, pagination info, CSV export, detail pages, date range |
| `response-time.spec.ts` | Response time badge visibility |
| `theme.spec.ts` | Dark mode colors |
| `error-handling.spec.ts` | Error states |
| `dashboard.spec.ts` | Dashboard KPIs and charts |

## Notes

- Playwright config: `frontend/playwright.config.ts` (baseURL: `http://localhost:4200`)
- Tests run on 3 browsers by default: chromium, firefox, webkit
- Use `--project=chromium` for faster single-browser runs during development
- The MCP Playwright tool is available for interactive browser debugging
- Retries are set to 2 in config to handle flaky network-dependent tests
