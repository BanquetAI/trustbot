# Epic 1: Enhanced Trust Scoring

**Epic ID:** TRUST-E1
**Priority:** HIGH
**Estimated Points:** 13
**Dependencies:** None (can start immediately)

---

## Story 1.1: Trust Component Type Definitions

**Story ID:** TRUST-1.1
**Points:** 2
**Priority:** P0 (Blocker for other stories)

### Description
As a developer, I need TypeScript interfaces for the enhanced trust scoring system so that all components have consistent type safety.

### Acceptance Criteria
- [ ] AC1: `TrustComponents` interface defines all 5 component scores
- [ ] AC2: `ComponentScore` interface includes raw, weighted, samples, confidence, lastUpdated
- [ ] AC3: `EnhancedTrustScore` extends existing `TrustScore` with new fields
- [ ] AC4: `TrustTier` type maps score ranges to tier names
- [ ] AC5: All types exported from `src/core/types/trust.ts`
- [ ] AC6: JSDoc comments on all interfaces

### Technical Notes
```typescript
// Key interfaces to create:
- TrustComponents
- ComponentScore
- EnhancedTrustScore
- TrustTier
- ComponentWeights (const)
- ScoreRange (const)
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/types/trust.ts` | CREATE |
| `src/types.ts` | MODIFY - add exports |

---

## Story 1.2: Decision Accuracy Calculator

**Story ID:** TRUST-1.2
**Points:** 3
**Priority:** P1

### Description
As the trust system, I need to calculate decision accuracy from task approval rates so that agent performance is measured objectively.

### Acceptance Criteria
- [ ] AC1: Query task history for specified agent (configurable lookback, default 90 days)
- [ ] AC2: Calculate raw approval rate: approved / total
- [ ] AC3: Apply risk-adjusted weighting (low=1x, medium=1.5x, high=2x, critical=3x)
- [ ] AC4: Return `ComponentScore` with confidence based on sample size
- [ ] AC5: Handle edge case: new agent with 0 tasks returns 50 (neutral)
- [ ] AC6: Confidence reaches 1.0 at 100+ samples

### Technical Notes
```typescript
// Risk multipliers
const RISK_WEIGHTS = {
  low: 1,
  medium: 1.5,
  high: 2,
  critical: 3,
};

// Confidence calculation
confidence = Math.min(1, sampleCount / 100);
```

### Test Cases
- Agent with 100 low-risk approved tasks → ~100 raw score
- Agent with 50% approval on high-risk tasks → score reflects risk
- New agent with 0 tasks → 50 score, 0 confidence
- Agent with 50 tasks → 0.5 confidence

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/TrustScoreCalculator.ts` | CREATE |
| `src/core/TrustScoreCalculator.test.ts` | CREATE |

---

## Story 1.3: Ethics Compliance Calculator

**Story ID:** TRUST-1.3
**Points:** 2
**Priority:** P1

### Description
As the trust system, I need to calculate ethics compliance from violations and escalations so that behavioral issues reduce trust.

### Acceptance Criteria
- [ ] AC1: Query violations for agent (90-day window)
- [ ] AC2: Query escalations for agent (90-day window)
- [ ] AC3: Start at 100, deduct 10 per violation, 5 per escalation
- [ ] AC4: Floor at 0 (no negative scores)
- [ ] AC5: Return `ComponentScore` with confidence = 1 (violation data always complete)
- [ ] AC6: Integrate with existing `SecurityLayer.getAuditLog()` for violation data

### Technical Notes
```typescript
// Penalty formula
const violationPenalty = violations.length * 10;
const escalationPenalty = escalations.length * 5;
const raw = Math.max(0, 100 - violationPenalty - escalationPenalty);
```

### Test Cases
- Agent with 0 violations → 100 score
- Agent with 5 violations → 50 score
- Agent with 10+ violations → 0 score (floored)
- Agent with 2 violations + 4 escalations → 60 score

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/TrustScoreCalculator.ts` | MODIFY |
| `src/core/TrustScoreCalculator.test.ts` | MODIFY |

---

## Story 1.4: Task Success Calculator

**Story ID:** TRUST-1.4
**Points:** 2
**Priority:** P1

### Description
As the trust system, I need to calculate task success rate from completed vs failed tasks so that reliability is measured.

### Acceptance Criteria
- [ ] AC1: Query completed tasks for agent (90-day window)
- [ ] AC2: Query failed tasks for agent (90-day window)
- [ ] AC3: Calculate: (completed / (completed + failed)) * 100
- [ ] AC4: Handle edge case: 0 tasks returns 50 (neutral)
- [ ] AC5: Return `ComponentScore` with confidence based on sample size
- [ ] AC6: Use existing task data from `PersistenceLayer`

### Technical Notes
```typescript
// Success formula
const total = completed + failed;
const raw = total > 0 ? (completed / total) * 100 : 50;
const confidence = Math.min(1, total / 50);
```

