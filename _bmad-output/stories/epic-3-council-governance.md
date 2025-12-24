# Epic 3: Council Governance Layer

**Epic ID:** TRUST-E3
**Priority:** HIGH
**Estimated Points:** 21
**Dependencies:** Epic 1 (for reviewer trust scores), Epic 2 (for decision audit)

---

## Story 3.1: Council Type Definitions

**Story ID:** TRUST-3.1
**Points:** 2
**Priority:** P0 (Blocker)

### Description
As a developer, I need TypeScript interfaces for the council governance system so that all council operations are type-safe.

### Acceptance Criteria
- [ ] AC1: `CouncilMember` interface with agentId, tier, votingWeight, activeReviews
- [ ] AC2: `CouncilReview` interface with full review lifecycle
- [ ] AC3: `CouncilVote` interface with vote, reasoning, confidence
- [ ] AC4: `Precedent` interface for stored decisions
- [ ] AC5: Request types enum: SPAWN, TIER_UPGRADE, POLICY_CHANGE, CAPABILITY_GRANT
- [ ] AC6: Status types: pending, approved, rejected, timeout, escalated
- [ ] AC7: All types exported from `src/core/council/types.ts`

### Technical Notes
```typescript
interface CouncilMember {
  agentId: AgentId;
  tier: AgentTier;           // Must be >= 4
  specialization?: string;
  votingWeight: number;      // Default 1, T5 can have higher
  activeReviews: number;     // Max 3 concurrent
}

interface CouncilReview {
  id: string;
  requestType: 'SPAWN' | 'TIER_UPGRADE' | 'POLICY_CHANGE' | 'CAPABILITY_GRANT';
  requesterId: AgentId;
  context: Record<string, unknown>;
  reviewers: CouncilMember[];
  votes: Map<AgentId, CouncilVote>;
  requiredVotes: number;     // Usually 2 of 3
  status: 'pending' | 'approved' | 'rejected' | 'timeout' | 'escalated';
  outcome?: CouncilOutcome;
  createdAt: Date;
  expiresAt: Date;
  decidedAt?: Date;
}
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/council/types.ts` | CREATE |
| `src/core/council/index.ts` | CREATE |

---

## Story 3.2: Council Member Management

**Story ID:** TRUST-3.2
**Points:** 3
**Priority:** P1

### Description
As the council system, I need to manage council membership so that qualified agents can participate in governance.

### Acceptance Criteria
- [ ] AC1: Only T4+ agents can be council members
- [ ] AC2: Register member with `registerMember(agentId)`
- [ ] AC3: Unregister member with `unregisterMember(agentId)`
- [ ] AC4: List active members with `getMembers()`
- [ ] AC5: Track activeReviews per member (max 3 concurrent)
- [ ] AC6: Auto-unregister if agent drops below T4
- [ ] AC7: Emit events: `council:member-joined`, `council:member-left`

### Technical Notes
```typescript
class CouncilMemberRegistry {
  private members: Map<AgentId, CouncilMember> = new Map();

  async registerMember(agentId: AgentId): Promise<CouncilMember> {
    const trust = await this.trustEngine.getTrust(agentId);
    if (trust.tier < 4) {
      throw new Error('Council requires T4+ agents');
    }
    // Create member...
  }
}
```

### Test Cases
- T4 agent can register
- T3 agent cannot register (throws)
- Member with 3 active reviews cannot take more
- Dropped tier triggers auto-unregister

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/council/CouncilMemberRegistry.ts` | CREATE |
| `src/core/council/CouncilMemberRegistry.test.ts` | CREATE |

---

## Story 3.3: Reviewer Selection Algorithm

**Story ID:** TRUST-3.3
**Points:** 3
**Priority:** P1

### Description
As the council system, I need to select appropriate reviewers for each request so that decisions are made by qualified, diverse agents.

### Acceptance Criteria
- [ ] AC1: Select 3 reviewers per request
- [ ] AC2: Exclude requester from reviewers
- [ ] AC3: Prefer agents with < 3 active reviews
- [ ] AC4: Prefer diverse specializations when available
- [ ] AC5: Weight T5 agents higher for critical requests
- [ ] AC6: Fallback to any available T4+ if not enough diverse
- [ ] AC7: Fail if < 3 eligible reviewers available

### Technical Notes
```typescript
async selectReviewers(
  requestType: CouncilReview['requestType'],
  requesterId: AgentId,
  context: Record<string, unknown>
): Promise<CouncilMember[]> {
  const eligible = this.members.filter(m =>
    m.agentId !== requesterId &&
    m.activeReviews < 3
  );

  if (eligible.length < 3) {
    throw new Error('Insufficient council members available');
  }

  return this.diverseSelect(eligible, 3, context);
}
```

### Test Cases
- Selects exactly 3 reviewers
- Never selects requester
- Respects activeReviews limit
- Throws if < 3 available

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/council/CouncilService.ts` | CREATE |
| `src/core/council/CouncilService.test.ts` | CREATE |

