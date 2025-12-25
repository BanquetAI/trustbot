# Story 8.3: First Approval Request Learning

## Story Info
- **Epic**: 8 - Onboarding & Education
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR48

## User Story

As an operator,
I want to see educational content when I approve a request for the first time,
So that I understand the trust implications and review best practices.

## Acceptance Criteria

### AC1: First Approval Detection
**Given** an operator approves a request
**When** it is their first approval ever
**Then** a learning popup is displayed after the action completes

### AC2: Popup Content
**Given** the first approval popup appears
**When** viewing the content
**Then** I see: title, explanation of approval impact on agent trust, tips for thorough reviews

### AC3: Review Importance
**Given** the popup is displayed
**When** reading the tips
**Then** I understand: why reviewing details matters, how approvals affect trust scores, what to look for before approving

### AC4: One-Time Display
**Given** I have already seen the first approval popup
**When** I approve subsequent requests
**Then** the popup does not appear again

## Technical Implementation

### Reuses Story 8.2 Infrastructure
- Same LearningPopupCard component
- Same API endpoints with different eventType
- first_approval event type

### Component Usage
```typescript
<LearningPopupCard
  popup={{
    id: 'first-approval',
    eventType: 'first_approval',
    title: 'Your First Approval!',
    content: 'Approving requests increases agent trust...',
    tips: ['Review sample data', 'Check trust gate reasons', 'Consider impact'],
    dismissable: true,
    showOnce: true
  }}
  onDismiss={handleDismiss}
/>
```

## Definition of Done
- [x] first_approval event type handled
- [x] Approval-specific educational content
- [x] Tips focused on review best practices
- [x] Trust score impact explanation
- [x] User progress tracked (UserLearningProgress type)

## Deliverables
- `web/src/components/mission-control/shared/OnboardingTour.tsx` (shared with 8.2)
- `web/src/types.ts` (UserLearningProgress type)
