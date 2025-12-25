# Story 13.2: Structured Logging

## Story Info
- **Epic**: 13 - Observability & Monitoring
- **Status**: done
- **Started**: 2025-12-25 (previously implemented in Epic 9)
- **Completed**: 2025-12-25
- **FRs Covered**: FR83 (Structured logging with correlation IDs)

## User Story

As a DevOps engineer,
I want structured logging with correlation IDs,
So that I can trace requests through the system.

## Acceptance Criteria

### AC1: JSON Structured Logs
**Given** log events occur
**When** logs are written
**Then** they are in JSON format with consistent schema

### AC2: Correlation ID Tracking
**Given** an HTTP request enters the system
**When** logs are generated during processing
**Then** all logs include the same correlation ID

### AC3: Log Levels
**Given** different severity events
**When** they are logged
**Then** appropriate levels (trace, debug, info, warn, error, fatal) are used

### AC4: Request Context
**Given** logged events
**When** they occur during request processing
**Then** user, org, and other context is included

## Technical Implementation

### Note: Previously Implemented

This story was implemented as part of Epic 9: Production Hardening (Story 9.2). The existing implementation fully covers all requirements for Epic 13.

### Logger Library

`src/lib/logger.ts` provides Pino-based structured logging:

```typescript
import { logger, createLogger, childLogger } from './lib/logger.js';

// Simple logging
logger.info('User logged in', { userId: 'user_1' });

// Create child logger with context
const log = childLogger({ component: 'decisions', decisionId: 'dec_1' });
log.info('Decision created');

// With correlation ID
const requestLog = createLogger({ correlationId: 'req_123' });
requestLog.setCorrelationId('req_123');
requestLog.info('Processing request');
```

### Logging Middleware

`src/api/middleware/logging.ts` provides HTTP request logging:

```typescript
import { loggingMiddleware, getRequestLogger } from './middleware/logging.js';

// Add to app
app.use('*', loggingMiddleware());

// In route handler, get request-scoped logger
app.get('/api/test', (c) => {
    const log = getRequestLogger(c);
    log.info('Processing test request');
    return c.json({ ok: true });
});
```

### Features

| Feature | Implementation |
|---------|----------------|
| JSON Output | Pino structured JSON in production |
| Pretty Printing | pino-pretty in development |
| Log Levels | trace, debug, info, warn, error, fatal |
| Correlation IDs | Auto-generated or from X-Request-ID header |
| Context Enrichment | User, org, agent, decision context |
| Request Logging | Method, path, status, duration |
| Audit Logging | Action-based audit trail |
| Domain Events | Event sourcing support |
| Child Loggers | Component-specific logging |

### Log Output Example

```json
{
    "level": "info",
    "timestamp": "2025-12-25T12:00:00.000Z",
    "service": "trustbot-api",
    "correlationId": "req_abc123",
    "component": "decisions",
    "message": "Decision approved",
    "decisionId": "dec_456",
    "userId": "user_1",
    "orgId": "org_1"
}
```

### Domain-Specific Loggers

```typescript
import { decisionLogger, agentLogger, trustLogger, tribunalLogger } from './lib/logger.js';

// Decision operations
const dlog = decisionLogger('dec_123', correlationId);
dlog.info('Decision submitted');

// Agent operations
const alog = agentLogger('agent_456', correlationId);
alog.info('Agent connected');

// Trust operations
const tlog = trustLogger(correlationId);
tlog.info('Trust score updated');

// Tribunal operations
const triblog = tribunalLogger('trib_789', correlationId);
triblog.info('Vote recorded');
```

### Audit Logging

```typescript
import { logAudit } from './middleware/logging.js';

logAudit({
    action: 'decision.approve',
    resource: 'decisions',
    resourceId: 'dec_123',
    userId: 'user_1',
    orgId: 'org_1',
    success: true,
    correlationId: 'req_abc',
    details: { reason: 'Auto-approved' },
});
```

### Domain Event Logging

```typescript
import { logDomainEvent } from './middleware/logging.js';

logDomainEvent({
    event: 'TrustScoreUpdated',
    aggregate: 'agents',
    aggregateId: 'agent_123',
    payload: { oldScore: 500, newScore: 550 },
    correlationId: 'req_abc',
    userId: 'user_1',
    orgId: 'org_1',
});
```

### Configuration

Environment variables:
- `LOG_LEVEL`: trace, debug, info, warn, error, fatal (default: info)
- `SERVICE_NAME`: Service identifier in logs (default: trustbot-api)
- `NODE_ENV`: production enables JSON output, development enables pretty printing

### Files

| File | Purpose |
|------|---------|
| `src/lib/logger.ts` | Core logging library |
| `src/lib/logger.test.ts` | Logger tests (25 tests) |
| `src/api/middleware/logging.ts` | HTTP logging middleware |
| `src/api/middleware/logging.test.ts` | Middleware tests (16 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Logger Factory | 4 |
| Correlation ID | 2 |
| Log Level Methods | 8 |
| Context Enrichment | 2 |
| Request Logging | 4 |
| Domain-Specific Loggers | 5 |
| Middleware Configuration | 3 |
| Correlation ID Handling | 3 |
| Request Logger Access | 2 |
| Response Status Logging | 3 |
| Audit Logging | 3 |
| Domain Event Logging | 2 |
| **Total** | **41** |

### Running Tests

```bash
npx vitest run src/lib/logger.test.ts src/api/middleware/logging.test.ts
```

## Definition of Done
- [x] Pino-based structured logger
- [x] JSON output in production
- [x] Pretty printing in development
- [x] All log levels (trace, debug, info, warn, error, fatal)
- [x] Correlation ID tracking
- [x] HTTP request logging middleware
- [x] Context enrichment (user, org, etc.)
- [x] Child loggers for components
- [x] Domain-specific loggers
- [x] Audit logging
- [x] Domain event logging
- [x] Comprehensive test suite (41 tests)
- [x] TypeScript compilation successful
