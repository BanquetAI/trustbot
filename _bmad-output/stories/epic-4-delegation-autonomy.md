# Epic 4: Delegation & Autonomy Budgets

**Epic ID:** TRUST-E4
**Priority:** HIGH
**Estimated Points:** 13
**Dependencies:** Epic 1 (tier-based budgets), Epic 3 (council approval)

---

## Story 4.1: Delegation Type Definitions

**Story ID:** TRUST-4.1
**Points:** 1
**Priority:** P0 (Blocker)

### Description
As a developer, I need TypeScript interfaces for the delegation system so that capability requests are type-safe.

### Acceptance Criteria
- [ ] AC1: `DelegationRequest` interface with full request lifecycle
- [ ] AC2: `ActiveDelegation` interface for granted capabilities
- [ ] AC3: Status types: pending, approved, rejected, expired, revoked
- [ ] AC4: Permission types match existing RBAC permissions
- [ ] AC5: Duration in milliseconds
- [ ] AC6: All types exported from `src/core/delegation/types.ts`

### Technical Notes
```typescript
interface DelegationRequest {
  id: string;
  requesterId: AgentId;
  requestedCapabilities: Permission[];
  reason: string;
  duration: number;           // ms
  context: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';
  approvedBy?: AgentId | 'COUNCIL' | 'HUMAN';
  approvedAt?: Date;
  expiresAt?: Date;
  // Track record
  requesterSuccessRate: number;
  requesterTier: AgentTier;
}

interface ActiveDelegation {
  id: string;
  agentId: AgentId;
  capabilities: Permission[];
  grantedAt: Date;
  expiresAt: Date;
  reason: string;
}
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/delegation/types.ts` | CREATE |
| `src/core/delegation/index.ts` | CREATE |

---

## Story 4.2: Delegation Request Creation

**Story ID:** TRUST-4.2
**Points:** 2
**Priority:** P0

### Description
As an agent, I need to request temporary capabilities so that I can perform tasks requiring elevated permissions.

### Acceptance Criteria
- [ ] AC1: Create request with capabilities, reason, duration
- [ ] AC2: Validate requested capabilities exist in RBAC
- [ ] AC3: Validate duration within limits (max 24 hours)
- [ ] AC4: Attach requester's track record (success rate, tier)
- [ ] AC5: Count similar past requests that were approved
- [ ] AC6: Persist request
- [ ] AC7: Log in audit trail

### Technical Notes
```typescript
async requestCapabilities(
  agentId: AgentId,
  capabilities: Permission[],
  reason: string,
  duration: number
): Promise<DelegationRequest> {
  // Validate
  if (duration > MAX_DELEGATION_DURATION) {
    throw new Error(`Duration exceeds maximum (${MAX_DELEGATION_DURATION}ms)`);
  }

  for (const cap of capabilities) {
    if (!this.isValidPermission(cap)) {
      throw new Error(`Invalid capability: ${cap}`);
    }
  }

  const agent = await this.trustEngine.getTrust(agentId);
  const successRate = await this.getSuccessRate(agentId);
  const similarApprovals = await this.getSimilarApprovals(agentId, capabilities);

  return {
    id: crypto.randomUUID(),
    requesterId: agentId,
    requestedCapabilities: capabilities,
    reason,
    duration,
    context: {},
    status: 'pending',
    requesterSuccessRate: successRate,
    requesterTier: agent.tier,
    similarRequestsApproved: similarApprovals,
  };
}
```

### Test Cases
- Valid request created
- Invalid capability rejected
- Duration over limit rejected
- Track record attached correctly

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/delegation/DelegationManager.ts` | CREATE |
| `src/core/delegation/DelegationManager.test.ts` | CREATE |

---

## Story 4.3: Auto-Approval Logic

**Story ID:** TRUST-4.3
**Points:** 2
**Priority:** P1

### Description
As a high-trust agent, I need my delegation requests auto-approved when I meet criteria so that I don't wait for review.

### Acceptance Criteria
- [ ] AC1: Auto-approve if ALL conditions met:
  - Tier >= 4
  - Success rate >= 90%
  - 3+ similar requests previously approved
  - Duration <= 1 hour
  - No restricted capabilities (SYSTEM_CONFIG, HITL_MODIFY, AGENT_TERMINATE)
- [ ] AC2: Create ActiveDelegation immediately
- [ ] AC3: Set expiry based on duration
- [ ] AC4: Log auto-approval in audit
- [ ] AC5: Emit `delegation:auto-approved` event

### Technical Notes
```typescript
private canAutoApprove(request: DelegationRequest): boolean {
  const RESTRICTED = ['SYSTEM_CONFIG', 'HITL_MODIFY', 'AGENT_TERMINATE'];

  return (
    request.requesterTier >= 4 &&
    request.requesterSuccessRate >= 0.90 &&
    request.similarRequestsApproved >= 3 &&
    request.duration <= 60 * 60 * 1000 && // 1 hour
    !request.requestedCapabilities.some(c => RESTRICTED.includes(c))
  );
}

