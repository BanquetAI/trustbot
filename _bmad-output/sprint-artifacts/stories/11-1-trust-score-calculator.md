# Story 11.1: Trust Score Calculator

## Story Info
- **Epic**: 11 - Live Trust Scoring Engine
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR68 (Real-time Trust Calculation), FR69 (Rolling History with Decay)

## User Story

As the trust system,
I want to calculate trust scores based on agent behavior,
So that trust reflects actual agent performance.

## Acceptance Criteria

### AC1: Event-Based Scoring
**Given** an agent performs an action
**When** the action is recorded
**Then** the trust score is updated based on event type

### AC2: Time-Based Decay
**Given** a trust event occurred in the past
**When** calculating current score
**Then** the event's contribution decays over its configured period

### AC3: Score Bounds
**Given** many positive or negative events
**When** calculating the score
**Then** the score remains within min/max bounds (0-1000)

### AC4: Organization Configuration
**Given** an organization has custom scoring rules
**When** calculating scores for their agents
**Then** the org-specific configuration is applied

## Technical Implementation

### TrustScoreCalculator Service

`src/services/TrustScoreCalculator.ts` provides:

```typescript
const calculator = new TrustScoreCalculator({
    baseScore: 300,
    minScore: 0,
    maxScore: 1000,
    decayFunction: 'linear', // or 'exponential'
});

// Initialize agent
calculator.initializeAgent('agent_1', 'org_1');

// Record events
calculator.recordEvent('agent_1', 'org_1', 'task_completed', {
    reason: 'Task finished successfully',
});

// Get current score
const score = calculator.getScore('agent_1'); // 310
```

### Scoring Events

| Event Type | Points | Decay Period |
|------------|--------|--------------|
| `task_completed` | +10 | 30 days |
| `task_reviewed_positive` | +5 | 30 days |
| `task_reviewed_negative` | -5 | 30 days |
| `task_failed` | -15 | 14 days |
| `task_timeout` | -10 | 14 days |
| `invalid_delegation` | -20 | 7 days |
| `security_violation` | -50 | 60 days |
| `manual_adjustment` | custom | 30 days |

### Decay Functions

**Linear Decay:**
```
contribution = points × (1 - ageDays / decayDays)
```

**Exponential Decay:**
```
k = -ln(0.05) / decayDays
contribution = points × e^(-k × ageDays)
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseScore` | number | 300 | Starting score for new agents |
| `minScore` | number | 0 | Minimum allowed score |
| `maxScore` | number | 1000 | Maximum allowed score |
| `decayFunction` | string | 'linear' | Decay type (linear/exponential) |
| `events` | object | DEFAULT_EVENT_CONFIG | Event type configurations |

### Events Emitted

```typescript
calculator.on('event:recorded', (event: TrustEvent) => {});
calculator.on('score:changed', (change: ScoreChange) => {});
calculator.on('score:recalculated', (agentId: string, score: number) => {});
```

### Score Retrieval API

```typescript
// Basic score queries
calculator.getScore(agentId): number | null
calculator.getFreshScore(agentId, maxAgeMs): number | null
calculator.getAgentState(agentId): AgentTrustState | null
calculator.getOrgScores(orgId): Map<string, number>

// Event queries
calculator.getRecentEvents(agentId, limit): TrustEvent[]
calculator.getEventsByType(agentId, eventType): TrustEvent[]
calculator.getEventCounts(agentId): Record<TrustEventType, number>

// Analysis
calculator.getScoreBreakdown(agentId): Record<TrustEventType, {...}>
calculator.getScoreTrend(agentId, days): { date: Date; score: number }[]
```

### Organization Configuration

```typescript
// Set org-specific scoring rules
calculator.setOrgConfig('org_1', {
    baseScore: 500,
    events: {
        task_completed: { points: 20, decayDays: 30 },
        security_violation: { points: -100, decayDays: 90 },
    },
});

// Get merged config
calculator.getOrgConfig('org_1'): ScoringConfig
calculator.getEventConfig('org_1', 'task_completed'): TrustEventConfig
```

### Bulk Operations

```typescript
// Find agents by score
calculator.getAgentsBelowThreshold(300, orgId?): AgentTrustState[]
calculator.getTopAgents(10, orgId?): AgentTrustState[]

// Maintenance
calculator.recalculateScore(agentId): number
calculator.recalculateAllScores(): Map<string, number>
```

### Statistics

```typescript
calculator.getStats(orgId?): {
    totalAgents: number;
    averageScore: number;
    minScore: number;
    maxScore: number;
    totalEvents: number;
}
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/TrustScoreCalculator.ts` | Trust score calculation service |
| `src/services/TrustScoreCalculator.test.ts` | Unit tests (42 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Event Recording | 6 |
| Score Calculation | 5 |
| Exponential Decay | 1 |
| Score Retrieval | 7 |
| Score Analysis | 2 |
| Organization Config | 4 |
| Agent Management | 5 |
| Bulk Operations | 4 |
| Statistics | 2 |
| Default Config | 4 |
| Lifecycle | 1 |
| **Total** | **42** |

### Running Tests

```bash
npx vitest run src/services/TrustScoreCalculator.test.ts
```

## Definition of Done
- [x] TrustScoreCalculator service created
- [x] Event-based scoring with configurable points
- [x] Linear and exponential decay functions
- [x] 30-day rolling history (configurable per event type)
- [x] Score bounds enforcement (min/max)
- [x] Organization-specific configuration
- [x] Score analysis (breakdown, trend)
- [x] Event emission for score changes
- [x] Bulk operations for maintenance
- [x] Statistics aggregation
- [x] Comprehensive test suite (42 tests)
- [x] TypeScript compilation successful
