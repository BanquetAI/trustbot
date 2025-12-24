# Story 1.3: Agent Overview Module - List View

## Story Info
- **Epic**: 1 - Mission Control Core & Agent Visibility
- **Status**: done
- **Completed**: 2025-12-23
- **FRs Covered**: FR1, FR4, FR5

## User Story

As an operator,
I want to see all agents in my organization with their current status,
So that I can monitor fleet health at a glance.

## Acceptance Criteria

### AC1: Agent List Display
**Given** an operator is authenticated
**When** they view the Mission Control dashboard
**Then** the Agent Overview Module displays all agents for their organization
**And** each agent shows: name, ID (HH-OO-RR-II format), status, trust score

### AC2: Status Indicators
**Given** agents have different statuses
**When** viewing the agent list
**Then** status indicators are color-coded (active=green, pending=yellow, idle=gray, error=red)
**And** status icons are accessible with ARIA labels

### AC3: Scrollable List Performance
**Given** the organization has more than 20 agents
**When** viewing the agent list
**Then** agents are displayed in a scrollable container
**And** the initial load completes within 2 seconds

## Technical Implementation

### Files to Create
- `web/src/components/mission-control/modules/AgentOverviewModule.tsx` - Main module component
- `web/src/components/mission-control/modules/AgentOverviewModule.test.tsx` - Tests

### API Endpoint to Create
- `GET /api/v1/mission-control/agents` - List agents for organization

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Add agents endpoint

### Implementation Notes

#### Component Structure (Compound Pattern)
```typescript
<AgentOverviewModule>
  <AgentOverviewModule.Header title="Agent Fleet" count={agents.length} />
  <AgentOverviewModule.List>
    {agents.map(agent => (
      <AgentOverviewModule.Item key={agent.id} agent={agent} />
    ))}
  </AgentOverviewModule.List>
  <AgentOverviewModule.Footer />
</AgentOverviewModule>
```

#### Agent ID Format (HH-OO-RR-II)
- HH: Hierarchy level (00-99)
- OO: Organization code
- RR: Role code
- II: Instance number

#### Status Colors
```typescript
const STATUS_COLORS = {
  active: 'var(--color-success)',    // green
  pending: 'var(--color-warning)',   // yellow
  idle: 'var(--color-muted)',        // gray
  error: 'var(--color-error)',       // red
};
```

#### Accessibility
- Each status icon needs `aria-label` describing the status
- List should be announced as a list to screen readers
- Focus management for keyboard navigation

### Dependencies
- Story 1.1 (RBAC middleware for API)
- Story 1.2 (Zustand store for state)

## Definition of Done
- [x] AgentOverviewModule component with compound pattern
- [x] GET /api/v1/mission-control/agents endpoint
- [x] Color-coded status indicators
- [x] ARIA labels for accessibility
- [x] Scrollable container for large lists
- [x] Performance: < 2s initial load
- [x] Unit tests for component
- [x] Integration tests for API
