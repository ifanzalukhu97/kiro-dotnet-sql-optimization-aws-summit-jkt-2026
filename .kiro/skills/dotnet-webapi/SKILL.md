---
name: dotnet-webapi
description: >-
  Guides creation and modification of ASP.NET Core Web API endpoints with
  correct HTTP semantics, OpenAPI metadata, and error handling. Use when
  adding new API endpoints (controllers or minimal APIs), wiring up
  OpenAPI/Swagger, defining request/response DTOs, or setting up global
  error handling middleware. DO NOT USE FOR general C# coding, EF Core
  query optimization, frontend/Blazor, gRPC, or SignalR.
license: MIT
---

# ASP.NET Core Web API

Produce well-structured ASP.NET Core Web API endpoints with proper HTTP
semantics, OpenAPI documentation, and error handling.

## When to Use

- Adding or modifying Web API endpoints (controllers or minimal APIs)
- Wiring up OpenAPI/Swagger metadata
- Defining request/response DTOs
- Configuring centralized error handling middleware

## When Not to Use

- General C# coding style or non-API refactoring
- EF Core data modeling or query optimization
- Frontend, Razor, or Blazor UI changes
- gRPC services or SignalR hubs

## Workflow

### Step 1: Determine the API style

1. Search for `ControllerBase` or `[ApiController]` classes
2. Search for `app.MapGet`, `app.MapPost` etc.
3. Match existing style — do not mix controllers and minimal APIs

### Step 2: Define DTOs

Never expose EF Core entities directly. Use `sealed record` types:

| Role | Convention | Example |
|------|-----------|---------|
| Input (create) | `Create{Entity}Request` | `CreateProductRequest` |
| Input (update) | `Update{Entity}Request` | `UpdateProductRequest` |
| Output | `{Entity}Response` | `ProductResponse` |

Key rules:
- Use `sealed record` for all DTOs
- Use `DateTimeOffset` not `DateTime`
- Serialize enums as strings (`JsonStringEnumConverter`)
- Add XML doc `<summary>` comments (flows into OpenAPI)

### Step 3: Implement endpoints

**HTTP status codes:**

| Operation | Success | Common errors |
|-----------|---------|---------------|
| GET single | 200 OK | 404 Not Found |
| GET list | 200 OK | — |
| POST create | 201 Created + Location | 400, 409 |
| PUT update | 200 OK | 400, 404 |
| DELETE | 204 No Content | 404, 409 |

**Always:**
- Accept `CancellationToken` in every endpoint
- Forward it through all async calls
- Return `Location` header on POST 201

### Step 4: Wire up OpenAPI

- .NET 8 and earlier: Swashbuckle is fine
- .NET 9+: Use built-in `AddOpenApi()` + `MapOpenApi()` — no Swashbuckle

### Step 5: Error handling

Use global exception handler. Return RFC 7807 Problem Details.

```csharp
builder.Services.AddProblemDetails();
app.UseExceptionHandler();
app.UseStatusCodePages();
```

Place exception handlers in `Middleware/` folder.

### Step 6: Build and verify

1. `dotnet build` — zero errors, zero warnings
2. Verify OpenAPI document loads
3. Test endpoints with `.http` file or Swagger UI

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Exposing entities as responses | Create separate sealed record DTOs |
| Missing CancellationToken | Add to every endpoint signature |
| POST returning 200 | Return 201 Created with Location |
| Mixing controller + minimal API | Pick one style per project |
| Adding Swashbuckle to .NET 9+ | Use built-in OpenAPI |
| Using DateTime | Use DateTimeOffset |
