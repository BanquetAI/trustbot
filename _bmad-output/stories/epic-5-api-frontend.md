# Epic 5: API Extensions & Frontend Updates

**Epic ID:** TRUST-E5
**Priority:** MEDIUM
**Estimated Points:** 21 (API: 8, Frontend: 13)
**Dependencies:** Epics 1-4 (all core features)

---

## Part A: API Extensions (8 Points)

---

## Story 5.1: Trust Component Endpoints

**Story ID:** TRUST-5.1
**Points:** 2
**Priority:** P1

### Description
As an API consumer, I need endpoints to retrieve trust component details so that I can display granular trust information.

### Acceptance Criteria
- [ ] AC1: `GET /trust/:agentId/components` returns all 5 component scores
- [ ] AC2: Response includes raw, weighted, confidence for each component
- [ ] AC3: `GET /trust/:agentId/history?days=30` returns score history
- [ ] AC4: History includes daily snapshots with component breakdown
- [ ] AC5: Requires T2+ token or human token
- [ ] AC6: Returns 404 if agent not found

### API Specification
```yaml
GET /trust/{agentId}/components:
  responses:
    200:
      schema:
        type: object
        properties:
          agentId: string
          finalScore: number
          tier: string
          components:
            decisionAccuracy: ComponentScore
            ethicsCompliance: ComponentScore
            taskSuccess: ComponentScore
            operationalStability: ComponentScore
            peerReviews: ComponentScore
          trend: string
          lastUpdated: string

GET /trust/{agentId}/history:
  parameters:
    - name: days
      type: integer
      default: 30
  responses:
    200:
      schema:
        type: array
        items:
          type: object
          properties:
            date: string
            score: number
            components: object
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/api/UnifiedWorkflowAPI.ts` | MODIFY |
| `src/api/routes/trust.ts` | CREATE (optional refactor) |

---

## Story 5.2: Audit Verification Endpoints

**Story ID:** TRUST-5.2
**Points:** 2
**Priority:** P0 (Compliance)

### Description
As a compliance officer, I need endpoints to verify and export the audit trail so that I can prove integrity.

### Acceptance Criteria
- [ ] AC1: `GET /audit/verify?start=N&end=M` verifies chain segment
- [ ] AC2: Returns AuditChainStatus with isValid, entriesVerified, error
- [ ] AC3: `GET /audit/export?startDate=...&endDate=...&format=json|csv`
- [ ] AC4: Export includes chain verification status
- [ ] AC5: Requires HUMAN token only (compliance sensitive)
- [ ] AC6: Large exports stream response

### API Specification
```yaml
GET /audit/verify:
  parameters:
    - name: start
      type: integer
    - name: end
      type: integer
  responses:
    200:
      schema:
        type: object
        properties:
          isValid: boolean
          lastVerified: string
          entriesVerified: integer
          brokenAt: integer
          error: string

GET /audit/export:
  parameters:
    - name: startDate
      type: string
      format: date
    - name: endDate
      type: string
      format: date
    - name: format
      type: string
      enum: [json, csv]
  responses:
    200:
      content:
        application/json: {}
        text/csv: {}
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/api/UnifiedWorkflowAPI.ts` | MODIFY |

---

## Story 5.3: Council Endpoints

**Story ID:** TRUST-5.3
**Points:** 2
**Priority:** P1

### Description
As a council member, I need endpoints to view and vote on reviews so that I can participate in governance.

### Acceptance Criteria
- [ ] AC1: `GET /council/reviews` lists pending reviews (for current user)
- [ ] AC2: `GET /council/reviews/:id` gets review details
- [ ] AC3: `POST /council/reviews/:id/vote` submits vote
- [ ] AC4: Vote body: `{ vote, reasoning, confidence }`
- [ ] AC5: `GET /council/members` lists council members
- [ ] AC6: Requires T4+ token for voting
- [ ] AC7: Returns appropriate errors for unauthorized/invalid

