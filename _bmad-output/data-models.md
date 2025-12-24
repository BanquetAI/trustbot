# Data Models

## Database: Supabase (PostgreSQL)

## Tables

### agents

Core agent entities.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Agent display name |
| type | TEXT | Agent type (WORKER, EXECUTIVE, etc.) |
| tier | INTEGER | Trust tier (0-5) |
| status | TEXT | Current status (IDLE, ACTIVE, PAUSED) |
| trust_score | INTEGER | Current trust score (0-1000) |
| floor | TEXT | Building floor location |
| room | TEXT | Room within floor |
| capabilities | TEXT[] | Agent capabilities array |
| skills | TEXT[] | Assigned skill IDs |
| parent_id | UUID | Parent agent (FK to agents) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_agents_tier` - Query by tier
- `idx_agents_status` - Query by status

---

### tasks

Task queue and history.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| description | TEXT | Task description |
| status | TEXT | PENDING, IN_PROGRESS, COMPLETED, FAILED |
| priority | TEXT | NORMAL, HIGH, CRITICAL |
| requester | TEXT | Who requested the task |
| assigned_to | UUID | Assigned agent (FK to agents) |
| delegation_chain | TEXT[] | Chain of delegations |
| result | TEXT | Completion result |
| created_at | TIMESTAMPTZ | Creation timestamp |
| started_at | TIMESTAMPTZ | When work started |
| completed_at | TIMESTAMPTZ | When completed |

**Indexes:**
- `idx_tasks_status` - Query by status
- `idx_tasks_assigned` - Query by assigned agent

---

### trust_scores

Trust score history for auditing.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| agent_id | UUID | Agent reference (FK to agents) |
| score | INTEGER | Score at this point |
| tier | INTEGER | Tier at this point |
| reason | TEXT | Why score changed |
| delta | INTEGER | Change amount (+/-) |
| recorded_at | TIMESTAMPTZ | When recorded |

**Indexes:**
- `idx_trust_scores_agent` - Query by agent

---

### blackboard_entries

Stigmergic coordination system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| type | TEXT | TASK, GOAL, RESOURCE, ALERT, STATUS, KNOWLEDGE |
| title | TEXT | Entry title |
| content | TEXT | Entry content |
| author | TEXT | Who created it |
| priority | TEXT | NORMAL, HIGH, CRITICAL |
| status | TEXT | OPEN, IN_PROGRESS, RESOLVED |
| parent_id | UUID | Parent entry (FK, for threading) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update |
| resolved_at | TIMESTAMPTZ | When resolved |

**Indexes:**
- `idx_blackboard_type` - Query by type
- `idx_blackboard_status` - Query by status

---

### blackboard_comments

Comments on blackboard entries.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| entry_id | UUID | Parent entry (FK to blackboard_entries) |
| author | TEXT | Comment author |
| content | TEXT | Comment text |
| created_at | TIMESTAMPTZ | Creation timestamp |

---

### audit_log

Security audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| event_type | TEXT | Type of event |
| actor | TEXT | Who performed action |
| target | TEXT | Target of action |
| action | TEXT | What was done |
| details | JSONB | Additional details |
| ip_address | TEXT | Client IP |
| timestamp | TIMESTAMPTZ | When occurred |

**Indexes:**
- `idx_audit_timestamp` - Query by time range

---

### approvals

HITL approval queue.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| task_id | UUID | Related task (FK to tasks) |
| agent_id | UUID | Agent requesting |
| action | TEXT | What needs approval |
| reason | TEXT | Why approval needed |
| priority | TEXT | NORMAL, HIGH, CRITICAL |
| status | TEXT | PENDING, APPROVED, REJECTED |
| approved_by | TEXT | Who approved |
| approved_at | TIMESTAMPTZ | When approved |
| created_at | TIMESTAMPTZ | When requested |
| expires_at | TIMESTAMPTZ | Expiration time |

**Indexes:**
- `idx_approvals_status` - Query pending approvals

---

### system_config

System-wide configuration.

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Config key (PK) |
| value | JSONB | Config value |
| updated_at | TIMESTAMPTZ | Last update |

**Default Values:**
```sql
INSERT INTO system_config (key, value) VALUES
  ('hitl_level', '100'),
  ('aggressiveness', '{"level": 50, "autoApproveUpToTier": 1, "maxDelegationDepth": 3}');
```

---

## Entity Relationships

```
agents ──┬── tasks (assigned_to)
         ├── trust_scores (agent_id)
         ├── approvals (agent_id)
         └── agents (parent_id, self-reference)

blackboard_entries ──┬── blackboard_comments (entry_id)
                     └── blackboard_entries (parent_id, self-reference)

tasks ── approvals (task_id)
```

---

## TypeScript Types

### Core Types (src/types.ts)

```typescript
type AgentId = string;
type AgentTier = 0 | 1 | 2 | 3 | 4 | 5;
type TrustLevel = 'PASSIVE' | 'WORKER' | 'OPERATIONAL' | 'TACTICAL' | 'EXECUTIVE' | 'SOVEREIGN';
type TrustScore = number; // 0-1000

interface Agent {
  id: AgentId;
  name: string;
  type: AgentType;
  tier: AgentTier;
  status: AgentStatus;
  trustScore: TrustScore;
  location: { floor: string; room: string };
  capabilities: string[];
  skills: string[];
  parentId: AgentId | null;
  childIds: AgentId[];
}
```

---

*Generated by BMad Method document-project workflow*
