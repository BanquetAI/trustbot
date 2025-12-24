# Story 7.5: HITL Load & Autonomous Rate Metrics

## Story Info
- **Epic**: 7 - Team & Executive Dashboards
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR42, FR43

## User Story

As an executive,
I want to see HITL load and autonomous decision rates,
So that I can understand staffing needs and automation effectiveness.

## Acceptance Criteria

### AC1: Autonomous Rate
**Given** decisions are being made
**When** viewing HITL load
**Then** I see the percentage of autonomous vs HITL-required decisions

### AC2: Capacity Utilization
**Given** reviewers are working
**When** viewing load metrics
**Then** I see capacity utilization percentage

### AC3: Queue Health
**Given** decisions are queued
**When** viewing status
**Then** I see: healthy, backlogged, or overloaded

### AC4: Decision Breakdown
**Given** decisions are tracked
**When** viewing details
**Then** I see: total, HITL required, autonomous counts

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/executive/hitl-load - Returns HITL load metrics

### Files Updated
- ExecutiveDashboard.tsx - HITLLoadCard component

## Definition of Done
- [x] HITLLoadMetrics type added
- [x] GET /executive/hitl-load endpoint
- [x] HITLLoadCard component
- [x] Queue health icon helper
- [x] Decision count breakdown
- [x] Unit tests