### API Specification
```yaml
GET /council/reviews:
  responses:
    200:
      schema:
        type: array
        items:
          $ref: '#/components/schemas/CouncilReview'

POST /council/reviews/{reviewId}/vote:
  requestBody:
    schema:
      type: object
      required: [vote, reasoning, confidence]
      properties:
        vote:
          type: string
          enum: [approve, reject, abstain]
        reasoning:
          type: string
        confidence:
          type: number
          minimum: 0
          maximum: 1
  responses:
    200:
      schema:
        $ref: '#/components/schemas/CouncilReview'
    401:
      description: Not authorized to vote
    409:
      description: Already voted
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/api/UnifiedWorkflowAPI.ts` | MODIFY |
| `src/api/routes/council.ts` | CREATE (optional refactor) |

---

## Story 5.4: Delegation & Budget Endpoints

**Story ID:** TRUST-5.4
**Points:** 2
**Priority:** P1

### Description
As an agent or operator, I need endpoints for delegation and budget management so that capabilities and limits are accessible.

### Acceptance Criteria
- [ ] AC1: `POST /delegation/request` creates delegation request
- [ ] AC2: `GET /delegation/:agentId/active` lists active delegations
- [ ] AC3: `DELETE /delegation/:id` revokes delegation (human only)
- [ ] AC4: `GET /autonomy/:agentId/budget` returns current budget status
- [ ] AC5: `POST /autonomy/:agentId/action` records action (internal use)
- [ ] AC6: Budget endpoint returns used/max/percentage/resetsIn
- [ ] AC7: Appropriate auth for each endpoint

### API Specification
```yaml
POST /delegation/request:
  requestBody:
    schema:
      type: object
      required: [agentId, capabilities, reason, duration]
      properties:
        agentId: string
        capabilities: array
        reason: string
        duration: integer
  responses:
    200:
      schema:
        $ref: '#/components/schemas/DelegationRequest'

GET /autonomy/{agentId}/budget:
  responses:
    200:
      schema:
        type: object
        properties:
          used: integer
          max: integer
          percentage: number
          resetsIn: integer
          tier: integer
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/api/UnifiedWorkflowAPI.ts` | MODIFY |

---

## Part B: Frontend Updates (13 Points)

---

## Story 5.5: Trust Score Gauge Component

**Story ID:** TRUST-5.5
**Points:** 3
**Priority:** P1

### Description
As a user, I need a visual gauge showing trust scores so that I can quickly understand agent trust levels.

### Acceptance Criteria
- [ ] AC1: Circular gauge showing 300-1000 score
- [ ] AC2: Color gradient: red (300) → yellow (600) → green (1000)
- [ ] AC3: Tier badge displayed in center
- [ ] AC4: Trend indicator (arrow up/down/stable)
- [ ] AC5: Hover shows component breakdown
- [ ] AC6: Animates on score change
- [ ] AC7: Responsive sizing

### Component Design
```tsx
<TrustScoreGauge
  score={875}
  tier="EXECUTIVE"
  trend="rising"
  components={componentScores}
  size="medium" // small | medium | large
/>
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `web/src/components/TrustScoreGauge.tsx` | CREATE |
| `web/src/components/TrustScoreGauge.css` | CREATE |

---

## Story 5.6: Component Breakdown Panel

**Story ID:** TRUST-5.6
**Points:** 2
**Priority:** P1

### Description
As a user, I need to see the breakdown of trust components so that I understand why an agent has its score.

### Acceptance Criteria
- [ ] AC1: Bar chart showing 5 components
- [ ] AC2: Each bar labeled with component name
- [ ] AC3: Show raw score and weight percentage
- [ ] AC4: Color-coded by score (red/yellow/green)
- [ ] AC5: Confidence indicator per component
- [ ] AC6: Tooltip with detailed explanation

### Component Design
```tsx
<ComponentBreakdown
  components={{
    decisionAccuracy: { raw: 85, weighted: 29.75, confidence: 0.9 },
    ethicsCompliance: { raw: 100, weighted: 25, confidence: 1.0 },
    // ...
  }}
/>
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `web/src/components/ComponentBreakdown.tsx` | CREATE |

---

## Story 5.7: Council Review Panel

**Story ID:** TRUST-5.7
**Points:** 3
**Priority:** P1

### Description
As a council member, I need a panel to view and vote on reviews so that I can participate in governance from the UI.

