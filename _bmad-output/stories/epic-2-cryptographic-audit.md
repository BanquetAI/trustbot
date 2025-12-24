# Epic 2: Cryptographic Audit Trail

**Epic ID:** TRUST-E2
**Priority:** CRITICAL (Regulatory)
**Estimated Points:** 8
**Dependencies:** None (can run parallel with Epic 1)

---

## Story 2.1: Audit Entry Type Definitions

**Story ID:** TRUST-2.1
**Points:** 1
**Priority:** P0 (Blocker)

### Description
As a developer, I need TypeScript interfaces for the cryptographic audit system so that all audit entries have consistent structure.

### Acceptance Criteria
- [ ] AC1: `CryptographicAuditEntry` extends existing `AuditEntry`
- [ ] AC2: Add `sequenceNumber: number` (monotonic counter)
- [ ] AC3: Add `previousHash: string` (SHA-256 of previous entry)
- [ ] AC4: Add `entryHash: string` (SHA-256 of current entry)
- [ ] AC5: Add optional `merkleRoot: string` for batch operations
- [ ] AC6: `AuditChainStatus` interface for verification results
- [ ] AC7: All types exported from `src/core/types/audit.ts`

### Technical Notes
```typescript
interface CryptographicAuditEntry extends AuditEntry {
  sequenceNumber: number;
  previousHash: string;
  entryHash: string;
  merkleRoot?: string;
}

interface AuditChainStatus {
  isValid: boolean;
  lastVerified: Date;
  entriesVerified: number;
  brokenAt?: number;
  error?: string;
}
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/types/audit.ts` | CREATE |
| `src/types.ts` | MODIFY - add exports |

---

## Story 2.2: Hash Computation Module

**Story ID:** TRUST-2.2
**Points:** 2
**Priority:** P0

### Description
As the audit system, I need a reliable hash computation module so that audit entries are cryptographically secured.

### Acceptance Criteria
- [ ] AC1: Use Node.js `crypto.createHash('sha256')`
- [ ] AC2: Compute hash from deterministic JSON string of entry
- [ ] AC3: Exclude `entryHash` field from hash computation (circular reference)
- [ ] AC4: Handle Date serialization consistently (ISO string)
- [ ] AC5: Handle undefined/null values consistently
- [ ] AC6: Return lowercase hex string (64 characters)

### Technical Notes
```typescript
private computeHash(entry: Omit<CryptographicAuditEntry, 'entryHash'>): string {
  const content = JSON.stringify({
    id: entry.id,
    timestamp: entry.timestamp.toISOString(),
    action: entry.action,
    actorId: entry.actorId,
    // ... other fields in consistent order
    previousHash: entry.previousHash,
  });
  return createHash('sha256').update(content).digest('hex');
}
```

### Test Cases
- Same entry → same hash (deterministic)
- Modified entry → different hash
- Hash is 64 hex characters
- Hash chain links correctly

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/CryptographicAuditLogger.ts` | CREATE |
| `src/core/CryptographicAuditLogger.test.ts` | CREATE |

---

## Story 2.3: Chain-Linked Entry Logging

**Story ID:** TRUST-2.3
**Points:** 2
**Priority:** P0

### Description
As the audit system, I need to create chain-linked audit entries so that the audit trail is tamper-evident.

### Acceptance Criteria
- [ ] AC1: First entry uses `previousHash = 'GENESIS'`
- [ ] AC2: Each subsequent entry uses previous entry's `entryHash`
- [ ] AC3: Increment `sequenceNumber` monotonically (1, 2, 3...)
- [ ] AC4: Compute and store `entryHash` for current entry
- [ ] AC5: Persist entry immediately after creation (append-only)
- [ ] AC6: Return complete `CryptographicAuditEntry`
- [ ] AC7: Emit `audit:entry-created` event

### Technical Notes
```typescript
async logEntry(action, actor, outcome, details): Promise<CryptographicAuditEntry> {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    action,
    actorId: actor.id,
    actorType: actor.type,
    outcome,
    details,
    sequenceNumber: ++this.sequenceCounter,
    previousHash: this.lastHash,
  };

  const entryHash = this.computeHash(entry);
  this.lastHash = entryHash;

  const fullEntry = { ...entry, entryHash };
  await this.persist(fullEntry);
  return fullEntry;
}
```

### Test Cases
- First entry has previousHash = 'GENESIS'
- Second entry has previousHash = first entry's hash
- Sequence numbers increment correctly
- Entries persist immediately

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/CryptographicAuditLogger.ts` | MODIFY |
| `src/core/CryptographicAuditLogger.test.ts` | MODIFY |

