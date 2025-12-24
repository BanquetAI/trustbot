# Story 7.1: Supervisor View - Team Operators

## Story Info
- **Epic**: 7 - Team & Executive Dashboards
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR36

## User Story

As a supervisor,
I want to see my team's operators in one view,
So that I can monitor workload and support my team effectively.

## Acceptance Criteria

### AC1: Team Overview
**Given** I am a supervisor
**When** I view the supervisor dashboard
**Then** I see my team's name, size, online count, and pending total

### AC2: Operator Cards
**Given** I view the team list
**When** looking at an operator
**Then** I see: name, role, status (online/away/offline), pending reviews, completed today

### AC3: Status Indicators
**Given** operators have different statuses
**When** viewing the list
**Then** online shows green, away shows amber, offline shows gray

### AC4: Quality Scores
**Given** each operator has a quality score
**When** viewing the card
**Then** I see color-coded quality percentages

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/team/operators - Returns team operators

### Files Created
- web/src/components/mission-control/shared/SupervisorDashboard.tsx
- web/src/components/mission-control/shared/SupervisorDashboard.test.tsx
- TeamOperator, SupervisorTeamView types

## Definition of Done
- [x] TeamOperator type added to types.ts
- [x] SupervisorTeamView type added
- [x] GET /team/operators endpoint
- [x] OperatorCard component
- [x] TeamSummary component
- [x] Status color/icon helpers
- [x] Unit tests