### Acceptance Criteria
- [ ] AC1: List of pending reviews assigned to current user
- [ ] AC2: Review card shows: type, requester, context summary
- [ ] AC3: Expandable detail view with full context
- [ ] AC4: Vote buttons: Approve, Reject, Abstain
- [ ] AC5: Reasoning text field (required)
- [ ] AC6: Confidence slider (0-100%)
- [ ] AC7: Shows other votes after submitting
- [ ] AC8: Auto-refresh on decision

### Component Design
```tsx
<CouncilPanel
  reviews={pendingReviews}
  currentAgentId={myAgentId}
  onVote={handleVote}
/>
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `web/src/components/CouncilPanel.tsx` | CREATE |
| `web/src/components/ReviewCard.tsx` | CREATE |
| `web/src/components/VoteForm.tsx` | CREATE |

---

## Story 5.8: Delegation Request Modal

**Story ID:** TRUST-5.8
**Points:** 2
**Priority:** P2

### Description
As an operator, I need a modal to request capability delegations so that agents can get temporary permissions.

### Acceptance Criteria
- [ ] AC1: Modal triggered from agent detail view
- [ ] AC2: Capability checklist (multi-select)
- [ ] AC3: Reason text field
- [ ] AC4: Duration selector (15min, 30min, 1h, 4h, 24h)
- [ ] AC5: Shows eligibility for auto-approval
- [ ] AC6: Submit button with loading state
- [ ] AC7: Success/error feedback

### Component Design
```tsx
<DelegationModal
  agentId={selectedAgentId}
  availableCapabilities={PERMISSIONS}
  onSubmit={handleDelegationRequest}
  onClose={closeModal}
/>
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `web/src/components/DelegationModal.tsx` | CREATE |

---

## Story 5.9: Autonomy Budget Widget

**Story ID:** TRUST-5.9
**Points:** 2
**Priority:** P1

### Description
As a user, I need to see agent autonomy budgets so that I know how much capacity agents have remaining.

### Acceptance Criteria
- [ ] AC1: Progress bar showing used/max
- [ ] AC2: Percentage label
- [ ] AC3: Time until reset countdown
- [ ] AC4: Color changes as budget depletes (green → yellow → red)
- [ ] AC5: Tooltip shows tier and limits
- [ ] AC6: Updates in real-time

### Component Design
```tsx
<AutonomyBudgetWidget
  used={45}
  max={50}
  resetsIn={36000000} // ms
  tier={3}
/>
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `web/src/components/AutonomyBudgetWidget.tsx` | CREATE |

---

## Story 5.10: Dashboard Integration

**Story ID:** TRUST-5.10
**Points:** 3
**Priority:** P0

### Description
As a user, I need all new components integrated into the main dashboard so that I have a unified view.

### Acceptance Criteria
- [ ] AC1: Trust gauge in agent cards
- [ ] AC2: Component breakdown in agent detail modal
- [ ] AC3: Council panel in sidebar (for T4+ users)
- [ ] AC4: Budget widget in agent cards
- [ ] AC5: Delegation button in agent detail
- [ ] AC6: Audit verification status in footer
- [ ] AC7: All data refreshes on interval (30s)

### Integration Points
```
Dashboard
├── Header
├── Agent Cards (updated)
│   ├── TrustScoreGauge ← NEW
│   └── AutonomyBudgetWidget ← NEW
├── Sidebar
│   └── CouncilPanel ← NEW (T4+ only)
├── Agent Detail Modal (updated)
│   ├── ComponentBreakdown ← NEW
│   └── DelegationModal trigger ← NEW
└── Footer
    └── Audit chain status ← NEW
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `web/src/App.tsx` | MODIFY |
| `web/src/components/AgentCard.tsx` | MODIFY or CREATE |
| `web/src/api.ts` | MODIFY - add new endpoints |

---

## Definition of Done (Epic 5)

- [ ] All 10 stories completed and merged
- [ ] API endpoints documented in OpenAPI spec
- [ ] All new components have Storybook stories
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Loading and error states implemented
- [ ] Real-time updates working
- [ ] Integration tests for critical paths
- [ ] Accessibility audit passed (WCAG 2.1 AA)
