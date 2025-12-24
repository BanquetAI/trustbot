# Story 6.5: Pattern Anomaly Detection

## Story Info
- **Epic**: 6 - Investigation Management
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR35

## User Story

As a supervisor,
I want to see pattern anomalies detected in an investigation,
So that I can identify systemic issues.

## Acceptance Criteria

### AC1: Anomaly Display
**Given** an investigation with detected anomalies
**When** viewing expanded details
**Then** I see Pattern Anomalies section

### AC2: Anomaly Details
**Given** a pattern anomaly
**When** viewing it
**Then** I see: pattern name, severity, description, baseline comparison

### AC3: Baseline Comparison
**Given** an anomaly
**When** viewing baseline
**Then** I see: expected value, actual value, deviation percentage

### AC4: Confirm/Dismiss Actions
**Given** a detected anomaly
**When** reviewing it
**Then** I can Confirm or Dismiss it

### AC5: Anomaly Status
**Given** anomalies
**When** confirmed/dismissed
**Then** action buttons are hidden and status is updated

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/anomalies - List anomalies
- PUT /api/v1/mission-control/anomalies/:id/status - Update status

### Files Updated
- InvestigationCard.tsx - AnomalyCard sub-component
- PatternAnomaly, AnomalyBaseline types added

## Definition of Done
- [x] GET /anomalies endpoint
- [x] PUT /anomalies/:id/status endpoint
- [x] AnomalyCard component with severity badges
- [x] Baseline metrics display
- [x] Confirm/Dismiss buttons
- [x] onUpdateAnomalyStatus callback chain
- [x] Unit tests
