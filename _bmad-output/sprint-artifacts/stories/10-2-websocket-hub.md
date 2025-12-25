# Story 10.2: WebSocket Hub

## Story Info
- **Epic**: 10 - Agent Connection Layer
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR62 (WebSocket Communication)

## User Story

As an agent,
I want persistent WebSocket connection to Mission Control,
So that I receive real-time commands and send updates.

## Acceptance Criteria

### AC1: WebSocket Endpoint
**Given** a configured server
**When** agents connect to /ws
**Then** WebSocket connections are established

### AC2: Authentication
**Given** an agent connecting via WebSocket
**When** API key is provided in connection header
**Then** the connection is authenticated

### AC3: Ping/Pong Health
**Given** an established connection
**When** the server pings
**Then** the agent responds with pong

### AC4: Reconnection
**Given** a disconnected client
**When** connection is lost
**Then** reconnection with exponential backoff occurs

## Technical Implementation

### WebSocket Hub

`src/api/ws/WebSocketHub.ts` provides:

```typescript
const hub = new WebSocketHub({
    path: '/ws',
    pingInterval: 30000,      // 30 second ping
    pongTimeout: 10000,       // 10 second pong timeout
    authTimeout: 5000,        // 5 second auth timeout
    maxConnections: 1000,
    maxConnectionsPerAgent: 5,
});

// Attach to HTTP server
hub.attach(httpServer);

// Or standalone
hub.listen(3003);
```

### Authentication Methods

```typescript
// Header: Authorization: Bearer <api_key>
// Query: ?apiKey=<api_key>
// Custom Header: X-API-Key: <api_key>
```

### Message Types

**Inbound (Server → Agent):**
| Type | Payload | Description |
|------|---------|-------------|
| `task:assigned` | TaskPayload | New task assignment |
| `decision:required` | DecisionPayload | Decision request |
| `config:updated` | ConfigPayload | Configuration update |
| `pong` | `{ timestamp }` | Response to ping |
| `connected` | `{ connectionId, agentId }` | Connection confirmed |
| `disconnecting` | `{ reason }` | Server disconnecting |
| `error` | `{ code, message }` | Error notification |

**Outbound (Agent → Server):**
| Type | Payload | Description |
|------|---------|-------------|
| `status:update` | StatusUpdatePayload | Agent status change |
| `heartbeat` | HeartbeatPayload | Health check |
| `action:request` | ActionRequestPayload | Action approval request |
| `task:completed` | TaskCompletedPayload | Task completion |
| `ping` | - | Keep-alive ping |

### Message Structure

```typescript
interface WebSocketMessage<T> {
    type: MessageType;
    payload: T;
    timestamp: number;
    messageId: string;
    correlationId?: string;
}
```

### WebSocket Client (for Agents)

```typescript
import { WebSocketClient } from './WebSocketClient.js';

const client = new WebSocketClient({
    url: 'wss://api.trustbot.ai/ws',
    apiKey: 'tb_abc123...',
    reconnect: true,
    reconnectMaxRetries: 10,
    reconnectBaseDelay: 1000,
    reconnectMaxDelay: 30000,
    heartbeatInterval: 30000,
});

await client.connect();

// Listen for messages
client.on('task:assigned', (task) => {
    console.log('New task:', task);
});

// Send status updates
client.sendStatusUpdate({
    status: 'busy',
    progress: 50,
    currentTask: 'task_123',
});
```

### Exponential Backoff

```
Attempt 1: 1s + jitter
Attempt 2: 2s + jitter
Attempt 3: 4s + jitter
Attempt 4: 8s + jitter
...
Max: 30s
```

### Files Created

| File | Purpose |
|------|---------|
| `src/api/ws/types.ts` | TypeScript types for messages |
| `src/api/ws/WebSocketHub.ts` | Server-side WebSocket hub |
| `src/api/ws/WebSocketClient.ts` | Client with reconnection |
| `src/api/ws/handlers/index.ts` | Message handlers |
| `src/api/ws/index.ts` | Module exports |
| `src/api/ws/WebSocketHub.test.ts` | Unit tests (28 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Configuration | 2 |
| Connection Management | 4 |
| Message Sending | 5 |
| Event Emission | 5 |
| Shutdown | 2 |
| Disconnect Agent | 2 |
| TaskPayload | 2 |
| DecisionPayload | 2 |
| ConfigPayload | 1 |
| StatusUpdatePayload | 3 |
| **Total** | **28** |

### Running Tests

```bash
npx vitest run src/api/ws/WebSocketHub.test.ts
```

## Integration Example

```typescript
import { createServer } from 'http';
import { Hono } from 'hono';
import { getWebSocketHub, registerHandlers } from './api/ws/index.js';

const app = new Hono();
const server = createServer(app.fetch);

// Set up WebSocket hub
const hub = getWebSocketHub();
registerHandlers(hub);
hub.attach(server);

// Send task to agent
hub.assignTask('agent_123', {
    id: 'task_1',
    description: 'Process data batch',
    priority: 'high',
    requiredTier: 2,
});

server.listen(3002);
```

## Definition of Done
- [x] WebSocket Hub created with /ws endpoint
- [x] API key authentication (header, query, custom header)
- [x] Ping/pong health checks (30s interval)
- [x] Message type definitions
- [x] Message handlers for all types
- [x] WebSocket client with reconnection
- [x] Exponential backoff (1s-30s with jitter)
- [x] Message queuing during disconnection
- [x] Connection statistics tracking
- [x] Comprehensive test suite (28 tests)
- [x] TypeScript compilation successful
