# Story 7.6: Active Incidents & Cost Avoided

## Story Info
- **Epic**: 7 - Team & Executive Dashboards
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR44, FR45

## User Story

As an executive,
I want to see active incidents and cost avoided metrics,
So that I can demonstrate ROI and prioritize incident response.

## Acceptance Criteria

### AC1: Active Incidents
**Given** incidents are occurring
**When** viewing incidents section
**Then** I see: active count, resolving count, resolved in 24h

### AC2: Incident Cards
**Given** active incidents exist
**When** viewing a card
**Then** I see: title, severity, status, affected agents, potential impact

### AC3: Cost Avoided Total
**Given** incidents have been prevented
**When** viewing cost avoided
**Then** I see total cost avoided (formatted as $XXK or $X.XM)

### AC4: Cost by Category
**Given** costs are categorized
**When** viewing breakdown
**Then** I see: category name, amount, incident count

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/executive/incidents - Returns incidents and cost avoided

### Files Updated
- ExecutiveDashboard.tsx - IncidentCard, CostAvoidedCard components

## Definition of Done
- [x] ActiveIncident type added
- [x] CostAvoidedMetrics type added
- [x] IncidentSummary type added
- [x] GET /executive/incidents endpoint
- [x] IncidentCard component
- [x] CostAvoidedCard component
- [x] formatCurrency helper
- [x] Severity color helper
- [x] Unit tests
