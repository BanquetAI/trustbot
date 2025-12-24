# Story 1.4: Agent Trust Score Display with Tier Badges

## Story Info
- **Epic**: 1 - Mission Control Core & Agent Visibility
- **Status**: done
- **Completed**: 2025-12-23
- **FRs Covered**: FR3, FR6

## User Story

As an operator,
I want to see agent trust scores with visual tier indicators,
So that I can quickly identify agent authority levels.

## Acceptance Criteria

### AC1: Trust Score Display
**Given** an agent is displayed in the Agent Overview Module
**When** viewing their trust information
**Then** the numeric trust score is shown (300-1000)
**And** a tier badge is displayed (T0-T5 with tier name)

### AC2: Tier Badge Colors
**Given** different trust score ranges
**When** displaying tier badges
**Then** T5 (900-1000) shows "SOVEREIGN" with gold badge
**And** T4 (700-899) shows "EXECUTIVE" with silver badge
**And** T3 (500-699) shows "TACTICAL" with blue badge
**And** T2 (300-499) shows "OPERATIONAL" with green badge
**And** T1 (100-299) shows "WORKER" with gray badge
**And** T0 (0-99) shows "PASSIVE" with muted badge

### AC3: Trend Indicator
**Given** an agent's trust score trend
**When** displaying the score
**Then** an arrow indicator shows trend direction (rising/stable/falling)
**And** trend is calculated from 7-day history

## Technical Implementation

### Files to Create
- `web/src/components/mission-control/shared/TrustBadge.tsx` - Trust tier badge component
- `web/src/components/mission-control/shared/TrendIndicator.tsx` - Trend arrow component
- `web/src/components/mission-control/shared/TrustBadge.test.tsx` - Tests
- `web/src/components/mission-control/shared/TrendIndicator.test.tsx` - Tests

### Files to Modify
- `web/src/components/mission-control/modules/AgentOverviewModule.tsx` - Use trust components

### Implementation Notes

#### Tier Calculation
```typescript
interface TierInfo {
  tier: 0 | 1 | 2 | 3 | 4 | 5;
  name: string;
  color: string;
  minScore: number;
  maxScore: number;
}

const TIERS: TierInfo[] = [
  { tier: 5, name: 'SOVEREIGN', color: 'gold', minScore: 900, maxScore: 1000 },
  { tier: 4, name: 'EXECUTIVE', color: 'silver', minScore: 700, maxScore: 899 },
  { tier: 3, name: 'TACTICAL', color: 'blue', minScore: 500, maxScore: 699 },
  { tier: 2, name: 'OPERATIONAL', color: 'green', minScore: 300, maxScore: 499 },
  { tier: 1, name: 'WORKER', color: 'gray', minScore: 100, maxScore: 299 },
  { tier: 0, name: 'PASSIVE', color: 'muted', minScore: 0, maxScore: 99 },
];

function getTierFromScore(score: number): TierInfo {
  return TIERS.find(t => score >= t.minScore && score <= t.maxScore) ?? TIERS[5];
}
```

#### Trend Calculation
```typescript
type TrendDirection = 'rising' | 'stable' | 'falling';

interface TrendData {
  direction: TrendDirection;
  percentChange: number;
}

// Calculate from 7-day history
// Rising: > 5% increase
// Falling: > 5% decrease
// Stable: within 5%
```

#### TrustBadge Component Props
```typescript
interface TrustBadgeProps {
  score: number;
  showScore?: boolean;    // default: true
  showTierName?: boolean; // default: true
  size?: 'sm' | 'md' | 'lg';
}
```

#### TrendIndicator Component Props
```typescript
interface TrendIndicatorProps {
  trend: TrendDirection;
  percentChange?: number;
  showPercentage?: boolean;
}
```

### Dependencies
- Existing TrustEngine for score calculation

## Definition of Done
- [x] TrustBadge component with all 6 tier styles
- [x] TrendIndicator component with 3 states
- [x] Tier calculation utility function
- [x] Integration with AgentOverviewModule
- [x] Accessible ARIA labels for colors
- [x] Unit tests for tier calculation
- [x] Visual tests for badge rendering
