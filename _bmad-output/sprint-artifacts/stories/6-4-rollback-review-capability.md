# Story 6.4: Rollback Review Capability

## Story Info
- **Epic**: 6 - Investigation Management
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR34

## User Story

As a director,
I want to request rollbacks for decisions under investigation,
So that I can undo potentially harmful actions.

## Acceptance Criteria

### AC1: Request Rollback Button
**Given** an open investigation
**When** I click "Request Rollback"
**Then** I can select a decision to rollback and provide reason

### AC2: Rollback Status
**Given** a rollback request
**When** viewing the investigation
**Then** I see status: pending, completed, or failed

### AC3: Affected Records
**Given** a completed rollback
**When** viewing details
**Then** I see the number of affected records

### AC4: Rollback History
**Given** an investigation with rollbacks
**When** expanded
**Then** I see all rollback records with details

## Technical Implementation

### API Endpoints
- POST /api/v1/mission-control/investigations/:id/rollback - Request rollback

### Files Updated
- InvestigationCard.tsx - RollbackCard sub-component
- RollbackRecord type added

## Definition of Done
- [x] POST /investigations/:id/rollback endpoint
- [x] Request Rollback button (warning style)
- [x] RollbackCard component
- [x] Status badges (pending/completed/failed)
- [x] Affected records count display
- [x] Unit tests
