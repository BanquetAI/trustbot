# Story 2.6: Sample Data Viewing

## Story Info
- **Epic**: 2 - Decision Queue & Morning Review
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR18

## User Story

As an operator,
I want to view a sample of the data an agent is requesting to process,
So that I can make informed approval decisions while sensitive data is masked.

## Acceptance Criteria

### AC1: Sample Data Display
**Given** an operator views a pending action request
**When** they click "View Sample Data"
**Then** a modal shows a representative sample of the data
**And** the sample is limited to a reasonable size (max 10 records)

### AC2: Data Masking
**Given** the sample data contains sensitive fields
**When** the data is displayed
**Then** PII fields are masked (e.g., email, phone, SSN)
**And** the operator can see field types without full values

### AC3: Masking Indicators
**Given** masked data is displayed
**When** viewing the sample
**Then** masked fields show a visual indicator
**And** a legend explains the masking types used

## Technical Implementation

### API Specification

#### GET /api/v1/mission-control/decisions/:id/sample
Returns masked sample data for a decision.

**Query Parameters:**
- `limit` (optional): Max records to return (default: 5, max: 10)

**Response:**
```json
{
  "decisionId": "uuid",
  "actionType": "data_export",
  "sampleData": [
    {
      "id": "REC-001",
      "customer_name": "J*** D**",
      "email": "j***@***.com",
      "amount": 1250.00,
      "status": "active"
    }
  ],
  "maskedFields": [
    { "field": "customer_name", "type": "name", "reason": "PII" },
    { "field": "email", "type": "email", "reason": "PII" }
  ],
  "totalRecords": 15000,
  "sampleSize": 5
}
```

### Masking Rules
- **Email**: Show first letter + domain hint (`j***@***.com`)
- **Name**: Show initials with asterisks (`J*** D**`)
- **Phone**: Show last 4 digits (`***-***-1234`)
- **SSN**: Show last 4 digits (`***-**-1234`)
- **Address**: Show city/state only
- **Financial**: Show ranges instead of exact values

### Files to Create
- `web/src/components/mission-control/shared/SampleDataViewer.tsx`
- `web/src/components/mission-control/shared/SampleDataViewer.test.tsx`

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Add sample endpoint

### Dependencies
- Story 2.1 (TaskPipelineModule)

## Definition of Done
- [x] GET /api/v1/mission-control/decisions/:id/sample endpoint working
- [x] SampleDataViewer component created
- [x] Data masking applied to PII fields (email, name, phone, ssn, hostname)
- [x] Masked field indicators displayed with legend
- [x] Sample size limited to max 10 records
- [x] Unit tests for masking functions (43 tests)
- [x] Component tests
