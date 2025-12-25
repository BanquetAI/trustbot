# Story 10.7: Graceful Disconnection Handling

## Story Info
- **Epic**: 10 - Agent Connection Layer
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR67 (Graceful Disconnection)

## User Story

As a supervisor,
I want graceful handling of agent disconnections,
So that in-progress tasks are managed properly.

## Acceptance Criteria

### AC1: Task Status Update
**Given** an agent disconnects unexpectedly
**When** the disconnection is detected
**Then** in-progress tasks are marked as "agent_disconnected"

### AC2: Automatic Reassignment Option
**Given** orphaned tasks exist after disconnection
**When** the reconnection window expires
**Then** tasks can be automatically reassigned to available agents

### AC3: Disconnection Logging
**Given** an agent disconnects
**When** the disconnection event occurs
**Then** the reason is logged and tracked in history

### AC4: Reconnection Resume
**Given** an agent reconnects within the window
**When** they have orphaned tasks
**Then** task state is resumed automatically

## Technical Implementation

### DisconnectionHandler Service

`src/services/DisconnectionHandler.ts` provides:

```typescript
const handler = new DisconnectionHandler({
    reconnectionWindowMs: 300000,   // 5 min window
    autoReassign: true,             // Auto-reassign after window
    maxPreservedTasks: 100,         // Max tasks per agent
    cleanupIntervalMs: 60000,       // Cleanup every minute
    stateRetentionMs: 3600000,      // 1 hour retention
});

// Register task for tracking
handler.registerTask({
    taskId: 'task_123',
    agentId: 'agent_1',
    orgId: 'org_1',
    type: 'execute',
    status: 'in_progress',
    progress: 50,
    createdAt: new Date(),
});

// Handle disconnection
const event = handler.handleDisconnection(
    'agent_1',
    'org_1',
    'conn_123',
    'network_error'
);
// Returns: { agentId, affectedTasks, wasGraceful, ... }

// Handle reconnection
const reconnectEvent = handler.handleReconnection(
    'agent_1',
    'org_1',
    'conn_456'
);
// Returns: { resumableTasks, previousDisconnection, ... }
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `reconnectionWindowMs` | number | 300000 | Time window for task resumption |
| `autoReassign` | boolean | true | Auto-reassign after window expires |
| `maxPreservedTasks` | number | 100 | Maximum tasks per agent |
| `cleanupIntervalMs` | number | 60000 | State cleanup interval |
| `stateRetentionMs` | number | 3600000 | How long to retain disconnected state |

### Task States

| State | Description |
|-------|-------------|
| `pending` | Task registered but not started |
| `assigned` | Task assigned to agent |
| `in_progress` | Task actively being worked on |
| `completed` | Task completed successfully |
| `failed` | Task failed |
| `agent_disconnected` | Agent disconnected during execution |
| `reassigned` | Task moved to different agent |
| `cancelled` | Task cancelled |

### Disconnection Reasons

| Reason | Description |
|--------|-------------|
| `client_close` | Client initiated graceful close |
| `server_close` | Server initiated graceful close |
| `network_error` | Network connectivity issue |
| `timeout` | Connection timeout |
| `idle_timeout` | Idle connection timeout |
| `auth_failure` | Authentication failure |
| `kicked` | Forcibly disconnected |
| `pool_shutdown` | Connection pool shutting down |
| `unknown` | Unknown reason |

### Events Emitted

```typescript
// Disconnection events
handler.on('agent:disconnected', (event: DisconnectionEvent) => {});
handler.on('agent:reconnected', (event: ReconnectionEvent) => {});

// Task events
handler.on('task:orphaned', (task: TaskInfo) => {});
handler.on('task:resumed', (task: TaskInfo, agentId: string) => {});
handler.on('task:reassigned', (reassignment: TaskReassignment) => {});
handler.on('task:expired', (task: TaskInfo) => {});

// Cleanup events
handler.on('state:cleaned', (agentId: string, tasksRemoved: number) => {});
```

### Task Management API

```typescript
// Register and update tasks
handler.registerTask(task: TaskInfo): void
handler.updateTaskStatus(taskId, status, progress?): boolean
handler.completeTask(taskId): boolean
handler.failTask(taskId): boolean
handler.removeTask(taskId): boolean

