# Story 5.2: Evidence Package Generator

## Story Info
- **Epic**: 5 - Compliance & Evidence Packages
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR27

## User Story

As a compliance analyst,
I want to generate evidence packages for regulatory inquiries,
So that I can provide tamper-proof documentation of customer data handling.

## Acceptance Criteria

### AC1: Request Package
**Given** I fill in customer ID, date range, format, and reason
**When** I submit the request
**Then** a package generation job starts and I see "generating" status

### AC2: Package Status Tracking
**Given** a package is being generated
**When** viewing the package card
**Then** I see status: generating, ready, expired, or failed

### AC3: Download Ready Package
**Given** a package is ready
**When** I click Download
**Then** the evidence package file downloads

### AC4: Hash Integrity Report
**Given** a ready package
**When** viewing details
**Then** I see hash verification stats (verified/total, chain status)

### AC5: Package Summary
**Given** a ready package
**When** viewing details
**Then** I see: total actions, agents involved, data categories, HITL decisions

## Technical Implementation

### API Endpoints
- POST /api/v1/mission-control/compliance/evidence-package - Request new package
- GET /api/v1/mission-control/compliance/evidence-package/:id - Get package status
- GET /api/v1/mission-control/compliance/evidence-packages - List all packages
- GET /api/v1/mission-control/compliance/evidence-package/:id/download - Download package

### Files Created
- web/src/components/mission-control/shared/EvidencePackageCard.tsx
- web/src/components/mission-control/shared/EvidencePackageCard.test.tsx
- EvidencePackage, EvidencePackageRequest, HashIntegrityReport types

## Definition of Done
- [x] EvidencePackage types added to types.ts
- [x] POST /evidence-package endpoint for requests
- [x] GET /evidence-package/:id endpoint for status
- [x] GET /evidence-packages endpoint for list
- [x] GET /evidence-package/:id/download endpoint
- [x] PackageRequestForm component with validation
- [x] EvidencePackageCard with status display
- [x] HashIntegrityBadge component
- [x] EvidencePackageList component
- [x] Async generation simulation
- [x] Unit tests
