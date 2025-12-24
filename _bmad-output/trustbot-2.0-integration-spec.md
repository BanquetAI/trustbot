# TrustBot 2.0 Integration Specification

**Document Version:** 1.0.0
**Date:** 2025-12-19
**Authors:** BMad Agent Collective (Party Mode)
**Status:** DRAFT - Pending Approval

---

## Executive Summary

This specification defines the integration of AgentAnchorAI (A3I-OS) patterns into the existing TrustBot autonomous agent governance system. The goal is to create **TrustBot 2.0**: a production-ready, regulatory-compliant, enterprise-scale autonomous agent orchestration platform.

### Key Outcomes
- **Enhanced Trust Scoring:** FICO-style weighted components (300-1000 scale)
- **Cryptographic Audit Trail:** SHA-256 hash-chained, tamper-evident logging
- **Council Governance:** 3-agent voting for distributed decision-making
- **Delegation System:** Upward capability requests with temporary grants
- **Autonomy Budgets:** Daily limits preventing runaway autonomous actions

### Preserved TrustBot Differentiators
- 80% trust inheritance from parent agents
- 50% penalty propagation to parent agents
- Fading HITL governance model
- Stigmergic Blackboard coordination
- 5 T5 Founding Orchestrators
- Aggressiveness slider UX

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Phase 1: Enhanced Trust Scoring](#3-phase-1-enhanced-trust-scoring)
4. [Phase 2: Cryptographic Audit Trail](#4-phase-2-cryptographic-audit-trail)
5. [Phase 3: Council Governance Layer](#5-phase-3-council-governance-layer)
6. [Phase 4: Delegation & Autonomy Budgets](#6-phase-4-delegation--autonomy-budgets)
7. [API Extensions](#7-api-extensions)
8. [Database Schema](#8-database-schema)
9. [Migration Strategy](#9-migration-strategy)
10. [Testing Strategy](#10-testing-strategy)
11. [Risk Analysis](#11-risk-analysis)
12. [Implementation Roadmap](#12-implementation-roadmap)

---

## 1. Current State Analysis

### 1.1 TrustBot Architecture (As-Is)

```
┌─────────────────────────────────────────────────────────────┐
│                      WEB FRONTEND                           │
│  React 18 | Building Viz | MetricsDashboard | TaskBoard    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    HONO REST API                            │
│  /dashboard | /tasks | /approvals | /auth | /trust         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     CORE SERVICES                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │ TrustEngine  │ │ Blackboard   │ │ HITLGateway          ││
│  │ (0-1000)     │ │ (Stigmergic) │ │ (Fading Governance)  ││
│  └──────────────┘ └──────────────┘ └──────────────────────┘│
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │ SecurityLayer│ │ MessageBus   │ │ Orchestrator         ││
│  │ (RBAC+Audit) │ │ (Pub/Sub)    │ │ (Tick-based)         ││
│  └──────────────┘ └──────────────┘ └──────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER                         │
│              File-based JSON (PersistenceLayer.ts)          │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Current Trust Model

```typescript
// Current: Simple additive model
TrustScore = {
  level: TrustLevel,           // T0-T5 enum
  numeric: number,             // 0-1000
  inherited: number,           // 80% of parent
  earned: number,              // From rewards
  penalties: number,           // From violations
  // numeric = inherited + earned - penalties
}
```

### 1.3 Identified Gaps

| Gap | Business Impact | Priority |
|-----|-----------------|----------|
| No weighted trust components | Less nuanced scoring | HIGH |
| Mutable audit log | Regulatory non-compliance | CRITICAL |
| Single-point governance | Bottleneck at HITL | MEDIUM |
| No delegation workflow | Agents can't request capabilities | MEDIUM |
| No autonomy limits | Potential runaway agents | HIGH |

---

## 2. Target Architecture

### 2.1 TrustBot 2.0 Architecture (To-Be)

```
┌─────────────────────────────────────────────────────────────┐
│                      WEB FRONTEND                           │
│  + TrustScoreGauge | + CouncilPanel | + DelegationUI       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    HONO REST API                            │
│  + /council | + /delegation | + /autonomy-budget           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     CORE SERVICES                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ENHANCED TRUST ENGINE                    │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐ │  │
│  │  │ Weighted    │ │ Inheritance │ │ Penalty         │ │  │
│  │  │ Components  │ │ (80%)       │ │ Propagation(50%)│ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │ Cryptographic│ │ Council      │ │ Delegation           ││
│  │ AuditLogger  │ │ Service      │ │ Manager              ││
│  │ (SHA-256)    │ │ (3-Bot Vote) │ │ (Upward Requests)    ││
│  └──────────────┘ └──────────────┘ └──────────────────────┘│
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │ Autonomy     │ │ Blackboard   │ │ HITL Gateway         ││
│  │ Budget       │ │ (Enhanced)   │ │ + Council Fallback   ││
│  └──────────────┘ └──────────────┘ └──────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER                         │
│  File JSON (default) | Supabase (optional) | Redis (cache) │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1: Enhanced Trust Scoring

### 3.1 Overview

Enhance the existing TrustEngine with FICO-style weighted components while preserving TrustBot's unique inheritance and penalty propagation model.

### 3.2 Component Weights

| Component | Weight | Source | Description |
|-----------|--------|--------|-------------|
| Decision Accuracy | 35% | Task completion rate, approval rate | Core performance metric |
| Ethics Compliance | 25% | Violation count, escalation rate | Behavioral guardrails |
| Task Success | 20% | Completed vs failed tasks | Reliability indicator |
| Operational Stability | 15% | Error rate, response times | System health |
| Peer Reviews | 5% | Blackboard contributions, endorsements | Social validation |

### 3.3 Enhanced Trust Score Interface

```typescript
// File: src/core/types/trust.ts

interface TrustComponents {
  decisionAccuracy: ComponentScore;
  ethicsCompliance: ComponentScore;
  taskSuccess: ComponentScore;
  operationalStability: ComponentScore;
  peerReviews: ComponentScore;
}

interface ComponentScore {
  raw: number;           // 0-100 raw score
  weighted: number;      // After weight applied
  samples: number;       // Data points used
  confidence: number;    // 0-1 confidence level
  lastUpdated: Date;
}

interface EnhancedTrustScore extends TrustScore {
  // Existing fields preserved
  level: TrustLevel;
  numeric: number;       // Now 300-1000 (FICO-style)
  inherited: number;
  earned: number;
  penalties: number;

  // New fields
  components: TrustComponents;
  componentScore: number;     // Weighted sum of components
  finalScore: number;         // componentScore + inherited - penalties
  tier: TrustTier;            // Derived from finalScore
  trend: 'rising' | 'stable' | 'falling';
  trendDelta: number;         // Change over last 7 days
}
```

### 3.4 Score Calculation Algorithm

```typescript
// File: src/core/TrustScoreCalculator.ts

const WEIGHTS = {
  decisionAccuracy: 0.35,
  ethicsCompliance: 0.25,
  taskSuccess: 0.20,
  operationalStability: 0.15,
  peerReviews: 0.05,
} as const;

const SCORE_RANGE = { min: 300, max: 1000 };

class TrustScoreCalculator {
  async calculateScore(agentId: AgentId): Promise<EnhancedTrustScore> {
    // Gather component data in parallel
    const [accuracy, ethics, tasks, stability, peers] = await Promise.all([
      this.calculateDecisionAccuracy(agentId),
      this.calculateEthicsCompliance(agentId),
      this.calculateTaskSuccess(agentId),
      this.calculateOperationalStability(agentId),
      this.calculatePeerReviews(agentId),
    ]);

    // Calculate weighted sum
    const weightedSum =
      accuracy.raw * WEIGHTS.decisionAccuracy +
      ethics.raw * WEIGHTS.ethicsCompliance +
      tasks.raw * WEIGHTS.taskSuccess +
      stability.raw * WEIGHTS.operationalStability +
      peers.raw * WEIGHTS.peerReviews;

    // Scale to 300-1000
    const componentScore = SCORE_RANGE.min +
      (weightedSum / 100) * (SCORE_RANGE.max - SCORE_RANGE.min);

    // Apply inheritance and penalties (TrustBot unique)
    const inherited = await this.getInheritedScore(agentId);
    const penalties = await this.getPenalties(agentId);

    // Final score combines both models
    const finalScore = Math.max(
      SCORE_RANGE.min,
      Math.min(SCORE_RANGE.max, componentScore + inherited - penalties)
    );

    return {
      numeric: finalScore,
      components: {
        decisionAccuracy: accuracy,
        ethicsCompliance: ethics,
        taskSuccess: tasks,
        operationalStability: stability,
        peerReviews: peers,
      },
      componentScore,
      finalScore,
      tier: this.scoreToTier(finalScore),
      // ... other fields
    };
  }

  private scoreToTier(score: number): TrustTier {
    if (score >= 900) return 'SOVEREIGN';   // T5
    if (score >= 750) return 'EXECUTIVE';   // T4
    if (score >= 600) return 'TACTICAL';    // T3
    if (score >= 450) return 'OPERATIONAL'; // T2
    if (score >= 300) return 'WORKER';      // T1
    return 'PASSIVE';                       // T0
  }
}
```

### 3.5 Component Calculation Details

```typescript
// Decision Accuracy (35%)
async calculateDecisionAccuracy(agentId: AgentId): Promise<ComponentScore> {
  const tasks = await this.getTaskHistory(agentId, 90); // 90 days
  const approved = tasks.filter(t => t.approvalStatus === 'approved').length;
  const total = tasks.length;

  // Risk-adjusted: high-risk approvals worth more
  const riskAdjusted = tasks.reduce((sum, t) => {
    const multiplier = { low: 1, medium: 1.5, high: 2, critical: 3 }[t.riskLevel];
    return sum + (t.approved ? multiplier : 0);
  }, 0);

  const raw = total > 0 ? (riskAdjusted / (total * 1.5)) * 100 : 50;

  return {
    raw: Math.min(100, raw),
    weighted: raw * WEIGHTS.decisionAccuracy,
    samples: total,
    confidence: Math.min(1, total / 100), // 100 samples = full confidence
    lastUpdated: new Date(),
  };
}

// Ethics Compliance (25%)
async calculateEthicsCompliance(agentId: AgentId): Promise<ComponentScore> {
  const violations = await this.getViolations(agentId, 90);
  const escalations = await this.getEscalations(agentId, 90);

  // Penalty-based: start at 100, deduct for issues
  const violationPenalty = violations.length * 10;
  const escalationPenalty = escalations.length * 5;

  const raw = Math.max(0, 100 - violationPenalty - escalationPenalty);

  return {
    raw,
    weighted: raw * WEIGHTS.ethicsCompliance,
    samples: violations.length + escalations.length,
    confidence: 1, // Always confident in violation data
    lastUpdated: new Date(),
  };
}

// Peer Reviews (5%) - Uses Blackboard!
async calculatePeerReviews(agentId: AgentId): Promise<ComponentScore> {
  const contributions = await this.blackboard.getContributionsBy(agentId);
  const endorsements = contributions.reduce((sum, c) =>
    sum + (c.endorsements?.length || 0), 0);
  const solutions = contributions.filter(c =>
    c.type === 'SOLUTION' && c.resolved).length;

  const raw = Math.min(100, (endorsements * 5) + (solutions * 20));

  return {
    raw,
    weighted: raw * WEIGHTS.peerReviews,
    samples: contributions.length,
    confidence: Math.min(1, contributions.length / 20),
    lastUpdated: new Date(),
  };
}
```

### 3.6 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/core/TrustScoreCalculator.ts` | CREATE | New weighted calculation engine |
| `src/core/types/trust.ts` | CREATE | Enhanced type definitions |
| `src/core/TrustEngine.ts` | MODIFY | Integrate calculator, preserve inheritance |
| `src/core/TrustEngine.test.ts` | MODIFY | Add component calculation tests |

---

## 4. Phase 2: Cryptographic Audit Trail

### 4.1 Overview

Upgrade the existing SecurityLayer audit logging to use SHA-256 hash chaining, creating a tamper-evident, regulatory-compliant audit trail.

### 4.2 Enhanced Audit Entry Interface

```typescript
// File: src/core/types/audit.ts

interface CryptographicAuditEntry {
  // Existing fields
  id: string;
  timestamp: Date;
  action: AuditAction;
  actorId: string;
  actorType: 'HUMAN' | 'AGENT' | 'SYSTEM';
  targetId?: string;
  outcome: 'success' | 'denied' | 'error';
  reason?: string;
  details?: Record<string, unknown>;

  // New cryptographic fields
  sequenceNumber: number;      // Monotonic counter
  previousHash: string;        // SHA-256 of previous entry
  entryHash: string;           // SHA-256 of this entry
  merkleRoot?: string;         // Batch merkle root (optional)
}

interface AuditChainStatus {
  isValid: boolean;
  lastVerified: Date;
  entriesVerified: number;
  brokenAt?: number;           // Sequence number if chain broken
  error?: string;
}
```

### 4.3 Cryptographic Audit Logger

```typescript
// File: src/core/CryptographicAuditLogger.ts

import { createHash } from 'crypto';

class CryptographicAuditLogger {
  private entries: CryptographicAuditEntry[] = [];
  private sequenceCounter = 0;
  private lastHash = 'GENESIS'; // Initial hash for first entry

  async logEntry(
    action: AuditAction,
    actor: { id: string; type: 'HUMAN' | 'AGENT' | 'SYSTEM' },
    outcome: 'success' | 'denied' | 'error',
    details?: Record<string, unknown>
  ): Promise<CryptographicAuditEntry> {
    const entry: Omit<CryptographicAuditEntry, 'entryHash'> = {
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

    // Compute hash of entry (excluding entryHash field)
    const entryHash = this.computeHash(entry);

    const fullEntry: CryptographicAuditEntry = {
      ...entry,
      entryHash,
    };

    this.lastHash = entryHash;
    this.entries.push(fullEntry);

    // Persist immediately (append-only)
    await this.persistEntry(fullEntry);

    return fullEntry;
  }

  private computeHash(entry: Omit<CryptographicAuditEntry, 'entryHash'>): string {
    const content = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp.toISOString(),
      action: entry.action,
      actorId: entry.actorId,
      actorType: entry.actorType,
      outcome: entry.outcome,
      details: entry.details,
      sequenceNumber: entry.sequenceNumber,
      previousHash: entry.previousHash,
    });

    return createHash('sha256').update(content).digest('hex');
  }

  async verifyChain(startSeq?: number, endSeq?: number): Promise<AuditChainStatus> {
    const start = startSeq ?? 1;
    const end = endSeq ?? this.sequenceCounter;

    let expectedPreviousHash = start === 1 ? 'GENESIS' :
      this.entries.find(e => e.sequenceNumber === start - 1)?.entryHash;

    for (let seq = start; seq <= end; seq++) {
      const entry = this.entries.find(e => e.sequenceNumber === seq);

      if (!entry) {
        return {
          isValid: false,
          lastVerified: new Date(),
          entriesVerified: seq - start,
          brokenAt: seq,
          error: `Missing entry at sequence ${seq}`,
        };
      }

      // Verify previous hash link
      if (entry.previousHash !== expectedPreviousHash) {
        return {
          isValid: false,
          lastVerified: new Date(),
          entriesVerified: seq - start,
          brokenAt: seq,
          error: `Chain broken: expected previousHash ${expectedPreviousHash}, got ${entry.previousHash}`,
        };
      }

      // Verify entry hash
      const { entryHash, ...entryWithoutHash } = entry;
      const computedHash = this.computeHash(entryWithoutHash);

      if (computedHash !== entryHash) {
        return {
          isValid: false,
          lastVerified: new Date(),
          entriesVerified: seq - start,
          brokenAt: seq,
          error: `Entry tampered: hash mismatch at sequence ${seq}`,
        };
      }

      expectedPreviousHash = entryHash;
    }

    return {
      isValid: true,
      lastVerified: new Date(),
      entriesVerified: end - start + 1,
    };
  }

  async exportForCompliance(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const filtered = this.entries.filter(e =>
      e.timestamp >= startDate && e.timestamp <= endDate
    );

    if (format === 'json') {
      return JSON.stringify({
        exportDate: new Date().toISOString(),
        chainStatus: await this.verifyChain(),
        entries: filtered,
      }, null, 2);
    }

    // CSV format
    const headers = 'id,timestamp,action,actorId,actorType,outcome,sequenceNumber,previousHash,entryHash\n';
    const rows = filtered.map(e =>
      `${e.id},${e.timestamp.toISOString()},${e.action},${e.actorId},${e.actorType},${e.outcome},${e.sequenceNumber},${e.previousHash},${e.entryHash}`
    ).join('\n');

    return headers + rows;
  }
}
```

### 4.4 Database Immutability Triggers (Optional Supabase)

```sql
-- File: supabase/migrations/YYYYMMDD_audit_immutability.sql

-- Prevent UPDATE on audit entries
CREATE OR REPLACE FUNCTION prevent_audit_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit entries are immutable and cannot be updated';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_update();

-- Prevent DELETE on audit entries
CREATE OR REPLACE FUNCTION prevent_audit_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit entries are immutable and cannot be deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_delete();
```

### 4.5 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/core/CryptographicAuditLogger.ts` | CREATE | Hash-chained audit system |
| `src/core/types/audit.ts` | CREATE | Audit type definitions |
| `src/core/SecurityLayer.ts` | MODIFY | Replace simple audit with cryptographic |
| `src/core/SecurityLayer.test.ts` | MODIFY | Add chain verification tests |

---

## 5. Phase 3: Council Governance Layer

### 5.1 Overview

Implement a 3-agent council system that provides distributed governance when HITL level drops below 50%. The council handles critical decisions through voting.

### 5.2 Council Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DECISION REQUEST                         │
│  (SPAWN | TIER_UPGRADE | POLICY_CHANGE | EMERGENCY)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GOVERNANCE ROUTER                        │
│                                                             │
│  if (hitlLevel >= 50%) → HUMAN APPROVAL                    │
│  if (hitlLevel < 50%)  → COUNCIL REVIEW                    │
│  if (EMERGENCY)        → HUMAN OVERRIDE                     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│     HUMAN APPROVAL      │     │    COUNCIL REVIEW       │
│                         │     │                         │
│  - Master key required  │     │  - 3 T4+ agents vote    │
│  - Single approver      │     │  - 2/3 majority needed  │
│  - Immediate decision   │     │  - 24h timeout          │
└─────────────────────────┘     │  - Precedent recorded   │
                                └─────────────────────────┘
```

### 5.3 Council Service Interface

```typescript
// File: src/core/council/CouncilService.ts

interface CouncilMember {
  agentId: AgentId;
  tier: AgentTier;            // Must be T4+
  specialization?: string;
  votingWeight: number;       // Usually 1, can be higher for T5
  activeReviews: number;
}

interface CouncilReview {
  id: string;
  requestType: 'SPAWN' | 'TIER_UPGRADE' | 'POLICY_CHANGE' | 'CAPABILITY_GRANT';
  requesterId: AgentId;
  context: Record<string, unknown>;

  // Voting
  reviewers: CouncilMember[];
  votes: Map<AgentId, CouncilVote>;
  requiredVotes: number;      // Usually 2 of 3

  // Outcome
  status: 'pending' | 'approved' | 'rejected' | 'timeout' | 'escalated';
  outcome?: {
    decision: 'approve' | 'reject';
    reasoning: string;
    precedentId?: string;
  };

  // Timing
  createdAt: Date;
  expiresAt: Date;
  decidedAt?: Date;
}

interface CouncilVote {
  voterId: AgentId;
  vote: 'approve' | 'reject' | 'abstain';
  reasoning: string;
  confidence: number;         // 0-1
  timestamp: Date;
}

class CouncilService {
  private members: CouncilMember[] = [];
  private activeReviews: Map<string, CouncilReview> = new Map();
  private precedents: Map<string, Precedent> = new Map();

  // Select 3 reviewers based on availability and expertise
  async selectReviewers(
    requestType: CouncilReview['requestType'],
    context: Record<string, unknown>
  ): Promise<CouncilMember[]> {
    const eligible = this.members.filter(m =>
      m.tier >= 4 &&
      m.activeReviews < 3 // Max concurrent reviews
    );

    // Prefer diverse specializations
    const selected = this.diverseSelect(eligible, 3, context);

    return selected;
  }

  async submitForReview(
    requestType: CouncilReview['requestType'],
    requesterId: AgentId,
    context: Record<string, unknown>
  ): Promise<CouncilReview> {
    // Check for applicable precedent first
    const precedent = await this.findPrecedent(requestType, context);

    if (precedent && precedent.confidence > 0.9) {
      // Auto-apply precedent
      return this.applyPrecedent(precedent, requesterId, context);
    }

    const reviewers = await this.selectReviewers(requestType, context);

    const review: CouncilReview = {
      id: crypto.randomUUID(),
      requestType,
      requesterId,
      context,
      reviewers,
      votes: new Map(),
      requiredVotes: 2, // 2 of 3
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    };

    this.activeReviews.set(review.id, review);

    // Notify reviewers
    await this.notifyReviewers(review);

    return review;
  }

  async submitVote(
    reviewId: string,
    voterId: AgentId,
    vote: CouncilVote['vote'],
    reasoning: string,
    confidence: number
  ): Promise<CouncilReview> {
    const review = this.activeReviews.get(reviewId);
    if (!review) throw new Error('Review not found');
    if (review.status !== 'pending') throw new Error('Review already decided');

    // Verify voter is assigned reviewer
    if (!review.reviewers.find(r => r.agentId === voterId)) {
      throw new Error('Not authorized to vote on this review');
    }

    review.votes.set(voterId, {
      voterId,
      vote,
      reasoning,
      confidence,
      timestamp: new Date(),
    });

    // Check if we have enough votes
    const approves = [...review.votes.values()].filter(v => v.vote === 'approve').length;
    const rejects = [...review.votes.values()].filter(v => v.vote === 'reject').length;

    if (approves >= review.requiredVotes) {
      review.status = 'approved';
      review.outcome = {
        decision: 'approve',
        reasoning: this.synthesizeReasoning(review.votes, 'approve'),
      };
      review.decidedAt = new Date();

      // Create precedent
      await this.createPrecedent(review);
    } else if (rejects >= review.requiredVotes) {
      review.status = 'rejected';
      review.outcome = {
        decision: 'reject',
        reasoning: this.synthesizeReasoning(review.votes, 'reject'),
      };
      review.decidedAt = new Date();
    }

    return review;
  }
}
```

### 5.4 HITL + Council Integration

```typescript
// File: src/core/HITLGateway.ts (MODIFIED)

class HITLGateway {
  constructor(
    private councilService: CouncilService,
    // ... existing dependencies
  ) {}

  async requestApproval(
    type: ApprovalType,
    context: Record<string, unknown>,
    requesterId: AgentId
  ): Promise<ApprovalResult> {
    // Emergency always goes to human
    if (type === 'EMERGENCY') {
      return this.createHumanApprovalRequest(type, context, requesterId);
    }

    // Route based on HITL level
    if (this.hitlLevel >= 50) {
      return this.createHumanApprovalRequest(type, context, requesterId);
    } else {
      // Council handles when HITL is low
      const review = await this.councilService.submitForReview(
        this.mapToCouncilType(type),
        requesterId,
        context
      );

      return this.awaitCouncilDecision(review);
    }
  }

  private mapToCouncilType(type: ApprovalType): CouncilReview['requestType'] {
    switch (type) {
      case 'SPAWN': return 'SPAWN';
      case 'DECISION': return 'POLICY_CHANGE';
      case 'STRATEGY': return 'POLICY_CHANGE';
      default: return 'CAPABILITY_GRANT';
    }
  }
}
```

### 5.5 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/core/council/CouncilService.ts` | CREATE | Council voting system |
| `src/core/council/PrecedentService.ts` | CREATE | Precedent learning |
| `src/core/council/types.ts` | CREATE | Council type definitions |
| `src/core/HITLGateway.ts` | MODIFY | Add council integration |
| `src/core/council/CouncilService.test.ts` | CREATE | Council tests |

---

## 6. Phase 4: Delegation & Autonomy Budgets

### 6.1 Delegation Manager

```typescript
// File: src/core/delegation/DelegationManager.ts

interface DelegationRequest {
  id: string;
  requesterId: AgentId;
  requestedCapabilities: Permission[];
  reason: string;
  duration: number;           // ms
  context: Record<string, unknown>;

  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';
  approvedBy?: AgentId | 'COUNCIL' | 'HUMAN';
  approvedAt?: Date;
  expiresAt?: Date;

  // Track record for self-advocacy
  requesterSuccessRate: number;
  requesterTier: AgentTier;
  similarRequestsApproved: number;
}

interface ActiveDelegation {
  id: string;
  agentId: AgentId;
  capabilities: Permission[];
  grantedAt: Date;
  expiresAt: Date;
  reason: string;
}

class DelegationManager {
  private activeDelegations: Map<AgentId, ActiveDelegation[]> = new Map();

  async requestCapabilities(
    agentId: AgentId,
    capabilities: Permission[],
    reason: string,
    duration: number
  ): Promise<DelegationRequest> {
    const agent = await this.trustEngine.getTrust(agentId);

    const request: DelegationRequest = {
      id: crypto.randomUUID(),
      requesterId: agentId,
      requestedCapabilities: capabilities,
      reason,
      duration,
      context: {},
      status: 'pending',
      requesterSuccessRate: await this.getSuccessRate(agentId),
      requesterTier: agent.tier,
      similarRequestsApproved: await this.getSimilarApprovals(agentId, capabilities),
    };

    // Auto-approve for high-trust agents with good track record
    if (this.canAutoApprove(request)) {
      return this.autoApprove(request);
    }

    // Route to council or human
    return this.routeForApproval(request);
  }

  private canAutoApprove(request: DelegationRequest): boolean {
    return (
      request.requesterTier >= 4 &&
      request.requesterSuccessRate >= 0.9 &&
      request.similarRequestsApproved >= 3 &&
      request.duration <= 60 * 60 * 1000 && // Max 1 hour
      !request.requestedCapabilities.includes('SYSTEM_CONFIG') &&
      !request.requestedCapabilities.includes('HITL_MODIFY')
    );
  }

  async checkCapability(
    agentId: AgentId,
    capability: Permission
  ): Promise<boolean> {
    // Check base permissions
    const hasBase = await this.securityLayer.hasPermission(agentId, capability);
    if (hasBase) return true;

    // Check delegated permissions
    const delegations = this.activeDelegations.get(agentId) || [];
    const active = delegations.find(d =>
      d.expiresAt > new Date() &&
      d.capabilities.includes(capability)
    );

    return !!active;
  }
}
```

### 6.2 Autonomy Budget System

```typescript
// File: src/core/autonomy/AutonomyBudget.ts

interface DailyBudget {
  agentId: AgentId;
  date: string;               // YYYY-MM-DD
  tier: AgentTier;

  // Limits
  maxAutonomousActions: number;
  maxDelegations: number;
  maxTokenSpend: number;

  // Usage
  autonomousActionsUsed: number;
  delegationsUsed: number;
  tokensSpent: number;

  // Tracking
  actions: BudgetAction[];
  resetAt: Date;
}

interface BudgetAction {
  timestamp: Date;
  actionType: string;
  cost: number;
  approved: boolean;
}

const TIER_BUDGETS = {
  0: { actions: 0, delegations: 0, tokens: 0 },      // PASSIVE: no autonomy
  1: { actions: 5, delegations: 0, tokens: 1000 },   // WORKER: minimal
  2: { actions: 20, delegations: 1, tokens: 5000 },  // OPERATIONAL
  3: { actions: 50, delegations: 3, tokens: 20000 }, // TACTICAL
  4: { actions: 200, delegations: 10, tokens: 100000 }, // EXECUTIVE
  5: { actions: Infinity, delegations: Infinity, tokens: Infinity }, // SOVEREIGN
} as const;

class AutonomyBudgetService {
  private budgets: Map<string, DailyBudget> = new Map(); // key: agentId:date

  async canPerformAction(
    agentId: AgentId,
    actionType: string,
    cost: number = 1
  ): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
    const budget = await this.getOrCreateBudget(agentId);

    if (budget.autonomousActionsUsed + cost > budget.maxAutonomousActions) {
      return {
        allowed: false,
        reason: `Daily autonomous action limit reached (${budget.maxAutonomousActions})`,
        remaining: budget.maxAutonomousActions - budget.autonomousActionsUsed,
      };
    }

    return {
      allowed: true,
      remaining: budget.maxAutonomousActions - budget.autonomousActionsUsed - cost,
    };
  }

  async recordAction(
    agentId: AgentId,
    actionType: string,
    cost: number = 1
  ): Promise<DailyBudget> {
    const budget = await this.getOrCreateBudget(agentId);

    budget.autonomousActionsUsed += cost;
    budget.actions.push({
      timestamp: new Date(),
      actionType,
      cost,
      approved: true,
    });

    await this.persist(budget);

    // Emit event for monitoring
    this.emit('budget:action', { agentId, actionType, cost, remaining:
      budget.maxAutonomousActions - budget.autonomousActionsUsed });

    return budget;
  }

  async getDashboardMetrics(agentId: AgentId): Promise<{
    used: number;
    max: number;
    percentage: number;
    resetsIn: number;
  }> {
    const budget = await this.getOrCreateBudget(agentId);

    return {
      used: budget.autonomousActionsUsed,
      max: budget.maxAutonomousActions,
      percentage: (budget.autonomousActionsUsed / budget.maxAutonomousActions) * 100,
      resetsIn: budget.resetAt.getTime() - Date.now(),
    };
  }
}
```

### 6.3 Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/core/delegation/DelegationManager.ts` | CREATE | Delegation workflow |
| `src/core/delegation/types.ts` | CREATE | Delegation types |
| `src/core/autonomy/AutonomyBudget.ts` | CREATE | Budget tracking |
| `src/core/autonomy/types.ts` | CREATE | Budget types |
| `src/core/delegation/DelegationManager.test.ts` | CREATE | Delegation tests |
| `src/core/autonomy/AutonomyBudget.test.ts` | CREATE | Budget tests |

---

## 7. API Extensions

### 7.1 New Endpoints

```typescript
// File: src/api/UnifiedWorkflowAPI.ts (ADDITIONS)

// Trust Score Components
app.get('/trust/:agentId/components', async (c) => {
  const { agentId } = c.req.param();
  const components = await trustScoreCalculator.getComponents(agentId);
  return c.json(components);
});

app.get('/trust/:agentId/history', async (c) => {
  const { agentId } = c.req.param();
  const { days = 30 } = c.req.query();
  const history = await trustScoreCalculator.getHistory(agentId, parseInt(days));
  return c.json(history);
});

// Audit Trail
app.get('/audit/verify', async (c) => {
  const { start, end } = c.req.query();
  const status = await auditLogger.verifyChain(
    start ? parseInt(start) : undefined,
    end ? parseInt(end) : undefined
  );
  return c.json(status);
});

app.get('/audit/export', async (c) => {
  const { startDate, endDate, format = 'json' } = c.req.query();
  const data = await auditLogger.exportForCompliance(
    new Date(startDate),
    new Date(endDate),
    format as 'json' | 'csv'
  );
  return c.text(data);
});

// Council
app.get('/council/reviews', async (c) => {
  const reviews = await councilService.getActiveReviews();
  return c.json(reviews);
});

app.post('/council/reviews/:reviewId/vote', async (c) => {
  const { reviewId } = c.req.param();
  const { voterId, vote, reasoning, confidence } = await c.req.json();
  const review = await councilService.submitVote(
    reviewId, voterId, vote, reasoning, confidence
  );
  return c.json(review);
});

// Delegation
app.post('/delegation/request', async (c) => {
  const { agentId, capabilities, reason, duration } = await c.req.json();
  const request = await delegationManager.requestCapabilities(
    agentId, capabilities, reason, duration
  );
  return c.json(request);
});

app.get('/delegation/:agentId/active', async (c) => {
  const { agentId } = c.req.param();
  const delegations = await delegationManager.getActiveDelegations(agentId);
  return c.json(delegations);
});

// Autonomy Budget
app.get('/autonomy/:agentId/budget', async (c) => {
  const { agentId } = c.req.param();
  const metrics = await autonomyBudget.getDashboardMetrics(agentId);
  return c.json(metrics);
});

app.post('/autonomy/:agentId/action', async (c) => {
  const { agentId } = c.req.param();
  const { actionType, cost } = await c.req.json();

  const check = await autonomyBudget.canPerformAction(agentId, actionType, cost);
  if (!check.allowed) {
    return c.json({ error: check.reason }, 429);
  }

  const budget = await autonomyBudget.recordAction(agentId, actionType, cost);
  return c.json(budget);
});
```

### 7.2 API Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/trust/:agentId/components` | GET | Get weighted trust components |
| `/trust/:agentId/history` | GET | Trust score history |
| `/audit/verify` | GET | Verify audit chain integrity |
| `/audit/export` | GET | Export audit for compliance |
| `/council/reviews` | GET | List active council reviews |
| `/council/reviews/:id/vote` | POST | Submit council vote |
| `/delegation/request` | POST | Request capability delegation |
| `/delegation/:agentId/active` | GET | Get active delegations |
| `/autonomy/:agentId/budget` | GET | Get autonomy budget status |
| `/autonomy/:agentId/action` | POST | Record autonomous action |

---

## 8. Database Schema

### 8.1 New Tables (File-Based JSON Structure)

```typescript
// File: src/core/PersistenceLayer.ts (ENHANCED)

interface EnhancedPersistedState extends PersistedState {
  // Existing
  trustScores: Record<AgentId, EnhancedTrustScore>;

  // New Phase 1
  trustComponentHistory: Record<AgentId, ComponentHistoryEntry[]>;

  // New Phase 2
  cryptographicAuditLog: CryptographicAuditEntry[];
  auditChainMeta: {
    lastHash: string;
    sequenceCounter: number;
    lastVerified: Date;
  };

  // New Phase 3
  councilMembers: CouncilMember[];
  councilReviews: CouncilReview[];
  precedents: Precedent[];

  // New Phase 4
  delegations: DelegationRequest[];
  activeDelegations: Record<AgentId, ActiveDelegation[]>;
  autonomyBudgets: Record<string, DailyBudget>; // key: agentId:date
}
```

### 8.2 Optional Supabase Migration

```sql
-- File: supabase/migrations/YYYYMMDD_trustbot_2_0.sql

-- Trust Components
CREATE TABLE trust_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  decision_accuracy DECIMAL(5,2),
  ethics_compliance DECIMAL(5,2),
  task_success DECIMAL(5,2),
  operational_stability DECIMAL(5,2),
  peer_reviews DECIMAL(5,2),
  weighted_score DECIMAL(5,2),
  final_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_components_agent ON trust_components(agent_id, created_at DESC);

-- Cryptographic Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  sequence_number BIGINT UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_id VARCHAR(100) NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
  target_id VARCHAR(100),
  outcome VARCHAR(20) NOT NULL,
  reason TEXT,
  details JSONB,
  previous_hash VARCHAR(64) NOT NULL,
  entry_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_sequence ON audit_log(sequence_number);
CREATE INDEX idx_audit_actor ON audit_log(actor_id, timestamp DESC);

-- Council Reviews
CREATE TABLE council_reviews (
  id UUID PRIMARY KEY,
  request_type VARCHAR(50) NOT NULL,
  requester_id UUID NOT NULL,
  context JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  outcome JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  decided_at TIMESTAMPTZ
);

CREATE TABLE council_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES council_reviews(id),
  voter_id UUID NOT NULL,
  vote VARCHAR(20) NOT NULL,
  reasoning TEXT,
  confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delegations
CREATE TABLE delegations (
  id UUID PRIMARY KEY,
  requester_id UUID NOT NULL,
  capabilities TEXT[] NOT NULL,
  reason TEXT,
  duration_ms INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by VARCHAR(100),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Autonomy Budgets
CREATE TABLE autonomy_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  date DATE NOT NULL,
  tier INTEGER NOT NULL,
  max_autonomous_actions INTEGER NOT NULL,
  autonomous_actions_used INTEGER DEFAULT 0,
  actions JSONB DEFAULT '[]',
  reset_at TIMESTAMPTZ NOT NULL,
  UNIQUE(agent_id, date)
);
```

---

## 9. Migration Strategy

### 9.1 Phase-by-Phase Rollout

```
Week 1-2: Phase 1 (Trust Scoring)
├─ Implement TrustScoreCalculator
├─ Run parallel scoring (old + new)
├─ Validate correlation
├─ Switch to new scoring
└─ Deprecate simple scoring

Week 3-4: Phase 2 (Cryptographic Audit)
├─ Implement CryptographicAuditLogger
├─ Run dual logging (old + new)
├─ Verify chain integrity
├─ Switch to new logger
└─ Archive old logs

Week 5-6: Phase 3 (Council)
├─ Implement CouncilService
├─ Designate initial T4+ reviewers
├─ Shadow mode (council votes, human decides)
├─ Activate council for HITL < 50%
└─ Monitor decision quality

Week 7-8: Phase 4 (Delegation + Budgets)
├─ Implement DelegationManager
├─ Implement AutonomyBudget
├─ Configure tier budgets
├─ Enable budget enforcement
└─ Monitor agent behavior
```

### 9.2 Rollback Procedures

Each phase includes rollback capability:

```typescript
// Feature flags for rollback
const FEATURES = {
  USE_FICO_SCORING: true,      // Phase 1
  USE_CRYPTO_AUDIT: true,      // Phase 2
  USE_COUNCIL: true,           // Phase 3
  USE_DELEGATION: true,        // Phase 4
  USE_AUTONOMY_BUDGET: true,   // Phase 4
};

// In TrustEngine
async calculateScore(agentId: AgentId) {
  if (FEATURES.USE_FICO_SCORING) {
    return this.trustScoreCalculator.calculateScore(agentId);
  }
  return this.legacyCalculateScore(agentId);
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

| Component | Test File | Coverage Target |
|-----------|-----------|-----------------|
| TrustScoreCalculator | `TrustScoreCalculator.test.ts` | 95% |
| CryptographicAuditLogger | `CryptographicAuditLogger.test.ts` | 100% |
| CouncilService | `CouncilService.test.ts` | 90% |
| DelegationManager | `DelegationManager.test.ts` | 90% |
| AutonomyBudget | `AutonomyBudget.test.ts` | 95% |

### 10.2 Integration Tests

```typescript
// File: tests/integration/trustbot-2.0.test.ts

describe('TrustBot 2.0 Integration', () => {
  describe('Trust Flow', () => {
    it('should calculate FICO-style score with all components');
    it('should preserve inheritance from parent');
    it('should propagate penalties to parent');
    it('should update tier on score change');
  });

  describe('Audit Trail', () => {
    it('should chain hashes correctly');
    it('should detect tampering');
    it('should export compliance-ready format');
  });

  describe('Council Governance', () => {
    it('should route to council when HITL < 50%');
    it('should require 2/3 majority for approval');
    it('should create precedent on decision');
    it('should apply precedent on similar request');
  });

  describe('Delegation', () => {
    it('should auto-approve for high-trust agents');
    it('should enforce capability expiry');
    it('should check delegated capabilities');
  });

  describe('Autonomy Budget', () => {
    it('should enforce daily limits');
    it('should reset at midnight');
    it('should vary by tier');
  });
});
```

---

## 11. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Score calculation performance | Medium | Medium | Cache components, async calculation |
| Audit chain corruption | Low | Critical | Checksum verification on write, redundant storage |
| Council deadlock | Medium | High | Timeout with escalation to human |
| Delegation abuse | Medium | High | Auto-approval limits, audit all grants |
| Budget gaming | Low | Medium | Anomaly detection, cross-day analysis |
| Backward compatibility | Medium | Medium | Feature flags, parallel running |

---

## 12. Implementation Roadmap

### 12.1 Dependencies

```
Phase 1 (Trust Scoring)
└── No dependencies, can start immediately

Phase 2 (Cryptographic Audit)
├── Depends on: Phase 1 (for component logging)
└── Can run in parallel with Phase 1

Phase 3 (Council)
├── Depends on: Phase 1 (for reviewer trust scores)
├── Depends on: Phase 2 (for decision audit)
└── Start after Phase 1 complete

Phase 4 (Delegation + Budgets)
├── Depends on: Phase 1 (for tier-based budgets)
├── Depends on: Phase 3 (for council approval of delegations)
└── Start after Phase 3 complete
```

### 12.2 Estimated Effort

| Phase | Components | Estimated Story Points |
|-------|------------|------------------------|
| Phase 1 | TrustScoreCalculator, types, tests | 13 |
| Phase 2 | CryptographicAuditLogger, export, tests | 8 |
| Phase 3 | CouncilService, PrecedentService, integration | 21 |
| Phase 4 | DelegationManager, AutonomyBudget, tests | 13 |
| API | New endpoints, documentation | 8 |
| Frontend | Dashboard updates | 13 |
| **Total** | | **76** |

### 12.3 Success Criteria

- [ ] All 5 trust components calculating correctly
- [ ] Audit chain passes verification with 10,000+ entries
- [ ] Council achieves 90%+ agreement with human decisions (shadow mode)
- [ ] Delegation workflow completing in < 5s for auto-approvals
- [ ] Autonomy budgets enforcing limits with 100% accuracy
- [ ] No regression in existing functionality
- [ ] 95%+ test coverage on new code

---

## Appendix A: Configuration

```yaml
# config/trustbot-2.0.yaml

trust:
  scoring:
    weights:
      decisionAccuracy: 0.35
      ethicsCompliance: 0.25
      taskSuccess: 0.20
      operationalStability: 0.15
      peerReviews: 0.05
    range:
      min: 300
      max: 1000
    inheritance:
      rate: 0.80
    penalty:
      propagation: 0.50

audit:
  hashAlgorithm: sha256
  genesisHash: GENESIS
  exportFormats:
    - json
    - csv
  retentionDays: 2555  # 7 years

council:
  memberCount: 3
  requiredVotes: 2
  timeoutHours: 24
  minTierForMembership: 4
  maxActiveReviewsPerMember: 3

delegation:
  maxDurationMs: 86400000  # 24 hours
  autoApprove:
    minTier: 4
    minSuccessRate: 0.90
    minSimilarApprovals: 3
    maxDurationMs: 3600000  # 1 hour
    excludedCapabilities:
      - SYSTEM_CONFIG
      - HITL_MODIFY
      - AGENT_TERMINATE

autonomy:
  budgets:
    tier0: { actions: 0, delegations: 0, tokens: 0 }
    tier1: { actions: 5, delegations: 0, tokens: 1000 }
    tier2: { actions: 20, delegations: 1, tokens: 5000 }
    tier3: { actions: 50, delegations: 3, tokens: 20000 }
    tier4: { actions: 200, delegations: 10, tokens: 100000 }
    tier5: { actions: -1, delegations: -1, tokens: -1 }  # Unlimited
  resetTimeUtc: "00:00"
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| FICO-Style Scoring | Weighted component scoring inspired by credit scoring models |
| Trust Inheritance | Child agents receive 80% of parent's trust score |
| Penalty Propagation | 50% of child's penalties propagate to parent |
| HITL | Human-In-The-Loop governance level (0-100%) |
| Council | 3-agent voting body for distributed governance |
| Precedent | Recorded decision used to inform future similar decisions |
| Delegation | Temporary capability grant with expiration |
| Autonomy Budget | Daily limit on autonomous actions per agent |
| Cryptographic Audit | SHA-256 hash-chained, tamper-evident logging |

---

**Document Status:** DRAFT
**Next Review:** Upon pilot approval
**Implementation Start:** Pending approval

---

*Generated by BMad Agent Collective in Party Mode*
*TrustBot 2.0 - Enterprise-Scale Autonomous Agent Governance*