---

## Story 2.4: Chain Verification

**Story ID:** TRUST-2.4
**Points:** 2
**Priority:** P0

### Description
As a compliance officer, I need to verify the audit chain integrity so that I can prove the log hasn't been tampered with.

### Acceptance Criteria
- [ ] AC1: Verify chain from any start sequence to any end sequence
- [ ] AC2: Check each entry's `previousHash` matches previous entry's `entryHash`
- [ ] AC3: Recompute each entry's hash and compare to stored `entryHash`
- [ ] AC4: Return `AuditChainStatus` with success/failure details
- [ ] AC5: On failure, identify exact sequence number where chain broke
- [ ] AC6: On failure, describe what was wrong (missing entry, hash mismatch, tampered)
- [ ] AC7: Handle missing entries gracefully

### Technical Notes
```typescript
async verifyChain(startSeq?: number, endSeq?: number): Promise<AuditChainStatus> {
  // For each entry in range:
  // 1. Verify previousHash matches prior entry
  // 2. Recompute entryHash and verify match
  // 3. Report first break point if any
}
```

### Test Cases
- Valid chain → isValid: true
- Tampered entry → isValid: false, identifies entry
- Missing entry → isValid: false, identifies gap
- Empty chain → isValid: true (nothing to verify)

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/CryptographicAuditLogger.ts` | MODIFY |
| `src/core/CryptographicAuditLogger.test.ts` | MODIFY |

---

## Story 2.5: Compliance Export

**Story ID:** TRUST-2.5
**Points:** 1
**Priority:** P1

### Description
As a compliance officer, I need to export audit logs in standard formats so that I can provide them to auditors.

### Acceptance Criteria
- [ ] AC1: Export by date range (startDate, endDate)
- [ ] AC2: JSON format includes chain verification status
- [ ] AC3: CSV format includes all fields as columns
- [ ] AC4: Include export metadata (date, verifier, entry count)
- [ ] AC5: Cryptographically sign the export (optional, for future)
- [ ] AC6: Handle large exports efficiently (streaming for 100k+ entries)

### Technical Notes
```typescript
async exportForCompliance(
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  // Filter entries by date
  // Include chain status
  // Format appropriately
}
```

### Export JSON Structure
```json
{
  "exportDate": "2025-12-19T...",
  "chainStatus": { "isValid": true, ... },
  "entryCount": 1234,
  "entries": [...]
}
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/CryptographicAuditLogger.ts` | MODIFY |
| `src/core/CryptographicAuditLogger.test.ts` | MODIFY |

---

## Story 2.6: SecurityLayer Integration

**Story ID:** TRUST-2.6
**Points:** 2
**Priority:** P0

### Description
As the security system, I need to replace the existing audit logger with the cryptographic version so that all security events are tamper-evident.

### Acceptance Criteria
- [ ] AC1: Add feature flag `USE_CRYPTO_AUDIT` (default: true)
- [ ] AC2: Inject `CryptographicAuditLogger` into `SecurityLayer`
- [ ] AC3: Replace all `logAudit()` calls to use new logger
- [ ] AC4: Migrate existing audit entries (add hashes retroactively)
- [ ] AC5: Preserve existing audit query capabilities
- [ ] AC6: Add `verifyAuditChain()` method to SecurityLayer
- [ ] AC7: Backward compatibility when flag disabled

### Technical Notes
```typescript
// Migration strategy for existing entries
async migrateExistingAudit() {
  const existing = this.legacyAuditLog;
  let previousHash = 'GENESIS';

  for (const entry of existing) {
    const enhanced = {
      ...entry,
      sequenceNumber: this.nextSequence++,
      previousHash,
    };
    enhanced.entryHash = this.computeHash(enhanced);
    previousHash = enhanced.entryHash;
    await this.persist(enhanced);
  }
}
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `src/core/SecurityLayer.ts` | MODIFY |
| `src/core/SecurityLayer.test.ts` | MODIFY |
| `src/core/config/features.ts` | MODIFY |

---

## Definition of Done (Epic 2)

- [ ] All 6 stories completed and merged
- [ ] 100% test coverage on CryptographicAuditLogger (critical path)
- [ ] Chain verification passes on 10,000+ entry test
- [ ] All existing SecurityLayer tests still pass
- [ ] Feature flag allows rollback to legacy audit
- [ ] Export produces valid JSON and CSV
- [ ] Documentation updated with compliance instructions
