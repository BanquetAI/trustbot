# Story 10.5: Agent SDK (TypeScript)

## Story Info
- **Epic**: 10 - Agent Connection Layer
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR65 (Agent SDK)

## User Story

As an agent developer,
I want an SDK to easily connect my agent,
So that I don't have to implement WebSocket logic myself.

## Acceptance Criteria

### AC1: NPM Package
**Given** the SDK is published
**When** a developer installs @trustbot/agent-sdk
**Then** they have access to the TrustBotAgent class

### AC2: Auto-reconnection
**Given** a connected agent loses connection
**When** the connection drops
**Then** the SDK automatically reconnects with exponential backoff

### AC3: Type-safe Messages
**Given** the SDK is used with TypeScript
**When** sending or receiving messages
**Then** all messages are fully typed

### AC4: Event Emitter Pattern
**Given** an agent using the SDK
**When** events occur (tasks, decisions, etc.)
**Then** the agent can listen via event handlers

### AC5: Example Implementation
**Given** a developer wants to use the SDK
**When** they look at examples
**Then** they have working code to reference

## Technical Implementation

### SDK Package Structure

```
packages/agent-sdk/
├── src/
│   ├── index.ts           # Main exports
│   ├── types.ts           # Type definitions
│   ├── TrustBotAgent.ts   # Main agent class
│   └── TrustBotAgent.test.ts
├── examples/
│   ├── basic-agent.ts     # Simple task handler
│   └── action-request-agent.ts  # Action approval
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Quick Start

```typescript
import { TrustBotAgent } from '@trustbot/agent-sdk';

const agent = new TrustBotAgent({
    apiKey: process.env.TRUSTBOT_API_KEY,
    capabilities: ['execute', 'external'],
    skills: ['web-dev', 'api-integration'],
});

agent.on('task:assigned', async (task) => {
    await agent.updateStatus('WORKING', 0);
    // ... process task ...
    await agent.completeTask(task.id, result);
});

await agent.connect();
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | required | API key for authentication |
| `capabilities` | string[] | `['execute']` | Agent capabilities |
| `skills` | string[] | `[]` | Agent skills |
| `serverUrl` | string | `wss://api.trustbot.ai/ws` | WebSocket server URL |
| `autoReconnect` | boolean | `true` | Enable auto-reconnection |
| `maxReconnectAttempts` | number | `10` | Max reconnection attempts |
| `reconnectBaseDelay` | number | `1000` | Base delay in ms |
| `reconnectMaxDelay` | number | `30000` | Max delay in ms |
| `heartbeatInterval` | number | `30000` | Heartbeat interval in ms |
| `connectionTimeout` | number | `10000` | Connection timeout in ms |
| `metadata` | object | `{}` | Custom agent metadata |

### Event Types

```typescript
// Connection events
agent.on('connected', () => {});
agent.on('disconnected', (reason: string) => {});
agent.on('reconnecting', (attempt: number, max: number) => {});
agent.on('reconnected', () => {});
agent.on('error', (error: Error) => {});

// Task events
agent.on('task:assigned', (task: Task) => {});
agent.on('task:completed', (result: TaskResult) => {});

// Decision events
agent.on('decision:required', (request: ActionRequest) => {});
agent.on('decision:result', (decision: ActionDecision) => {});

// Config events
agent.on('config:updated', (config: AgentConfig) => {});

// Status events
agent.on('status:changed', (old: AgentStatus, new: AgentStatus) => {});
```

### API Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to Mission Control |
| `disconnect()` | Disconnect from Mission Control |
| `updateStatus(status, progress?, message?)` | Update agent status |
| `reportProgress(taskId, progress, message?)` | Report task progress |
| `completeTask(taskId, result)` | Complete a task successfully |
| `failTask(taskId, error)` | Fail a task |
| `requestAction(request)` | Request action approval |
| `isConnected()` | Check connection status |
| `getConnectionState()` | Get connection state |
| `getAgentId()` | Get agent ID |
| `getStructuredId()` | Get structured agent ID |
| `getStatus()` | Get current status |

### Message Types

**Inbound (server → agent):**
- `task:assigned` - New task assignment
- `decision:required` - Decision needed
- `decision:result` - Decision made
- `config:updated` - Configuration changed
- `ping` - Health check
- `ack` - Message acknowledgment
- `error` - Error notification

**Outbound (agent → server):**
- `status:update` - Status change
- `action:request` - Request action approval
- `task:completed` - Task completion
- `task:progress` - Progress update
- `heartbeat` - Health heartbeat
- `pong` - Ping response
- `register` - Agent registration

### Auto-reconnection

The SDK implements exponential backoff with jitter:

```
delay = min(baseDelay * 2^attempt + random(0, 1000), maxDelay)
```

Default values:
- Base delay: 1 second
- Max delay: 30 seconds
- Max attempts: 10

### Files Created

| File | Purpose |
|------|---------|
| `packages/agent-sdk/package.json` | NPM package configuration |
| `packages/agent-sdk/tsconfig.json` | TypeScript configuration |
| `packages/agent-sdk/vitest.config.ts` | Test configuration |
| `packages/agent-sdk/README.md` | SDK documentation |
| `packages/agent-sdk/src/index.ts` | Main exports |
| `packages/agent-sdk/src/types.ts` | Type definitions |
| `packages/agent-sdk/src/TrustBotAgent.ts` | Main agent class |
| `packages/agent-sdk/src/TrustBotAgent.test.ts` | Unit tests |
| `packages/agent-sdk/examples/basic-agent.ts` | Basic example |
| `packages/agent-sdk/examples/action-request-agent.ts` | Advanced example |

### Test Coverage

| Category | Tests |
|----------|-------|
| Configuration | 3 |
| Connection State | 2 |
| Status | 2 |
| Event Emitter | 6 |
| Task Events | 2 |
| Decision Events | 2 |
| Config Events | 1 |
| Message Events | 2 |
| Disconnect | 2 |
| Type Safety | 2 |
| **Total** | **24** |

### Running Tests

```bash
cd packages/agent-sdk
npm test
```

### Building the SDK

```bash
cd packages/agent-sdk
npm run build
```

## Definition of Done
- [x] SDK package structure created
- [x] TrustBotAgent class with WebSocket connection
- [x] Auto-reconnection with exponential backoff
- [x] Type-safe message interfaces
- [x] Event emitter pattern for all events
- [x] Basic example agent
- [x] Action request example agent
- [x] Comprehensive README
- [x] Unit tests (24 tests passing)
- [x] TypeScript compilation successful
