# Story 9.1: Health Check Endpoints

## Story Info
- **Epic**: 9 - Production Hardening
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR56

## User Story

As a DevOps engineer,
I want Kubernetes-compatible health check endpoints,
So that the orchestration layer can monitor service health and manage pod lifecycle.

## Acceptance Criteria

### AC1: Liveness Probe
**Given** the API server is running
**When** I call GET /live
**Then** I receive a 200 response with process info (pid, memory)
**And** the response is fast (no external dependencies)

### AC2: Readiness Probe
**Given** the API server is starting up
**When** I call GET /ready
**Then** I receive 200 if database is connected
**And** I receive 503 if database check fails
**And** the response includes database check details

### AC3: Comprehensive Health Check
**Given** I want full system health info
**When** I call GET /health
**Then** I receive status: healthy/degraded/unhealthy
**And** I see individual check results (database, memory, event_loop)
**And** I see uptime information
**And** I see version information

### AC4: Database-Specific Health Check
**Given** I want to check database connectivity
**When** I call GET /health/db
**Then** I see database connection status
**And** I see query latency in milliseconds
**And** I receive 503 if database is unavailable

## Technical Implementation

### API Endpoints

#### GET /health - Comprehensive Health Check
Returns full system health with all checks.

**Response (200/503):**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-12-25T09:50:00.000Z",
  "version": "1.0.0",
  "uptime": 86400000,
  "uptimeFormatted": "1d 0h 0m",
  "checks": [
    { "name": "database", "status": "pass", "latencyMs": 15 },
    { "name": "memory", "status": "pass", "message": "Memory usage: 45MB (25%)" },
    { "name": "event_loop", "status": "pass", "latencyMs": 1 }
  ]
}
```

#### GET /ready - Kubernetes Readiness Probe
```json
{
  "ready": true,
  "timestamp": "2025-12-25T09:50:00.000Z",
  "checks": [
    { "name": "database", "status": "pass" }
  ]
}
```

#### GET /live - Kubernetes Liveness Probe
```json
{
  "alive": true,
  "timestamp": "2025-12-25T09:50:00.000Z",
  "pid": 12345,
  "memoryUsageMB": 45
}
```

#### GET /health/db - Database-Specific Check
```json
{
  "name": "database",
  "status": "pass",
  "message": "Connected to Supabase",
  "latencyMs": 15,
  "lastChecked": "2025-12-25T09:50:00.000Z",
  "timestamp": "2025-12-25T09:50:00.000Z"
}
```

### Files Created
- `src/api/routes/health.ts` - Health check route handlers
- `src/api/routes/health.test.ts` - 21 unit tests

### Files Modified
- `src/api/UnifiedWorkflowAPI.ts` - Import and mount health routes
- `src/core/SupabasePersistence.ts` - Added getClient() method for health checks
- `src/api/api.test.ts` - Updated health endpoint test expectations

### Health Check Types
```typescript
interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    uptimeFormatted: string;
    checks: HealthCheck[];
}

interface HealthCheck {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message?: string;
    latencyMs?: number;
    lastChecked?: string;
}

interface ReadinessStatus {
    ready: boolean;
    timestamp: string;
    checks: HealthCheck[];
}

interface LivenessStatus {
    alive: boolean;
    timestamp: string;
    pid: number;
    memoryUsageMB: number;
}
```

### Helper Functions
- `formatUptime(ms)` - Formats milliseconds to human-readable (e.g., "1d 2h 30m")
- `getMemoryUsageMB()` - Returns current heap usage in MB
- `checkDatabase(supabase)` - Async database connectivity check
- `checkMemory()` - Memory usage check with thresholds
- `checkEventLoop()` - Event loop responsiveness check

## Definition of Done
- [x] Health routes file created (src/api/routes/health.ts)
- [x] GET /health endpoint with comprehensive checks
- [x] GET /ready endpoint for Kubernetes readiness probe
- [x] GET /live endpoint for Kubernetes liveness probe
- [x] GET /health/db endpoint for database-specific check
- [x] Routes integrated into UnifiedWorkflowAPI
- [x] SupabasePersistence.getClient() method added
- [x] Unit tests (21 passing)
- [x] All backend tests passing (414 total)
- [x] Build successful

## Test Coverage
- 21 unit tests for health routes
- Tests for all 4 endpoints
- Tests for helper functions (formatUptime, getMemoryUsageMB)
- Tests for database failure scenarios
- Tests for optional config parameters (connection count, agent count)
