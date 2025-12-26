# TrustBot Architecture

## System Overview

TrustBot is a multi-agent AI orchestration platform designed for enterprise-grade governance, trust management, and human oversight.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   Mission Control Web (React/Vite)                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │  Agent   │ │  Task    │ │  Trust   │ │  Audit   │ │Executive │  │    │
│  │  │ Overview │ │ Pipeline │ │ Metrics  │ │  Trail   │ │Dashboard │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │ REST/WebSocket
┌────────────────────────────────────┴────────────────────────────────────────┐
│                               API LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     TrustBot API (Express/Hono)                      │    │
│  │                                                                       │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                    DECISION PIPELINE                          │   │    │
│  │  │  ┌──────────┐    ┌──────────────┐    ┌──────────────┐        │   │    │
│  │  │  │TrustGate │ →  │ Bot Tribunal │ →  │ HITL Queue   │        │   │    │
│  │  │  │(Auto-    │    │ (Peer Vote)  │    │ (Human       │        │   │    │
│  │  │  │ approve) │    │              │    │  Review)     │        │   │    │
│  │  │  └──────────┘    └──────────────┘    └──────────────┘        │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                                                                       │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│  │  │  Auth   │ │  Tasks  │ │ Agents  │ │  Trust  │ │ Audit   │        │    │
│  │  │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │ │ Routes  │        │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────────────────────┐
│                              SERVICE LAYER                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │TrustScoreCalc   │ │TribunalManager  │ │TaskAssignment   │                │
│  │ • Tier calc     │ │ • Peer voting   │ │ • Skill match   │                │
│  │ • Score updates │ │ • Consensus     │ │ • Load balance  │                │
│  │ • History       │ │ • Appeals       │ │ • Priority      │                │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                │
│                                                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │AgentRegistry    │ │TrustAnomaly     │ │BlackboardTask   │                │
│  │ • Agent pool    │ │ • Detection     │ │ • Sync          │                │
│  │ • Capabilities  │ │ • Alerts        │ │ • Bridge        │                │
│  │ • Status        │ │ • Thresholds    │ │ • Events        │                │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────────────────────┐
│                               CORE LAYER                                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │TrustEngine      │ │Blackboard       │ │SecurityLayer    │                │
│  │ • Trust CRUD    │ │ • Stigmergic    │ │ • Auth tokens   │                │
│  │ • Rewards       │ │ • Pub/Sub       │ │ • RBAC          │                │
│  │ • Penalties     │ │ • Events        │ │ • Audit log     │                │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────────────────────┐
│                            DATA/PERSISTENCE                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │    Supabase     │ │   In-Memory     │ │   Hash Chain    │                │
│  │ • PostgreSQL    │ │ • Agent state   │ │ • Audit trail   │                │
│  │ • RLS policies  │ │ • Task queue    │ │ • Integrity     │                │
│  │ • Migrations    │ │ • WebSocket     │ │ • Verification  │                │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Presentation Layer

#### Mission Control Web
- **Framework**: React 18 with Vite
- **State Management**: Zustand stores
- **Real-time**: WebSocket connections
- **Styling**: Tailwind CSS

Key modules:
- `AgentOverviewModule`: Agent listing, status, trust badges
- `TaskPipelineModule`: Task queue, assignments, progress
- `TrustMetricsCard`: Trust scores, tier visualization
- `AuditEntry`: Hash-verified audit trail entries
- `ExecutiveDashboard`: KPIs, fleet health, cost metrics

### 2. API Layer

#### TrustBot API
- **Framework**: Express with Hono router
- **Port**: 3002 (dev), 8080 (prod)
- **Auth**: Token-based with RBAC middleware

Routes:
```
/auth/human          POST - Get operator token
/api/spawn           POST - Spawn new agent
/tasks               GET/POST - Task CRUD
/tasks/:id/assign    POST - Assign task
/tasks/:id/complete  POST - Complete task
/approvals           GET - Pending approvals
/trust/stats         GET - Trust statistics
/dashboard/today     GET - Daily metrics
```

#### Decision Pipeline
Three-stage approval flow:

1. **TrustGate**: Automatic approval for high-trust agents
2. **Bot Tribunal**: Peer voting for borderline cases
3. **HITL Queue**: Human review for flagged actions

### 3. Service Layer

#### TrustScoreCalculator
```typescript
interface TrustScoreCalculator {
  calculateScore(agent: Agent): number;
  getTier(score: number): TrustTier;
  updateScore(agentId: string, delta: number): void;
  getHistory(agentId: string): TrustHistory[];
}
```

#### TribunalManager
```typescript
interface TribunalManager {
  initiateVoting(request: ActionRequest): VotingSession;
  castVote(sessionId: string, agentId: string, vote: Vote): void;
  getConsensus(sessionId: string): ConsensusResult;
  appeal(sessionId: string, reason: string): AppealRequest;
}
```

