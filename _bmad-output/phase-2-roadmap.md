# TrustBot Phase 2: Live Agent Integration Roadmap

## Executive Summary

Phase 1 delivered the **Mission Control Dashboard** - a comprehensive UI for human oversight of AI agents. Phase 2 transforms TrustBot from a visualization tool into a **live orchestration platform** with real agent connections, dynamic trust scoring, and automated decision pipelines.

---

## Phase 2 Vision

> **"From Dashboard to Command Center"**
>
> Enable real AI agents to connect, operate under trust-based governance,
> and execute decisions with appropriate human oversight.

---

## Phase 2 Objectives

| Objective | Success Metric |
|-----------|----------------|
| **Real Agent Connectivity** | 10+ agents connected simultaneously |
| **Live Trust Scoring** | Sub-second score updates on agent actions |
| **Automated Decisions** | 80% of low-risk actions auto-approved |
| **Production Reliability** | 99.9% uptime, <200ms API latency |
| **Observability** | Full request tracing, real-time dashboards |

---

## Epic Overview

| Epic | Title | Stories | Priority | Sprint |
|------|-------|---------|----------|--------|
| 9 | Production Hardening | 6 | P0 | N+1 |
| 10 | Agent Connection Layer | 7 | P0 | N+1, N+2 |
| 11 | Live Trust Scoring Engine | 6 | P1 | N+2 |
| 12 | Decision Automation Pipeline | 8 | P1 | N+3 |
| 13 | Observability & Monitoring | 5 | P1 | N+2, N+3 |

**Total: 5 Epics, 32 Stories**

---

# Epic 9: Production Hardening

## Overview
Prepare the existing codebase for production deployment with health checks, E2E testing, security hardening, and CI/CD automation.

## Functional Requirements
- **FR56**: Health check endpoints for liveness and readiness probes
- **FR57**: E2E test coverage for critical user flows
- **FR58**: Rate limiting and DDoS protection
- **FR59**: Security headers and CORS hardening
- **FR60**: Automated CI/CD pipeline with quality gates

## Stories

### Story 9.1: Health Check Endpoints
**As a** DevOps engineer,
**I want** `/health`, `/ready`, and `/live` endpoints,
**So that** Kubernetes can manage pod lifecycle correctly.

**Acceptance Criteria:**
- GET /health returns 200 with uptime and version
- GET /ready checks database connectivity
- GET /live returns 200 if process is responsive
- Health data includes: uptime, memory usage, DB status

**Deliverables:**
- `src/api/routes/health.ts`
- `src/api/routes/health.test.ts`

---

### Story 9.2: E2E Test Framework Setup
**As a** QA engineer,
**I want** Playwright configured for E2E testing,
**So that** we can automate browser-based test coverage.

**Acceptance Criteria:**
- Playwright installed and configured
- Test fixtures for auth and navigation
- Example test for login → dashboard flow
- CI integration with test artifacts

**Deliverables:**
- `web/e2e/` directory with Playwright config
- `web/e2e/fixtures/` for reusable test helpers
- `web/e2e/tests/smoke.spec.ts`

---

### Story 9.3: Critical Path E2E Tests
**As a** QA engineer,
**I want** E2E tests for critical user journeys,
**So that** regressions are caught before deployment.

**Acceptance Criteria:**
- Login/logout flow tested
- Agent list viewing tested
- Decision approval/denial flow tested
- Error states handled gracefully

**Deliverables:**
- `web/e2e/tests/auth.spec.ts`
- `web/e2e/tests/agents.spec.ts`
- `web/e2e/tests/decisions.spec.ts`

---

### Story 9.4: Rate Limiting & Security Headers
**As a** security engineer,
**I want** rate limiting and security headers,
**So that** the API is protected from abuse.

**Acceptance Criteria:**
- Rate limiting: 100 req/min per IP for public, 1000 for authenticated
- Security headers: HSTS, X-Frame-Options, CSP, X-Content-Type-Options
- CORS restricted to allowed origins
- Request size limits enforced

**Deliverables:**
- `src/api/middleware/rateLimiter.ts`
- `src/api/middleware/security.ts`

---

### Story 9.5: CI/CD Pipeline with Quality Gates
**As a** DevOps engineer,
**I want** automated CI/CD with quality gates,
**So that** only tested, quality code reaches production.

**Acceptance Criteria:**
- GitHub Actions workflow for PR checks
- Gates: lint, typecheck, unit tests, E2E tests
- Coverage threshold enforcement (80%)
- Automatic preview deployments

