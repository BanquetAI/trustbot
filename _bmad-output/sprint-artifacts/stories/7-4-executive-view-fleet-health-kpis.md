# Story 7.4: Executive View - Fleet Health KPIs

## Story Info
- **Epic**: 7 - Team & Executive Dashboards
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR39, FR40, FR41

## User Story

As a director/executive,
I want to see fleet health and KPIs at a glance,
So that I can make strategic decisions about AI operations.

## Acceptance Criteria

### AC1: Health Indicators
**Given** I view the executive dashboard
**When** looking at health
**Then** I see: overall status (healthy/warning/critical), trust trend, risk level

### AC2: Fleet Summary
**Given** agents are operating
**When** viewing the dashboard
**Then** I see: total agents, active agents, average trust score

### AC3: Trust Distribution
**Given** agents have different tiers
**When** viewing distribution
**Then** I see bar chart of agents per tier

### AC4: KPI Cards
**Given** KPIs are tracked
**When** viewing cards
**Then** I see: name, value, target, status (above/on/below), trend

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/executive/kpis - Returns fleet health KPIs

### Files Created
- web/src/components/mission-control/shared/ExecutiveDashboard.tsx
- web/src/components/mission-control/shared/ExecutiveDashboard.test.tsx
- FleetHealthKPIs type

## Definition of Done
- [x] FleetHealthKPIs type added
- [x] GET /executive/kpis endpoint
- [x] HealthIndicator component
- [x] KPICard component
- [x] TrustDistribution component
- [x] Color helpers for statuses
- [x] Unit tests
