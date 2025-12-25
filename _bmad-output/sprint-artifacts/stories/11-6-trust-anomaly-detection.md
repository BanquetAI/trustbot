# Story 11.6: Trust Anomaly Detection

## Story Info
- **Epic**: 11 - Live Trust Scoring Engine
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR73 (Trust anomaly detection)

## User Story

As a supervisor,
I want alerts for unusual trust patterns,
So that I can investigate potential issues.

## Acceptance Criteria

### AC1: Rapid Score Drop Detection
**Given** an agent's trust score
**When** it drops significantly in a short time (>50 points in 1 hour)
**Then** a high-severity anomaly is detected

### AC2: Unusual Failure Rate Detection
**Given** an agent's event history
**When** the failure rate exceeds 3x the baseline
**Then** a medium-severity anomaly is detected

### AC3: Repeated Violations Detection
**Given** an agent's security events
**When** multiple violations occur in a short period
**Then** a critical anomaly is detected and escalated

### AC4: Coordinated Behavior Detection
**Given** multiple agents in an organization
**When** they perform similar actions simultaneously
**Then** a coordinated behavior anomaly is detected

## Technical Implementation

### TrustAnomalyDetector Service

`src/services/TrustAnomalyDetector.ts` provides real-time anomaly detection:

```typescript
import { getTrustAnomalyDetector } from './TrustAnomalyDetector.js';

const detector = getTrustAnomalyDetector();

// Listen for anomalies
detector.on('anomaly:detected', (anomaly) => {
    console.log(`Anomaly: ${anomaly.type} - ${anomaly.description}`);
});

detector.on('anomaly:escalated', (anomaly) => {
    // Critical anomalies auto-escalate
    notifySecurityTeam(anomaly);
});

// Record score changes
detector.recordScoreChange('agent_1', 'org_1', 400, 320);

// Record events
detector.recordEvent('agent_1', 'org_1', 'task_failed', -15);

// Record tier changes
detector.recordTierChange('agent_1', 'org_1', 'TRUSTED', 'PROBATIONARY');
```

### Anomaly Types

| Type | Description | Severity |
|------|-------------|----------|
| `rapid_score_drop` | Score dropped >50 points in 1 hour | High |
| `unusual_failure_rate` | Failure rate >3x baseline | Medium |
| `repeated_violations` | 3+ violations in 1 hour | High/Critical |
| `coordinated_behavior` | 3+ agents acting in sync | High |
| `sudden_recovery` | Suspicious quick recovery | Medium |
| `tier_oscillation` | 3+ tier changes in 24 hours | Low |

### Detection Thresholds

```typescript
interface AnomalyThresholds {
    rapidDropThreshold: 50,         // Points drop per hour
    failureRateMultiplier: 3,       // x times baseline
    rapidDropWindowMs: 3600000,     // 1 hour
    minEventsForFailureRate: 5,     // Minimum events
    failureRateWindowMs: 86400000,  // 24 hours
    coordinatedBehaviorMinAgents: 3,// Agents for coordination
    coordinatedBehaviorWindowMs: 300000, // 5 minutes
    tierOscillationThreshold: 3,    // Changes in window
    tierOscillationWindowMs: 86400000,  // 24 hours
    repeatedViolationsThreshold: 3, // Violations
    repeatedViolationsWindowMs: 3600000, // 1 hour
}
```

### Recording Events

```typescript
// Score changes
detector.recordScoreChange(agentId, orgId, oldScore, newScore);

// Trust events
detector.recordEvent(agentId, orgId, eventType, points);

// Tier changes
detector.recordTierChange(agentId, orgId, previousTier, newTier);
```

### Anomaly Interface

```typescript
interface Anomaly {
    id: string;
    type: AnomalyType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    agentId: string;
    orgId: string;
    description: string;
    detectedAt: Date;
    metadata: Record<string, unknown>;
    acknowledged: boolean;
    resolvedAt?: Date;
}
```

### Anomaly Management API

