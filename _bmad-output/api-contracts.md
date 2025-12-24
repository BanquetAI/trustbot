# API Contracts

## Overview

The TrustBot API exposes 70+ REST endpoints organized by domain.

**Base URL:** `http://localhost:3010` (dev) / `https://trustbot-api.fly.dev` (prod)

## Health & System

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-22T00:00:00.000Z",
  "uptime": 12345
}
```

### GET /api/state
Get full system state.

**Response:**
```json
{
  "agents": [...],
  "tasks": [...],
  "hitlLevel": 50,
  "aggressiveness": { "level": 50 }
}
```

### GET /api/tick
Trigger system tick (cron endpoint).

---

## Agents

### GET /api/agents
List all agents.

**Response:**
```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "T5-Executor",
      "type": "EXECUTIVE",
      "tier": 5,
      "status": "ACTIVE",
      "trustScore": 950,
      "location": { "floor": "EXECUTIVE", "room": "COMMAND" },
      "capabilities": [],
      "skills": [],
      "parentId": null,
      "childIds": []
    }
  ]
}
```

### POST /api/spawn
Spawn a new agent.

**Request:**
```json
{
  "name": "Worker-1",
  "type": "WORKER",
  "tier": 1,
  "parentId": "uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "agent": { ... }
}
```

### DELETE /api/agents/:id
Delete an agent.

### POST /api/agent/pause
Pause an agent.

**Request:** `{ "agentId": "uuid" }`

### POST /api/agent/resume
Resume a paused agent.

### POST /api/agent/trust
Update agent trust score.

**Request:**
```json
{
  "agentId": "uuid",
  "delta": 50,
  "reason": "Task completed successfully"
}
```

---

## Tasks

### GET /tasks
List all tasks.

### POST /tasks
Create a new task.

**Request:**
```json
{
  "description": "Analyze data",
  "priority": "HIGH",
  "requester": "human"
}
```

### POST /tasks/:id/assign
Assign task to agent.

**Request:** `{ "agentId": "uuid" }`

### POST /tasks/:id/complete
Mark task complete.

**Request:** `{ "result": "Analysis complete" }`

### POST /tasks/:id/delegate
Delegate task to another agent.

---

## Dashboard

### GET /dashboard/today
Get today's completed tasks and metrics.

**Response:**
```json
{
  "completedToday": [...],
  "autonomyMetrics": {
    "autoApproved": 45,
    "humanApproved": 12,
    "humanRejected": 2
  }
}
```

### GET /dashboard/aggressiveness
Get current aggressiveness level.

**Response:**
```json
{
  "level": 50,
  "autoApproveUpToTier": 1,
  "maxDelegationDepth": 3
}
```

### POST /dashboard/aggressiveness
Set aggressiveness level (requires human auth).

**Request:**
```json
{
  "level": 75,
  "tokenId": "human-token-id"
}
```

---

## Trust

### GET /trust/stats
Get trust statistics.

### GET /trust/:agentId/components
Get trust score breakdown.

**Response:**
```json
{
  "baseScore": 500,
  "performanceBonus": 100,
  "reliabilityFactor": 1.2,
  "tenureBonus": 50,
  "penaltyDeductions": -10,
  "finalScore": 640
}
```

### GET /trust/:agentId/history
Get trust score history.

---

## Council (Governance)

### GET /council/reviews
List pending council reviews.

### POST /council/reviews/:id/vote
Vote on a council review.

**Request:**
```json
{
  "vote": "approve", // or "reject"
  "agentId": "uuid",
  "reason": "Meets criteria"
}
```

### GET /council/members
List council members.

---

## Delegation

### POST /delegation/request
Request task delegation.

**Request:**
```json
{
  "taskId": "uuid",
  "fromAgentId": "uuid",
  "toAgentId": "uuid",
  "reason": "Specialized skill required"
}
```

### GET /delegation/:agentId/active
Get active delegations for agent.

### DELETE /delegation/:id
Cancel delegation.

---

## Autonomy

### GET /autonomy/:agentId/budget
Get agent's autonomy budget.

**Response:**
```json
{
  "total": 100,
  "used": 45,
  "remaining": 55,
  "resetAt": "2025-12-23T00:00:00.000Z"
}
```

### POST /autonomy/:agentId/action
Record autonomy action.

---

## AI / Aria

### GET /api/ai/providers
List configured AI providers.

### POST /api/ai/ask
Ask a question to AI.

**Request:**
```json
{
  "query": "What should I do next?",
  "provider": "claude" // optional
}
```

### POST /api/ai/aria/interpret
Interpret natural language command.

### POST /api/ai/aria/gather
Gather responses from multiple providers.

### GET /api/ai/aria/settings
Get Aria settings.

### POST /api/ai/aria/advisors
Configure AI advisors.

---

## Skills

### GET /api/skills
List all skills (130 total).

**Query Params:**
- `category`: Filter by category
- `search`: Search query
- `tier`: Filter by min tier

### GET /api/skills/:id
Get skill details.

### GET /api/agent/:id/skills
Get skills available to agent.

### POST /api/agent/:id/skills/check
Check if agent can use a skill.

---

## Authentication

### POST /auth/human
Authenticate as human operator.

**Request:**
```json
{
  "masterKey": "YOUR_MASTER_KEY"
}
```

**Response:**
```json
{
  "token": {
    "id": "token-id",
    "type": "HUMAN",
    "permissions": ["HITL_MODIFY", "SPAWN_AGENT", ...]
  }
}
```

---

## Audit

### GET /security/audit
Get audit log entries.

### GET /audit/verify
Verify audit trail integrity.

### GET /audit/export
Export audit log.

---

*Generated by BMad Method document-project workflow*