### Test Cases
- Agent with 100 completed, 0 failed → 100 score
- Agent with 50 completed, 50 failed → 50 score
- Agent with 0 tasks → 50 score, 0 confidence

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/TrustScoreCalculator.ts` | MODIFY |
| `src/core/TrustScoreCalculator.test.ts` | MODIFY |

---

## Story 1.5: Operational Stability Calculator

**Story ID:** TRUST-1.5
**Points:** 2
**Priority:** P1

### Description
As the trust system, I need to calculate operational stability from error rates and response times so that system health is tracked.

### Acceptance Criteria
- [ ] AC1: Query error count for agent (90-day window)
- [ ] AC2: Query average response time for agent
- [ ] AC3: Error penalty: -5 per error (max -50)
- [ ] AC4: Response time penalty: -1 per 100ms above 500ms baseline
- [ ] AC5: Start at 100, apply penalties, floor at 0
- [ ] AC6: Return `ComponentScore` with appropriate confidence

### Technical Notes
```typescript
// Stability formula
const errorPenalty = Math.min(50, errors * 5);
const responsePenalty = Math.max(0, (avgResponseMs - 500) / 100);
const raw = Math.max(0, 100 - errorPenalty - responsePenalty);
```

### Test Cases
- Agent with 0 errors, <500ms response → 100 score
- Agent with 10 errors → 50 score (max error penalty)
- Agent with 1000ms avg response → 95 score (5 point penalty)

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/TrustScoreCalculator.ts` | MODIFY |
| `src/core/TrustScoreCalculator.test.ts` | MODIFY |

---

## Story 1.6: Peer Reviews Calculator (Blackboard Integration)

**Story ID:** TRUST-1.6
**Points:** 2
**Priority:** P1

### Description
As the trust system, I need to calculate peer reviews from Blackboard contributions so that collaborative value is recognized.

### Acceptance Criteria
- [ ] AC1: Query Blackboard contributions by agent
- [ ] AC2: Count endorsements on agent's contributions
- [ ] AC3: Count resolved SOLUTION entries by agent
- [ ] AC4: Score formula: (endorsements * 5) + (solutions * 20), capped at 100
- [ ] AC5: Return `ComponentScore` with confidence based on contribution count
- [ ] AC6: Integrate with existing `Blackboard.getContributionsBy()` (may need to add)

### Technical Notes
```typescript
// Peer score formula
const endorsementPoints = endorsements * 5;
const solutionPoints = resolvedSolutions * 20;
const raw = Math.min(100, endorsementPoints + solutionPoints);
const confidence = Math.min(1, contributions.length / 20);
```

### Test Cases
- Agent with 20 endorsements → 100 score (capped)
- Agent with 3 resolved solutions → 60 score
- Agent with 0 contributions → 0 score, 0 confidence

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/TrustScoreCalculator.ts` | MODIFY |
| `src/core/Blackboard.ts` | MODIFY - add getContributionsBy() |
| `src/core/TrustScoreCalculator.test.ts` | MODIFY |

---

## Story 1.7: Weighted Score Aggregation

**Story ID:** TRUST-1.7
**Points:** 2
**Priority:** P0

### Description
As the trust system, I need to aggregate component scores with proper weighting so that the final FICO-style score is calculated.

### Acceptance Criteria
- [ ] AC1: Apply weights: accuracy=35%, ethics=25%, tasks=20%, stability=15%, peers=5%
- [ ] AC2: Calculate weighted sum of component scores
- [ ] AC3: Scale to 300-1000 range (FICO-style)
- [ ] AC4: Apply inheritance bonus (from parent agent, 80% rate)
- [ ] AC5: Apply penalty deductions (from violations)
- [ ] AC6: Clamp final score to 300-1000 range
- [ ] AC7: Derive tier from final score
- [ ] AC8: Calculate 7-day trend (rising/stable/falling)

### Technical Notes
```typescript
// Final score calculation
const weightedSum =
  accuracy.raw * 0.35 +
  ethics.raw * 0.25 +
  tasks.raw * 0.20 +
  stability.raw * 0.15 +
  peers.raw * 0.05;

const componentScore = 300 + (weightedSum / 100) * 700;
const finalScore = clamp(componentScore + inherited - penalties, 300, 1000);
```

### Tier Mapping
| Score Range | Tier |
|-------------|------|
| 900-1000 | SOVEREIGN (T5) |
| 750-899 | EXECUTIVE (T4) |
| 600-749 | TACTICAL (T3) |
| 450-599 | OPERATIONAL (T2) |
| 300-449 | WORKER (T1) |
| <300 | PASSIVE (T0) |

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/TrustScoreCalculator.ts` | MODIFY |
| `src/core/TrustScoreCalculator.test.ts` | MODIFY |

---

## Story 1.8: TrustEngine Integration

**Story ID:** TRUST-1.8
**Points:** 3
**Priority:** P0

### Description
As the trust system, I need to integrate the new TrustScoreCalculator into the existing TrustEngine so that all trust operations use the enhanced scoring.

### Acceptance Criteria
- [ ] AC1: Add feature flag `USE_FICO_SCORING` (default: true)
- [ ] AC2: Inject `TrustScoreCalculator` into `TrustEngine`
- [ ] AC3: Modify `createTrust()` to use calculator when flag enabled
- [ ] AC4: Modify `reward()` to recalculate score after reward
- [ ] AC5: Modify `penalize()` to recalculate score after penalty
- [ ] AC6: Preserve existing inheritance and penalty propagation logic
- [ ] AC7: Emit `trust:score-recalculated` event with component breakdown
- [ ] AC8: Add backward compatibility: old scoring still works when flag disabled

### Technical Notes
```typescript
// Feature flag pattern
if (FEATURES.USE_FICO_SCORING) {
  return this.calculator.calculateScore(agentId);
}
return this.legacyCalculateScore(agentId);
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/TrustEngine.ts` | MODIFY |
| `src/core/TrustEngine.test.ts` | MODIFY |
| `src/core/config/features.ts` | CREATE |

---

## Definition of Done (Epic 1)

- [ ] All 8 stories completed and merged
- [ ] 95%+ test coverage on TrustScoreCalculator
- [ ] All existing TrustEngine tests still pass
- [ ] Feature flag allows rollback to legacy scoring
- [ ] Component scores visible in API response
- [ ] Documentation updated
