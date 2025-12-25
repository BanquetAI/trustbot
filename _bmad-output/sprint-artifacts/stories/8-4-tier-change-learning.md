# Story 8.4: Tier Change Learning

## Story Info
- **Epic**: 8 - Onboarding & Education
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR49

## User Story

As an operator,
I want to see educational content when an agent's tier changes,
So that I understand what caused the change and its implications.

## Acceptance Criteria

### AC1: Tier Upgrade Detection
**Given** an agent's trust score increases past a tier threshold
**When** viewing the agent or decision that caused the change
**Then** a learning popup explains the tier upgrade

### AC2: Tier Downgrade Detection
**Given** an agent's trust score decreases past a tier threshold
**When** viewing the agent or decision that caused the change
**Then** a learning popup explains the tier downgrade and implications

### AC3: Contextual Content
**Given** a tier change popup appears
**When** viewing the content
**Then** I see: which tier changed, what caused it, what new capabilities/restrictions apply

### AC4: Capability Changes
**Given** a tier upgrade popup
**When** reading the content
**Then** I understand what new capabilities the agent gained (e.g., delegation, spawning)

## Technical Implementation

### Event Types
- tier_change_up - Agent promoted to higher tier
- tier_change_down - Agent demoted to lower tier

### API Endpoints
- POST /api/v1/mission-control/onboarding/popup/:eventType/dismiss

### Component Usage
```typescript
<LearningPopupCard
  popup={{
    eventType: 'tier_change_up',
    title: 'Agent Promoted to Verified!',
    content: 'This agent has demonstrated consistent performance...',
    tips: [
      'Can now delegate tasks to other agents',
      'Increased concurrent task limit',
      'Monitor for responsible capability use'
    ]
  }}
/>
```

## Definition of Done
- [x] tier_change_up event type handled
- [x] tier_change_down event type handled
- [x] Contextual content based on old/new tier
- [x] Capability change explanations
- [x] POST /popup/:eventType/dismiss endpoint
- [x] LearningPopupProvider manages popup lifecycle

## Deliverables
- `src/api/routes/mission-control/index.ts` (popup dismiss endpoint)
- `web/src/components/mission-control/shared/OnboardingTour.tsx` (LearningPopupProvider)