---

## Story 3.4: Review Submission

**Story ID:** TRUST-3.4
**Points:** 3
**Priority:** P0

### Description
As an agent, I need to submit requests for council review so that critical decisions get distributed governance.

### Acceptance Criteria
- [ ] AC1: Create review with unique ID, timestamp, expiry (24h default)
- [ ] AC2: Select reviewers using selection algorithm
- [ ] AC3: Increment activeReviews for each reviewer
- [ ] AC4: Persist review in storage
- [ ] AC5: Notify reviewers via MessageBus
- [ ] AC6: Return pending review object
- [ ] AC7: Log submission in audit trail

### Technical Notes
```typescript
async submitForReview(
  requestType: CouncilReview['requestType'],
  requesterId: AgentId,
  context: Record<string, unknown>
): Promise<CouncilReview> {
  const reviewers = await this.selectReviewers(requestType, requesterId, context);

  const review: CouncilReview = {
    id: crypto.randomUUID(),
    requestType,
    requesterId,
    context,
    reviewers,
    votes: new Map(),
    requiredVotes: 2,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  await this.persist(review);
  await this.notifyReviewers(review);
  return review;
}
```

### Test Cases
- Review created with correct fields
- Reviewers notified
- Review persisted
- Audit log entry created

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/council/CouncilService.ts` | MODIFY |
| `src/core/council/CouncilService.test.ts` | MODIFY |

---

## Story 3.5: Voting Mechanism

**Story ID:** TRUST-3.5
**Points:** 3
**Priority:** P0

### Description
As a council member, I need to submit my vote on pending reviews so that collective decisions are made.

### Acceptance Criteria
- [ ] AC1: Only assigned reviewers can vote
- [ ] AC2: Vote options: approve, reject, abstain
- [ ] AC3: Vote includes reasoning (required) and confidence (0-1)
- [ ] AC4: Cannot vote on already-decided reviews
- [ ] AC5: Cannot change vote once submitted
- [ ] AC6: Persist vote immediately
- [ ] AC7: Emit `council:vote-submitted` event

### Technical Notes
```typescript
async submitVote(
  reviewId: string,
  voterId: AgentId,
  vote: 'approve' | 'reject' | 'abstain',
  reasoning: string,
  confidence: number
): Promise<CouncilReview> {
  const review = await this.getReview(reviewId);

  if (!review.reviewers.find(r => r.agentId === voterId)) {
    throw new Error('Not authorized to vote');
  }

  if (review.status !== 'pending') {
    throw new Error('Review already decided');
  }

  if (review.votes.has(voterId)) {
    throw new Error('Already voted');
  }

  review.votes.set(voterId, {
    voterId,
    vote,
    reasoning,
    confidence,
    timestamp: new Date(),
  });

  await this.checkForDecision(review);
  return review;
}
```

### Test Cases
- Authorized voter can vote
- Unauthorized voter rejected
- Cannot vote twice
- Cannot vote on decided review

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/council/CouncilService.ts` | MODIFY |
| `src/core/council/CouncilService.test.ts` | MODIFY |

---

## Story 3.6: Decision Resolution

**Story ID:** TRUST-3.6
**Points:** 3
**Priority:** P0

### Description
As the council system, I need to resolve reviews when sufficient votes are collected so that decisions are finalized.

### Acceptance Criteria
- [ ] AC1: 2 of 3 approves → approved
- [ ] AC2: 2 of 3 rejects → rejected
- [ ] AC3: Timeout (24h) with no majority → escalate to human
- [ ] AC4: Synthesize reasoning from majority votes
- [ ] AC5: Update review status and decidedAt
- [ ] AC6: Decrement activeReviews for all reviewers
- [ ] AC7: Emit `council:decision-made` event
- [ ] AC8: Notify requester of outcome