**Deliverables:**
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`

---

### Story 9.6: Database Migration Safety
**As a** database administrator,
**I want** safe migration patterns,
**So that** schema changes don't cause downtime.

**Acceptance Criteria:**
- Migration rollback capability
- Zero-downtime migration patterns
- Migration dry-run in CI
- Backup before migration

**Deliverables:**
- `scripts/migrate-safe.sh`
- Migration rollback documentation

---

# Epic 10: Agent Connection Layer

## Overview
Build the infrastructure for real AI agents to connect, register, and communicate with Mission Control in real-time.

## Functional Requirements
- **FR61**: Agent registration with capability declaration
- **FR62**: WebSocket-based real-time communication
- **FR63**: Agent heartbeat and health monitoring
- **FR64**: Secure agent authentication (API keys + mTLS)
- **FR65**: Agent SDK for easy integration
- **FR66**: Connection pooling and load balancing
- **FR67**: Graceful agent disconnection handling

## Stories

### Story 10.1: Agent Registry Service
**As an** agent developer,
**I want** to register my agent with Mission Control,
**So that** it appears in the dashboard and can receive tasks.

**Acceptance Criteria:**
- POST /api/v1/agents/register endpoint
- Agent provides: name, type, capabilities, skills
- Returns: agent_id, structured_id, api_key
- Agent appears in Mission Control immediately

**Technical Notes:**
- Store in Supabase `agents` table
- Generate 6-digit structured ID (TRCCII format)
- Issue JWT-based API key with 30-day expiry

**Deliverables:**
- `src/api/routes/agents/register.ts`
- `src/services/AgentRegistry.ts`

---

### Story 10.2: WebSocket Hub
**As an** agent,
**I want** persistent WebSocket connection to Mission Control,
**So that** I receive real-time commands and send updates.

**Acceptance Criteria:**
- WebSocket endpoint: wss://api.trustbot.ai/ws
- Authentication via API key in connection header
- Ping/pong for connection health
- Reconnection with exponential backoff

**Message Types:**
```typescript
// Inbound (to agent)
{ type: 'task:assigned', payload: Task }
{ type: 'decision:required', payload: ActionRequest }
{ type: 'config:updated', payload: Config }

// Outbound (from agent)
{ type: 'status:update', payload: { status, progress } }
{ type: 'action:request', payload: ActionRequest }
{ type: 'task:completed', payload: TaskResult }
```

**Deliverables:**
- `src/api/ws/WebSocketHub.ts`
- `src/api/ws/handlers/`

---

### Story 10.3: Agent Heartbeat System
**As a** supervisor,
**I want** to see which agents are online/offline,
**So that** I know the actual state of my agent fleet.

**Acceptance Criteria:**
- Agents send heartbeat every 30 seconds
- Missing 3 heartbeats → mark as OFFLINE
- Status changes trigger UI update via WebSocket
- Last seen timestamp tracked

**Deliverables:**
- `src/services/HeartbeatMonitor.ts`
- `src/jobs/AgentHealthCheck.ts`

---

### Story 10.4: Agent Authentication
**As a** security engineer,
**I want** secure agent authentication,
**So that** only authorized agents can connect.

**Acceptance Criteria:**
- API key authentication for REST endpoints
- WebSocket auth via key in connection params
- Key rotation capability
- Revocation with immediate effect
- Optional mTLS for high-security deployments

**Deliverables:**
- `src/api/middleware/agentAuth.ts`
- `src/services/ApiKeyManager.ts`

---

### Story 10.5: Agent SDK (TypeScript)
**As an** agent developer,
**I want** an SDK to easily connect my agent,
**So that** I don't have to implement WebSocket logic myself.

**Acceptance Criteria:**
- `@trustbot/agent-sdk` npm package
- Auto-reconnection handling
- Type-safe message interfaces
- Event emitter pattern for messages
- Example agent implementation

**SDK Interface:**
```typescript
import { TrustBotAgent } from '@trustbot/agent-sdk';

const agent = new TrustBotAgent({
  apiKey: process.env.TRUSTBOT_API_KEY,
  capabilities: ['execute', 'external'],
  skills: ['web-dev', 'api-integration'],
});

agent.on('task:assigned', async (task) => {
  // Handle task
  await agent.updateStatus('WORKING', 50);
  await agent.completeTask(task.id, result);
});

