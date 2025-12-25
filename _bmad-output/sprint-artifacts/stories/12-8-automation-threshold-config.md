# Story 12.8: Automation Threshold Configuration

## Story Info
- **Epic**: 12 - Decision Automation Pipeline
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR81 (Automation threshold configuration)

## User Story

As a director,
I want to configure automation thresholds,
So that I can balance efficiency with oversight.

## Acceptance Criteria

### AC1: Auto-Approval Thresholds
**Given** I have director permissions
**When** I configure auto-approval settings
**Then** I can set trust score thresholds and action type exclusions

### AC2: Risk Level Classifications
**Given** I am configuring risk settings
**When** I define risk classifications
**Then** action types and trust scores are properly mapped

### AC3: Timeout Durations
**Given** I am configuring timeouts
**When** I set timeout values
**Then** decisions use the configured timeouts

### AC4: Escalation Paths
**Given** I am configuring escalation
**When** I define escalation paths
**Then** decisions follow the configured chain

## Technical Implementation

### AutomationConfigService

`src/services/AutomationConfig.ts` provides centralized configuration:

```typescript
import { getAutomationConfigService } from './AutomationConfig.js';

const config = getAutomationConfigService();

// Get all settings
const settings = config.getSettings('org_1');

// Update auto-approval thresholds
config.updateAutoApprovalThresholds('org_1', {
    minTrustScore: 850,
    maxRiskLevel: 'low',
    excludedActionTypes: ['delete', 'financial'],
});

// Check eligibility
const result = config.isAutoApprovalEligible(
    'org_1',
    trustScore,
    actionType,
    riskLevel
);
```

### Configuration Categories

| Category | Settings |
|----------|----------|
| Auto-Approval | Trust thresholds, risk limits, exclusions |
| Risk Classification | Action types, patterns, trust ranges |
| Timeouts | Duration, action, warning times |
| Escalation | Paths, roles, notification settings |
| Tribunal | Validators, quorum, consensus |
| HITL | Load balancing, SLA targets |

### Auto-Approval Thresholds

```typescript
interface AutoApprovalThresholds {
    minTrustScore: number;       // Default: 800
    maxRiskLevel: RiskLevel;     // Default: 'low'
    maxActionsPerHour: number;   // Default: 100
    requiredSuccessStreak: number; // Default: 5
    excludedActionTypes: string[]; // Default: ['delete', 'financial', 'security_critical']
    enabled: boolean;            // Default: true
}
```

### Risk Classifications

```typescript
interface RiskClassification {
    level: 'low' | 'medium' | 'high' | 'critical';
    trustScoreRange: { min: number; max: number };
    actionTypes: string[];
    patterns: string[];      // Supports wildcards: 'delete_*'
    baseScore: number;
}

// Default mappings:
// low: read, query, report (trust 800-1000)
// medium: write, update, create (trust 500-799)
// high: execute, external, modify (trust 200-499)
// critical: delete, financial, admin (trust 0-199)
```

### Timeout Configuration

```typescript
interface TimeoutConfiguration {
    urgency: 'low' | 'normal' | 'high' | 'immediate';
    timeoutMs: number;
    action: 'escalate' | 'expire' | 'auto_deny';
    warningMs: number;
    description: string;
}

// Default timeouts:
// immediate: 15 min → escalate (10 min warning)
// high: 1 hour → escalate (45 min warning)
// normal: 4 hours → expire (3 hour warning)
// low: 24 hours → expire (20 hour warning)
```

### Escalation Paths

```typescript
interface EscalationPath {
    fromRisk: RiskLevel;
    targetRole: ReviewerRole;
    chain: ReviewerRole[];     // Ordered escalation roles
    maxLevels: number;
    autoEscalate: boolean;
    notifications: {
        email: boolean;
        slack: boolean;
        webhook?: string;
    };
}

// Default paths:
// low → operator
// medium → operator → supervisor
// high → supervisor → director
// critical → director → security_team
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/settings/automation/defaults` | GET | Default configuration |
| `/api/v1/settings/automation/:orgId` | GET | All settings |
| `/api/v1/settings/automation/:orgId` | PUT | Update settings |
| `/api/v1/settings/automation/:orgId/reset` | POST | Reset to defaults |
| `/api/v1/settings/automation/:orgId/auto-approval` | GET/PUT | Auto-approval config |
| `/api/v1/settings/automation/:orgId/auto-approval/check` | POST | Check eligibility |
| `/api/v1/settings/automation/:orgId/risk-classifications` | GET | Risk mappings |
| `/api/v1/settings/automation/:orgId/risk-classifications/classify` | POST | Classify action |
| `/api/v1/settings/automation/:orgId/timeouts` | GET | Timeout configs |
| `/api/v1/settings/automation/:orgId/timeouts/:urgency` | GET | Specific timeout |
| `/api/v1/settings/automation/:orgId/escalation-paths` | GET | All paths |
| `/api/v1/settings/automation/:orgId/escalation-paths/:risk` | GET | Specific path |
| `/api/v1/settings/automation/:orgId/tribunal` | GET/PUT | Tribunal config |
| `/api/v1/settings/automation/:orgId/hitl` | GET/PUT | HITL config |

### Tribunal Configuration

```typescript
interface TribunalConfiguration {
    minValidators: number;      // Default: 3
    maxValidators: number;      // Default: 5
    validatorMinTrust: number;  // Default: 700
    consensusThreshold: number; // Default: 0.6 (60%)
    weightedVoting: boolean;    // Default: true
    enabled: boolean;           // Default: true
}
```

### HITL Configuration

```typescript
interface HITLConfiguration {
    loadBalancing: boolean;           // Default: true
    maxConcurrentPerReviewer: number; // Default: 10
    checkAvailability: boolean;       // Default: true
    defaultUrgency: UrgencyLevel;     // Default: 'normal'
    slaTargets: Record<UrgencyLevel, number>;
}
```

### Validation

All updates are validated before applying:

```typescript
const validation = config.validateUpdate(update);
if (!validation.valid) {
    console.error(validation.errors);
}
```

### Events

```typescript
config.on('config:updated', (orgId, settings) => {
    // Settings changed
});

config.on('threshold:changed', (orgId, field, oldValue, newValue) => {
    // Specific threshold changed
});

config.on('config:reset', (orgId) => {
    // Reset to defaults
});
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/AutomationConfig.ts` | Configuration service |
| `src/services/AutomationConfig.test.ts` | Service tests (44 tests) |
| `src/api/routes/settings/automation.ts` | API routes |
| `src/api/routes/settings/automation.test.ts` | API tests (24 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Settings Management | 6 |
| Auto-Approval Config | 8 |
| Risk Classification | 5 |
| Timeout Config | 3 |
| Escalation Paths | 4 |
| Tribunal Config | 3 |
| HITL Config | 4 |
| Validation | 6 |
| Defaults | 1 |
| Lifecycle | 2 |
| Singleton | 2 |
| API Routes | 24 |
| **Total** | **68** |

### Running Tests

```bash
npx vitest run src/services/AutomationConfig.test.ts src/api/routes/settings/automation.test.ts
```

## Definition of Done
- [x] AutomationConfigService created
- [x] Auto-approval threshold configuration
- [x] Risk level classification system
- [x] Timeout duration configuration
- [x] Escalation path configuration
- [x] Tribunal configuration
- [x] HITL configuration
- [x] Eligibility checking
- [x] Risk classification API
- [x] Configuration validation
- [x] Event emission on changes
- [x] API routes for all settings
- [x] Comprehensive test suite (68 tests)
- [x] TypeScript compilation successful