async autoApprove(request: DelegationRequest): Promise<DelegationRequest> {
  request.status = 'approved';
  request.approvedBy = 'AUTO';
  request.approvedAt = new Date();
  request.expiresAt = new Date(Date.now() + request.duration);

  await this.createActiveDelegation(request);
  await this.audit('DELEGATION_AUTO_APPROVED', request);

  return request;
}
```

### Test Cases
- T4 with 95% rate, 5 approvals, 30min → auto
- T3 with 95% rate → manual (tier too low)
- T4 requesting SYSTEM_CONFIG → manual (restricted)
- T4 for 2 hours → manual (too long)

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/delegation/DelegationManager.ts` | MODIFY |
| `src/core/delegation/DelegationManager.test.ts` | MODIFY |

---

## Story 4.4: Delegation Approval Routing

**Story ID:** TRUST-4.4
**Points:** 2
**Priority:** P0

### Description
As the delegation system, I need to route non-auto requests to appropriate approvers so that capabilities are granted with oversight.

### Acceptance Criteria
- [ ] AC1: If not auto-approved, route to council or human based on HITL
- [ ] AC2: HITL >= 50% → human approval
- [ ] AC3: HITL < 50% → council review (CAPABILITY_GRANT type)
- [ ] AC4: Await decision before returning
- [ ] AC5: On approval, create ActiveDelegation
- [ ] AC6: On rejection, mark request rejected
- [ ] AC7: Notify requester of outcome

### Technical Notes
```typescript
async routeForApproval(request: DelegationRequest): Promise<DelegationRequest> {
  if (this.hitlGateway.hitlLevel >= 50) {
    // Human approval
    const approval = await this.hitlGateway.requestHumanApproval(
      'DELEGATION',
      { request }
    );
    return this.handleApprovalResult(request, approval);
  } else {
    // Council review
    const review = await this.councilService.submitForReview(
      'CAPABILITY_GRANT',
      request.requesterId,
      { request }
    );
    const decision = await this.awaitCouncilDecision(review);
    return this.handleApprovalResult(request, decision);
  }
}
```

### Test Cases
- HITL 60% → goes to human
- HITL 40% → goes to council
- Approval → creates active delegation
- Rejection → marks rejected

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/delegation/DelegationManager.ts` | MODIFY |
| `src/core/delegation/DelegationManager.test.ts` | MODIFY |

---

## Story 4.5: Active Delegation Management

**Story ID:** TRUST-4.5
**Points:** 2
**Priority:** P0

### Description
As the delegation system, I need to manage active delegations so that capabilities expire and can be revoked.

### Acceptance Criteria
- [ ] AC1: Store active delegations per agent
- [ ] AC2: Check expiry on every capability check
- [ ] AC3: Remove expired delegations automatically
- [ ] AC4: Allow manual revocation with reason
- [ ] AC5: `checkCapability(agentId, capability)` includes delegated
- [ ] AC6: List active delegations for agent
- [ ] AC7: Emit events: `delegation:expired`, `delegation:revoked`

### Technical Notes
```typescript
async checkCapability(
  agentId: AgentId,
  capability: Permission
): Promise<boolean> {
  // Check base permissions
  const hasBase = await this.securityLayer.hasPermission(agentId, capability);
  if (hasBase) return true;

  // Check delegated permissions
  const delegations = await this.getActiveDelegations(agentId);
  const active = delegations.find(d =>
    d.expiresAt > new Date() &&
    d.capabilities.includes(capability)
  );

  return !!active;
}

async cleanupExpired(): Promise<number> {
  const now = new Date();
  let cleaned = 0;

  for (const [agentId, delegations] of this.activeDelegations) {
    const expired = delegations.filter(d => d.expiresAt <= now);
    for (const d of expired) {
      await this.removeDelegation(d.id);
      this.emit('delegation:expired', { agentId, delegation: d });
      cleaned++;
    }
  }

  return cleaned;
}
```

### Test Cases
- Active delegation grants capability
- Expired delegation doesn't grant
- Revoked delegation doesn't grant
- Cleanup removes expired

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/delegation/DelegationManager.ts` | MODIFY |
| `src/core/delegation/DelegationManager.test.ts` | MODIFY |

---

## Story 4.6: Autonomy Budget Type Definitions

**Story ID:** TRUST-4.6
**Points:** 1
**Priority:** P0 (Blocker for 4.7-4.8)

### Description
As a developer, I need TypeScript interfaces for the autonomy budget system so that daily limits are type-safe.

### Acceptance Criteria
- [ ] AC1: `DailyBudget` interface with limits and usage
- [ ] AC2: `BudgetAction` interface for tracking individual actions
- [ ] AC3: `TierBudgets` const with per-tier limits
- [ ] AC4: T5 has unlimited (-1) values
- [ ] AC5: All types exported from `src/core/autonomy/types.ts`

