# Story 9.2: Structured Logging with Correlation IDs

## Story Info
- **Epic**: 9 - Production Hardening
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR57 (Observability)

## User Story

As a DevOps engineer,
I want structured JSON logs with correlation IDs,
So that I can query and analyze logs effectively across distributed requests.

## Acceptance Criteria

### AC1: Structured Log Format
**Given** the API is running
**When** a log event occurs
**Then** the log is output as JSON with:
- level (trace/debug/info/warn/error/fatal)
- timestamp (ISO 8601)
- correlationId (request-scoped)
- service name
- message
- context object

### AC2: Correlation ID Tracking
**Given** a request enters the system
**When** logging occurs during request handling
**Then** all logs include the same correlation ID
**And** the correlation ID is returned in X-Request-ID header

### AC3: Request Logging
**Given** an HTTP request is processed
**When** the request completes
**Then** a log entry captures method, path, status, response time

### AC4: Error Logging
**Given** an error occurs
**When** the error is logged
**Then** the log includes error name, message, and stack trace

### AC5: Domain-Specific Loggers
**Given** I need to log a specific domain operation
**When** I use the domain logger factory
**Then** logs are enriched with relevant domain context

## Technical Implementation

### Log Format (Production)
```json
{
  "level": "info",
  "timestamp": "2025-12-25T10:00:00.000Z",
  "correlationId": "abc-123-def-456",
  "service": "trustbot-api",
  "message": "Decision approved",
  "component": "decisions",
  "decisionId": "dec-123",
  "userId": "user-456"
}
```

### Log Format (Development - Pretty Printed)
```
[2025-12-25 10:00:00.000 -0500] INFO: Decision approved
    service: "trustbot-api"
    correlationId: "abc-123-def-456"
    component: "decisions"
    decisionId: "dec-123"
```

### Files Created
- `src/lib/logger.ts` - Pino-based structured logger
- `src/lib/logger.test.ts` - 25 unit tests for logger
- `src/api/middleware/logging.ts` - HTTP request logging middleware
- `src/api/middleware/logging.test.ts` - 16 unit tests for middleware

### Files Modified
- `src/api/UnifiedWorkflowAPI.ts` - Integrated logging middleware
- `package.json` - Added pino, pino-pretty dependencies

### Dependencies Added
- `pino` - Fast JSON logger
- `pino-pretty` - Pretty printing for development
- `@types/pino` - TypeScript types

### Logger API
```typescript
// Singleton logger
import { logger } from '../lib/logger.js';
logger.info('Message', { context });

// Create scoped logger
import { createLogger } from '../lib/logger.js';
const log = createLogger({ component: 'auth' });

// Child logger with bindings
const child = logger.child({ userId: 'user-123' });

// Correlation ID management
log.setCorrelationId('abc-123');
const id = log.getCorrelationId();

// Domain-specific loggers
import { decisionLogger, agentLogger, trustLogger } from '../lib/logger.js';
const dlog = decisionLogger('dec-123', 'correlation-id');
dlog.info('Decision approved');
```

### Middleware API
```typescript
import { loggingMiddleware, getRequestLogger, logAudit } from './middleware/logging.js';

// Add to Hono app
app.use('*', loggingMiddleware({
    skipPaths: ['/health', '/live', '/ready'],
}));

// Access logger in route handler
app.get('/api/resource', (c) => {
    const log = getRequestLogger(c);
    log.info('Processing resource request');
    return c.json({ data });
});

// Audit logging
logAudit({
    action: 'APPROVE_DECISION',
    resource: 'decision',
    resourceId: 'dec-123',
    success: true,
});

// Domain event logging
logDomainEvent({
    event: 'DecisionApproved',
    aggregate: 'Decision',
    aggregateId: 'dec-123',
});
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Minimum log level |
| `SERVICE_NAME` | `trustbot-api` | Service identifier |
| `NODE_ENV` | `development` | Environment (affects formatting) |

## Definition of Done
- [x] Pino logger installed and configured
- [x] StructuredLogger class with all log levels
- [x] Correlation ID tracking
- [x] Logging middleware for HTTP requests
- [x] getRequestLogger helper for route handlers
- [x] logAudit for audit trail events
- [x] logDomainEvent for domain events
- [x] Domain-specific logger factories
- [x] Pretty printing in development
- [x] JSON output in production
- [x] Unit tests (41 total - 25 logger, 16 middleware)
- [x] All backend tests passing (455 total)
- [x] Build successful

## Test Coverage
- Logger factory tests (singleton, create, child)
- Correlation ID management tests
- All log level method tests (trace through fatal)
- Context enrichment tests
- Request logging tests
- Domain-specific logger tests
- Middleware configuration tests
- Audit logging tests
- Domain event logging tests
