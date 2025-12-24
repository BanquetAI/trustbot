# Story 4.2: Hash Chain Verification Badges

## Story Info
- **Epic**: 4 - Cryptographic Audit Trail
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR24

## User Story

As a user,
I want to see hash verification badges on audit entries,
So that I can visually confirm the integrity of records.

## Acceptance Criteria

### AC1: Visual Hash Status
**Given** I view an audit entry
**When** looking at the hash badge
**Then** I see a visual indicator showing: verified, unverified, invalid, or checking

### AC2: Click to Verify
**Given** an unverified hash badge
**When** clicking on it
**Then** the system verifies the hash chain for that entry
**And** updates the badge status accordingly

### AC3: Tamper Detection
**Given** a hash fails verification
**When** viewing the entry
**Then** I see a clear warning indicator
**And** the entry is flagged as potentially tampered

## Technical Implementation

### Files Created/Modified
- web/src/components/mission-control/shared/AuditEntry.tsx (HashBadge, TamperProofIndicator)
- GET /api/v1/mission-control/audit/:id/verify endpoint

## Definition of Done
- [x] HashBadge component with status colors and icons
- [x] TamperProofIndicator component
- [x] Verification API endpoint
- [x] Helper functions for status display
- [x] Unit tests
