---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/prd.md"
  - "_bmad-output/stories/epic-1-enhanced-trust-scoring.md"
  - "_bmad-output/stories/epic-2-cryptographic-audit.md"
  - "_bmad-output/stories/epic-3-council-governance.md"
  - "_bmad-output/stories/epic-4-delegation-autonomy.md"
  - "_bmad-output/stories/epic-5-api-frontend.md"
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2025-12-23'
project_name: 'TrustBot'
user_name: 'pilot'
date: '2025-12-23'
hasProjectContext: false
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- 55 FRs across 9 capability areas
- Core domains: Agent Visibility, Task Management, Governance, Audit, Investigation, Oversight, Reporting, Onboarding, User Management
- Every FR traces to user journeys (Operator, Supervisor, Director, Compliance)

**Non-Functional Requirements:**
- 49 NFRs across 7 categories
- Performance: <2s dashboard load, <2s real-time delivery
- Security: TLS 1.3, encryption at rest, hash chain integrity
- Reliability: 99.5% → 99.99% SLA progression
- Compliance: SOC 2 Type II, EU AI Act 2027, WCAG 2.1 AA

**Scale & Complexity:**
- Primary domain: Full-stack SaaS B2B
- Complexity level: HIGH (governance + compliance + real-time)
- Existing infrastructure: Brownfield (Hono API, React SPA, Supabase)
- Estimated architectural components: 12-15 major services

### Technical Constraints & Dependencies

| Constraint | Implication |
|------------|-------------|
| **Brownfield** | Must integrate with existing 70+ API endpoints |
| **Supabase** | PostgreSQL + Realtime Channels locked in |
| **Fly.io + Vercel** | Deployment targets fixed |
| **TypeScript** | Type safety required throughout |
| **Existing TrustEngine** | Extend, don't replace (feature flags) |

### Cross-Cutting Concerns Identified

| Concern | Scope | Priority |
|---------|-------|----------|
| **Audit Trail** | Every mutation, every read of sensitive data | P0 |
| **Multi-tenancy** | All queries filtered by org_id | P0 |
| **Real-time** | Agent events, trust changes, decisions | P0 |
| **RBAC** | 4 roles with distinct capabilities | P0 |
| **Hash Chain** | Audit writes chained, verification on read | P0 |
| **Error Handling** | Graceful degradation, connection recovery | P1 |

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack SaaS B2B** - Brownfield enhancement of existing platform

### Existing Foundation (Brownfield)

This is an extension of an existing production system, not a greenfield starter selection.

**Current Stack:**

| Layer | Technology | Status |
|-------|------------|--------|
| **API** | Hono 4.x | 70+ endpoints active |
| **Frontend** | React 18 | Console.tsx as base |
| **Database** | Supabase/PostgreSQL | 8+ tables |
| **Real-time** | Supabase Channels | Active |
| **Auth** | Supabase Auth | Email/password |
| **Language** | TypeScript 5.x | Strict mode |
| **API Deploy** | Fly.io | Production |
| **Web Deploy** | Vercel | Production |

### Architectural Decisions Already Made

**Language & Runtime:**
- TypeScript with strict mode
- Node.js 20 LTS
- ES modules

**API Architecture:**
- Hono framework with middleware chain
- RESTful design with /api/v1/ prefix
- JWT authentication via Supabase

**Frontend Architecture:**
- React 18 with functional components
- Vite for bundling
- CSS modules / index.css

**Database:**
- PostgreSQL via Supabase
- Row-level security for multi-tenancy
- Realtime subscriptions via Channels

**Development Experience:**
- Vitest for testing
- ESLint + Prettier
- npm scripts for build/dev/test

### Extension Strategy for Mission Control

Rather than replacing the foundation, Mission Control will:

