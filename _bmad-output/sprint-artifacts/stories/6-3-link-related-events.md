# Story 6.3: Link Related Events

## Story Info
- **Epic**: 6 - Investigation Management
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR33

## User Story

As an investigator,
I want to link related events to an investigation,
So that I can build a complete picture of the incident.

## Acceptance Criteria

### AC1: Link Event Button
**Given** an open investigation
**When** I click "Link Event"
**Then** I can search for and select an event to link

### AC2: Relationship Types
**Given** I am linking an event
**When** selecting relationship
**Then** options include: related, cause, effect, duplicate

### AC3: Link with Notes
**Given** I am linking an event
**When** adding the link
**Then** I can optionally add notes explaining the relationship

### AC4: Linked Events Display
**Given** an investigation with linked events
**When** viewing expanded details
**Then** I see all linked events with their relationships

## Technical Implementation

### API Endpoints
- POST /api/v1/mission-control/investigations/:id/events - Link an event

### Files Updated
- InvestigationCard.tsx - LinkedEventCard sub-component
- LinkedEvent type added

## Definition of Done
- [x] POST /investigations/:id/events endpoint
- [x] Link Event button in InvestigationCard
- [x] LinkedEventCard component
- [x] Relationship badges with colors
- [x] Notes display support
- [x] Unit tests
