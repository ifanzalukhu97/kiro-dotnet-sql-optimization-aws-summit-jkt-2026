---
name: test-gap-analysis
description: >-
  Performs pseudo-mutation analysis on production code to find gaps in
  existing tests. Use when asked to find weak tests, discover untested
  edge cases, or check whether tests would catch a bug. Evaluates test
  effectiveness through mutation-style reasoning analyzing boundary
  conditions, boolean flips, null returns, exception removal, and
  arithmetic changes. Works with .NET, Python, TypeScript, Java, Go.
  DO NOT USE FOR writing new tests (use code-testing-agent) or running
  actual mutation tools like Stryker.
license: MIT
---

# Test Gap Analysis via Pseudo-Mutation

Analyze production code by reasoning about hypothetical mutations and
checking whether existing tests would catch them.

## When to Use

- User asks "would my tests catch a bug in this code?"
- User wants to find weak or shallow tests
- User wants to evaluate test effectiveness beyond coverage
- User asks "where are my tests blind?"
- User wants to prioritize which tests to strengthen

## When Not to Use

- Writing new tests (use `code-testing-agent`)
- Running actual mutation testing tools (Stryker, mutmut, PIT)
- Only wanting code coverage numbers

## Workflow

### Step 1: Gather code

Read production code and corresponding test files. Identify pairs by
convention (e.g., `FooController.cs` ↔ `FooControllerTests.cs`).

### Step 2: Identify mutation points

Scan production code for locations where a mutation could reveal a gap:

**Boundary:** `<` → `<=`, `>` → `>=`, `== 0` → `== 1`
**Boolean:** `&&` → `||`, `!x` → `x`, `if(x)` → `if(!x)`
**Return value:** `return result` → `return null`, `return true` → `return false`
**Exception removal:** Remove `throw` or guard clause entirely
**Arithmetic:** `+` → `-`, `*` → `/`, `x++` → `x--`
**Null-check removal:** Remove `if (x == null)` guard, `x ?? default` → `x`

### Step 3: Evaluate against tests

For each mutation point:
1. Find covering tests
2. Check if assertions would detect the change
3. Classify as:

| Verdict | Meaning |
|---------|---------|
| Killed | A test would fail — effective |
| Survived | No test would fail — test gap |
| No coverage | No test exercises this path |
| Equivalent | Mutation doesn't change behavior — skip |

### Step 4: Calibrate

- Skip trivial code (simple getters, auto-properties)
- Consider defensive depth (redundant guards)
- Rate by risk (payment logic > logging)

### Step 5: Report

1. **Summary table** — mutation score breakdown
2. **Survived mutations** — location, category, original vs mutated, why missed, recommended fix
3. **No-coverage zones** — untested code paths
4. **Strengths** — areas where tests are effective
5. **Recommendations** — prioritized list of tests to add

## Validation

- [ ] Every mutation point classified
- [ ] Survived mutations include concrete fix recommendations
- [ ] Trivial code excluded
- [ ] Findings prioritized by business risk
- [ ] Report includes strengths alongside gaps
