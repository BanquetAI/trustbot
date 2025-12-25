# Story 8.2: First Denial Learning Popup

## Story Info
- **Epic**: 8 - Onboarding & Education
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR47

## User Story

As an operator,
I want to see educational content when I deny a request for the first time,
So that I understand the implications of denials and best practices.

## Acceptance Criteria

### AC1: First Denial Detection
**Given** an operator denies a request
**When** it is their first denial ever
**Then** a learning popup is displayed after the action completes

### AC2: Popup Content
**Given** the first denial popup appears
**When** viewing the content
**Then** I see: title, explanation of denial impact, tips for denials, optional "Learn More" link

### AC3: Dismissal
**Given** the popup is displayed
**When** I dismiss it
**Then** my preference is saved and the popup won't show again for first_denial events

### AC4: One-Time Display
**Given** I have already seen the first denial popup
**When** I deny subsequent requests
**Then** the popup does not appear again

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/onboarding/popup/:eventType - Get popup content
- POST /api/v1/mission-control/onboarding/popup/:eventType/dismiss - Mark as seen

### Files Created/Modified
- web/src/components/mission-control/shared/OnboardingTour.tsx (LearningPopupCard)
- LearningPopup, LearningEventType types in types.ts

### Component Structure
```typescript
interface LearningPopupCardProps {
  popup: LearningPopup;
  onDismiss: () => void;
  onLearnMore?: () => void;
}

<LearningPopupCard
  popup={firstDenialPopup}
  onDismiss={handleDismiss}
/>
```

## Definition of Done
- [x] LearningPopupCard component created
- [x] first_denial event type handled
- [x] GET /onboarding/popup/:eventType endpoint
- [x] POST /onboarding/popup/:eventType/dismiss endpoint
- [x] LearningPopup, LearningEventType types added
- [x] Popup displays educational tips for denials
- [x] User progress tracked to prevent repeat display

## Deliverables
- `src/api/routes/mission-control/index.ts` (onboarding/popup endpoints)
- `web/src/components/mission-control/shared/OnboardingTour.tsx` (LearningPopupCard)
- `web/src/types.ts` (LearningPopup, LearningEventType types)
