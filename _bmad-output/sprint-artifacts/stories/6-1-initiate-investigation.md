# Story 6.1: Initiate Investigation

## Story Info
- **Epic**: 6 - Investigation Management
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR31

## User Story

As a supervisor,
I want to initiate investigations from suspicious events,
So that I can proactively address potential trust violations.

## Acceptance Criteria

### AC1: Investigation Creation
**Given** I identify a suspicious event
**When** I click "Initiate Investigation"
**Then** an investigation is created with the event as trigger

### AC2: Investigation Form
**Given** I am creating an investigation
**When** filling the form
**Then** I can set: title, description, type, priority, assignee

### AC3: Investigation Types
**Given** I create an investigation
**When** selecting type
**Then** options include: suspicious_activity, trust_violation, data_anomaly, pattern_alert, manual

### AC4: Initial Scope
**Given** I create an investigation
**When** specifying scope
**Then** I can select agent(s) and time range to investigate

## Technical Implementation

### API Endpoints
- POST /api/v1/mission-control/investigations - Create new investigation
- GET /api/v1/mission-control/investigations - List investigations
- GET /api/v1/mission-control/investigations/:id - Get investigation details

### Files Created
- web/src/components/mission-control/shared/InvestigationCard.tsx
- web/src/components/mission-control/shared/InvestigationCard.test.tsx
- Investigation, InvestigationScope, InvestigationStatus types

## Definition of Done
- [x] Investigation types added to types.ts
- [x] POST /investigations endpoint
- [x] GET /investigations endpoint
- [x] GET /investigations/:id endpoint
- [x] InvestigationCard component with form actions
- [x] InvestigationList component
- [x] Priority and Status badges
- [x] Unit tests
