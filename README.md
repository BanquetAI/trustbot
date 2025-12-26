# TrustBot Mission Control

> **Build autonomous AI systems with provable oversight and progressive trust.**

[![Tests](https://img.shields.io/badge/tests-1406%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()
[![API](https://img.shields.io/badge/API-live-success)](https://trustbot-api.fly.dev)
[![Web](https://img.shields.io/badge/Web-live-success)](https://trustbot-web.vercel.app)

## Overview

TrustBot is a multi-agent AI orchestration platform with trust-based governance, human-in-the-loop (HITL) oversight, and cryptographic accountability. It enables organizations to deploy, monitor, and govern fleets of AI agents with:

- **Trust Scoring**: Dynamic trust levels (0-100) with 5-tier progression
- **Decision Pipeline**: TrustGate, Bot Tribunal, and HITL oversight
- **Cryptographic Audit**: Hash-chain verified accountability trails
- **Multi-LLM Support**: Claude, Gemini, Grok, and extensible architecture
- **Agent Communication**: Direct messaging, collaboration, and task delegation

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/BanquetAI/trustbot.git
cd trustbot

# Install dependencies
npm install
cd web && npm install && cd ..

# Run tests (1,406 passing)
npm run test:run

# Start API server
npm run api

# Start web frontend (separate terminal)
cd web && npm run dev
```

### Production URLs

| Environment | URL |
|-------------|-----|
| API | https://trustbot-api.fly.dev |
| Web | https://trustbot-web.vercel.app |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mission Control (Web)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Agent   │ │  Task    │ │  Trust   │ │ Audit    │           │
│  │ Overview │ │ Pipeline │ │ Metrics  │ │ Trail    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST/WebSocket
┌────────────────────────────┴────────────────────────────────────┐
│                        TrustBot API                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Decision Pipeline                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │   │
│  │  │ TrustGate│→ │ Tribunal │→ │   HITL   │               │   │
│  │  └──────────┘  └──────────┘  └──────────┘               │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │     Services: Trust, Tasks, Agents, Governance           │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                  Agent Coordinator                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Claude  │  │  Gemini  │  │   Grok   │  │  Custom  │        │
│  │  Agent   │  │  Agent   │  │  Agent   │  │  Agent   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Trust System

### Trust Tiers

| Tier | Range | Autonomy Level | Capabilities |
|------|-------|----------------|--------------|
| 1 | 0-20 | Fully supervised | Observation, basic tasks |
| 2 | 21-40 | Low autonomy | Limited task execution |
| 3 | 41-60 | Standard autonomy | Full task execution |
| 4 | 61-80 | High autonomy | Task creation, delegation |
| 5 | 81-100 | Full autonomy | System modification |

### Decision Pipeline

1. **TrustGate**: Evaluates agent trust vs task requirements
2. **Bot Tribunal**: Peer agents vote on borderline decisions
3. **HITL Queue**: Human operators review flagged actions

---

## Connect AI Agents

### Single Agent

```bash
# Claude (Anthropic)
ANTHROPIC_API_KEY=your_key npx tsx scripts/agents/claude-agent.ts

# Gemini (Google)
GOOGLE_API_KEY=your_key npx tsx scripts/agents/gemini-agent.ts

# Grok (X.AI)
XAI_API_KEY=your_key npx tsx scripts/agents/grok-agent.ts
```

### Multi-Agent Fleet

```bash
ANTHROPIC_API_KEY=x GOOGLE_API_KEY=y XAI_API_KEY=z \
  npx tsx scripts/agents/multi-agent-fleet.ts
```

### Agent Communication Demo

```bash
npx tsx scripts/agents/collaborative-agents-demo.ts
```

---

## API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/dashboard/today` | Daily dashboard metrics |
| POST | `/auth/human` | Authenticate as operator |
| POST | `/api/spawn` | Spawn new agent |
| GET | `/tasks` | List tasks |
| POST | `/tasks` | Create task |
| POST | `/tasks/:id/assign` | Assign task to agent |
| POST | `/tasks/:id/complete` | Complete task |
| GET | `/approvals` | Pending approvals |
| GET | `/trust/stats` | Trust statistics |

### Authentication

```bash
# Get auth token
curl -X POST https://trustbot-api.fly.dev/auth/human \
  -H "Content-Type: application/json" \
  -d '{"masterKey": "your-master-key"}'
```

### Example: Complete Task Lifecycle

```bash
# 1. Authenticate
TOKEN=$(curl -s -X POST https://trustbot-api.fly.dev/auth/human \
  -H "Content-Type: application/json" \
  -d '{"masterKey": "your-key"}' | jq -r '.tokenId')

# 2. Spawn agent
AGENT_ID=$(curl -s -X POST https://trustbot-api.fly.dev/api/spawn \
  -H "Content-Type: application/json" \
  -d '{"name": "MyAgent", "type": "WORKER", "tier": 3}' | jq -r '.agent.id')

# 3. Create task
TASK_ID=$(curl -s -X POST https://trustbot-api.fly.dev/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "priority": "MEDIUM"}' | jq -r '.id')

# 4. Assign and complete
curl -X POST "https://trustbot-api.fly.dev/tasks/$TASK_ID/assign" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\": \"$AGENT_ID\", \"tokenId\": \"$TOKEN\"}"

curl -X POST "https://trustbot-api.fly.dev/tasks/$TASK_ID/complete" \
  -H "Content-Type: application/json" \
  -d "{\"result\": {\"summary\": \"Done\"}, \"tokenId\": \"$TOKEN\"}"
```

---

## Agent-to-Agent Communication

Agents can communicate directly via the AgentCoordinator:

```typescript
import { ClaudeAgent } from './scripts/agents/claude-agent';
import { getCoordinator } from './scripts/agents/agent-coordinator';

const claude = new ClaudeAgent({ name: 'Claude-1' });
await claude.initialize();
claude.joinCoordinator();

// Direct messaging
await claude.sendMessage(targetId, 'QUERY', 'Question', 'What is the status?');

// Request collaboration (skill-based matching)
await claude.requestCollaboration('Data Analysis', 'Analyze metrics', ['data-analysis']);

// Broadcast to all agents
await claude.broadcast('Status Update', 'Task completed successfully');

// Delegate task
await claude.delegateTask(researcherId, 'Research', 'Find best practices');
```

### Communication Patterns

| Pattern | Description |
|---------|-------------|
| `QUERY` | Ask another agent a question |
| `REQUEST_HELP` | Request assistance |
| `DELEGATE_TASK` | Assign work to another agent |
| `SHARE_CONTEXT` | Share relevant data |
| `BROADCAST` | Message all agents |
| `COLLABORATION` | Skill-based matching |

---

## Project Structure

```
trustbot/
├── src/                    # API source code
│   ├── api/               # Express routes and middleware
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # RBAC, auth, etc.
│   │   └── ws/            # WebSocket hub
│   ├── agents/            # Agent base classes
│   ├── core/              # Trust scoring, blackboard
│   ├── services/          # Business logic services
│   │   ├── TribunalManager.ts
│   │   ├── TaskAssignmentService.ts
│   │   └── TrustAnomalyDetector.ts
│   └── types.ts           # Type definitions
├── web/                   # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   │   └── mission-control/
│   │   ├── stores/       # Zustand state
│   │   └── hooks/        # Custom hooks
│   └── dist/             # Production build
├── scripts/
│   └── agents/           # AI agent connectors
│       ├── base-ai-agent.ts
│       ├── claude-agent.ts
│       ├── gemini-agent.ts
│       ├── grok-agent.ts
│       ├── agent-coordinator.ts
│       ├── agent-protocol.ts
│       └── multi-agent-fleet.ts
├── supabase/
│   └── migrations/       # Database migrations
├── docs/                 # Documentation
│   ├── PRODUCT_SPEC.md
│   ├── DEMO_FLOW.md
│   └── stories/          # Story documentation
└── tests/                # E2E tests
```

---

## Development

### Testing

```bash
# Unit tests
npm run test:run

# Watch mode
npm run test

# Coverage
npm run test:coverage

# E2E tests
npx playwright test
```

### Building

```bash
# API
npm run build

# Web
cd web && npm run build
```

---

## Deployment

### API (Fly.io)

```bash
fly deploy --app trustbot-api
```

### Web (Vercel)

```bash
cd web && npx vercel --prod
```

### Environment Variables

**API:**

| Variable | Description |
|----------|-------------|
| `MASTER_KEY` | Authentication master key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `ANTHROPIC_API_KEY` | Claude API key (optional) |

**Web:**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL |

---

## Completed Phases

- [x] **Phase 1**: Mission Control Dashboard (8 epics, 41 stories)
  - RBAC, real-time, agent visibility
  - Decision queue, morning review
  - Governance, tribunal transparency
  - Cryptographic audit trail
  - Compliance, evidence packages
  - Investigation management
  - Executive dashboards
  - Onboarding, education

- [x] **Phase 2**: Live Agent Integration (5 epics, 32 stories)
  - Multi-LLM connectors (Claude, Gemini, Grok)
  - Agent-to-agent communication
  - Collaboration workflows
  - Production deployment

---

## License

MIT

---

## Support

- Issues: https://github.com/BanquetAI/trustbot/issues
- Documentation: See `/docs` folder

---

*Built with trust. Governed by design.*
