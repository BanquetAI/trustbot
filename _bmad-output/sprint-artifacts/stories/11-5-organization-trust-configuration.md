# Story 11.5: Organization Trust Configuration

## Story Info
- **Epic**: 11 - Live Trust Scoring Engine
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR72 (Configurable scoring weights per organization)

## User Story

As a director,
I want to customize trust scoring weights,
So that our organization's values are reflected.

## Acceptance Criteria

### AC1: Configure Point Values
**Given** organization settings
**When** updating event point values
**Then** the organization's agents use the new scoring weights

### AC2: Configure Decay Periods
**Given** organization settings
**When** updating decay periods per event type
**Then** events decay according to the new periods

### AC3: Configure Tier Thresholds
**Given** organization settings
**When** updating tier score thresholds
**Then** agent tiers are calculated using the new thresholds

### AC4: Preview Impact
**Given** proposed configuration changes
**When** requesting a preview
**Then** the system shows which agents would be affected

## Technical Implementation

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/settings/trust/:orgId` | Get current trust config |
| PUT | `/api/v1/settings/trust/:orgId` | Update trust config |
| POST | `/api/v1/settings/trust/:orgId/preview` | Preview impact of changes |
| POST | `/api/v1/settings/trust/:orgId/reset` | Reset to defaults |
| GET | `/api/v1/settings/trust/defaults` | Get default configuration |

### Get Configuration

```typescript
// GET /api/v1/settings/trust/org_1
// Response:
{
    "success": true,
    "data": {
        "orgId": "org_1",
        "scoring": {
            "events": {
                "task_completed": { "points": 10, "decayDays": 30 },
                "task_failed": { "points": -15, "decayDays": 14 },
                // ...other event types
            },
            "minScore": 0,
            "maxScore": 1000,
            "baseScore": 300,
            "decayFunction": "linear"
        },
        "tiers": [
            { "level": "UNTRUSTED", "minScore": 0, "maxScore": 199, ... },
            { "level": "PROBATIONARY", "minScore": 200, "maxScore": 399, ... },
            // ...other tiers
        ]
    }
}
```

### Update Configuration

```typescript
// PUT /api/v1/settings/trust/org_1
// Request:
{
    "scoring": {
        "events": {
            "task_completed": { "points": 20 },  // Double completion points
            "task_failed": { "points": -25, "decayDays": 7 }  // Harsher failures
        },
        "baseScore": 400,  // Start agents higher
        "decayFunction": "exponential"  // Faster initial decay
    },
    "tiers": [
        { "level": "UNTRUSTED", "minScore": 0, "maxScore": 299 },
        { "level": "PROBATIONARY", "minScore": 300, "maxScore": 599 },
        { "level": "TRUSTED", "minScore": 600, "maxScore": 1000 }
    ]
}

// Response:
{
    "success": true,
    "data": {
        "orgId": "org_1",
        "scoring": { /* merged config */ },
        "tiers": [ /* updated tiers */ ]
    }
}
```

### Preview Changes

```typescript
// POST /api/v1/settings/trust/org_1/preview
// Request: Same as update
// Response:
{
    "success": true,
    "data": {
        "orgId": "org_1",
        "affectedAgents": 5,
        "promotions": 2,
        "demotions": 1,
        "unchanged": 2,
        "agents": [
            {
                "agentId": "agent_1",
                "currentScore": 450,
                "currentTier": "TRUSTED",
                "projectedTier": "VERIFIED",
                "tierChange": "promotion",
                "affectedCapabilities": {
                    "gained": ["delegate"],
                    "lost": []
                }
            }
        ]
    }
}
```

### Reset to Defaults

```typescript
// POST /api/v1/settings/trust/org_1/reset
// Response:
{
    "success": true,
    "data": {
        "orgId": "org_1",
        "message": "Trust configuration reset to defaults"
    }
}
```

### Configurable Event Types

| Event Type | Default Points | Default Decay |
|------------|----------------|---------------|
| `task_completed` | +10 | 30 days |
| `task_reviewed_positive` | +5 | 30 days |
| `task_reviewed_negative` | -5 | 30 days |
| `task_failed` | -15 | 14 days |
| `task_timeout` | -10 | 14 days |
| `invalid_delegation` | -20 | 7 days |
| `security_violation` | -50 | 60 days |
| `manual_adjustment` | 0 | 30 days |

### Validation Rules

| Field | Validation |
|-------|------------|
| `scoring.minScore` | Non-negative number |
| `scoring.maxScore` | Positive number |
| `scoring.decayFunction` | "linear" or "exponential" |
| `events.*.points` | Any number |
| `events.*.decayDays` | 1-365 |
| `tiers.*.level` | Valid TierLevel |
| `tiers.*.minScore` | Non-negative, < maxScore |
| `tiers.*.maxScore` | Positive |
| Tier ranges | Must not overlap |

### Files Created

| File | Purpose |
|------|---------|
| `src/api/routes/settings/trust.ts` | API route handlers |
| `src/api/routes/settings/trust.test.ts` | Unit tests (18 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| GET /:orgId | 2 |
| PUT /:orgId | 5 |
| POST /:orgId/preview | 3 |
| POST /:orgId/reset | 1 |
| GET /defaults | 1 |
| Validation | 4 |
| **Total** | **18** |

### Running Tests

```bash
npx vitest run src/api/routes/settings/trust.test.ts
```

## Integration Example

```typescript
// Frontend: Update trust configuration
async function updateTrustConfig(orgId: string, config: TrustConfigUpdate) {
    const response = await fetch(`/api/v1/settings/trust/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
    return response.json();
}

// Frontend: Preview before applying
async function previewConfigChange(orgId: string, config: TrustConfigUpdate) {
    const preview = await fetch(`/api/v1/settings/trust/${orgId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
    const result = await preview.json();

    if (result.data.demotions > 0) {
        const proceed = confirm(
            `This change would demote ${result.data.demotions} agents. Proceed?`
        );
        if (!proceed) return null;
    }

    return updateTrustConfig(orgId, config);
}
```

## Definition of Done
- [x] API endpoint for getting trust config
- [x] API endpoint for updating trust config
- [x] API endpoint for previewing changes
- [x] API endpoint for resetting to defaults
- [x] Validation for all configuration fields
- [x] Integration with TrustScoreCalculator
- [x] Integration with TierManager
- [x] Preview shows tier changes and capability impact
- [x] Comprehensive test suite (18 tests)
- [x] TypeScript compilation successful
