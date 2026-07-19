---
name: run-tests
description: >-
  Recommend or run the exact dotnet test command for .NET projects.
  Use when the user asks to run, filter, or troubleshoot .NET tests.
  Detects the platform (VSTest vs MTP) and framework (xUnit/MSTest/NUnit),
  then picks the matching command and filter syntax. Handles SDK version
  differences (SDK 5-9 vs 10+) and filter flags (--filter, --filter-class,
  --filter-trait). DO NOT USE FOR writing test code (use code-testing-agent)
  or debugging test logic.
license: MIT
---

# Run .NET Tests

Detect the test platform and framework, run tests, and apply filters.

## When to Use

- User wants to run tests in a .NET project
- User needs to run a subset of tests using filters
- User needs help detecting which test platform or framework is in use
- User wants the correct filter syntax for their setup

## When Not to Use

- User needs to write or generate test code (use `code-testing-agent`)
- User needs CI/CD pipeline configuration
- User needs to debug a test

## Quick Reference

| Platform | SDK | Command pattern |
|----------|-----|----------------|
| VSTest | Any | `dotnet test [path] [--filter expr] [--logger trx]` |
| MTP | 8 or 9 | `dotnet test [path] -- <MTP_ARGS>` |
| MTP | 10+ | `dotnet test --project path <MTP_ARGS>` |

## Critical Rules

| Rule | Why |
|------|-----|
| Do NOT use `--logger trx` for MTP | MTP uses `--report-trx` |
| Do NOT use `--report-trx` for VSTest | VSTest uses `--logger trx` |
| Do NOT use `-- --arg` on SDK 10+ | SDK 10+ passes MTP args directly |
| Do NOT omit `--` on SDK 8/9 with MTP | SDK 8/9 requires the separator |
| Do NOT use VSTest `--filter` with xUnit v3 on MTP | Use `--filter-class`, `--filter-method`, `--filter-trait` |

## Workflow

### Step 1: Detect platform and framework

1. Run `dotnet --version` to determine the SDK version (accounts for `global.json` pinning).
2. Read `global.json` for MTP signal: `"test": { "runner": "Microsoft.Testing.Platform" }`.
3. Read `.csproj`, `Directory.Build.props`, and `Directory.Packages.props` for framework packages and MTP properties.

**Detection summary:**

| Signal | Means |
|--------|-------|
| `global.json` has `"test.runner": "Microsoft.Testing.Platform"` | MTP on SDK 10+ |
| `<TestingPlatformDotnetTestSupport>true` in csproj/props | MTP on SDK 8/9 |
| Neither signal present | VSTest |

### Step 2: Run tests

**VSTest (any SDK):**
```bash
dotnet test [<PROJECT_OR_SOLUTION>]
```

Common flags: `--framework <TFM>`, `--no-build`, `--filter <EXPR>`, `--logger trx`, `--blame`, `-v <level>`

**MTP with SDK 8/9:**
```bash
dotnet test [<PROJECT>] -- <MTP_ARGUMENTS>
```

**MTP with SDK 10+:**
```bash
dotnet test --project <PATH> <MTP_ARGUMENTS>
```

### Step 3: Run filtered tests

| Framework | Attribute | Filter |
|-----------|-----------|--------|
| MSTest | `[TestCategory("X")]` | `--filter "TestCategory=X"` |
| NUnit | `[Category("X")]` | `--filter "TestCategory=X"` |
| xUnit v2 | `[Trait("Category", "X")]` | `--filter "Category=X"` |
| xUnit v3 (MTP) | `[Trait("Category", "X")]` | `--filter-trait "Category=X"` |

## Troubleshooting

| Error | Fix |
|-------|-----|
| `No test is available` | Verify filter syntax matches platform |
| `error NETSDK1045` | SDK version mismatch — check `global.json` |
| Tests discovered but 0 executed | Check filter property names/values |
| Multi-TFM runs all frameworks | Use `--framework <TFM>` |
