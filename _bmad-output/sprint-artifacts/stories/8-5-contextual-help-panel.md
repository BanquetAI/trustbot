# Story 8.5: Contextual Help Panel

## Story Info
- **Epic**: 8 - Onboarding & Education
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR50

## User Story

As an operator,
I want to access on-demand help and trust explanations,
So that I can understand system concepts without leaving my workflow.

## Acceptance Criteria

### AC1: Help Panel Access
**Given** I am anywhere in Mission Control
**When** I click the help icon or press a keyboard shortcut
**Then** a contextual help panel opens

### AC2: Context-Aware Content
**Given** the help panel is open
**When** I am on a specific page/module
**Then** the help content is relevant to my current context

### AC3: Trust Explanations
**Given** I want to understand trust concepts
**When** viewing help content
**Then** I see explanations for: trust scores, tiers, capabilities, trust gates

### AC4: FAQ Section
**Given** the help panel is open
**When** viewing the FAQ section
**Then** I see common questions with expandable answers

### AC5: Related Topics
**Given** I am reading an explanation
**When** viewing the content
**Then** I see links to related topics for deeper learning

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/help/explanations - Get all trust explanations
- GET /api/v1/mission-control/help/context/:contextId - Get context-specific help

### Files Created
- web/src/components/mission-control/shared/HelpPanel.tsx
- web/src/components/mission-control/shared/HelpPanel.test.tsx
- TrustExplanation, HelpPanelContent types

### Component Structure
```typescript
interface HelpPanelProps {
  contextId?: string;
  isOpen: boolean;
  onClose: () => void;
}

<HelpPanel contextId="decision-queue" isOpen={true}>
  <ExplanationCard topic="trust-gates" />
  <FAQSection faqs={contextualFAQs} />
  <RelatedTopics topics={['trust-scores', 'tiers']} />
</HelpPanel>
```

## Definition of Done
- [x] HelpPanel component with slide-out drawer
- [x] ExplanationCard component for trust concepts
- [x] FAQItem component with expand/collapse
- [x] GET /help/explanations endpoint
- [x] GET /help/context/:contextId endpoint
- [x] TrustExplanation, HelpPanelContent types
- [x] Context-aware content loading
- [x] Unit tests (HelpPanel.test.tsx)

## Deliverables
- `src/api/routes/mission-control/index.ts` (help/explanations, help/context endpoints)
- `web/src/components/mission-control/shared/HelpPanel.tsx`
- `web/src/components/mission-control/shared/HelpPanel.test.tsx`
- `web/src/types.ts` (TrustExplanation, HelpPanelContent types)
