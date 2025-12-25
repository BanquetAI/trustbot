# Story 10.1: Agent Registry Service

## Story Info
- **Epic**: 10 - Agent Connection Layer
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR61 (Agent Registration)

## User Story

As an agent developer,
I want to register my agent with Mission Control,
So that it appears in the dashboard and can receive tasks.

## Acceptance Criteria

### AC1: Registration Endpoint
**Given** a valid agent registration request
**When** POST /api/v1/agents/register is called
**Then** the agent is registered and credentials are returned

### AC2: Agent Data
**Given** a registration request
**When** the agent provides name, type, capabilities, skills
**Then** all data is stored correctly

### AC3: Credentials Returned
**Given** successful registration
**When** the response is sent
**Then** agent_id, structured_id, and api_key are included

### AC4: Dashboard Visibility
**Given** a registered agent
**When** Mission Control is viewed
**Then** the agent appears immediately

## Technical Implementation

### Agent Registry Service

`src/services/AgentRegistry.ts` provides:

```typescript
interface AgentRegistrationRequest {
    name: string;
    type: AgentType;
    capabilities: string[];
    skills?: string[];
    metadata?: Record<string, unknown>;
}

interface AgentRegistrationResult {
    agentId: string;        // agent_abc123...
    structuredId: string;   // TRCCII format (e.g., 013001)
    apiKey: string;         // tb_base64...
    apiKeyExpiresAt: string;
    agent: RegisteredAgent;
}
```

### Structured ID Format (TRCCII)

| Position | Meaning | Values |
|----------|---------|--------|
| T | Tier | 0-8 |
| R | Role | 1=Executor, 2=Planner, 3=Validator, 4=Researcher, 5=Communicator, 6=Orchestrator |
| CC | Category | 10-99 (see AgentCategory enum) |
| II | Instance | 00-99 |

**Example:** `013001`
- Tier 0 (new agent)
- Role 1 (Executor)
- Category 30 (Development)
- Instance 01 (first of this type)

### API Key Management

- **Format:** `tb_` prefix + 32 bytes base64url
- **Storage:** SHA-256 hash stored, plaintext returned once
- **Expiry:** 30 days from issuance
- **Verification:** Hash comparison
- **Revocation:** Supported via POST /:agentId/revoke

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/agents/register | Register new agent |
| POST | /api/v1/agents/verify | Verify API key |
| GET | /api/v1/agents/:agentId | Get agent by ID |
| GET | /api/v1/agents | List agents with filters |
| POST | /api/v1/agents/:agentId/revoke | Revoke API key |

### Request/Response Examples

**Register Agent:**
```http
POST /api/v1/agents/register
Content-Type: application/json

{
    "name": "DataProcessor",
    "type": "worker",
    "capabilities": ["development", "testing"],
    "skills": ["data-validation", "report-generation"]
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "agentId": "agent_a1b2c3d4e5f6g7h8i9j0k1l2",
        "structuredId": "013001",
        "apiKey": "tb_abc123xyz...",
        "apiKeyExpiresAt": "2026-01-24T12:00:00.000Z",
        "agent": {
            "id": "agent_a1b2c3d4e5f6g7h8i9j0k1l2",
            "structuredId": "013001",
            "name": "DataProcessor",
            "type": "worker",
            "tier": 0,
            "status": "pending",
            "capabilities": ["development", "testing"],
            "skills": ["data-validation", "report-generation"],
            "createdAt": "2025-12-25T12:00:00.000Z"
        }
    }
}
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/AgentRegistry.ts` | Core registry service |
| `src/services/AgentRegistry.test.ts` | Unit tests (37 tests) |
| `src/api/routes/agents/register.ts` | HTTP endpoints |
| `src/api/routes/agents/index.ts` | Route exports |

### Test Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| Registration | 5 | Valid agent, skills, validation errors |
| Structured ID | 6 | Format, tier, role, category, instance |
| Parsing | 2 | Valid/invalid ID parsing |
| API Keys | 4 | Generation, uniqueness, hashing |
| Verification | 2 | Valid/invalid keys |
| Revocation | 2 | Revoke/unknown key |
| Type Mapping | 7 | Agent types to roles |
| Category Mapping | 10 | Capabilities to categories |
| **Total** | **37** | |

### Running Tests

```bash
# Run agent registry tests
npx vitest run src/services/AgentRegistry.test.ts
```

## Definition of Done
- [x] AgentRegistry service created
- [x] POST /api/v1/agents/register endpoint
- [x] Structured ID generation (TRCCII format)
- [x] API key issuance with 30-day expiry
- [x] API key verification endpoint
- [x] API key revocation support
- [x] Agent listing and retrieval
- [x] Comprehensive test suite (37 tests)
- [x] TypeScript compilation successful
- [x] All tests passing

## Integration Notes

To integrate with UnifiedWorkflowAPI:

```typescript
import { agentRoutes } from './routes/agents/index.js';

// Mount under /api/v1/agents
app.route('/api/v1/agents', agentRoutes);
```