1. **Extend existing API** - Add new /api/v1/mission-control/* endpoints
2. **Add React components** - Mission Control modules in web/src/components/
3. **Leverage existing services** - TrustEngine, SecurityLayer, Blackboard
4. **Add real-time channels** - New subscriptions for dashboard updates

**Note:** No starter template initialization needed - extend existing codebase.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Hash chain storage architecture (separate table)
- RBAC implementation pattern (hybrid middleware + RLS)
- Real-time channel structure (granular by entity)
- State management approach (Zustand)

**Important Decisions (Shape Architecture):**
- Tribunal vote normalization
- Cursor-based pagination for audit
- Optimistic UI updates with reconciliation
- Feature flag infrastructure

**Deferred Decisions (Post-MVP):**
- Drag-drop module customization
- Redis caching layer
- Cold storage for 7-year retention

### Data Architecture

| Decision | Choice | Version/Details |
|----------|--------|-----------------|
| **Hash Chain Storage** | Separate `audit_hashes` table | Links to audit_log via entry_id |
| **Trust Score Caching** | In-memory Map + Supabase | TTL: 60s, invalidate on trust events |
| **Audit Retention** | Archive after 90 days | `audit_log_archive` table, nightly job |
| **Event Shape** | Typed discriminated unions | `TrustEvent | QueueEvent | AgentEvent` |

**Hash Chain Schema:**
```sql
CREATE TABLE audit_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES audit_log(id),
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,
  algorithm TEXT DEFAULT 'sha256',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_hashes_entry ON audit_hashes(entry_id);
CREATE INDEX idx_audit_hashes_chain ON audit_hashes(previous_hash);
```

**Tribunal Votes Schema:**
```sql
CREATE TABLE tribunal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_request_id UUID REFERENCES action_requests(id),
  agent_id TEXT NOT NULL,
  vote TEXT CHECK (vote IN ('approve', 'deny', 'abstain')),
  reasoning TEXT,
  confidence DECIMAL(3,2),
  voted_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tribunal_action ON tribunal_votes(action_request_id);
```

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **RBAC Pattern** | Hybrid: Middleware + RLS | Defense in depth |
| **Role Check** | Hono middleware `requireRole()` | Fast fail before DB |
| **Data Isolation** | Supabase RLS on org_id | Can't bypass via SQL |
| **HITL Metrics** | Server-side capture | Accurate, tamper-resistant |

**RBAC Middleware Pattern:**
```typescript
// Hono middleware
const requireRole = (...roles: UserRole[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
};

// Usage
app.get('/mission-control/team',
  requireRole('supervisor', 'director'),
  getTeamView
);
```

**RLS Policy Pattern:**
```sql
CREATE POLICY org_isolation ON agents
  FOR ALL USING (org_id = auth.jwt() ->> 'org_id');
```

### API & Communication Patterns

| Decision | Choice | Details |
|----------|--------|---------|
| **Route Namespace** | `/api/v1/mission-control/*` | Isolated from existing routes |
| **Real-time Channels** | Granular by entity | org:{id}, agent:{id}, queue:{id} |
| **Pagination** | Cursor-based | `?cursor=xyz&limit=50` |
| **Error Format** | RFC 7807 Problem Details | Standard error shape |

**Channel Structure:**
```typescript
// Channel subscriptions
supabase.channel(`org:${orgId}`)
  .on('broadcast', { event: 'agent:status' }, handleAgentStatus)
  .on('broadcast', { event: 'trust:changed' }, handleTrustChange)
  .subscribe();

supabase.channel(`queue:${orgId}`)
  .on('broadcast', { event: 'decision:pending' }, handleNewDecision)
  .on('broadcast', { event: 'decision:resolved' }, handleResolved)
  .subscribe();
```

**Mission Control Endpoints:**
```
GET  /api/v1/mission-control/dashboard      # Aggregated KPIs
GET  /api/v1/mission-control/agents         # Agent list with status
GET  /api/v1/mission-control/queue          # Pending decisions
GET  /api/v1/mission-control/queue/morning  # Overnight queue
POST /api/v1/mission-control/decisions/:id/approve
POST /api/v1/mission-control/decisions/:id/deny
POST /api/v1/mission-control/decisions/:id/investigate
GET  /api/v1/mission-control/audit          # Audit trail (cursor)
GET  /api/v1/mission-control/audit/:id/verify  # Hash verification
```

### Frontend Architecture

| Decision | Choice | Details |
|----------|--------|---------|
| **State Management** | Zustand | `useMissionControlStore()` |
| **Module Layout** | Fixed CSS Grid | 3-column responsive |
| **Real-time Updates** | Optimistic + reconcile | Instant UX, server confirms |
| **Tooltip Tour** | react-joyride | Accessible, customizable |
| **Components** | Compound pattern | `<Module.Header>`, `<Module.Body>` |

**Zustand Store Structure:**
```typescript
interface MissionControlState {
  // Agent data
  agents: Agent[];
  agentStatus: Map<string, AgentStatus>;

  // Queue data
  pendingDecisions: Decision[];
  morningQueue: Decision[];

  // Real-time
  lastSync: Date;
  connectionStatus: 'connected' | 'reconnecting' | 'offline';

  // Actions
  approveDecision: (id: string) => Promise<void>;
  denyDecision: (id: string, reason: string) => Promise<void>;
  refreshAgents: () => Promise<void>;
}
```

**Module Component Pattern:**
```typescript
// Compound component pattern
<AgentOverviewModule>
  <AgentOverviewModule.Header title="Agent Fleet" />
  <AgentOverviewModule.Filters />
  <AgentOverviewModule.List agents={agents} />
  <AgentOverviewModule.Footer count={agents.length} />
</AgentOverviewModule>
```

### Infrastructure & Deployment

| Decision | Choice | Details |
|----------|--------|---------|
| **Connection Recovery** | Exponential backoff | 1s, 2s, 4s, 8s, max 30s |
| **Sync Indicator** | "Last sync: Xs ago" | Shows in header when stale |
| **Hash Cache** | LRU (1000, 5min TTL) | Avoid re-verification |
| **Feature Flags** | Env + DB config | `FEATURES` table in Supabase |
| **Archive Job** | Supabase scheduled function | Nightly at 3 AM UTC |

**Connection Recovery Pattern:**
```typescript
const useRealtimeConnection = () => {
  const [status, setStatus] = useState<'connected' | 'reconnecting'>('connected');
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    const channel = supabase.channel(`org:${orgId}`)
      .on('system', { event: 'disconnect' }, () => {
        setStatus('reconnecting');
        reconnectWithBackoff();
      })
      .on('system', { event: 'connected' }, () => {
        setStatus('connected');
        setLastSync(new Date());
      });

    return () => channel.unsubscribe();
  }, [orgId]);

  return { status, lastSync };
};
```

### Decision Impact Analysis

**Implementation Sequence:**
1. Database migrations (audit_hashes, tribunal_votes, archive)
2. RBAC middleware implementation
3. RLS policies for new tables
4. Real-time channel setup
5. Zustand store creation
6. Mission Control API routes
7. React module components
8. react-joyride tour integration

**Cross-Component Dependencies:**
- Hash verification depends on audit_hashes table
- Tribunal display depends on tribunal_votes normalization
- Real-time updates depend on channel structure
- Module components depend on Zustand store shape

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 24 areas where AI agents could make different choices

### Naming Patterns

**Database Naming:**
| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `audit_hashes` |
| Columns | snake_case | `created_at` |
| Indexes | `idx_{table}_{cols}` | `idx_audit_hashes_entry` |
| Foreign Keys | `{table}_id` | `org_id`, `agent_id` |

**API Naming:**
| Element | Convention | Example |
|---------|------------|---------|
| Routes | kebab-case, plural | `/mission-control/agents` |
| Route Params | `:camelCase` | `:decisionId` |
| Query Params | camelCase | `?agentId=xxx` |

**Code Naming:**
| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `AgentOverviewModule` |
| Files (components) | PascalCase.tsx | `AgentOverview.tsx` |
| Files (utilities) | camelCase.ts | `hashChain.ts` |
| Functions | camelCase | `calculateTrustScore` |
| Types/Interfaces | PascalCase | `TrustScore` |
| Constants | UPPER_SNAKE | `DEFAULT_PAGE_SIZE` |
| Hooks | use{Name} | `useRealtimeConnection` |
| Stores | use{Name}Store | `useMissionControlStore` |

### Structure Patterns

**New Files Location:**
- API routes: `src/api/routes/mission-control/`
- API middleware: `src/api/middleware/`
- API services: `src/api/services/`
- React components: `web/src/components/mission-control/`
- Zustand stores: `web/src/stores/`
- Custom hooks: `web/src/hooks/`
- Shared types: `src/types/` and `web/src/types/`

**Test Location:** Co-located with source files
```
feature.ts
feature.test.ts
```

### Format Patterns

**API Response Wrapper:**
```typescript
// Success
{ data: T, meta?: { cursor, hasMore, total } }

// Error (RFC 7807)
{ type, title, status, detail, instance }
```

**Date Format:** ISO 8601 UTC strings
```typescript
"2025-12-23T14:30:00.000Z"
```

**Event Payload:**
```typescript
{ type: string, payload: T, timestamp: string, orgId: string }
```

### Communication Patterns

**Real-time Events:** `{entity}:{action}` lowercase
```
agent:status_changed
trust:score_updated
decision:pending
queue:item_resolved
```

**Zustand Actions:** Imperative verbs
```typescript
approveDecision(id)
refreshAgents()
setConnectionStatus(status)
```

### Process Patterns

**Async State Shape:**
```typescript
{ data: T | null, isLoading: boolean, error: Error | null }
```

**Error Handling:**
- API: Throw `ApiError` with type, message, status
- Frontend: Catch, display toast, log to console

**Validation:** Zod schemas for all API inputs

**Retry Logic:** Exponential backoff (1s, 2s, 4s... max 30s)

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow naming conventions exactly (case matters)
2. Place new files in designated directories
3. Use RFC 7807 for all error responses
4. Co-locate tests with source files
5. Use Zod for input validation
6. Use ISO 8601 for all dates
7. Follow event naming: `{entity}:{action}`

**Pattern Verification:**
- TypeScript compiler catches type mismatches
- ESLint rules enforce naming conventions
- PR review checks pattern compliance

### Anti-Patterns to Avoid

| Bad | Good | Why |
|-----|------|-----|
| `getUserData()` | `getUser()` | Redundant "Data" suffix |
| `users_table` | `users` | Don't suffix tables with "_table" |
| `handleApprove()` | `approveDecision()` | Avoid "handle" prefix for actions |
| `{ error: "msg" }` | `{ type, title, status, detail }` | Use RFC 7807 |
| `UserCreated` | `user:created` | Events are lowercase with colon |
| `__tests__/` | `*.test.ts` | Co-locate tests |

## Project Structure & Boundaries

### Complete Project Directory Structure

```
scarlet-armstrong/                      # Project root
├── README.md
├── package.json                        # Root package (workspaces)
├── package-lock.json
├── tsconfig.json                       # Base TS config
├── .env                                # Environment variables
├── .env.example
├── .gitignore
├── vitest.config.ts                    # Test configuration
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      # CI pipeline
│       └── deploy.yml                  # Deploy pipeline
│
├── docs/
│   ├── PRODUCT_SPEC.md                 # Existing
│   └── DEMO_FLOW.md                    # Existing
│
├── _bmad-output/                       # Planning artifacts
│   ├── prd.md                          # Product Requirements
│   ├── architecture.md                 # This document
│   └── stories/                        # Epic files
│
├── src/                                # API source (Hono)
│   ├── api/
│   │   ├── index.ts                    # API entry point
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts                # Route aggregator
│   │   │   ├── agents.ts               # Existing agent routes
│   │   │   ├── tasks.ts                # Existing task routes
│   │   │   ├── ai.ts                   # Existing AI routes
│   │   │   │
│   │   │   └── mission-control/        # NEW: Mission Control routes
│   │   │       ├── index.ts            # MC route aggregator
│   │   │       ├── dashboard.ts        # GET /mc/dashboard
│   │   │       ├── agents.ts           # GET /mc/agents
│   │   │       ├── queue.ts            # GET /mc/queue, /mc/queue/morning
│   │   │       ├── decisions.ts        # POST approve/deny/investigate
│   │   │       ├── audit.ts            # GET /mc/audit (cursor)
│   │   │       ├── audit.test.ts       # Co-located tests
│   │   │       ├── team.ts             # GET /mc/team (supervisor)
│   │   │       ├── kpis.ts             # GET /mc/kpis (executive)
│   │   │       └── investigations.ts   # Investigation endpoints
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # Existing auth middleware
│   │   │   ├── rbac.ts                 # NEW: Role-based access
│   │   │   └── audit.ts                # NEW: Audit logging middleware
│   │   │
│   │   └── services/
│   │       ├── hashChain.ts            # NEW: Hash chain service
│   │       ├── hashChain.test.ts
│   │       ├── hitlMetrics.ts          # NEW: HITL quality metrics
│   │       ├── hitlMetrics.test.ts
│   │       ├── realtime.ts             # NEW: Channel broadcasting
│   │       └── archiver.ts             # NEW: Audit archival service
│   │
│   ├── core/                           # Existing core services
│   │   ├── TrustEngine.ts
│   │   ├── TrustEngine.test.ts
│   │   ├── TrustScoreCalculator.ts     # From Epic 1
│   │   ├── TrustScoreCalculator.test.ts
│   │   ├── SecurityLayer.ts
│   │   ├── Blackboard.ts
│   │   ├── CouncilService.ts
│   │   └── AgentOrchestrator.ts
│   │
│   ├── types/
│   │   ├── index.ts                    # Type exports
│   │   ├── agent.ts                    # Agent types
│   │   ├── trust.ts                    # Trust types (Epic 1)
│   │   └── mission-control.ts          # NEW: MC-specific types
│   │
│   └── db/
│       ├── schema.sql                  # Database schema
│       └── migrations/
│           ├── 001_initial.sql
│           ├── 002_audit_hashes.sql    # NEW: Hash chain table
│           ├── 003_tribunal_votes.sql  # NEW: Tribunal votes
│           └── 004_audit_archive.sql   # NEW: Archive table
│
├── web/                                # Frontend (React + Vite)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   │
│   ├── public/
│   │   ├── trustbot-intro.mp4          # Existing
│   │   └── favicon.ico
│   │
│   └── src/
│       ├── main.tsx                    # Entry point
│       ├── App.tsx                     # Root component
│       ├── index.css                   # Global styles
│       ├── api.ts                      # API client
│       │
│       ├── components/
│       │   ├── Console.tsx             # Existing console
│       │   ├── AgentProfilePage.tsx    # Existing
│       │   ├── LoginScreen.tsx         # Existing
│       │   ├── Tooltip.tsx             # Existing
│       │   ├── NavBar.tsx              # Existing
│       │   │
│       │   └── mission-control/        # NEW: Mission Control
│       │       ├── MissionControlDashboard.tsx
│       │       ├── MissionControlDashboard.test.tsx
│       │       │
│       │       ├── modules/            # Dashboard modules
│       │       │   ├── AgentOverviewModule.tsx
│       │       │   ├── AgentOverviewModule.test.tsx
│       │       │   ├── TaskPipelineModule.tsx
│       │       │   ├── RecordReviewModule.tsx
│       │       │   └── UserControlsModule.tsx
│       │       │
│       │       ├── views/              # Role-specific views
│       │       │   ├── OperatorView.tsx
│       │       │   ├── SupervisorView.tsx
│       │       │   ├── ExecutiveView.tsx
│       │       │   └── ComplianceView.tsx
│       │       │
│       │       ├── shared/             # Shared MC components
│       │       │   ├── AgentLink.tsx
│       │       │   ├── TrustBadge.tsx
│       │       │   ├── HashVerifyBadge.tsx
│       │       │   ├── UrgencyIndicator.tsx
│       │       │   ├── DecisionCard.tsx
│       │       │   ├── AuditEntry.tsx
│       │       │   └── ConnectionStatus.tsx
│       │       │
│       │       └── tour/               # Onboarding
│       │           ├── OnboardingTour.tsx
│       │           ├── tourSteps.ts
│       │           └── ContextualPopup.tsx
│       │
│       ├── stores/                     # NEW: Zustand stores
│       │   ├── missionControlStore.ts
│       │   ├── missionControlStore.test.ts
│       │   └── types.ts
│       │
│       ├── hooks/                      # NEW: Custom hooks
│       │   ├── useRealtimeConnection.ts
│       │   ├── useMissionControl.ts
│       │   ├── useAuditVerification.ts
│       │   └── useTour.ts
│       │
│       └── types/
│           ├── index.ts
│           └── mission-control.ts      # Frontend MC types
│
└── coverage/                           # Test coverage output
```

### Architectural Boundaries

**Layer Responsibilities:**

| Layer | Responsibility | Location |
|-------|---------------|----------|
| API Routes | HTTP handling, validation | `src/api/routes/` |
| Middleware | Auth, RBAC, audit logging | `src/api/middleware/` |
| Services | Business logic, integrations | `src/api/services/` |
| Core | Domain logic (Trust, Security) | `src/core/` |
| Data | Database operations | Supabase client |
| UI Components | User interface | `web/src/components/` |
| State | Client state management | `web/src/stores/` |
| Hooks | Reusable logic | `web/src/hooks/` |

**API Boundary Diagram:**
```
PUBLIC: /api/v1/mission-control/*
         │
    ┌────┴────┐
    │ Routes  │ ← HTTP layer
    └────┬────┘
         │
    ┌────┴────┐
    │Middleware│ ← Auth, RBAC, Audit
    └────┬────┘
         │
    ┌────┴────┐
    │Services │ ← Business logic
    └────┬────┘
         │
    ┌────┴────┐
    │  Core   │ ← Domain (TrustEngine)
    └────┬────┘
         │
    ┌────┴────┐
    │Supabase │ ← Data layer
    └─────────┘
```

**Frontend Boundary Diagram:**
```
┌─────────────────────────────┐
│     UI Components           │
│  (Modules, Views, Shared)   │
└──────────┬──────────────────┘
           │
┌──────────┴──────────────────┐
│     Zustand Store           │
│  useMissionControlStore()   │
└──────────┬──────────────────┘
           │
┌──────────┴──────────────────┐
│   Hooks (Realtime, API)     │
└──────────┬──────────────────┘
           │
┌──────────┴──────────────────┐
│   API Client + Supabase     │
└─────────────────────────────┘
```

### Requirements to Structure Mapping

**FR Category Mapping:**

| Category | API Files | Frontend Files |
|----------|-----------|----------------|
| Agent Visibility (FR1-6) | `routes/mc/agents.ts` | `modules/AgentOverviewModule.tsx` |
| Task & Queue (FR7-13) | `routes/mc/queue.ts` | `modules/TaskPipelineModule.tsx` |
| Decision (FR14-22) | `routes/mc/decisions.ts` | `shared/DecisionCard.tsx` |
| Audit (FR23-30) | `routes/mc/audit.ts` | `modules/RecordReviewModule.tsx` |
| Investigation (FR31-35) | `routes/mc/investigations.ts` | Views |
| Team Oversight (FR36-40) | `routes/mc/team.ts` | `views/SupervisorView.tsx` |
| Executive (FR41-45) | `routes/mc/kpis.ts` | `views/ExecutiveView.tsx` |
| Onboarding (FR46-50) | - | `tour/OnboardingTour.tsx` |

### Database Schema Additions

**New Tables:**

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `audit_hashes` | Hash chain integrity | entry_id, previous_hash, current_hash |
| `tribunal_votes` | Normalized voting | action_request_id, agent_id, vote |
| `audit_log_archive` | Archived entries | Same as audit_log |
| `features` | Feature flags | name, enabled, org_id |
| `hitl_metrics` | Quality tracking | user_id, review_time, context_depth |

### Integration Points

**Internal Communication:**

| From | To | Method |
|------|----|--------|
| React Modules | Zustand Store | `useMissionControlStore()` |
| Zustand Store | API | `fetch()` via api.ts |
| Supabase Channel | Zustand Store | Event handlers |
| API Routes | Core Services | Direct import |
| Core Services | Database | Supabase client |

**External Integrations:**

| System | Integration Point | Purpose |
|--------|------------------|---------|
| Supabase Auth | `middleware/auth.ts` | JWT validation |
| Supabase Realtime | `services/realtime.ts` | Event broadcasting |
| Supabase DB | `@supabase/supabase-js` | Data persistence |

### Data Flow

```
User Action → Component → Zustand Action → API Call
                              ↓
                      Optimistic Update
                              ↓
API Response ← Service ← Middleware ← Route
      ↓
Reconciliation ← Realtime Event (broadcast)
      ↓
UI Update
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts. Hono 4.x + React 18 + Supabase + TypeScript + Zustand form a proven, compatible stack. JWT auth via Supabase integrates cleanly with Hono middleware patterns. Hash chain verification design is non-blocking and async.

**Pattern Consistency:**
Implementation patterns fully support architectural decisions:
- Database naming (snake_case) consistent across all schemas
- API naming (kebab-case routes) consistent across all endpoints
- Code naming (PascalCase components, camelCase functions) enforced by TypeScript/ESLint
- Event naming (entity:action) consistent for all real-time events

**Structure Alignment:**
Project structure enables all architectural decisions:
- Clear layer separation (routes → middleware → services → core)
- Frontend concerns isolated (components, stores, hooks)
- Test co-location pattern ensures coverage
- Integration points properly structured

### Requirements Coverage Validation ✅

**Epic Coverage:**
All 5 epics have complete architectural support:
- Epic 1 (Trust Scoring): TrustScoreCalculator, trust types
- Epic 2 (Cryptographic Audit): audit_hashes table, hashChain service
- Epic 3 (Council Governance): tribunal_votes table, tribunal patterns
- Epic 4 (Delegation Autonomy): Fading HITL model, trust routing
- Epic 5 (API Frontend): Mission Control routes and modules

**Functional Requirements Coverage:**
All 55 FRs mapped to specific files and components:
- FR1-6 (Agent Visibility): AgentOverviewModule, agent routes
- FR7-13 (Task & Queue): TaskPipelineModule, queue routes
- FR14-22 (Decision & Governance): DecisionCard, decisions routes
- FR23-30 (Audit & Compliance): audit routes, hashChain service
- FR31-35 (Investigation): investigations routes
- FR36-40 (Team Oversight): team routes, SupervisorView
- FR41-45 (Executive): kpis routes, ExecutiveView
- FR46-50 (Onboarding): OnboardingTour, tourSteps
- FR51-55 (User & Org): RBAC middleware, auth, real-time channels

**Non-Functional Requirements Coverage:**
All 49 NFRs architecturally supported:
- Performance: Async verification, optimistic updates, cursor pagination
- Security: TLS, encryption, hash chain, RBAC + RLS, Zod validation
- Reliability: Connection recovery, last-sync indicator, tribunal persistence
- Scalability: Connection pooling, CDN, audit archival, caching
- Integration: REST API patterns, Supabase channels
- Compliance: Audit logging, hash chain, HITL metrics

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical decisions documented with specific versions
- SQL schemas provided for all new tables with indexes
- Code examples provided for all major patterns
- Consistency rules clear and enforceable

**Structure Completeness:**
- Complete directory tree with NEW markers for additions
- All files and directories defined with purposes
- Integration points clearly specified
- Component boundaries well-defined

**Pattern Completeness:**
- 24 potential conflict points identified and addressed
- Naming conventions comprehensive (DB, API, code)
- Communication patterns fully specified
- Process patterns (error handling, retry, validation) complete

### Gap Analysis Results

**Critical Gaps:** None

**Important Gaps (Non-blocking):**
- Accessibility patterns: Defer to component implementation (WCAG 2.1 AA standard)
- Agent Taxonomy WIP: OO domains and RR roles to be defined during implementation
- Mobile responsiveness: CSS Grid defined; breakpoints added per component

**Nice-to-Have Gaps:**
- CI/CD pipeline patterns: Use existing GitHub Actions
- Feature flag UI: Start with env + DB; add UI in Growth phase
- React Error Boundaries: Standard pattern; implement per module

### Validation Issues Addressed

No critical issues found. Architecture demonstrates strong coherence across all decision areas with complete FR/NFR coverage.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Complete FR/NFR coverage with clear file mappings
- Robust security model (RBAC + RLS defense in depth)
- Comprehensive conflict prevention (24 points addressed)
- Proven technology stack with existing foundation
- Clear implementation sequence defined

**Areas for Future Enhancement:**
- Accessibility patterns (implement per component)
- Agent Taxonomy codes (define iteratively)
- Advanced caching (Redis in Growth phase)
- Mobile-specific patterns (add as needed)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- When in doubt, prefer existing patterns in the codebase

**First Implementation Priority:**
1. Database migrations (audit_hashes, tribunal_votes, audit_archive)
2. RBAC middleware implementation
3. Hash chain service
4. Mission Control API routes
5. Zustand store creation
6. React module components

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2025-12-23
**Document Location:** _bmad-output/architecture.md

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 15+ architectural decisions made
- 24 conflict points addressed with patterns
- 50+ files/directories specified
- 55 FRs + 49 NFRs fully supported

**AI Agent Implementation Guide**
- Technology stack with verified versions (Hono 4.x, React 18, TypeScript 5.x)
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Development Sequence

1. Initialize database migrations for new tables
2. Implement RBAC middleware with role checks
3. Add hash chain service for audit integrity
4. Create Mission Control API routes
5. Build Zustand store for frontend state
6. Implement React module components
7. Add real-time channel subscriptions
8. Integrate onboarding tour

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All 55 functional requirements supported
- [x] All 49 non-functional requirements addressed
- [x] Cross-cutting concerns handled (audit, RBAC, real-time)
- [x] Integration points defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Code examples provided for clarity

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

