# Story 1.2: Zustand Store & Real-Time Connection

## Story Info
- **Epic**: 1 - Mission Control Core & Agent Visibility
- **Status**: done
- **Completed**: 2025-12-23
- **FRs Covered**: FR55

## User Story

As an operator,
I want my dashboard to stay synchronized with server state,
So that I see real-time updates without manual refresh.

## Acceptance Criteria

### AC1: Real-Time Updates
**Given** an operator viewing the Mission Control dashboard
**When** an agent's status changes on the server
**Then** the change is reflected in the UI within 2 seconds
**And** no page refresh is required

### AC2: Connection Loss Indicator
**Given** the real-time connection is lost
**When** the operator continues viewing the dashboard
**Then** a "Last sync: Xs ago" indicator appears in the header
**And** the system attempts to reconnect with exponential backoff

### AC3: Connection Recovery
**Given** the connection is restored after a drop
**When** reconnection succeeds
**Then** the sync indicator disappears
**And** the dashboard refreshes with current data

## Technical Implementation

### Files to Create
- `web/src/stores/missionControlStore.ts` - Zustand store for Mission Control state
- `web/src/hooks/useRealtimeConnection.ts` - Real-time connection hook

### Files to Modify
- `web/src/App.tsx` - Add store provider and connection hook

### Implementation Notes

#### Zustand Store Structure
```typescript
interface MissionControlState {
  agents: Agent[];
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastSync: Date | null;

  // Actions
  setAgents: (agents: Agent[]) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}
```

#### Real-Time Hook
1. Subscribe to `org:{orgId}` Supabase channel
2. Handle `agent:status_changed` events
3. Implement exponential backoff: 1s, 2s, 4s, 8s, max 30s
4. Track last successful sync timestamp

#### Connection Recovery
- On reconnect, fetch full state to reconcile
- Update `lastSync` on successful data fetch
- Clear sync indicator when connected

### Dependencies
- Zustand (add to package.json if not present)
- Supabase Realtime client (existing)

## Definition of Done
- [x] Zustand store created with typed state
- [x] useRealtimeConnection hook implemented
- [x] Connection status indicator in UI
- [x] Exponential backoff reconnection
- [x] State reconciliation on reconnect
- [x] Unit tests for store actions (21 tests passing)
- [x] Integration test for real-time updates

## Deliverables
- `web/src/stores/missionControlStore.ts` - Zustand store with agents, decisions, connection state
- `web/src/stores/missionControlStore.test.ts` - 21 unit tests
- `web/src/hooks/useRealtimeConnection.ts` - Real-time hook with exponential backoff
- `web/src/components/ConnectionStatusIndicator.tsx` - UI component for connection status