```typescript
// Get all anomalies
detector.getAnomalies({
    agentId: 'agent_1',
    orgId: 'org_1',
    type: 'rapid_score_drop',
    severity: 'high',
    acknowledged: false,
    resolved: false,
});

// Get single anomaly
detector.getAnomaly(id);

// Acknowledge anomaly
detector.acknowledgeAnomaly(id);

// Resolve anomaly
detector.resolveAnomaly(id);

// Get counts by severity
detector.getAnomalyCounts(orgId);
// Returns: { low: 2, medium: 1, high: 0, critical: 0 }
```

### Configuration

```typescript
// Set org baseline failure rate
detector.setOrgBaselineFailureRate('org_1', 0.15); // 15%

// Update thresholds
detector.updateThresholds({
    rapidDropThreshold: 75,
    failureRateMultiplier: 2,
});

// Get current thresholds
detector.getThresholds();
```

### Batch Analysis

```typescript
// Run coordinated behavior check for an org
const anomaly = detector.checkCoordinatedBehavior('org_1');

// Manual batch analysis
detector.runBatchAnalysis();
```

### Events Emitted

```typescript
detector.on('anomaly:detected', (anomaly: Anomaly) => {});
detector.on('anomaly:resolved', (anomaly: Anomaly) => {});
detector.on('anomaly:escalated', (anomaly: Anomaly) => {});
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/TrustAnomalyDetector.ts` | Anomaly detection service |
| `src/services/TrustAnomalyDetector.test.ts` | Unit tests (25 tests) |

### Test Coverage

| Category | Tests |
|----------|-------|
| Rapid Score Drop | 4 |
| Unusual Failure Rate | 3 |
| Repeated Violations | 3 |
| Sudden Recovery | 1 |
| Tier Oscillation | 2 |
| Coordinated Behavior | 2 |
| Anomaly Management | 6 |
| Configuration | 2 |
| Lifecycle | 2 |
| **Total** | **25** |

### Running Tests

```bash
npx vitest run src/services/TrustAnomalyDetector.test.ts
```

## Integration Example

```typescript
import { getTrustScoreCalculator } from './TrustScoreCalculator.js';
import { getTierManager } from './TierManager.js';
import { getTrustAnomalyDetector } from './TrustAnomalyDetector.js';

const calculator = getTrustScoreCalculator();
const tierManager = getTierManager();
const detector = getTrustAnomalyDetector();

// Wire up score changes to anomaly detector
calculator.on('score:changed', (change) => {
    detector.recordScoreChange(
        change.agentId,
        getAgentOrg(change.agentId),
        change.oldScore,
        change.newScore
    );
});

// Wire up events
calculator.on('event:recorded', (event) => {
    detector.recordEvent(
        event.agentId,
        event.orgId,
        event.eventType,
        event.points
    );
});

// Wire up tier changes
tierManager.on('tier:changed', (change) => {
    detector.recordTierChange(
        change.agentId,
        change.orgId,
        change.previousTier,
        change.newTier
    );
});

// Handle detected anomalies
detector.on('anomaly:detected', async (anomaly) => {
    // Log to audit trail
    await logAnomaly(anomaly);

    // Alert based on severity
    if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        await alertSupervisors(anomaly);
    }

    // Auto-actions for certain anomaly types
    if (anomaly.type === 'repeated_violations') {
        await quarantineAgent(anomaly.agentId);
    }
});

detector.on('anomaly:escalated', async (anomaly) => {
    await notifySecurityTeam(anomaly);
    await createIncident(anomaly);
});
```

## Definition of Done
- [x] TrustAnomalyDetector service created
- [x] Rapid score drop detection (>50 points/hour)
- [x] Unusual failure rate detection (>3x baseline)
- [x] Repeated violations detection (3+ in 1 hour)
- [x] Coordinated behavior detection (3+ agents)
- [x] Sudden recovery detection
- [x] Tier oscillation detection
- [x] Anomaly management API (get, acknowledge, resolve)
- [x] Configurable thresholds
- [x] Event emission for anomalies
- [x] Auto-escalation for critical anomalies
- [x] Comprehensive test suite (25 tests)
- [x] TypeScript compilation successful
