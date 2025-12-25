# Story 11.3: Automatic Tier Management

## Story Info
- **Epic**: 11 - Live Trust Scoring Engine
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR70 (Automatic Tier Promotion/Demotion)

## User Story

As the trust system,
I want automatic tier promotion/demotion,
So that agent capabilities reflect their trust level.

## Acceptance Criteria

### AC1: Score-Based Tier Assignment
**Given** an agent's trust score changes
**When** the score crosses a tier threshold
**Then** the agent's tier is updated automatically

### AC2: Capability Updates
**Given** an agent changes tiers
**When** the new tier is assigned
**Then** capabilities are updated to match the new tier

### AC3: Demotion Protection
**Given** a small score fluctuation
**When** approaching a demotion threshold
**Then** hysteresis prevents oscillation

### AC4: Event Emission
**Given** a tier change occurs
**When** the change is applied
**Then** promotion/demotion events are emitted

## Technical Implementation

### Tier Thresholds

| Tier | Score Range | Capabilities | Max Tasks |
|------|-------------|--------------|-----------|
| UNTRUSTED | 0-199 | None | 0 |
| PROBATIONARY | 200-399 | Execute | 1 |
| TRUSTED | 400-599 | Execute | 3 |
| VERIFIED | 600-799 | Execute, Delegate | 5 |
| CERTIFIED | 800-949 | Execute, Delegate, Spawn, Auto-approve Low | 10 |
| ELITE | 950-1000 | All capabilities | Unlimited |

### TierManager Service

`src/services/TierManager.ts` provides:

```typescript
const manager = new TierManager({
    allowDemotion: true,
    demotionGracePeriodMs: 0,
    hysteresisPoints: 10,
});

// Initialize agent
manager.initializeAgent('agent_1', 'org_1', 300);

// Update tier based on score
const change = manager.updateAgentTier('agent_1', 'org_1', 450);
// Returns: { previousTier: 'PROBATIONARY', newTier: 'TRUSTED', direction: 'promotion' }

// Check capabilities
manager.hasCapability('agent_1', 'delegate'); // false
manager.hasCapability('agent_1', 'execute');  // true
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowDemotion` | boolean | true | Whether tier demotion is enabled |
| `demotionGracePeriodMs` | number | 0 | Delay before demotion is applied |
| `hysteresisPoints` | number | 10 | Buffer points to prevent oscillation |

### Capabilities

| Capability | Description |
|------------|-------------|
| `execute` | Can execute assigned tasks |
| `delegate` | Can delegate tasks to other agents |
| `spawn` | Can spawn new agents |
| `unlimited_tasks` | No limit on concurrent tasks |
| `approve_low_risk` | Can auto-approve low-risk actions |
| `approve_medium_risk` | Can auto-approve medium-risk actions |

### Hysteresis Protection

When a score approaches a demotion threshold:
- Within hysteresis zone (threshold - hysteresisPoints): No demotion
- Below hysteresis zone: Demotion applied
- Warning event emitted when approaching threshold

### Grace Period

If `demotionGracePeriodMs > 0`:
1. Demotion is scheduled, not immediate
2. If score recovers before grace period, demotion is cancelled
3. After grace period, tier is recalculated and applied

### Events Emitted

```typescript
manager.on('tier:changed', (change: TierChange) => {});
manager.on('tier:promotion', (change: TierChange) => {});
manager.on('tier:demotion', (change: TierChange) => {});
manager.on('tier:warning', (agentId: string, message: string) => {});
```

### State Management API

```typescript
// Agent state
manager.initializeAgent(agentId, orgId, score): AgentTierState
manager.getAgentState(agentId): AgentTierState | null
manager.getAgentTier(agentId): TierLevel | null
manager.removeAgent(agentId): boolean

// Capabilities
manager.hasCapability(agentId, capability): boolean
manager.getMaxConcurrentTasks(agentId): number

// Tier definitions
manager.getTierForScore(score, orgId?): TierDefinition
manager.getTierDefinition(level, orgId?): TierDefinition | null
manager.getAllTiers(orgId?): TierDefinition[]
manager.setOrgTiers(orgId, tiers): void
```

### Bulk Operations

```typescript
manager.getAgentsInTier(tier, orgId?): AgentTierState[]
manager.getTierDistribution(orgId?): Record<TierLevel, number>
manager.getAgentsWithCapability(capability, orgId?): AgentTierState[]
```

### Statistics

```typescript
manager.getStats(orgId?): {
    totalAgents: number;
    distribution: Record<TierLevel, number>;
    averageScore: number;
    pendingDemotions: number;
}
```

### Organization-Specific Tiers

```typescript
// Custom tier thresholds for an org
manager.setOrgTiers('org_1', [
    { level: 'UNTRUSTED', minScore: 0, maxScore: 299, ... },
    { level: 'PROBATIONARY', minScore: 300, maxScore: 599, ... },
    { level: 'TRUSTED', minScore: 600, maxScore: 1000, ... },
]);
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/TierManager.ts` | Tier management service |
| `src/services/TierManager.test.ts` | Unit tests (43 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Tier Calculation | 8 |
| Tier Updates | 6 |
| Hysteresis | 3 |
| Demotion Grace Period | 2 |
| Demotion Control | 1 |
| Agent State | 6 |
| Capabilities | 4 |
| Tier Definitions | 3 |
| Bulk Operations | 4 |
| Statistics | 2 |
| Default Tiers | 3 |
| Lifecycle | 1 |
| **Total** | **43** |

### Running Tests

```bash
npx vitest run src/services/TierManager.test.ts
```

## Integration Example

```typescript
import { getTrustScoreCalculator } from './TrustScoreCalculator.js';
import { getTierManager } from './TierManager.js';

const calculator = getTrustScoreCalculator();
const tierManager = getTierManager();

// Listen for score changes and update tiers
calculator.on('score:changed', (change) => {
    const tierChange = tierManager.updateAgentTier(
        change.agentId,
        getAgentOrg(change.agentId),
        change.newScore
    );

    if (tierChange) {
        console.log(`Agent ${change.agentId}: ${tierChange.direction} to ${tierChange.newTier}`);
    }
});

// Check permissions before allowing actions
function canDelegate(agentId: string): boolean {
    return tierManager.hasCapability(agentId, 'delegate');
}

function canSpawn(agentId: string): boolean {
    return tierManager.hasCapability(agentId, 'spawn');
}
```

## Definition of Done
- [x] TierManager service created
- [x] 6 tier levels with score thresholds
- [x] Automatic tier promotion on score increase
- [x] Automatic tier demotion on score decrease
- [x] Hysteresis to prevent tier oscillation
- [x] Optional demotion grace period
- [x] Capability-based permission checking
- [x] Max concurrent tasks per tier
- [x] Organization-specific tier configuration
- [x] Tier distribution statistics
- [x] Event emission for all tier changes
- [x] Comprehensive test suite (43 tests)
- [x] TypeScript compilation successful