#### TaskAssignmentService
```typescript
interface TaskAssignmentService {
  assignTask(taskId: string, agentId: string): Assignment;
  findBestAgent(task: Task): Agent | null;
  rebalanceLoad(): void;
}
```

### 4. Core Layer

#### TrustEngine
Central trust management:
- CRUD operations for trust records
- Reward/penalty processing
- Trust history tracking
- Tier calculations

#### Blackboard
Stigmergic coordination:
- Pub/sub messaging
- Agent communication
- Event broadcasting
- State synchronization

#### SecurityLayer
Authentication and authorization:
- Token issuance (human/agent)
- RBAC enforcement
- Permission checking
- Audit logging

### 5. Data Layer

#### Supabase (PostgreSQL)
- Persistent storage
- Row-Level Security (RLS)
- Migrations versioning

#### In-Memory
- Agent runtime state
- Task queue
- WebSocket connections

#### Hash Chain
- Cryptographic audit trail
- Tamper detection
- Integrity verification

---

## Agent Communication Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AGENT COORDINATOR                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Message Router                                  │    │
│  │  • Direct delivery    • Broadcast     • Skill matching              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Claude    │  │   Gemini    │  │    Grok     │  │   Custom    │        │
│  │   Agent     │  │   Agent     │  │   Agent     │  │   Agent     │        │
│  │             │  │             │  │             │  │             │        │
│  │ Skills:     │  │ Skills:     │  │ Skills:     │  │ Skills:     │        │
│  │ - planning  │  │ - research  │  │ - creative  │  │ - custom    │        │
│  │ - analysis  │  │ - data      │  │ - trends    │  │ - domain    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Message Types
- `QUERY`: Ask questions
- `REQUEST_HELP`: Request assistance
- `DELEGATE_TASK`: Assign work
- `SHARE_CONTEXT`: Share data
- `BROADCAST`: Message all
- `TASK_RESULT`: Return results

### Collaboration Flow
1. Agent requests collaboration with required skills
2. Coordinator matches skills to available agents
3. Best-matched agent accepts/declines
4. Work is executed and results returned

---

## Data Flow

### Task Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  CREATE  │ →  │  ASSIGN  │ →  │ EXECUTE  │ →  │ COMPLETE │ →  │  AUDIT   │
│          │    │          │    │          │    │          │    │          │
│ • Title  │    │ • Agent  │    │ • LLM    │    │ • Result │    │ • Hash   │
│ • Desc   │    │ • Token  │    │   call   │    │ • Trust  │    │ • Store  │
│ • Prior  │    │          │    │          │    │   update │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Trust Update Flow

```
┌──────────────┐
│ Task Result  │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Success?     │──→  │ Reward       │
│              │ YES │ +5 to +20    │
└──────┬───────┘     └──────────────┘
       │ NO
       ▼
┌──────────────┐
│ Penalty      │
│ -10 to -50   │
└──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Tier Change? │──→  │ Notify       │
│              │ YES │ Operators    │
└──────────────┘     └──────────────┘
```

---

## Deployment Architecture

### Production

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                CLOUDFLARE                                    │
│                              (DNS + CDN)                                     │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   Vercel      │           │   Fly.io      │           │   Supabase    │
│   (Web)       │           │   (API)       │           │   (Database)  │
│               │           │               │           │               │
│ trustbot-web  │  ←─API──→ │ trustbot-api  │  ←─SQL──→ │  PostgreSQL   │
│ .vercel.app   │           │ .fly.dev      │           │               │
└───────────────┘           └───────────────┘           └───────────────┘
```

### Environment Variables

| Service | Variable | Description |
|---------|----------|-------------|
| API | `MASTER_KEY` | Auth master key |
| API | `SUPABASE_URL` | Database URL |
| API | `SUPABASE_ANON_KEY` | Database key |
| API | `ANTHROPIC_API_KEY` | Claude (optional) |
| Web | `VITE_API_URL` | API base URL |

---

## Security Model

### Authentication
- Human operators: Master key → Token
- AI agents: Spawn → Agent token
- Tokens expire after 24 hours

### Authorization (RBAC)
| Role | Permissions |
|------|-------------|
| HUMAN | All operations |
| DIRECTOR | Governance rules |
| SUPERVISOR | Team management |
| OPERATOR | Task operations |
| AGENT | Execute, report |

### Audit Trail
- All actions logged with hash chain
- Tamper-evident verification
- Compliance-ready exports

---

## Scalability Considerations

### Current Limits
- 100+ concurrent agents
- 1000+ tasks/hour
- Sub-100ms response times

### Scaling Strategies
1. **Horizontal**: Multiple API instances
2. **Database**: Read replicas
3. **Caching**: Redis for hot data
4. **Queue**: Background job processing

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Zustand, Tailwind |
| API | Node.js, Express, Hono |
| Database | PostgreSQL (Supabase) |
| Auth | Custom token system |
| Testing | Vitest (1,406 tests) |
| Deployment | Fly.io (API), Vercel (Web) |
| AI | Claude, Gemini, Grok |
