# Story 7.2: Cross-Operator Activity Patterns

## Story Info
- **Epic**: 7 - Team & Executive Dashboards
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR37

## User Story

As a supervisor,
I want to see patterns across my operators' activity,
So that I can identify outliers and coaching opportunities.

## Acceptance Criteria

### AC1: Activity Patterns
**Given** operators have activity data
**When** viewing patterns
**Then** I see approval rates, review times, and counts by time block

### AC2: Team Averages
**Given** a team with multiple operators
**When** viewing patterns
**Then** I see team-wide averages for comparison

### AC3: Outlier Detection
**Given** an operator deviates significantly from the team average
**When** viewing patterns
**Then** they appear in the outliers section with deviation percentage

### AC4: Outlier Severity
**Given** outliers exist
**When** viewing them
**Then** severity is shown: low (10-20%), medium (20-30%), high (30%+)

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/team/patterns - Returns cross-operator patterns

### Files Updated
- SupervisorDashboard.tsx - OutlierAlert component

## Definition of Done
- [x] OperatorActivityPattern type added
- [x] CrossOperatorPatterns type added
- [x] GET /team/patterns endpoint
- [x] OutlierAlert component
- [x] Deviation color helper
- [x] Unit tests