// Query tasks
handler.getTask(taskId): TaskInfo | null
handler.getAgentTasks(agentId): TaskInfo[]
handler.getInProgressTasks(agentId): TaskInfo[]
handler.getOrphanedTasks(orgId?): TaskInfo[]
```

### Reassignment API

```typescript
// Manual reassignment
handler.reassignTask(taskId, toAgentId, reason): TaskReassignment | null

// Bulk reassignment
handler.reassignOrphanedTasks(fromAgentId, toAgentId, reason): TaskReassignment[]

// Find available agents
handler.getAvailableAgents(orgId, excludeAgentId?): string[]
```

### Agent State API

```typescript
// Query agent state
handler.getAgentState(agentId): AgentState | null
handler.isAgentConnected(agentId): boolean
handler.getDisconnectionHistory(agentId): DisconnectionEvent[]

// Mark agent connected
handler.markAgentConnected(agentId, orgId): void
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/DisconnectionHandler.ts` | Disconnection handler service |
| `src/services/DisconnectionHandler.test.ts` | Unit tests (35 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Task Management | 8 |
| Disconnection Handling | 8 |
| Reconnection Handling | 6 |
| Task Reassignment | 5 |
| Orphaned Tasks | 2 |
| Cleanup | 3 |
| Statistics | 1 |
| Lifecycle | 2 |
| **Total** | **35** |

### Running Tests

```bash
npx vitest run src/services/DisconnectionHandler.test.ts
```

## Integration Example

```typescript
import { getDisconnectionHandler } from './services/DisconnectionHandler.js';
import { getWebSocketHub } from './api/ws/index.js';
import { getConnectionPool } from './services/ConnectionPool.js';

const handler = getDisconnectionHandler();
const hub = getWebSocketHub();
const pool = getConnectionPool();

// Register task when assigned
hub.on('task:assign', (agentId, task) => {
    handler.registerTask({
        taskId: task.id,
        agentId,
        orgId: task.orgId,
        type: task.type,
        status: 'assigned',
        progress: 0,
        createdAt: new Date(),
    });
});

// Handle WebSocket disconnection
hub.on('disconnect', (ws, reason) => {
    const { agentId, orgId, connectionId } = ws;

    handler.handleDisconnection(agentId, orgId, connectionId, reason);
    pool.releaseConnection(connectionId, reason);
});

// Handle WebSocket reconnection
hub.on('connect', (ws) => {
    const { agentId, orgId, connectionId } = ws;

    const event = handler.handleReconnection(agentId, orgId, connectionId);

    // Notify agent of resumed tasks
    if (event.resumableTasks.length > 0) {
        ws.send(JSON.stringify({
            type: 'tasks:resumed',
            taskIds: event.resumableTasks,
        }));
    }
});

// Handle expired tasks (auto-reassignment)
handler.on('task:expired', async (task) => {
    const available = handler.getAvailableAgents(task.orgId, task.agentId);

    if (available.length > 0) {
        // Simple round-robin selection
        const newAgent = available[0];
        handler.reassignTask(task.taskId, newAgent, 'auto_reassign');

        // Notify new agent
        hub.sendToAgent(newAgent, {
            type: 'task:assigned',
            task: task,
        });
    }
});

// Start cleanup
handler.startCleanup();

// On shutdown
process.on('SIGTERM', async () => {
    await handler.shutdown(5000);
});
```

## Definition of Done
- [x] DisconnectionHandler service created
- [x] Task registration and tracking
- [x] In-progress tasks marked as "agent_disconnected"
- [x] Disconnection reason logging
- [x] Reconnection window with configurable timeout
- [x] Task state resume on reconnection
- [x] Automatic task reassignment support
- [x] Bulk orphan task reassignment
- [x] Agent state management
- [x] Disconnection history tracking
- [x] State cleanup for stale data
- [x] Event emission for all state changes
- [x] Comprehensive test suite (35 tests)
- [x] TypeScript compilation successful