### Technical Notes
```typescript
private async checkForDecision(review: CouncilReview): Promise<void> {
  const votes = [...review.votes.values()];
  const approves = votes.filter(v => v.vote === 'approve').length;
  const rejects = votes.filter(v => v.vote === 'reject').length;

  if (approves >= review.requiredVotes) {
    await this.finalizeDecision(review, 'approved');
  } else if (rejects >= review.requiredVotes) {
    await this.finalizeDecision(review, 'rejected');
  }
}

private async finalizeDecision(
  review: CouncilReview,
  decision: 'approved' | 'rejected'
): Promise<void> {
  review.status = decision;
  review.decidedAt = new Date();
  review.outcome = {
    decision,
    reasoning: this.synthesizeReasoning(review.votes, decision),
  };

  // Create precedent
  await this.precedentService.create(review);

  // Cleanup
  for (const reviewer of review.reviewers) {
    reviewer.activeReviews--;
  }

  await this.persist(review);
  await this.notifyRequester(review);
}
```

### Test Cases
- 2 approves → approved
- 2 rejects → rejected
- 1-1 split → still pending
- Timeout → escalated

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/council/CouncilService.ts` | MODIFY |
| `src/core/council/CouncilService.test.ts` | MODIFY |

---

## Story 3.7: Precedent Service

**Story ID:** TRUST-3.7
**Points:** 3
**Priority:** P1

### Description
As the council system, I need to record and apply precedents so that similar requests get consistent treatment.

### Acceptance Criteria
- [ ] AC1: Create precedent from decided review
- [ ] AC2: Store: requestType, context patterns, decision, reasoning
- [ ] AC3: Calculate similarity score between new request and precedents
- [ ] AC4: Auto-apply precedent if similarity > 0.9 and confidence high
- [ ] AC5: Reference precedent in new decision if applied
- [ ] AC6: Allow precedent override with justification
- [ ] AC7: Precedents persist across restarts

### Technical Notes
```typescript
interface Precedent {
  id: string;
  requestType: CouncilReview['requestType'];
  contextPattern: Record<string, unknown>;  // Generalized pattern
  decision: 'approved' | 'rejected';
  reasoning: string;
  votes: CouncilVote[];
  confidence: number;
  createdAt: Date;
  appliedCount: number;
}

async findPrecedent(
  requestType: string,
  context: Record<string, unknown>
): Promise<Precedent | null> {
  const candidates = this.precedents.filter(p => p.requestType === requestType);

  for (const precedent of candidates) {
    const similarity = this.calculateSimilarity(context, precedent.contextPattern);
    if (similarity > 0.9 && precedent.confidence > 0.8) {
      return precedent;
    }
  }

  return null;
}
```

### Test Cases
- Precedent created from decision
- Similar request finds precedent
- Dissimilar request doesn't match
- Precedent applied correctly

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/council/PrecedentService.ts` | CREATE |
| `src/core/council/PrecedentService.test.ts` | CREATE |

---

## Story 3.8: HITL Gateway Integration

**Story ID:** TRUST-3.8
**Points:** 3
**Priority:** P0

### Description
As the governance system, I need to route requests to council when HITL is low so that distributed governance takes over from human oversight.

### Acceptance Criteria
- [ ] AC1: If HITL >= 50% → route to human approval
- [ ] AC2: If HITL < 50% → route to council review
- [ ] AC3: EMERGENCY type always routes to human
- [ ] AC4: Council timeout escalates to human
- [ ] AC5: Map approval types to council request types
- [ ] AC6: Await council decision before returning
- [ ] AC7: Feature flag `USE_COUNCIL` (default: true)

### Technical Notes
```typescript
// In HITLGateway
async requestApproval(
  type: ApprovalType,
  context: Record<string, unknown>,
  requesterId: AgentId
): Promise<ApprovalResult> {
  if (type === 'EMERGENCY' || !FEATURES.USE_COUNCIL) {
    return this.humanApproval(type, context, requesterId);
  }

  if (this.hitlLevel >= 50) {
    return this.humanApproval(type, context, requesterId);
  }

  // Route to council
  const review = await this.councilService.submitForReview(
    this.mapToCouncilType(type),
    requesterId,
    context
  );

  return this.awaitCouncilDecision(review);
}
```

### Test Cases
- HITL 60% → human
- HITL 40% → council
- EMERGENCY → always human
- Council timeout → escalates to human

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/HITLGateway.ts` | MODIFY |
| `src/core/HITLGateway.test.ts` | MODIFY |
| `src/core/config/features.ts` | MODIFY |

---

## Definition of Done (Epic 3)

- [ ] All 8 stories completed and merged
- [ ] 90%+ test coverage on council services
- [ ] Shadow mode tested: council + human decisions logged
- [ ] Council achieves 90%+ agreement with human (shadow)
- [ ] Precedent matching works correctly
- [ ] Feature flag allows bypass to human-only
- [ ] All existing HITLGateway tests pass
- [ ] Documentation updated
