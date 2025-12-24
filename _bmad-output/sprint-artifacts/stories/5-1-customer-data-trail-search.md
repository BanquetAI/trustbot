# Story 5.1: Customer Data Trail Search

## Story Info
- **Epic**: 5 - Compliance & Evidence Packages
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR26

## User Story

As a compliance analyst,
I want to search for all data access events related to a specific customer,
So that I can respond to regulatory inquiries and data subject requests.

## Acceptance Criteria

### AC1: Customer ID Search
**Given** I enter a customer ID
**When** I submit the search
**Then** I see all data access events related to that customer

### AC2: Filter by Date Range
**Given** I specify start and end dates
**When** searching
**Then** results are limited to that date range

### AC3: Filter by Operation Type
**Given** I select an operation type (read/write/delete/export)
**When** searching
**Then** results show only that operation type

### AC4: Filter by Data Category
**Given** I select a data category
**When** searching
**Then** results show only entries for that category

### AC5: Evidence Package Link
**Given** I have search results
**When** I click Generate Evidence Package
**Then** I'm taken to the evidence package form pre-filled with the customer ID

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/compliance/search - Search with cursor pagination

### Files Created
- web/src/components/mission-control/shared/CustomerDataTrailSearch.tsx
- web/src/components/mission-control/shared/CustomerDataTrailSearch.test.tsx
- CustomerDataTrailEntry, CustomerDataTrailFilters types

## Definition of Done
- [x] CustomerDataTrailEntry types added to types.ts
- [x] GET /compliance/search endpoint with filters
- [x] SearchForm component with all filter options
- [x] TrailEntryCard component with operation badges
- [x] Hash status display on entries
- [x] View Chain button for accountability
- [x] Generate Evidence Package integration
- [x] Unit tests
