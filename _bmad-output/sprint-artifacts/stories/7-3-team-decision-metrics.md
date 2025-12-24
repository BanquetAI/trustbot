# Story 7.3: Team Decision Metrics

## Story Info
- **Epic**: 7 - Team & Executive Dashboards
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR38

## User Story

As a supervisor,
I want to see my team's decision metrics,
So that I can track performance and identify trends.

## Acceptance Criteria

### AC1: Total Decisions
**Given** decisions have been made
**When** viewing metrics
**Then** I see total decision count for the period

### AC2: Approval/Denial Rates
**Given** decisions have been made
**When** viewing metrics
**Then** I see approval rate and denial rate percentages

### AC3: By Decision Type
**Given** different decision types exist
**When** viewing metrics
**Then** I see breakdown by type with counts and approval rates

### AC4: Period Selection
**Given** I want different time ranges
**When** selecting period
**Then** I can choose: 24h, 7d, 30d

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/team/metrics?period=7d - Returns team metrics

### Files Updated
- SupervisorDashboard.tsx - MetricsTrend component

## Definition of Done
- [x] TeamDecisionMetrics type added
- [x] GET /team/metrics endpoint with period param
- [x] MetricsTrend component
- [x] Decision type breakdown display
- [x] formatDuration helper
- [x] Unit tests
