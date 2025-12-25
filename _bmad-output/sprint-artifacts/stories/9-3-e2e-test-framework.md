# Story 9.3: E2E Test Framework Setup

## Story Info
- **Epic**: 9 - Production Hardening
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR58 (Test Coverage)

## User Story

As a QA engineer,
I want Playwright configured for E2E testing,
So that we can automate browser-based test coverage.

## Acceptance Criteria

### AC1: Playwright Installation
**Given** the web project
**When** I run npm install
**Then** Playwright is available with Chromium browser

### AC2: Test Configuration
**Given** Playwright is installed
**When** I look at the configuration
**Then** I see settings for: base URL, browsers, reporters, web server

### AC3: Authentication Fixtures
**Given** I need to test authenticated pages
**When** I use the test fixtures
**Then** I can create authenticated sessions without real OAuth

### AC4: Smoke Tests
**Given** the E2E framework is set up
**When** I run the smoke tests
**Then** basic app loading and API health are verified

### AC5: NPM Scripts
**Given** I want to run E2E tests
**When** I check package.json
**Then** I see scripts for: e2e, e2e:ui, e2e:headed, e2e:debug

## Technical Implementation

### Directory Structure
```
web/
├── e2e/
│   ├── fixtures/
│   │   └── test-fixtures.ts    # Reusable test utilities
│   ├── tests/
│   │   └── smoke.spec.ts       # Smoke tests
│   └── auth.setup.ts           # Auth state setup
├── playwright.config.ts        # Playwright configuration
└── .gitignore                  # Excludes test artifacts
```

### NPM Scripts
```json
{
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui",
  "e2e:headed": "playwright test --headed",
  "e2e:debug": "playwright test --debug",
  "e2e:report": "playwright show-report e2e-report"
}
```

### Test Fixtures API
```typescript
import { test, expect } from '../fixtures/test-fixtures';

// Authenticated page fixture
test('dashboard loads', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    // Test authenticated content
});

// Navigation helper
test('navigate to settings', async ({ navigateTo }) => {
    await navigateTo('/settings');
});

// Wait for API
test('api ready', async ({ waitForApi }) => {
    await waitForApi();
});

// Mock API responses
test('mock data', async ({ mockApi }) => {
    await mockApi('/agents', [{ id: '1', name: 'Test Agent' }]);
});
```

### Smoke Tests Coverage
| Test | Description |
|------|-------------|
| App Loading | Verifies app loads without console errors |
| Page Title | Checks correct title is displayed |
| Login Page | Shows login for unauthenticated users |
| Login Button | Verifies login button is clickable |
| Authenticated Nav | Dashboard accessible when authenticated |
| API Health | /health endpoint responds correctly |
| API Live | /live endpoint responds correctly |
| API Ready | /ready endpoint responds |
| 404 Handling | Graceful error handling for invalid routes |

### Playwright Configuration
```typescript
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: [['html'], ['list']],
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
    },
    projects: [
        { name: 'setup', testMatch: /.*\.setup\.ts/ },
        { name: 'chromium', dependencies: ['setup'] },
        { name: 'mobile-chrome', dependencies: ['setup'] },
    ],
    webServer: [
        { command: 'npm run dev', url: 'http://localhost:5173' },
        { command: 'cd .. && npm run api', url: 'http://localhost:3002/health' },
    ],
});
```

### Files Created
- `web/playwright.config.ts` - Playwright configuration
- `web/e2e/fixtures/test-fixtures.ts` - Reusable test utilities
- `web/e2e/auth.setup.ts` - Authentication setup
- `web/e2e/tests/smoke.spec.ts` - Smoke tests

### Files Modified
- `web/package.json` - Added E2E scripts and Playwright dependency
- `web/.gitignore` - Added Playwright artifacts

### Dependencies Added
- `@playwright/test` - Playwright testing framework

## Running E2E Tests

```bash
# Run all E2E tests
cd web && npm run e2e

# Run with UI (interactive mode)
npm run e2e:ui

# Run headed (visible browser)
npm run e2e:headed

# Debug mode
npm run e2e:debug

# View report
npm run e2e:report
```

## Definition of Done
- [x] Playwright installed in web directory
- [x] playwright.config.ts with proper settings
- [x] Test fixtures for authentication
- [x] Navigation and API helpers
- [x] Smoke tests for app loading
- [x] Smoke tests for login flow
- [x] Smoke tests for API health
- [x] NPM scripts for running tests
- [x] Artifacts excluded from git
- [x] TypeScript compilation successful

## Next Steps
- Story 9.4: Critical Path E2E Tests (decision approval, agent management)
- Story 9.5: Visual Regression Testing
