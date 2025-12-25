# Story 12.7: Decision Analytics

## Story Info
- **Epic**: 12 - Decision Automation Pipeline
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR80 (Decision pattern analytics)

## User Story

As a director,
I want analytics on decision patterns,
So that I can optimize automation thresholds.

## Acceptance Criteria

### AC1: Auto-Approval Rate by Action Type
**Given** historical decision data
**When** analyzing auto-approval rates
**Then** breakdown by action type is available

### AC2: Average Decision Time by Risk Level
**Given** historical decision data
**When** analyzing decision times
**Then** metrics by risk level are provided

### AC3: Override Rate Tracking
**Given** overridden decisions
**When** calculating override rates
**Then** breakdown by source (human vs tribunal) is available

### AC4: False Positive Rate
**Given** auto-approved decisions that were later overridden
**When** calculating false positive rate
**Then** the rate is tracked and reported

## Technical Implementation

### DecisionAnalytics Service

`src/services/DecisionAnalytics.ts` provides comprehensive decision analytics:

```typescript
import { getDecisionAnalytics } from './DecisionAnalytics.js';

const analytics = getDecisionAnalytics();

// Record a decision
analytics.recordDecision(
    'dec_123',
    'req_456',
    'org_1',
    'agent_1',
    'execute',          // actionType
    'medium',           // riskLevel
    'auto_approval',    // source
    'approved',         // outcome
    createdAt,
    decidedAt,
    trustScore,
    { wasOverridden: false }
);

// Get comprehensive analytics
const summary = analytics.getAnalyticsSummary('org_1', {
    startDate: new Date('2025-01-01'),
    endDate: new Date(),
});
```

### Metrics Available

| Metric | Description |
|--------|-------------|
| Auto-Approval Rate | Percentage of decisions auto-approved |
| Decision Time | Mean, median, P95, P99 by risk level |
| Override Rate | Percentage overridden by source |
| False Positive Rate | Auto-approvals later overridden |
| Trends | Week-over-week changes |

### Analytics Summary

```typescript
interface DecisionAnalyticsSummary {
    orgId: string;
    period: { start: Date; end: Date };
    totalDecisions: number;
    bySource: Record<DecisionSource, number>;
    byOutcome: Record<DecisionOutcome, number>;
    byRiskLevel: Record<RiskLevel, number>;
    autoApproval: AutoApprovalMetrics;
    decisionTime: DecisionTimeMetrics;
    override: OverrideMetrics;
    falsePositive: FalsePositiveMetrics;
    trends: {
        autoApprovalRateTrend: number;  // -1 to 1
        decisionTimeTrend: number;      // -1 to 1
        overrideRateTrend: number;      // -1 to 1
    };
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/analytics/decisions/stats` | GET | Global statistics |
| `/api/v1/analytics/decisions/:orgId` | GET | Full analytics summary |
| `/api/v1/analytics/decisions/:orgId/auto-approval` | GET | Auto-approval metrics |
| `/api/v1/analytics/decisions/:orgId/decision-time` | GET | Decision time metrics |
| `/api/v1/analytics/decisions/:orgId/overrides` | GET | Override metrics |
| `/api/v1/analytics/decisions/:orgId/false-positives` | GET | False positive metrics |
| `/api/v1/analytics/decisions/:orgId/recent` | GET | Recent records |
| `/api/v1/analytics/decisions/:orgId/agent/:agentId` | GET | Agent-specific analytics |
| `/api/v1/analytics/decisions/:orgId/action-type/:type` | GET | Action type analytics |
| `/api/v1/analytics/decisions/:orgId/thresholds` | GET/PUT | Alert thresholds |

### Query Parameters

```
startDate - Filter by start date (ISO format)
endDate - Filter by end date (ISO format)
limit - Limit recent records (default: 100, max: 500)
source - Filter by source (auto_approval, tribunal, hitl)
outcome - Filter by outcome (approved, denied, expired, escalated)
riskLevel - Filter by risk (low, medium, high, critical)
```

### Alert Thresholds

```typescript
// Set alert thresholds
analytics.setThreshold('org_1', 'autoApprovalRate', 0.7);
analytics.setThreshold('org_1', 'maxOverrideRate', 0.1);
analytics.setThreshold('org_1', 'maxFalsePositiveRate', 0.05);

// Listen for threshold alerts
analytics.on('threshold:alert', (alert) => {
    console.log(`Alert: ${alert.metric} = ${alert.current}, threshold = ${alert.threshold}`);
});
```

### Agent Analytics

```typescript
const agentStats = analytics.getAgentAnalytics('agent_1');
// Returns:
// - totalDecisions
// - approvalRate
// - avgDecisionTime
// - overrideRate
// - bySource
// - byOutcome
```

### Action Type Analytics

```typescript
const actionStats = analytics.getActionTypeAnalytics('org_1', 'execute');
// Returns:
// - total
// - approvalRate
// - avgDecisionTime
// - autoApprovalRate
// - falsePositiveRate
```

### Configuration

```typescript
interface AnalyticsConfig {
    retentionDays: 90,       // Days to keep records
    trendWindowDays: 7,      // Window for trend calculation
    trackActionTypes: true,  // Track by action type
    maxRecords: 100000,      // Maximum records to store
}

analytics.updateConfig({ retentionDays: 30 });
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/DecisionAnalytics.ts` | Analytics service |
| `src/services/DecisionAnalytics.test.ts` | Service tests (41 tests) |
| `src/api/routes/analytics/decisions.ts` | API routes |
| `src/api/routes/analytics/decisions.test.ts` | API tests (19 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Decision Recording | 4 |
| Auto-Approval Metrics | 3 |
| Decision Time Metrics | 3 |
| Override Metrics | 2 |
| False Positive Metrics | 3 |
| Summary | 2 |
| Agent Analytics | 2 |
| Action Type Analytics | 1 |
| Thresholds | 3 |
| Record Retrieval | 6 |
| Trends | 1 |
| Configuration | 1 |
| Statistics | 1 |
| Lifecycle | 2 |
| Max Records | 1 |
| Singleton | 2 |
| API Routes | 19 |
| **Total** | **60** |

### Running Tests

```bash
npx vitest run src/services/DecisionAnalytics.test.ts src/api/routes/analytics/decisions.test.ts
```

## Definition of Done
- [x] DecisionAnalytics service created
- [x] Auto-approval rate by action type
- [x] Average decision time by risk level
- [x] Override rate tracking (human vs tribunal)
- [x] False positive rate calculation
- [x] Trend analysis (week-over-week)
- [x] Alert threshold configuration
- [x] API routes for all metrics
- [x] Query filtering (date range, source, outcome, risk)
- [x] Agent-specific analytics
- [x] Action type analytics
- [x] Record retention and cleanup
- [x] Comprehensive test suite (60 tests)
- [x] TypeScript compilation successful
