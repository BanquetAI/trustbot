# Story 8.1: Guided Tooltip Tour

## Story Info
- **Epic**: 8 - Onboarding & Education
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR46

## User Story

As a new operator,
I want to be guided through the Mission Control interface with tooltips,
So that I can quickly learn how to use the system effectively.

## Acceptance Criteria

### AC1: Tour Initialization
**Given** a new user accesses Mission Control for the first time
**When** the tour is available
**Then** they see a welcome prompt offering to start the guided tour

### AC2: Tooltip Navigation
**Given** the tour is active
**When** viewing a tooltip
**Then** I can navigate Next, Previous, or Skip the tour
**And** I see my progress (e.g., "Step 3 of 8")

### AC3: Element Spotlight
**Given** a tooltip is displayed
**When** it targets a UI element
**Then** that element is highlighted with a spotlight effect
**And** the rest of the UI is slightly dimmed

### AC4: Tour Completion
**Given** I complete all tour steps
**When** finishing the tour
**Then** my progress is saved so the tour doesn't repeat
**And** I can restart it from settings if desired

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/onboarding/tour/:tourId - Get tour configuration
- POST /api/v1/mission-control/onboarding/tour/:tourId/progress - Update progress

### Files Created
- web/src/components/mission-control/shared/OnboardingTour.tsx
- web/src/components/mission-control/shared/OnboardingTour.test.tsx
- TourStep, TourConfig, TourState types in types.ts

### Component Structure
```typescript
// Tooltip component with positioning
<Tooltip step={step} onNext={} onPrev={} onSkip={} />

// Spotlight overlay
<Spotlight targetSelector={step.target} padding={step.spotlightPadding} />

// Tour provider
<TourProvider config={tourConfig}>
  <App />
</TourProvider>
```

## Definition of Done
- [x] OnboardingTour component with Tooltip sub-component
- [x] Spotlight overlay with dynamic positioning
- [x] Tour navigation (next/prev/skip/complete)
- [x] GET /onboarding/tour/:tourId endpoint
- [x] POST /onboarding/tour/:tourId/progress endpoint
- [x] TourStep, TourConfig types added to types.ts
- [x] Unit tests (OnboardingTour.test.tsx)

## Deliverables
- `src/api/routes/mission-control/index.ts` (onboarding/tour endpoints)
- `web/src/components/mission-control/shared/OnboardingTour.tsx`
- `web/src/components/mission-control/shared/OnboardingTour.test.tsx`
- `web/src/types.ts` (TourStep, TourConfig, TourState types)
