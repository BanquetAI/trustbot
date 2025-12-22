# 🏢 TrustBot: Governable AI Agent Orchestration

> **Build autonomous AI systems with provable oversight and progressive trust.**

[![Tests](https://img.shields.io/badge/tests-105%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## Why TrustBot?

The AI industry is building **capable** agents. Almost no one is building **governable** agents at scale.

TrustBot solves this with:

| Feature | What It Does | Why It Matters |
|---------|--------------|----------------|
| **6-Tier Trust Hierarchy** | Agents earn autonomy through verified performance | Prevents rogue agents, enables gradual capability expansion |
| **Fading HITL Governance** | Human oversight starts at 100% and decreases as trust builds | Progressive autonomy with audit trails for compliance |
| **Aggressiveness Slider** | Single control for system-wide autonomy level | Instant rollback, intuitive human control |
| **"Completed Today" Dashboard** | Real-time view of agent activity and trust changes | Transparency for operators and stakeholders |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        HUMAN OPERATOR (Governing Agent)                  │
│                    🎚️ Aggressiveness Slider (0-100%)                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │     UNIFIED WORKFLOW ENGINE    │
                    │  • Task Pipeline               │
                    │  • HITL Gateway                │
                    │  • Completed Today Dashboard   │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
   ┌────┴────┐                ┌─────┴─────┐               ┌─────┴─────┐
   │SOVEREIGN│                │ EXECUTIVE │               │  TACTICAL │
   │   T5    │◄───creates────►│    T4     │◄───creates───►│    T3     │
   │ Trust:  │                │  Trust:   │               │  Trust:   │
   │900-1000 │                │  700-899  │               │  500-699  │
   └────┬────┘                └─────┬─────┘               └─────┬─────┘
        │                           │                           │
        │              ┌────────────┼────────────┐              │
        │              │            │            │              │
   ┌────┴────┐    ┌────┴────┐ ┌────┴────┐ ┌────┴────┐    ┌────┴────┐
   │OPERATION│    │ WORKER  │ │ WORKER  │ │ PASSIVE │    │ PASSIVE │
   │   T2    │    │   T1    │ │   T1    │ │   T0    │    │   T0    │
   └─────────┘    └─────────┘ └─────────┘ └─────────┘    └─────────┘
```

### Trust Tiers

| Tier | Level | Trust Range | Capabilities |
|------|-------|-------------|--------------|
| T5 | SOVEREIGN | 900-1000 | Full autonomy, spawns all tiers, system modification |
| T4 | EXECUTIVE | 700-899 | Domain autonomy, spawns T3 and below |
| T3 | TACTICAL | 500-699 | Project scope, spawns T2 and below |
| T2 | OPERATIONAL | 300-499 | Task execution, limited spawning |
| T1 | WORKER | 100-299 | Single task focus |
| T0 | PASSIVE | 0-99 | Observation only |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run tests (105 passing)
npm test

# Start the Unified Workflow API
npm run api

# Start the Building UI (separate terminal)
npm run web
```

### API Endpoints

```bash
# Get today's completed tasks
curl http://localhost:3002/dashboard/today

# Get current aggressiveness setting
curl http://localhost:3002/dashboard/aggressiveness

# Create a task
curl -X POST http://localhost:3002/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Analyze user data", "priority": "HIGH"}'

# Authenticate as human operator
curl -X POST http://localhost:3002/auth/human \
  -H "Content-Type: application/json" \
  -d '{"masterKey": "YOUR_MASTER_KEY"}'

# Adjust aggressiveness (requires human token)
curl -X POST http://localhost:3002/dashboard/aggressiveness \
  -H "Content-Type: application/json" \
  -d '{"level": 50, "tokenId": "YOUR_TOKEN"}'
```

---

## Core Systems

### Trust Engine

The trust engine is the foundation of TrustBot's governance model:

```typescript
import { SecureTrustEngine, createSecureTrustEngine } from './core';

// Create a secure engine with master key
const { engine, masterKey } = createSecureTrustEngine();

// Get human operator token
const token = engine.issueHumanToken(masterKey);

// Create trust for a new agent
engine.createTrust('agent-1', { tier: 3, parentId: 't5-spawner' }, token.id);

// Reward good performance
engine.reward('agent-1', 50, 'Task completed successfully', token.id);

// HITL level can ONLY be changed by human operators
engine.setHITLLevel(75, token.id);  // Works
engine.setHITLLevel(75, agentToken.id);  // Throws UnauthorizedError
```

### Security Layer

All sensitive operations require authentication:

```typescript
import { SecurityLayer } from './core';

const security = new SecurityLayer();

// Issue tokens
const humanToken = security.issueHumanToken(masterKey);
const agentToken = security.issueAgentToken('agent-1', 3);

// Permissions are tier-based
humanToken.permissions;  // All permissions including HITL_MODIFY
agentToken.permissions;  // BLACKBOARD_POST, TRUST_REWARD, SPAWN_AGENT

// Audit trail for compliance
const auditLog = security.getAuditLog({ limit: 100 });
```

### Unified Workflow Engine

Single pipeline for all tasks:

```typescript
import { UnifiedWorkflowEngine } from './api/UnifiedWorkflowAPI';

const engine = new UnifiedWorkflowEngine();

// Create task - automatically checks if approval needed
const task = engine.createTask({
  title: 'Process customer data',
  priority: 'HIGH',
  requiredTier: 3
});

// If aggressiveness is low, high-tier tasks need approval
console.log(task.status);  // 'PENDING_APPROVAL'

// Human approves
engine.approveTask(task.id, 'HUMAN_OPERATOR');

// Get daily summary
const summary = engine.getCompletedToday();
console.log(summary.autonomyMetrics);
// { autoApproved: 45, humanApproved: 12, humanRejected: 2 }
```

---

## The 5 Supreme Orchestrators (T5)

TrustBot bootstraps with 5 sovereign agents:

| Agent | Role | Responsibility |
|-------|------|----------------|
| **T5-Executor** 🎖️ | Supreme Commander | Final authority on all decisions |
| **T5-Planner** 🧠 | Strategic Architect | Designs workforce structure |
| **T5-Validator** 🛡️ | Trust Guardian | Validates spawn requests, monitors trust |
| **T5-Evolver** 🧬 | Adaptive Intelligence | Continuously improves system |
| **T5-Spawner** 🏭 | Agent Factory | Creates all lower-tier agents |

---

## Project Structure

```
trustbot-system/
├── src/
│   ├── core/                 # Core systems
│   │   ├── TrustEngine.ts    # Trust scoring (96% coverage)
│   │   ├── Blackboard.ts     # Stigmergic coordination (97% coverage)
│   │   ├── SecurityLayer.ts  # Auth, authz, audit
│   │   ├── SecureTrustEngine.ts  # Security-wrapped trust engine
│   │   └── *.test.ts         # 105 unit tests
│   │
│   ├── api/
│   │   ├── UnifiedWorkflowAPI.ts  # Hono REST API
│   │   └── server.ts         # Legacy API
│   │
│   ├── orchestrators/        # T5 Supreme Orchestrators
│   └── agents/               # Base agent classes
│
├── web/                      # React Building UI
├── vitest.config.ts          # Test configuration
└── package.json
```

---

## Competitive Advantage

| Capability | TrustBot | AutoGen | CrewAI | LangGraph |
|------------|----------|---------|--------|-----------|
| Hierarchical trust | ✅ 6 tiers | ❌ | ❌ | ❌ |
| Fading HITL | ✅ Progressive | ❌ | ❌ | ❌ |
| Aggressiveness control | ✅ Single slider | ❌ | ❌ | ❌ |
| Audit trails | ✅ Full | ❌ | ❌ | ❌ |
| Trust inheritance | ✅ 80% cascade | ❌ | ❌ | ❌ |
| Security layer | ✅ RBAC | ❌ | ❌ | ❌ |

**TrustBot's moat: Governance and trust, not just capabilities.**

---

## Roadmap

- [x] Phase 1: Testing Foundation (105 tests, 96%+ coverage on core)
- [x] Phase 2: Security Hardening (Auth, RBAC, Audit)
- [x] Phase 3: Unified Workflow API (Hono, Completed Today, Aggressiveness)
- [ ] Phase 4: Persistence Layer (Redis/KV)
- [ ] Phase 5: Web Dashboard Integration
- [ ] Phase 6: MCP Server Integration

---

## License

MIT

---

## Contributing

TrustBot is built for the future of governable AI. Contributions welcome.

```bash
# Run tests before submitting
npm test

# Check coverage
npm run test:coverage
```

---

*Built with trust. Governed by design.*
