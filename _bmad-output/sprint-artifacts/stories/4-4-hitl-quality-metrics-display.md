# Story 4.4: HITL Quality Metrics Display

## Story Info
- **Epic**: 4 - Cryptographic Audit Trail
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR26, FR27

## User Story

As an admin,
I want to view HITL operator quality metrics,
So that I can monitor review quality and identify automation bias risks.

## Acceptance Criteria

### AC1: Operator Metrics Card
**Given** I view HITL metrics
**When** viewing an operator's card
**Then** I see: avg review time, detail view rate, sample data view rate, scroll depth

### AC2: Risk Indicator
**Given** an operator's metrics are displayed
**When** viewing the card
**Then** I see a color-coded risk badge (low/medium/high)

### AC3: Summary Dashboard
**Given** I access the HITL metrics summary
**When** viewing the overview
**Then** I see: total operators, total decisions, avg metrics, risk distribution

## Technical Implementation

### Files Created/Modified
- web/src/components/mission-control/shared/HITLMetricsCard.tsx
- HITLMetricsSummaryCard component
- GET /api/v1/mission-control/metrics/hitl endpoint
- HITLQualityMetrics and HITLMetricsSummary types

## Definition of Done
- [x] HITLMetricsCard component with gauges
- [x] RiskBadge component
- [x] MetricGauge component with status coloring
- [x] HITLMetricsSummaryCard with stats and risk distribution
- [x] API endpoint for metrics
- [x] Unit tests