### Technical Notes
```typescript
interface DailyBudget {
  agentId: AgentId;
  date: string;              // YYYY-MM-DD
  tier: AgentTier;
  maxAutonomousActions: number;
  maxDelegations: number;
  maxTokenSpend: number;
  autonomousActionsUsed: number;
  delegationsUsed: number;
  tokensSpent: number;
  actions: BudgetAction[];
  resetAt: Date;
}

const TIER_BUDGETS = {
  0: { actions: 0, delegations: 0, tokens: 0 },
  1: { actions: 5, delegations: 0, tokens: 1000 },
  2: { actions: 20, delegations: 1, tokens: 5000 },
  3: { actions: 50, delegations: 3, tokens: 20000 },
  4: { actions: 200, delegations: 10, tokens: 100000 },
  5: { actions: -1, delegations: -1, tokens: -1 }, // Unlimited
} as const;
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/autonomy/types.ts` | CREATE |
| `src/core/autonomy/index.ts` | CREATE |

---

## Story 4.7: Budget Creation & Reset

**Story ID:** TRUST-4.7
**Points:** 2
**Priority:** P0

### Description
As the autonomy system, I need to create and reset daily budgets so that agents have fresh limits each day.

### Acceptance Criteria
- [ ] AC1: Create budget for agent if doesn't exist for today
- [ ] AC2: Set limits based on agent's current tier
- [ ] AC3: Reset at midnight UTC (configurable)
- [ ] AC4: Preserve yesterday's budget for history
- [ ] AC5: Handle tier changes (new budget gets new tier's limits)
- [ ] AC6: Persist budgets
- [ ] AC7: Emit `budget:reset` event at midnight

### Technical Notes
```typescript
async getOrCreateBudget(agentId: AgentId): Promise<DailyBudget> {
  const today = this.getDateString(new Date());
  const key = `${agentId}:${today}`;

  let budget = this.budgets.get(key);
  if (budget) return budget;

  const trust = await this.trustEngine.getTrust(agentId);
  const limits = TIER_BUDGETS[trust.tier];

  budget = {
    agentId,
    date: today,
    tier: trust.tier,
    maxAutonomousActions: limits.actions,
    maxDelegations: limits.delegations,
    maxTokenSpend: limits.tokens,
    autonomousActionsUsed: 0,
    delegationsUsed: 0,
    tokensSpent: 0,
    actions: [],
    resetAt: this.getNextMidnight(),
  };

  this.budgets.set(key, budget);
  await this.persist(budget);
  return budget;
}
```

### Test Cases
- New agent gets fresh budget
- Existing budget returned
- Midnight triggers reset
- Tier change gets new limits

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/autonomy/AutonomyBudget.ts` | CREATE |
| `src/core/autonomy/AutonomyBudget.test.ts` | CREATE |

---

## Story 4.8: Budget Enforcement

**Story ID:** TRUST-4.8
**Points:** 3
**Priority:** P0

### Description
As the autonomy system, I need to enforce budget limits so that agents cannot exceed their daily allocation.

### Acceptance Criteria
- [ ] AC1: `canPerformAction(agentId, type, cost)` checks limit
- [ ] AC2: Return allowed: false with reason if over budget
- [ ] AC3: Return remaining count if allowed
- [ ] AC4: `recordAction(agentId, type, cost)` increments usage
- [ ] AC5: T5 agents always allowed (unlimited)
- [ ] AC6: Track each action in budget.actions array
- [ ] AC7: Emit `budget:action` event on record
- [ ] AC8: Emit `budget:exhausted` when limit reached

### Technical Notes
```typescript
async canPerformAction(
  agentId: AgentId,
  actionType: string,
  cost: number = 1
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const budget = await this.getOrCreateBudget(agentId);

  // T5 unlimited
  if (budget.maxAutonomousActions === -1) {
    return { allowed: true, remaining: Infinity };
  }

  if (budget.autonomousActionsUsed + cost > budget.maxAutonomousActions) {
    return {
      allowed: false,
      reason: `Daily limit reached (${budget.maxAutonomousActions})`,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: budget.maxAutonomousActions - budget.autonomousActionsUsed - cost,
  };
}

async recordAction(
  agentId: AgentId,
  actionType: string,
  cost: number = 1
): Promise<DailyBudget> {
  const budget = await this.getOrCreateBudget(agentId);

  budget.autonomousActionsUsed += cost;
  budget.actions.push({
    timestamp: new Date(),
    actionType,
    cost,
    approved: true,
  });

  await this.persist(budget);

  if (budget.autonomousActionsUsed >= budget.maxAutonomousActions) {
    this.emit('budget:exhausted', { agentId, budget });
  }

  return budget;
}
```

### Test Cases
- Under budget → allowed
- At limit → denied
- T5 always allowed
- Record increments correctly
- Exhausted event emits at limit

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/autonomy/AutonomyBudget.ts` | MODIFY |
| `src/core/autonomy/AutonomyBudget.test.ts` | MODIFY |

---

## Definition of Done (Epic 4)

- [ ] All 8 stories completed and merged
- [ ] 95%+ test coverage on delegation and budget
- [ ] Delegation auto-approval working correctly
- [ ] Budget limits enforced at all tiers
- [ ] T5 unlimited verified
- [ ] Expiry and revocation working
- [ ] Feature flags for both systems
- [ ] Documentation updated
