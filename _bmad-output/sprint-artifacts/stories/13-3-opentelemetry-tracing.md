# Story 13.3: OpenTelemetry Tracing

## Story Info
- **Epic**: 13 - Observability & Monitoring
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR84 (Distributed tracing for cross-service debugging)

## User Story

As a DevOps engineer,
I want distributed tracing,
So that I can debug cross-service issues.

## Acceptance Criteria

### AC1: HTTP Request Tracing
**Given** HTTP requests to the API
**When** processing occurs
**Then** spans capture the full request lifecycle

### AC2: Database Query Tracing
**Given** database operations
**When** queries are executed
**Then** spans capture query details and timing

### AC3: WebSocket Message Tracing
**Given** WebSocket messages
**When** they are processed
**Then** spans track inbound and outbound messages

### AC4: Decision Flow Tracing
**Given** decision processing
**When** decisions go through tribunal or execution
**Then** the full flow is traced

## Technical Implementation

### Tracing Library

`src/lib/tracing.ts` provides OpenTelemetry-based distributed tracing:

```typescript
import {
    initTracing,
    withSpan,
    tracing,
    traceHttpRequest,
    traceDbOperation,
    traceWsMessage,
    traceDecisionFlow,
} from './lib/tracing.js';

// Initialize tracing at application startup
initTracing({
    serviceName: 'trustbot-api',
    otlpEndpoint: 'http://jaeger:4318/v1/traces',
});

// Trace an HTTP request
await traceHttpRequest({
    method: 'POST',
    url: '/api/v1/decisions',
    correlationId: 'req_123',
}, async (span) => {
    // Processing happens here
    return response;
});

// Trace a database operation
await traceDbOperation({
    system: 'postgresql',
    operation: 'SELECT',
    table: 'agents',
}, async (span) => {
    return db.query('SELECT * FROM agents');
});
```

### Features

| Feature | Implementation |
|---------|----------------|
| Auto-Instrumentation | HTTP, Express, PostgreSQL, Redis |
| HTTP Spans | Method, URL, status, correlation ID |
| Database Spans | System, operation, table, statement |
| WebSocket Spans | Message type, direction, agent ID |
| Decision Spans | Decision ID, type, risk level, outcome |
| Context Propagation | W3C Trace Context headers |
| OTLP Export | Jaeger, Zipkin, or any OTLP backend |
| Console Export | Development debugging |

### Trace Span Types

#### HTTP Request Spans
```typescript
await traceHttpRequest({
    method: 'GET',
    url: '/api/v1/agents',
    correlationId: 'req_abc',
    userId: 'user_1',
    orgId: 'org_1',
    userAgent: 'Mozilla/5.0',
}, async (span) => {
    // Request processing
});
```

#### Database Operation Spans
```typescript
await traceDbOperation({
    system: 'postgresql',
    operation: 'INSERT',
    table: 'decisions',
    statement: 'INSERT INTO decisions (...)',
}, async (span) => {
    // DB query
});
```

#### WebSocket Message Spans
```typescript
await traceWsMessage({
    messageType: 'heartbeat',
    direction: 'inbound',
    agentId: 'agent_1',
    sessionId: 'sess_123',
}, async (span) => {
    // Message handling
});
```

#### Decision Flow Spans
```typescript
await traceDecisionFlow({
    decisionId: 'dec_123',
    decisionType: 'execute',
    agentId: 'agent_1',
    orgId: 'org_1',
    riskLevel: 'medium',
    outcome: 'approved',
}, async (span) => {
    // Decision processing
});

// Trace tribunal process
await traceTribunalProcess('dec_123', 'trib_456', async (span) => {
    // Tribunal voting
});

// Trace decision execution
await traceDecisionExecution('dec_123', 'auto_approval', async (span) => {
    // Execution
});
```

### Configuration

```typescript
interface TracingConfig {
    serviceName?: string;        // Default: 'trustbot-api'
    serviceVersion?: string;     // Default: '1.0.0'
    environment?: string;        // Default: process.env.NODE_ENV
    otlpEndpoint?: string;       // Default: 'http://localhost:4318/v1/traces'
    consoleExport?: boolean;     // Default: true in development
    autoInstrumentation?: boolean; // Default: true
    sampleRate?: number;         // Default: 1.0 (100%)
}

// Environment variables
// OTEL_EXPORTER_OTLP_ENDPOINT - OTLP collector endpoint
// OTEL_SAMPLE_RATE - Trace sampling rate (0.0-1.0)
// SERVICE_NAME - Service name in traces
// SERVICE_VERSION - Service version
```

### Generic Span Creation

```typescript
import { withSpan, withSpanSync, createSpan } from './lib/tracing.js';

// Async span
const result = await withSpan('custom-operation', async (span) => {
    span.setAttribute('custom.key', 'value');
    span.addEvent('step-completed', { step: 1 });
    return computeResult();
});

// Sync span
const value = withSpanSync('sync-operation', (span) => {
    return calculateValue();
});

// Manual span management
const span = createSpan('manual-span', {
    kind: SpanKind.CLIENT,
    attributes: { 'service.target': 'external-api' },
});
try {
    // work
    span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
    recordSpanError(span, error);
    throw error;
} finally {
    span.end();
}
```

### Context Operations

```typescript
import {
    getCurrentSpan,
    getCurrentTraceId,
    getCurrentSpanId,
    addSpanAttribute,
    addSpanEvent,
} from './lib/tracing.js';

// Get current trace context
const traceId = getCurrentTraceId();
const spanId = getCurrentSpanId();
const span = getCurrentSpan();

// Add to current span
addSpanAttribute('user.role', 'admin');
addSpanEvent('validation-passed', { fields: ['name', 'email'] });
```

### Convenience API

```typescript
import { tracing } from './lib/tracing.js';

// Lifecycle
tracing.init(config);
await tracing.shutdown();
tracing.isInitialized();

// Domain-specific
await tracing.http.trace(attrs, fn);
await tracing.db.trace(attrs, fn);
await tracing.ws.trace(attrs, fn);
await tracing.decision.trace(attrs, fn);
await tracing.decision.traceTribunal(decisionId, tribunalId, fn);
await tracing.decision.traceExecution(decisionId, type, fn);

// Context
tracing.getCurrentSpan();
tracing.getCurrentTraceId();
tracing.addAttribute(key, value);
tracing.addEvent(name, attrs);
```

### Integration with Observability Stack

```yaml
# docker-compose.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "4318:4318"    # OTLP HTTP

  api:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces
```

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/tracing.ts` | OpenTelemetry tracing library |
| `src/lib/tracing.test.ts` | Unit tests (42 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| SDK Initialization | 4 |
| Span Creation | 3 |
| withSpan (async) | 4 |
| withSpanSync | 3 |
| HTTP Tracing | 3 |
| Database Tracing | 3 |
| WebSocket Tracing | 3 |
| Decision Flow Tracing | 4 |
| Context Operations | 5 |
| Error Recording | 2 |
| Tracing Context | 1 |
| Convenience API | 7 |
| **Total** | **42** |

### Running Tests

```bash
npx vitest run src/lib/tracing.test.ts
```

## Definition of Done
- [x] OpenTelemetry SDK integration
- [x] HTTP request span creation
- [x] Database operation span creation
- [x] WebSocket message span creation
- [x] Decision flow span creation
- [x] Tribunal process tracing
- [x] Decision execution tracing
- [x] Context propagation utilities
- [x] OTLP exporter configuration
- [x] Console exporter for development
- [x] Auto-instrumentation support
- [x] Convenience API
- [x] Comprehensive test suite (42 tests)
- [x] TypeScript compilation successful
