---
name: code-testing-agent
description: >-
  Generates and writes new unit tests for any programming language.
  Use when asked to generate tests, write unit tests, add tests, improve
  coverage, or scaffold a new test project. Supports C#/.NET (xUnit, MSTest,
  NUnit), Python (pytest), TypeScript/JavaScript (Jest, Vitest), Go, Java.
  Runs a research-plan-implement pipeline so tests compile and pass.
  DO NOT USE FOR running existing tests (use run-tests) or analyzing
  existing test quality (use test-gap-analysis).
license: MIT
---

# Code Testing Generation Skill

Generate comprehensive, workable unit tests using a coordinated pipeline.

## When to Use

- Generate unit tests for a project or specific files
- Improve test coverage for existing codebases
- Create test files that follow project conventions
- Write tests that compile and pass
- Add tests for new features or untested code

## When Not to Use

- Running existing tests (use `run-tests`)
- Analyzing test quality (use `test-gap-analysis`)
- Debugging failing test logic

## Pipeline

```text
Research → Plan → Implement (Build → Test → Fix → Lint)
```

### Step 1: Determine scope

| User Request | Strategy |
|---|---|
| Single file test generation | Direct — write tests immediately |
| Module or service tests | Single pass — one Research → Plan → Implement cycle |
| Project-wide coverage goal | Iterative — multiple cycles narrowing gaps |

### Step 2: Research

Analyze the codebase:
- Detect language and testing framework
- Map source files, existing tests, dependencies
- Discover build and test commands
- Identify existing test patterns (naming, organization, assertions)

### Step 3: Plan

Create phased implementation plan:
- Group files into 2-5 logical phases
- Prioritize by complexity and dependencies
- Specify test cases per file (happy path, edge cases, error cases)

### Step 4: Implement

Per phase:
1. Read source files to understand the API
2. Write test files following project patterns
3. Build to verify compilation
4. Run tests to verify they pass
5. Fix errors (up to 3 attempts)

### Coverage Types

- **Happy path**: Valid inputs produce expected outputs
- **Edge cases**: Empty values, boundaries, special characters
- **Error cases**: Invalid inputs, null handling, exceptions

## Best Practices

- Aim for 80% coverage unless user specifies otherwise
- Use project's existing test patterns and conventions
- Prefer parameterized tests where multiple inputs test the same logic
- Never mark tests `[Skip]` or `[Ignore]` to make them pass
- Fix assertion values, not production code, when tests fail
- Run full workspace build after all phases to catch cross-project issues

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Tests don't compile | Check project refs, usings, method signatures |
| Tests fail | Read output, check production code, fix assertion |
| Wrong framework detected | Specify in request: "Generate xUnit tests for..." |
