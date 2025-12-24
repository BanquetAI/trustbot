# Story 6.2: Expand Investigation Scope

## Story Info
- **Epic**: 6 - Investigation Management
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR32

## User Story

As an investigator,
I want to expand an investigation's scope,
So that I can include additional agents or time periods when new information emerges.

## Acceptance Criteria

### AC1: Expand Scope Button
**Given** an open investigation
**When** I click "Expand Scope"
**Then** I can add agents or extend the time range

### AC2: Scope Expansion Form
**Given** I am expanding scope
**When** filling the form
**Then** I can: add agent IDs, extend start/end dates, provide reason

### AC3: Expansion History
**Given** a scope has been expanded
**When** viewing investigation details
**Then** I see the scope expansion indicator

### AC4: Audit Trail
**Given** a scope expansion
**When** complete
**Then** the expansion is recorded with timestamp and reason

## Technical Implementation

### API Endpoints
- PUT /api/v1/mission-control/investigations/:id/scope - Expand scope

### Files Updated
- InvestigationCard.tsx - onExpandScope callback
- InvestigationScope type with expansions array

## Definition of Done
- [x] PUT /investigations/:id/scope endpoint
- [x] Expand Scope button in InvestigationCard
- [x] Scope expansion indicator in UI
- [x] ScopeExpansion type added
- [x] Unit tests
