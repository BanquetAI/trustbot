# Story 10.6: Connection Pool Management

## Story Info
- **Epic**: 10 - Agent Connection Layer
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR66 (Connection Pooling)

## User Story

As a platform engineer,
I want efficient connection management,
So that the system scales to 1000+ concurrent agents.

## Acceptance Criteria

### AC1: Connection Pooling
**Given** agents connecting to the system
**When** connections are established
**Then** they are pooled with configurable global limits

### AC2: Per-Org Limits
**Given** multiple organizations
**When** an org has many agents connecting
**Then** per-org limits prevent resource monopolization

### AC3: Storm Protection
**Given** a sudden spike in connection attempts
**When** the rate exceeds the storm threshold
**Then** new connections are temporarily rejected

### AC4: Memory Efficiency
**Given** 1000+ concurrent connections
**When** tracking connection state
**Then** memory usage remains efficient with O(1) lookups

## Technical Implementation

### ConnectionPool Service

`src/services/ConnectionPool.ts` provides:

```typescript
const pool = new ConnectionPool({
    maxConnections: 10000,        // Global limit
    maxConnectionsPerOrg: 500,    // Per-org limit
    maxConnectionsPerAgent: 3,    // Per-agent limit
    connectionRateLimitGlobal: 200, // Connections/sec global
    connectionRateLimitPerOrg: 50,  // Connections/sec per org
    rateLimitWindowMs: 1000,      // Rate limit window
    idleTimeoutMs: 300000,        // 5 min idle timeout
    stormProtection: true,        // Enable storm protection
    stormThreshold: 100,          // Storm trigger threshold
    stormCooldownMs: 10000,       // 10 sec cooldown
});

// Request a new connection
const result = pool.requestConnection(agentId, orgId, {
    remoteAddress: '192.168.1.1',
    userAgent: 'TrustBot-Agent/1.0',
});

if (result.allowed) {
    // Connection allowed, use result.connectionId
} else {
    // Rejected: result.reason explains why
}

// Release when done
pool.releaseConnection(connectionId, 'normal_close');
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxConnections` | number | 10000 | Maximum total connections |
| `maxConnectionsPerOrg` | number | 500 | Maximum per organization |
| `maxConnectionsPerAgent` | number | 3 | Maximum per agent |
| `connectionRateLimitGlobal` | number | 200 | Global rate limit (per second) |
| `connectionRateLimitPerOrg` | number | 50 | Per-org rate limit (per second) |
| `rateLimitWindowMs` | number | 1000 | Rate limit window |
| `idleTimeoutMs` | number | 300000 | Idle connection timeout |
| `stormProtection` | boolean | true | Enable storm protection |
| `stormThreshold` | number | 100 | Connections to trigger storm |
| `stormCooldownMs` | number | 10000 | Storm cooldown period |

### Rejection Reasons

| Reason | Description |
|--------|-------------|
| `max_connections_reached` | Global connection limit hit |
| `max_org_connections_reached` | Org connection limit hit |
| `max_agent_connections_reached` | Agent connection limit hit |
| `rate_limit_exceeded` | Global rate limit exceeded |
| `org_rate_limit_exceeded` | Org rate limit exceeded |
| `storm_protection_active` | Storm mode activated |
| `pool_shutting_down` | Pool is shutting down |

### Memory-Efficient Tracking

```typescript
// O(1) connection lookup by ID
private connections: Map<string, ConnectionInfo>;

// O(1) agent connection lookup
private agentConnections: Map<string, Set<string>>;

// O(1) org connection lookup
private orgConnections: Map<string, Set<string>>;
```

### Storm Protection

When connection attempts spike:

1. Track recent connection timestamps
2. If count >= threshold within window, activate storm mode
3. Reject all new connections during storm
4. Emit `storm:detected` event
5. After cooldown period, clear storm mode
6. Emit `storm:cleared` event

### Events Emitted

```typescript
// Connection events
pool.on('connection:added', (info: ConnectionInfo) => {});
pool.on('connection:removed', (connectionId, agentId, reason) => {});
pool.on('connection:rejected', (agentId, orgId, reason) => {});

// Limit warnings (at 80% capacity)
pool.on('limit:approaching', (type, current, max, orgId?) => {});

// Storm events
pool.on('storm:detected', (connectionsInWindow) => {});
pool.on('storm:cleared', () => {});

// Stats updates
pool.on('stats:updated', (stats) => {});
```

### Query Methods

```typescript
// Connection info
pool.getConnection(connectionId): ConnectionInfo | null
pool.getAgentConnections(agentId): ConnectionInfo[]
pool.getOrgConnections(orgId): ConnectionInfo[]

// Counts
pool.getConnectionCount(): number
pool.getOrgConnectionCount(orgId): number
pool.getAgentConnectionCount(agentId): number

// Capacity checks
pool.isAtCapacity(): boolean
pool.isOrgAtCapacity(orgId): boolean

// Statistics
pool.getStats(): ConnectionPoolStats
```

### Bulk Operations

```typescript
// Disconnect all connections for an agent
pool.disconnectAgent(agentId, reason): number

// Disconnect all connections for an org
pool.disconnectOrg(orgId, reason): number

// Cleanup idle connections
pool.cleanupIdleConnections(): number

// Graceful shutdown
await pool.shutdown(gracePeriodMs)
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/ConnectionPool.ts` | Connection pool manager |
| `src/services/ConnectionPool.test.ts` | Unit tests (35 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Basic Connections | 7 |
| Global Limits | 3 |
| Per-Org Limits | 3 |
| Per-Agent Limits | 3 |
| Rate Limiting | 2 |
| Storm Protection | 3 |
| Queries | 5 |
| Disconnect Operations | 2 |
| Idle Cleanup | 2 |
| Limit Warnings | 2 |
| Shutdown | 2 |
| Clear | 1 |
| **Total** | **35** |

### Running Tests

```bash
npx vitest run src/services/ConnectionPool.test.ts
```

## Integration Example

```typescript
import { getConnectionPool } from './services/ConnectionPool.js';
import { getWebSocketHub } from './api/ws/index.js';

const pool = getConnectionPool();
const hub = getWebSocketHub();

// When WebSocket connects
hub.on('connection', (ws, req) => {
    const agentId = extractAgentId(req);
    const orgId = extractOrgId(req);

    const result = pool.requestConnection(agentId, orgId, {
        remoteAddress: req.socket.remoteAddress,
    });

    if (!result.allowed) {
        ws.close(4429, result.reason);
        return;
    }

    // Store connection ID for later
    ws.connectionId = result.connectionId;

    // Touch on activity
    ws.on('message', () => {
        pool.touchConnection(ws.connectionId);
    });
});

// When WebSocket disconnects
hub.on('close', (ws) => {
    pool.releaseConnection(ws.connectionId, 'ws_closed');
});

// Start idle cleanup
pool.startIdleCheck(60000); // Check every minute

// On shutdown
process.on('SIGTERM', async () => {
    await pool.shutdown(5000);
});
```

## Definition of Done
- [x] ConnectionPool service created
- [x] Global connection limits enforced
- [x] Per-org connection limits enforced
- [x] Per-agent connection limits enforced
- [x] Global rate limiting implemented
- [x] Per-org rate limiting implemented
- [x] Storm protection with cooldown
- [x] Memory-efficient Map-based tracking
- [x] Connection lifecycle events
- [x] Limit warning events at 80%
- [x] Idle connection cleanup
- [x] Graceful shutdown support
- [x] Comprehensive test suite (35 tests)
- [x] TypeScript compilation successful
