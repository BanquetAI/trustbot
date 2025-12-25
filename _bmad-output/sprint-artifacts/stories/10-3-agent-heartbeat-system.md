# Story 10.3: Agent Heartbeat System

## Story Info
- **Epic**: 10 - Agent Connection Layer
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR63 (Agent Heartbeat)

## User Story

As a supervisor,
I want to see which agents are online/offline,
So that I know the actual state of my agent fleet.

## Acceptance Criteria

### AC1: Heartbeat Interval
**Given** a connected agent
**When** 30 seconds pass
**Then** the agent should send a heartbeat

### AC2: Offline Detection
**Given** an agent stops sending heartbeats
**When** 3 heartbeats are missed (90 seconds)
**Then** the agent is marked OFFLINE

### AC3: Status Change Notifications
**Given** an agent status changes
**When** online/offline/degraded transitions occur
**Then** UI is updated via WebSocket broadcast

### AC4: Last Seen Tracking
**Given** an agent sends heartbeat
**When** the heartbeat is recorded
**Then** last_seen timestamp is updated

## Technical Implementation

### HeartbeatMonitor Service

`src/services/HeartbeatMonitor.ts` provides:

```typescript
const monitor = new HeartbeatMonitor({
    heartbeatInterval: 30000,    // 30 seconds
    missedThreshold: 3,          // 3 missed = offline (90s)
    degradedThreshold: 1,        // 1 missed = degraded (30s)
    checkInterval: 10000,        // Check every 10s
    recoveryThreshold: 2,        // 2 healthy to recover
});

monitor.start();

// Record heartbeat from agent
monitor.recordHeartbeat({
    agentId: 'agent_123',
    timestamp: new Date(),
    status: 'healthy',
    metrics: { cpuUsage: 45, memoryUsage: 60 },
});

// Query agent health
const health = monitor.getAgentHealth('agent_123');
const stats = monitor.getStats();
```

### Status Transitions

```
                    ┌─────────────────┐
         register   │                 │  3 missed
    ─────────────► │     ONLINE      │ ────────────┐
                    │                 │             │
                    └────────┬────────┘             │
                             │                      │
                    1 missed │                      ▼
                             │              ┌───────────────┐
                             ▼              │               │
                    ┌────────────────┐     │    OFFLINE    │
                    │                │◄────│               │
                    │   DEGRADED     │     └───────────────┘
                    │                │             │
                    └────────┬───────┘             │
                             │                     │
              2 healthy      │    2 healthy        │
              heartbeats     │    heartbeats       │
                             │                     │
                             ▼                     │
                    ┌────────────────┐             │
                    │                │◄────────────┘
                    │    ONLINE      │
                    │                │
                    └────────────────┘
```

### AgentHealthCheck Job

`src/jobs/AgentHealthCheck.ts` provides:

```typescript
const job = new AgentHealthCheckJob({
    checkInterval: 60000,            // Run every minute
    staleConnectionThreshold: 120000, // 2 min stale
    extendedOfflineThreshold: 300000, // 5 min extended
    enableReconciliation: true,
    enableAlerts: true,
});

job.start();

// Get health report
const report = await job.getHealthReport();
// { summary: { total, online, degraded, offline }, agents: [...] }
```

### Health Issues Detected

| Issue Type | Severity | Description |
|------------|----------|-------------|
| `stale_connection` | medium | Connected but no heartbeat for 2+ min |
| `heartbeat_mismatch` | medium | Connected but marked offline |
| `extended_offline` | high | Offline for 5+ minutes |
| `degraded_performance` | low | Agent reporting degraded status |

### Events Emitted

```typescript
// HeartbeatMonitor events
monitor.on('status:changed', (agentId, oldStatus, newStatus) => {});
monitor.on('heartbeat:received', (heartbeat) => {});
monitor.on('heartbeat:missed', (agentId, missedCount) => {});
monitor.on('agent:online', (agentId) => {});
monitor.on('agent:offline', (agentId) => {});
monitor.on('agent:degraded', (agentId) => {});
```

### WebSocket Broadcasts

Status changes broadcast to all connected clients:

```json
{
    "type": "config:updated",
    "payload": {
        "type": "agent:status_changed",
        "agentId": "agent_123",
        "oldStatus": "online",
        "newStatus": "offline",
        "timestamp": 1703505600000
    }
}
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/HeartbeatMonitor.ts` | Core heartbeat tracking service |
| `src/services/HeartbeatMonitor.test.ts` | Unit tests (29 tests) |
| `src/jobs/AgentHealthCheck.ts` | Periodic health check job |

### Test Coverage

| Category | Tests |
|----------|-------|
| Lifecycle | 2 |
| recordHeartbeat | 5 |
| registerAgent | 3 |
| unregisterAgent | 2 |
| Status Transitions | 2 |
| Queries | 8 |
| Configuration | 2 |
| clear | 1 |
| Missed Heartbeat Detection | 4 |
| **Total** | **29** |

### Running Tests

```bash
npx vitest run src/services/HeartbeatMonitor.test.ts
```

## Integration Example

```typescript
import { getHeartbeatMonitor } from './services/HeartbeatMonitor.js';
import { getAgentHealthCheckJob } from './jobs/AgentHealthCheck.js';
import { getWebSocketHub, registerHandlers } from './api/ws/index.js';

// Set up components
const monitor = getHeartbeatMonitor();
const healthJob = getAgentHealthCheckJob();
const hub = getWebSocketHub();

// Wire up WebSocket heartbeats
hub.on('heartbeat', (agentId, payload) => {
    monitor.recordHeartbeat({
        agentId,
        timestamp: new Date(payload.timestamp),
        status: payload.status,
        metrics: payload.metrics,
    });
});

// Wire up connections
hub.on('connection', (connId, agentId) => {
    monitor.registerAgent(agentId);
});

hub.on('disconnection', (connId, agentId) => {
    monitor.unregisterAgent(agentId);
});

// Start monitoring
monitor.start();
healthJob.start();
```

## Definition of Done
- [x] HeartbeatMonitor service created
- [x] 30-second heartbeat interval configured
- [x] 3 missed heartbeats → OFFLINE detection
- [x] Degraded status after 1 missed heartbeat
- [x] Recovery after 2 consecutive healthy heartbeats
- [x] Status change WebSocket broadcasts
- [x] Last seen timestamp tracking
- [x] AgentHealthCheck periodic job
- [x] Database reconciliation
- [x] Health alerts for high severity issues
- [x] Comprehensive test suite (29 tests)
- [x] TypeScript compilation successful