agent.connect();
```

**Deliverables:**
- `packages/agent-sdk/` monorepo package
- `packages/agent-sdk/examples/`

---

### Story 10.6: Connection Pool Management
**As a** platform engineer,
**I want** efficient connection management,
**So that** the system scales to 1000+ concurrent agents.

**Acceptance Criteria:**
- Connection pooling with configurable limits
- Per-org connection limits
- Graceful handling of connection storms
- Memory-efficient connection tracking

**Deliverables:**
- `src/services/ConnectionPool.ts`

---

### Story 10.7: Graceful Disconnection Handling
**As a** supervisor,
**I want** graceful handling of agent disconnections,
**So that** in-progress tasks are managed properly.

**Acceptance Criteria:**
- In-progress tasks marked as "agent_disconnected"
- Automatic reassignment option for orphaned tasks
- Disconnection reason logged
- Reconnection resumes task state

**Deliverables:**
- `src/services/DisconnectionHandler.ts`

---

# Epic 11: Live Trust Scoring Engine

## Overview
Implement real-time trust score calculation, history tracking, and automatic tier management based on agent behavior.

## Functional Requirements
- **FR68**: Real-time trust score calculation on every action
- **FR69**: 30-day rolling history with weighted decay
- **FR70**: Automatic tier promotion/demotion
- **FR71**: Trust score event sourcing for audit
- **FR72**: Configurable scoring weights per organization
- **FR73**: Trust anomaly detection

## Stories

### Story 11.1: Trust Score Calculator
**As the** trust system,
**I want** to calculate trust scores based on agent behavior,
**So that** trust reflects actual agent performance.

**Scoring Events:**
| Event | Points | Decay |
|-------|--------|-------|
| Task completed successfully | +10 | 30 days |
| Task reviewed positively | +5 | 30 days |
| Task failed | -15 | 14 days |
| Task timeout | -10 | 14 days |
| Invalid delegation | -20 | 7 days |
| Security violation | -50 | 60 days |

**Deliverables:**
- `src/services/TrustScoreCalculator.ts`
- `src/services/TrustScoreCalculator.test.ts`

---

### Story 11.2: Trust History Database
**As an** auditor,
**I want** complete trust score history,
**So that** I can analyze trust trends over time.

**Schema:**
```sql
CREATE TABLE trust_events (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  event_type VARCHAR(50),
  points INTEGER,
  reason TEXT,
  old_score INTEGER,
  new_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trust_events_agent ON trust_events(agent_id, created_at DESC);
```

**Deliverables:**
- `supabase/migrations/xxx_trust_events.sql`
- `src/services/TrustHistoryStore.ts`

---

### Story 11.3: Automatic Tier Management
**As the** trust system,
**I want** automatic tier promotion/demotion,
**So that** agent capabilities reflect their trust level.

**Tier Thresholds:**
| Tier | Score | Capabilities |
|------|-------|--------------|
| UNTRUSTED | 0-199 | None |
| PROBATIONARY | 200-399 | Execute only |
| TRUSTED | 400-599 | +3 concurrent tasks |
| VERIFIED | 600-799 | +Delegate |
| CERTIFIED | 800-949 | +Spawn |
| ELITE | 950+ | Unlimited |

**Deliverables:**
- `src/services/TierManager.ts`
- Tier change triggers learning popup (Epic 8)

---

### Story 11.4: Trust Event Sourcing
**As an** auditor,
**I want** immutable trust event logs,
**So that** trust changes are fully traceable.

**Acceptance Criteria:**
- Every score change creates event record
- Events are append-only (no updates)
- Hash chain for tamper detection
- Query API for trust history

**Deliverables:**
- `src/services/TrustEventStore.ts`

---

### Story 11.5: Organization Trust Configuration
**As a** director,
**I want** to customize trust scoring weights,
**So that** our organization's values are reflected.

**Acceptance Criteria:**
- Configure point values per event type
- Configure decay periods
- Configure tier thresholds
- Preview impact before applying

**Deliverables:**
- `src/api/routes/settings/trust.ts`
- `web/src/components/mission-control/settings/TrustConfig.tsx`

---

### Story 11.6: Trust Anomaly Detection
**As a** supervisor,
**I want** alerts for unusual trust patterns,
**So that** I can investigate potential issues.

**Anomaly Types:**
- Rapid score drop (>50 points in 1 hour)
- Unusual failure rate (>3x normal)
- Score manipulation attempts
- Coordinated agent behavior

**Deliverables:**
- `src/services/TrustAnomalyDetector.ts`
- Integration with bias alerts (Story 4.5)

---

# Epic 12: Decision Automation Pipeline

## Overview
Build the automated decision pipeline with Trust Gate evaluation, Bot Tribunal voting, and HITL routing.

## Functional Requirements
- **FR74**: Trust Gate rule evaluation engine
- **FR75**: Automatic approval for low-risk actions
- **FR76**: Bot Tribunal voting for high-risk decisions
- **FR77**: HITL routing based on risk and urgency
- **FR78**: Decision execution tracking
- **FR79**: Decision timeout handling
- **FR80**: Decision analytics and optimization
- **FR81**: Configurable automation thresholds

## Stories

### Story 12.1: Trust Gate Engine
**As the** decision system,
**I want** to evaluate action requests against trust rules,
**So that** appropriate oversight is applied.

**Rule Types:**
- Trust score threshold
- Risk level assessment
- Action type classification
- Tier permission check
- Rate limiting
- First-time action flag

**Deliverables:**
- `src/services/TrustGateEngine.ts`
- `src/services/TrustGateEngine.test.ts`

---

### Story 12.2: Auto-Approval System
**As an** operator,
**I want** low-risk actions auto-approved,
**So that** I only review decisions that need human judgment.

**Auto-Approval Criteria:**
- Agent trust score > 800
- Action type is low-risk
- Within rate limits
- No recent failures
- Not first-time action type

**Deliverables:**
- `src/services/AutoApprovalService.ts`

---

### Story 12.3: Bot Tribunal Voting Engine
**As a** high-risk action request,
**I want** multiple AI validators to vote on my approval,
**So that** no single point of failure exists.

**Voting Process:**
1. Select 3-5 validator agents
2. Each provides: vote, reasoning, confidence
3. Calculate consensus (unanimous/majority/split)
4. Generate recommendation

**Deliverables:**
- `src/services/TribunalVotingEngine.ts`
- `src/services/TribunalVoteAggregator.ts`

---

### Story 12.4: HITL Routing Engine
**As the** decision system,
**I want** to route decisions to appropriate humans,
**So that** the right person reviews based on risk.

**Routing Rules:**
| Risk | Urgency | Route To |
|------|---------|----------|
| Low | Any | Auto-approve |
| Medium | Queued | On-call operator |
| High | Immediate | Supervisor + notification |
| Critical | Immediate | Director + all-hands alert |

**Deliverables:**
- `src/services/HITLRouter.ts`
- `src/services/NotificationService.ts`

---

### Story 12.5: Decision Execution Tracker
**As an** operator,
**I want** to track approved action execution,
**So that** I know the outcome of my approvals.

**Tracking States:**
- `queued` → `executing` → `completed`/`failed`

**Deliverables:**
- `src/services/ExecutionTracker.ts`
- Real-time progress via WebSocket

---

### Story 12.6: Decision Timeout Handler
**As the** decision system,
**I want** decisions to timeout if not acted upon,
**So that** the queue doesn't grow indefinitely.

**Timeout Rules:**
- Immediate: 15 min → escalate
- High: 1 hour → escalate
- Medium: 4 hours → expire
- Low: 24 hours → expire

**Deliverables:**
- `src/jobs/DecisionTimeoutJob.ts`

---

### Story 12.7: Decision Analytics
**As a** director,
**I want** analytics on decision patterns,
**So that** I can optimize automation thresholds.

**Metrics:**
- Auto-approval rate by action type
- Average decision time by risk level
- Override rate (human vs tribunal)
- False positive rate

**Deliverables:**
- `src/api/routes/analytics/decisions.ts`
- `web/src/components/mission-control/analytics/DecisionAnalytics.tsx`

---

### Story 12.8: Automation Threshold Configuration
**As a** director,
**I want** to configure automation thresholds,
**So that** I can balance efficiency with oversight.

**Configurable:**
- Auto-approval trust threshold
- Risk level classifications
- Timeout durations
- Escalation paths

**Deliverables:**
- `src/api/routes/settings/automation.ts`
- `web/src/components/mission-control/settings/AutomationConfig.tsx`

---

# Epic 13: Observability & Monitoring

## Overview
Implement comprehensive observability with metrics, logging, tracing, and alerting.

## Functional Requirements
- **FR82**: Prometheus metrics for all API endpoints
- **FR83**: Structured JSON logging with correlation IDs
- **FR84**: Distributed tracing with OpenTelemetry
- **FR85**: Real-time monitoring dashboards
- **FR86**: Alerting rules and on-call routing

## Stories

### Story 13.1: Prometheus Metrics
**As a** DevOps engineer,
**I want** Prometheus metrics exposed,
**So that** I can monitor system health.

**Metrics:**
- `http_requests_total` by method, path, status
- `http_request_duration_seconds` histogram
- `websocket_connections_current` gauge
- `trust_score_changes_total` counter
- `decisions_processed_total` by type, outcome

**Deliverables:**
- `src/api/middleware/metrics.ts`
- `/metrics` endpoint

---

### Story 13.2: Structured Logging
**As a** DevOps engineer,
**I want** structured JSON logs,
**So that** I can query and analyze logs effectively.

**Log Format:**
```json
{
  "level": "info",
  "timestamp": "2025-12-25T10:00:00Z",
  "correlationId": "abc-123",
  "service": "mission-control",
  "message": "Decision approved",
  "context": { "decisionId": "...", "userId": "..." }
}
```

**Deliverables:**
- `src/lib/logger.ts` (Pino-based)
- Request correlation middleware

---

### Story 13.3: OpenTelemetry Tracing
**As a** DevOps engineer,
**I want** distributed tracing,
**So that** I can debug cross-service issues.

**Trace Spans:**
- HTTP request → DB query → external API
- WebSocket message → handler → response
- Decision flow → tribunal → execution

**Deliverables:**
- `src/lib/tracing.ts`
- OpenTelemetry SDK configuration

---

### Story 13.4: Grafana Dashboards
**As a** DevOps engineer,
**I want** pre-built Grafana dashboards,
**So that** I can visualize system health.

**Dashboards:**
- API Performance (latency, errors, throughput)
- Agent Fleet (connections, status, trust distribution)
- Decision Pipeline (queue depth, processing time)
- Trust System (score changes, tier movements)

**Deliverables:**
- `infra/grafana/dashboards/`
- Dashboard JSON exports

---

### Story 13.5: Alerting Rules
**As a** DevOps engineer,
**I want** alerting rules,
**So that** I'm notified of issues before users are impacted.

**Alert Rules:**
| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | >5% 5xx in 5 min | Critical |
| Slow API | p99 > 2s for 5 min | Warning |
| Queue Backup | >100 pending > 30 min | Warning |
| Agent Disconnections | >10% fleet offline | Critical |

**Deliverables:**
- `infra/prometheus/alerts.yml`
- PagerDuty/Slack integration

---

# Implementation Timeline

```
Sprint N+1 (Weeks 1-2)
├── Epic 9: Stories 9.1-9.4 (Health, E2E, Security)
└── Epic 10: Stories 10.1-10.2 (Registry, WebSocket)

Sprint N+2 (Weeks 3-4)
├── Epic 9: Stories 9.5-9.6 (CI/CD, Migrations)
├── Epic 10: Stories 10.3-10.5 (Heartbeat, Auth, SDK)
└── Epic 13: Stories 13.1-13.2 (Metrics, Logging)

Sprint N+3 (Weeks 5-6)
├── Epic 10: Stories 10.6-10.7 (Pool, Disconnect)
├── Epic 11: Stories 11.1-11.3 (Trust Calculator, Tiers)
└── Epic 13: Stories 13.3-13.4 (Tracing, Dashboards)

Sprint N+4 (Weeks 7-8)
├── Epic 11: Stories 11.4-11.6 (Event Sourcing, Config, Anomaly)
├── Epic 12: Stories 12.1-12.4 (Trust Gate, Auto-Approval, Tribunal, HITL)
└── Epic 13: Story 13.5 (Alerting)

Sprint N+5 (Weeks 9-10)
├── Epic 12: Stories 12.5-12.8 (Execution, Timeout, Analytics, Config)
└── Integration Testing & Hardening
```

---

# Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Agent Connection | 100+ concurrent | Grafana gauge |
| API Latency | p99 < 200ms | Prometheus histogram |
| Auto-Approval Rate | > 70% low-risk | Decision analytics |
| System Uptime | 99.9% | Uptime monitor |
| E2E Test Coverage | 20+ critical paths | Playwright report |
| Trust Score Accuracy | < 5% override rate | Decision analytics |

---

# Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebSocket scalability | Agent disconnections | Redis pub/sub for horizontal scaling |
| Trust gaming | Inflated scores | Anomaly detection + manual review |
| Bot tribunal latency | Slow decisions | Timeout + async voting |
| Database bottleneck | Slow queries | Read replicas + caching |

---

## Next Steps

1. Review and approve this roadmap
2. Create sprint-status.yaml for Phase 2
3. Begin Epic 9, Story 9.1 (Health Endpoints)

**Ready to proceed, pilot?**
