# Story 12.1: Trust Gate Engine

## Story Info
- **Epic**: 12 - Decision Automation Pipeline
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR74 (Trust Gate rule evaluation engine)

## User Story

As the decision system,
I want to evaluate action requests against trust rules,
So that appropriate oversight is applied.

## Acceptance Criteria

### AC1: Rule-Based Evaluation
**Given** an action request from an agent
**When** evaluated through the trust gate
**Then** appropriate rules are applied and a decision is returned

### AC2: Risk Assessment
**Given** an action request
**When** calculating risk level
**Then** category, trust score, and history are factored in

### AC3: Decision Routing
**Given** the gate evaluation result
**When** a decision is made
**Then** it routes to auto-approve, tribunal, HITL, or denial

### AC4: Rate Limiting
**Given** agent activity
**When** request rate exceeds limits
**Then** requests are rate-limited

## Technical Implementation

### TrustGateEngine Service

`src/services/TrustGateEngine.ts` provides rule-based decision routing:

```typescript
import { getTrustGateEngine } from './TrustGateEngine.js';

const engine = getTrustGateEngine();

const result = engine.evaluate(
    {
        id: 'req_123',
        agentId: 'agent_1',
        orgId: 'org_1',
        actionType: 'update_config',
        category: 'system_config',
        description: 'Update system settings',
        urgency: 'normal',
        requestedAt: new Date(),
    },
    {
        trustScore: 750,
        tier: 'VERIFIED',
        capabilities: ['execute', 'delegate'],
        recentFailures: 0,
        recentSuccesses: 20,
        actionHistory: new Map([['update_config', 5]]),
    }
);

console.log(result.decision); // 'tribunal_review'
console.log(result.riskLevel); // 'high'
console.log(result.reasons); // ['Action requires tribunal review']
```

### Gate Decisions

| Decision | Description |
|----------|-------------|
| `auto_approve` | Automatically approved, no review needed |
| `tribunal_review` | Requires Bot Tribunal voting |
| `hitl_required` | Requires human review |
| `escalate` | Critical - escalate to director |
| `deny` | Action denied |
| `rate_limited` | Rate limit exceeded |

### Action Categories

| Category | Base Risk | Required Capability |
|----------|-----------|---------------------|
| `read` | Low | execute |
| `write` | Medium | execute |
| `execute` | Medium | execute |
| `delegate` | High | delegate |
| `spawn` | High | spawn |
| `financial` | Critical | approve_medium_risk |
| `external_api` | Medium | execute |
| `data_access` | Medium | execute |
| `system_config` | High | approve_medium_risk |
| `user_facing` | Medium | execute |

### Built-in Rules

| Rule | Priority | Description |
|------|----------|-------------|
| `denied_action_check` | 200 | Checks if action is on denied list |
| `always_hitl_check` | 190 | Checks if action requires HITL |
| `trust_score_check` | 100 | Evaluates trust score thresholds |
| `tier_permission_check` | 90 | Verifies tier has required capability |
| `recent_failures_check` | 80 | Checks recent failure count |
| `first_time_action_check` | 70 | Flags first-time action types |

### Configuration

```typescript
interface GateConfig {
    autoApproveMinScore: 800,      // Min trust for auto-approve
    autoApproveMaxRecentFailures: 0,
    autoApproveMinSameTypeActions: 3,
    tribunalMinScore: 400,          // Min trust for tribunal
    hitlMinScore: 200,              // Min trust for HITL
    rateLimitPerHour: 100,
    rateLimitWindowMs: 3600000,
    categoryRiskOverrides: {},      // Override category risks
    alwaysHitlActions: [],          // Actions requiring HITL
    deniedActions: [],              // Denied actions
}
```

### Org-Specific Configuration

```typescript
engine.setOrgConfig('org_strict', {
    autoApproveMinScore: 950,
    alwaysHitlActions: ['delete_data'],
    deniedActions: ['system_shutdown'],
});
```

### Rate Limiting

```typescript
// Check rate limit status
const status = engine.getRateLimitStatus('agent_1');
// { remaining: 95, resetAt: Date }

// Configure rate limits
engine.updateConfig({
    rateLimitPerHour: 50,
    rateLimitWindowMs: 60 * 60 * 1000,
});
```

### Custom Rules

```typescript
engine.addRule({
    name: 'custom_check',
    description: 'Custom business rule',
    priority: 60,
    evaluate: (request, context, config) => ({
        ruleName: 'custom_check',
        passed: context.trustScore > 500,
        message: 'Custom check result',
        weight: 2,
    }),
});

engine.removeRule('custom_check');
```

### Events

```typescript
engine.on('gate:evaluated', (result) => { /* All evaluations */ });
engine.on('gate:auto_approved', (result) => { /* Auto-approvals */ });
engine.on('gate:denied', (result) => { /* Denials */ });
engine.on('gate:escalated', (result) => { /* Escalations */ });
```

### GateResult Interface

```typescript
interface GateResult {
    requestId: string;
    decision: GateDecision;
    riskLevel: RiskLevel;
    reasons: string[];
    requiredApprovers?: string[];
    autoExpireAt?: Date;
    evaluatedAt: Date;
    rules: RuleEvaluation[];
}
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/TrustGateEngine.ts` | Gate evaluation service |
| `src/services/TrustGateEngine.test.ts` | Unit tests (37 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Auto-Approval | 4 |
| Tribunal Review | 2 |
| HITL Required | 3 |
| Escalation | 2 |
| Denial | 3 |
| Rate Limiting | 3 |
| Risk Assessment | 6 |
| Always HITL | 1 |
| Events | 4 |
| Expiry | 2 |
| Configuration | 3 |
| Custom Rules | 2 |
| Utilities | 2 |
| **Total** | **37** |

### Running Tests

```bash
npx vitest run src/services/TrustGateEngine.test.ts
```

## Definition of Done
- [x] TrustGateEngine service created
- [x] Trust score threshold rules
- [x] Risk level assessment by category
- [x] Tier permission checking
- [x] Rate limiting
- [x] First-time action flagging
- [x] Denied action list
- [x] Always-HITL action list
- [x] Org-specific configuration
- [x] Custom rule support
- [x] Decision routing logic
- [x] Event emission
- [x] Comprehensive test suite (37 tests)
- [x] TypeScript compilation successful
