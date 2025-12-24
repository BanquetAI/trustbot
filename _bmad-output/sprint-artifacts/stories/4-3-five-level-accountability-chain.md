# Story 4.3: Five-Level Accountability Chain Display

## Story Info
- **Epic**: 4 - Cryptographic Audit Trail
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR25

## User Story

As a user,
I want to see the complete 5-level accountability chain for any action,
So that I understand who is responsible at each level.

## Acceptance Criteria

### AC1: Five Levels Display
**Given** I view an audit entry's accountability chain
**When** the chain loads
**Then** I see 5 levels: Acting Agent, Supervising Agent, HITL Reviewer, Tribunal Members, Governance Owner

### AC2: Entity Navigation
**Given** an applicable level with an entity
**When** clicking on the entity name
**Then** I navigate to that entity's profile/details

### AC3: Non-Applicable Levels
**Given** a level that doesn't apply to this action
**When** viewing the chain
**Then** the level shows "N/A" with an explanation

## Technical Implementation

### Files Created/Modified
- web/src/components/mission-control/shared/AccountabilityChain.tsx
- GET /api/v1/mission-control/audit/:id/accountability endpoint
- AccountabilityLevel and AccountabilityChain types

## Definition of Done
- [x] AccountabilityChain component with 5 levels
- [x] AccountabilityLevelCard sub-component
- [x] Color-coded level badges
- [x] Entity click navigation
- [x] N/A state with reason display
- [x] Unit tests
