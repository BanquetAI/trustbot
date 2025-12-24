# Architecture - API (Backend)

## Overview

The TrustBot API is a Hono-based REST API server that implements the core governance system for AI agents.

**Project Type:** backend
**Framework:** Hono 4.11
**Language:** TypeScript 5.3 (ES2022)
**Deployment:** Fly.io (Docker)

## Architecture Pattern

**Service-Oriented Architecture** with event-driven coordination via the Blackboard pattern.

```
┌─────────────────────────────────────────────────────────────┐
│                    Hono HTTP Server                         │
│                    (UnifiedWorkflowAPI.ts)                  │
├─────────────────────────────────────────────────────────────┤
│  Middleware Layer                                           │
│  ├── CORS, Rate Limiting, Security Headers                  │
│  ├── Google Auth Middleware                                 │
│  └── Request Validation (Zod-style)                         │
├─────────────────────────────────────────────────────────────┤
│  API Routes (70+ endpoints)                                 │
│  ├── /api/agents, /api/spawn, /api/agent/*                  │
│  ├── /tasks/*, /dashboard/*                                 │
│  ├── /trust/*, /council/*, /delegation/*                    │
│  ├── /autonomy/*, /api/ai/*, /api/skills/*                  │
│  └── /health, /security/audit                               │
├─────────────────────────────────────────────────────────────┤
│  Core Services                                              │
│  ├── TrustEngine (FICO-style scoring)                       │
│  ├── SecurityLayer (Auth, RBAC, Audit)                      │
│  ├── Blackboard (Stigmergic coordination)                   │
│  ├── CouncilService (Multi-agent governance)                │
│  ├── DelegationManager (Task delegation)                    │
│  ├── AutonomyBudgetService (Autonomy tracking)              │
│  └── CryptographicAuditLogger (Tamper-proof audit)          │
├─────────────────────────────────────────────────────────────┤
│  Persistence Layer                                          │
│  ├── SupabasePersistence (PostgreSQL)                       │
│  └── In-memory fallback                                     │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── api/
│   ├── UnifiedWorkflowAPI.ts    # Main API server (2800+ lines)
│   ├── index.ts                  # Entry point
│   └── middleware/
│       ├── security.ts           # CORS, rate limiting, auth
│       └── validation.ts         # Request validation
├── core/
│   ├── TrustEngine.ts            # Trust scoring system
│   ├── TrustScoreCalculator.ts   # FICO-style calculator
│   ├── SecurityLayer.ts          # Auth, authz, audit
│   ├── Blackboard.ts             # Stigmergic coordination
│   ├── PersistenceLayer.ts       # State persistence
│   ├── SupabasePersistence.ts    # Supabase integration
│   ├── council/
│   │   ├── CouncilService.ts     # Multi-agent governance
│   │   └── CouncilMemberRegistry.ts
│   ├── delegation/
│   │   └── DelegationManager.ts  # Task delegation
│   ├── autonomy/
│   │   └── AutonomyBudget.ts     # Autonomy tracking
│   └── CryptographicAuditLogger.ts
├── agents/
│   ├── BaseAgent.ts              # Base agent class
│   └── index.ts
├── orchestrators/                # T5 Supreme Orchestrators
├── skills/
│   ├── index.ts                  # 130 skills library
│   └── integration.ts            # Agent skill integration
└── types/
    ├── types.ts                  # Core types
    └── audit.ts                  # Audit types
```

## Core Services

### TrustEngine

Central trust verification and scoring system. Manages trust inheritance, trust budget allocation, and FICO-style score calculations.

**Key Features:**
- 6-tier trust levels (T0-T5)
- Trust inheritance (80% cascade from parent)
- Trust penalty propagation (50% affects parent)
- Enhanced scoring via TrustScoreCalculator
- Event-driven updates

**Events:**
- `trust:created`, `trust:updated`
- `trust:violation`, `trust:reward`
- `trust:level-changed`, `trust:score-recalculated`

### SecurityLayer

Authentication, authorization, and audit trail management.

**Features:**
- Human operator tokens (master key auth)
- Agent tokens (tier-based permissions)
- RBAC permissions: `HITL_MODIFY`, `BLACKBOARD_POST`, `TRUST_REWARD`, `SPAWN_AGENT`
- Comprehensive audit logging

### Blackboard

Stigmergic coordination system for agent communication.

**Entry Types:** TASK, GOAL, RESOURCE, ALERT, STATUS, KNOWLEDGE

### CouncilService

Multi-agent governance for high-stakes decisions requiring collective agreement.

**Features:**
- Review creation and voting
- Quorum-based decisions
- Council member registry

### DelegationManager

Task delegation with trust-based constraints.

**Features:**
- Delegation chain tracking
- Tier-based delegation limits
- Automatic trust validation

### AutonomyBudgetService

Tracks and manages autonomy budgets per agent.

**Features:**
- Budget allocation and consumption
- Action authorization
- Budget replenishment

## API Endpoints (Summary)

| Category | Count | Key Endpoints |
|----------|-------|---------------|
| Health | 3 | `/health`, `/api/state`, `/api/tick` |
| Agents | 8 | `/api/agents`, `/api/spawn`, `/api/agent/*` |
| Tasks | 8 | `/tasks/*`, `/api/tasks` |
| Dashboard | 3 | `/dashboard/today`, `/dashboard/aggressiveness` |
| Trust | 4 | `/trust/stats`, `/trust/:agentId/*` |
| Security | 2 | `/security/audit`, `/auth/human` |
| Council | 4 | `/council/reviews`, `/council/members` |
| Delegation | 3 | `/delegation/request`, `/delegation/*` |
| Autonomy | 2 | `/autonomy/:agentId/budget`, `/autonomy/:agentId/action` |
| AI/Aria | 15 | `/api/ai/*` (multi-provider AI) |
| Skills | 6 | `/api/skills/*` |

## Testing

- **Framework:** Vitest
- **Coverage:** 96%+ on core modules
- **Tests:** 105 passing
- **Thresholds:** 70% statements/branches/functions/lines

```bash
npm test           # Run tests
npm run test:coverage  # Coverage report
```

## Deployment

**Platform:** Fly.io
**Container:** Node.js 20 Alpine
**Region:** US East (iad)
**Resources:** 1 shared CPU, 256MB RAM
**Scaling:** Auto-stop/start on traffic

```bash
fly deploy         # Deploy to Fly.io
```

---

*Generated by BMad Method document-project workflow*
