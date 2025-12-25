# Story 13.1: Prometheus Metrics

## Story Info
- **Epic**: 13 - Observability & Monitoring
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR82 (Prometheus metrics for all API endpoints)

## User Story

As a DevOps engineer,
I want Prometheus metrics exposed,
So that I can monitor system health.

## Acceptance Criteria

### AC1: HTTP Request Metrics
**Given** HTTP requests to the API
**When** metrics are collected
**Then** request count, duration, and status are tracked

### AC2: WebSocket Metrics
**Given** WebSocket connections
**When** connections are established/closed
**Then** connection count and message counts are tracked

### AC3: Business Metrics
**Given** trust scores and decisions
**When** they change
**Then** the changes are recorded as metrics

### AC4: Metrics Endpoint
**Given** a Prometheus scraper
**When** it requests /metrics
**Then** all metrics are returned in Prometheus format

## Technical Implementation

### Metrics Middleware

`src/api/middleware/metrics.ts` provides comprehensive metrics:

```typescript
import { metricsMiddleware, metricsHandler } from './middleware/metrics.js';

// Add middleware to app
app.use('*', metricsMiddleware());

// Add metrics endpoint
app.get('/metrics', metricsHandler);
```

### Available Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `trustbot_http_requests_total` | Counter | method, path, status_code | Total HTTP requests |
| `trustbot_http_request_duration_seconds` | Histogram | method, path, status_code | Request duration |
| `trustbot_http_request_size_bytes` | Histogram | method, path | Request body size |
| `trustbot_http_response_size_bytes` | Histogram | method, path, status_code | Response body size |
| `trustbot_websocket_connections_current` | Gauge | type | Active WebSocket connections |
| `trustbot_websocket_messages_total` | Counter | direction, type | WebSocket messages |
| `trustbot_trust_score_changes_total` | Counter | direction, event_type, org_id | Trust score changes |
| `trustbot_trust_score_current` | Gauge | agent_id, org_id | Current trust scores |
| `trustbot_trust_tier_changes_total` | Counter | from_tier, to_tier, org_id | Tier promotions/demotions |
| `trustbot_decisions_processed_total` | Counter | type, outcome, source, org_id | Decisions processed |
| `trustbot_decision_duration_seconds` | Histogram | type, source | Decision processing time |
| `trustbot_decision_queue_depth` | Gauge | urgency, org_id | Pending decisions |
| `trustbot_agents_connected` | Gauge | status, org_id | Connected agents |
| `trustbot_agent_heartbeat_latency_seconds` | Histogram | agent_id | Heartbeat latency |
| `trustbot_uptime_seconds` | Gauge | - | Process uptime |

### Convenience API

```typescript
import { metrics } from './middleware/metrics.js';

// HTTP metrics (automatic via middleware)
metrics.http.record('GET', '/api/test', 200, 0.05);

// WebSocket metrics
metrics.websocket.setConnections('agent', 5);
metrics.websocket.incConnections('agent');
metrics.websocket.decConnections('agent');
metrics.websocket.recordMessage('inbound', 'heartbeat');

// Trust score metrics
metrics.trust.recordChange('increase', 'task_completed', 'org_1');
metrics.trust.setScore('agent_1', 'org_1', 850);
metrics.trust.recordTierChange('TRUSTED', 'VERIFIED', 'org_1');

// Decision metrics
metrics.decisions.recordProcessed('execute', 'approved', 'tribunal', 'org_1');
metrics.decisions.recordDuration('execute', 'tribunal', 2.5);
metrics.decisions.setQueueDepth('immediate', 'org_1', 3);

// Agent metrics
metrics.agents.setConnected('online', 'org_1', 15);
metrics.agents.recordHeartbeatLatency('agent_1', 0.03);
```

### Configuration

```typescript
interface MetricsConfig {
    prefix?: string;              // Default: 'trustbot_'
    defaultLabels?: Record<string, string>;
    collectDefaultMetrics?: boolean; // Default: true
    excludePaths?: string[];      // Default: ['/metrics', '/health', '/live', '/ready']
    durationBuckets?: number[];   // Custom histogram buckets
}

metricsMiddleware({
    prefix: 'myapp_',
    excludePaths: ['/metrics', '/health'],
});
```

### Path Normalization

Paths are normalized to reduce label cardinality:
- `/api/v1/agents/abc123` → `/api/v1/agents/:uuid`
- `/api/v1/decisions/dec_456/approve` → `/api/v1/decisions/:id/approve`
- `/api/v1/orgs/org_1` → `/api/v1/orgs/:orgId`

### Example Prometheus Output

```
# HELP trustbot_http_requests_total Total number of HTTP requests
# TYPE trustbot_http_requests_total counter
trustbot_http_requests_total{method="GET",path="/api/v1/agents",status_code="200"} 150
trustbot_http_requests_total{method="POST",path="/api/v1/decisions/:id/approve",status_code="200"} 42

# HELP trustbot_http_request_duration_seconds HTTP request duration in seconds
# TYPE trustbot_http_request_duration_seconds histogram
trustbot_http_request_duration_seconds_bucket{method="GET",path="/api/v1/agents",status_code="200",le="0.005"} 10
trustbot_http_request_duration_seconds_bucket{method="GET",path="/api/v1/agents",status_code="200",le="0.01"} 50
...

# HELP trustbot_decisions_processed_total Total decisions processed
# TYPE trustbot_decisions_processed_total counter
trustbot_decisions_processed_total{type="execute",outcome="approved",source="auto_approval",org_id="org_1"} 100
trustbot_decisions_processed_total{type="execute",outcome="denied",source="tribunal",org_id="org_1"} 5
```

### Files Created

| File | Purpose |
|------|---------|
| `src/api/middleware/metrics.ts` | Metrics middleware and registry |
| `src/api/middleware/metrics.test.ts` | Unit tests (29 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Metrics Registry | 3 |
| HTTP Metrics | 4 |
| Middleware Integration | 4 |
| Metrics Endpoint | 1 |
| WebSocket Metrics | 3 |
| Trust Score Metrics | 3 |
| Decision Metrics | 3 |
| Agent Metrics | 2 |
| Convenience API | 5 |
| Default Node.js Metrics | 1 |
| **Total** | **29** |

### Running Tests

```bash
npx vitest run src/api/middleware/metrics.test.ts
```

## Definition of Done
- [x] Prometheus metrics middleware created
- [x] HTTP request/response metrics (count, duration, size)
- [x] WebSocket connection and message metrics
- [x] Trust score change metrics
- [x] Decision processing metrics
- [x] Agent connection metrics
- [x] Path normalization for label cardinality
- [x] /metrics endpoint handler
- [x] Convenience API for recording metrics
- [x] Default Node.js metrics collection
- [x] Comprehensive test suite (29 tests)
- [x] TypeScript compilation successful
