# Story 4.5: Automation Bias Alerts

## Story Info
- **Epic**: 4 - Cryptographic Audit Trail
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR28

## User Story

As an admin,
I want to receive alerts when automation bias is detected,
So that I can intervene and ensure quality human oversight.

## Acceptance Criteria

### AC1: Alert Card Display
**Given** an automation bias alert is detected
**When** viewing the alerts list
**Then** I see: severity, status, user name, reason, metrics

### AC2: Severity Levels
**Given** an alert is displayed
**When** viewing severity
**Then** I see color-coded severity: low, medium, high, critical

### AC3: Acknowledge/Dismiss Actions
**Given** an active alert
**When** I take action
**Then** I can acknowledge or dismiss the alert
**And** the status updates accordingly

### AC4: Alert List
**Given** multiple alerts exist
**When** viewing the alerts list
**Then** active alerts are shown first
**And** past alerts are separated with a divider

## Technical Implementation

### Files Created/Modified
- web/src/components/mission-control/shared/BiasAlertCard.tsx
- BiasAlertList component
- SeverityBadge, StatusBadge, MetricsDisplay sub-components
- GET /api/v1/mission-control/alerts/bias endpoint
- POST /api/v1/mission-control/alerts/bias/:id/acknowledge endpoint
- AutomationBiasAlert type

## Definition of Done
- [x] BiasAlertCard component with full UI
- [x] BiasAlertList component with active/past separation
- [x] SeverityBadge with color coding
- [x] Acknowledge/Dismiss functionality
- [x] API endpoints for alerts
- [x] Unit tests
