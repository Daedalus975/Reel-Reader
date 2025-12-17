# E2E Testing

## Local Testing

Run all tests locally:

```bash
npm run test:e2e
```

### Individual Test Suites

Run a specific test file:

```bash
npx playwright test tests/smoke.spec.ts
npx playwright test tests/library-filters.spec.ts
npx playwright test tests/import-persistence.spec.ts
npx playwright test tests/detail-watch.spec.ts
```

### Debug Mode

Run tests with UI (inspector):

```bash
npx playwright test --ui
```

Run a single test in debug mode:

```bash
npx playwright test tests/smoke.spec.ts --debug
```

### View Test Report

After running tests, view the HTML report:

```bash
npx playwright show-report test-results/html
```

## CI/CD

Tests run automatically on every push/PR to `main` and `dev` branches via GitHub Actions (`.github/workflows/test.yml`).

**Artifacts captured on failure:**
- Screenshots
- Videos
- Traces (for debugging with `npx playwright show-trace`)
- HTML report

## Test Coverage

- **smoke.spec.ts**: Hero CTA, library filters, detail actions, import, search, persistence
- **library-filters.spec.ts**: Type/genre filters, favorites flow, adult toggle
- **import-persistence.spec.ts**: Manual item creation, reload persistence, search integration
- **detail-watch.spec.ts**: Favorite & watched state persistence across page reload

All tests use a fresh localStorage state and disable nav overlays to avoid flakiness.
