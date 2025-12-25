# Story 10.4: Agent Authentication

## Story Info
- **Epic**: 10 - Agent Connection Layer
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR64 (Agent Authentication), FR65 (API Key Management)

## User Story

As a system administrator,
I want agents to authenticate with API keys,
So that only authorized agents can connect and execute tasks.

## Acceptance Criteria

### AC1: API Key Authentication
**Given** an agent makes an API request
**When** the request includes a valid API key
**Then** the request is authenticated and processed

### AC2: Key Rotation
**Given** an API key needs rotation
**When** a rotation is initiated
**Then** a new key is issued with grace period for old key

### AC3: Immediate Revocation
**Given** an API key is compromised
**When** revocation is triggered
**Then** the key is immediately invalidated

### AC4: Permission Checking
**Given** an authenticated request
**When** the endpoint requires specific permissions
**Then** access is granted or denied based on key permissions

## Technical Implementation

### ApiKeyManager Service

`src/services/ApiKeyManager.ts` provides:

```typescript
const manager = new ApiKeyManager({
    defaultExpiryDays: 30,        // Keys expire in 30 days
    rotationGracePeriodMs: 86400000, // 24 hour grace period
    keyPrefix: 'tb_',             // TrustBot key prefix
    keyLength: 32,                // 32 bytes (256 bits)
    maxKeysPerAgent: 5,           // Max 5 keys per agent
    trackUsage: true,             // Track key usage
});

// Create API key
const result = await manager.createKey({
    agentId: 'agent_123',
    name: 'Production Key',
    permissions: ['agent:read', 'task:execute'],
    expiresInDays: 30,
});
// Returns: { id, key, keyPrefix, expiresAt }

// Verify API key
const verification = await manager.verifyKey(apiKey);
// Returns: { valid, keyId?, agentId?, permissions?, expired?, revoked?, error? }

// Rotate key with grace period
const rotation = await manager.rotateKey(oldKey);
// Returns: { newKey, oldKeyExpiresAt, gracePeriodMs }

// Revoke key immediately
await manager.revokeKey(apiKey, 'Compromised');
```

### API Key Security

| Feature | Implementation |
|---------|---------------|
| Key Format | `tb_` + 32 bytes base64url |
| Storage | SHA-256 hash only (plaintext never stored) |
| Comparison | Timing-safe equals |
| Expiry | Configurable, default 30 days |
| Rotation | Grace period for old key |
| Revocation | Immediate, cached for fast lookup |

### Authentication Middleware

`src/api/middleware/agentAuth.ts` provides:

```typescript
import {
    agentAuthMiddleware,
    requirePermissions,
    requireAgentOwnership
} from './middleware/agentAuth.js';

// Basic authentication
app.use('/api/agents/*', agentAuthMiddleware());

// With specific permissions
app.post('/api/tasks',
    agentAuthMiddleware(),
    requirePermissions('task:execute'),
    handler
);

// With ownership check
app.get('/api/agents/:agentId/keys',
    agentAuthMiddleware(),
    requireAgentOwnership('agentId'),
    handler
);
```

### Key Extraction Priority

1. `Authorization: Bearer <key>` header
2. `X-API-Key: <key>` header
3. `?apiKey=<key>` query parameter (if enabled)
4. Request body `apiKey` field (if enabled)

### Error Responses

| Code | Error Code | Description |
|------|------------|-------------|
| 401 | `AUTH_REQUIRED` | No API key provided |
| 401 | `INVALID_KEY` | Key not found or malformed |
| 401 | `KEY_EXPIRED` | Key has expired |
| 401 | `KEY_REVOKED` | Key has been revoked |
| 403 | `INSUFFICIENT_PERMISSIONS` | Missing required permissions |
| 403 | `OWNERSHIP_REQUIRED` | Agent doesn't own resource |

### Default Permissions

```typescript
const DEFAULT_PERMISSIONS = [
    'agent:read',    // Read agent info
    'agent:write',   // Update agent info
    'task:read',     // Read task info
    'task:execute',  // Execute tasks
    'ws:connect',    // WebSocket connection
];
```

### Events Emitted

```typescript
// ApiKeyManager events
manager.on('key:created', (keyId, agentId) => {});
manager.on('key:rotated', (oldKeyId, newKeyId, agentId) => {});
manager.on('key:revoked', (keyId, agentId, reason) => {});
manager.on('key:expired', (keyId, agentId) => {});
manager.on('key:used', (keyId, agentId) => {});
```

### Files Created

| File | Purpose |
|------|---------|
| `src/services/ApiKeyManager.ts` | Core API key management service |
| `src/services/ApiKeyManager.test.ts` | Unit tests (31 tests) |
| `src/api/middleware/agentAuth.ts` | Authentication middleware |

### Test Coverage

| Category | Tests |
|----------|-------|
| createKey | 5 |
| verifyKey | 6 |
| rotateKey | 6 |
| revokeKey | 4 |
| revokeAllAgentKeys | 1 |
| Queries | 5 |
| Utilities | 4 |
| **Total** | **31** |

### Running Tests

```bash
npx vitest run src/services/ApiKeyManager.test.ts
```

## Integration Example

```typescript
import { Hono } from 'hono';
import { getApiKeyManager } from './services/ApiKeyManager.js';
import {
    agentAuthMiddleware,
    requirePermissions,
    getAuthenticatedAgent
} from './api/middleware/agentAuth.js';

const app = new Hono();

// Apply authentication to agent routes
app.use('/api/agents/*', agentAuthMiddleware({
    skipPaths: ['/api/agents/register'],
    allowQueryParam: false,  // More secure
}));

// Protected endpoint
app.post('/api/tasks', requirePermissions('task:execute'), async (c) => {
    const agent = getAuthenticatedAgent(c);
    // agent.agentId, agent.permissions available
    return c.json({ success: true });
});

// Key management endpoints
app.post('/api/keys/rotate', async (c) => {
    const manager = getApiKeyManager();
    const oldKey = c.req.header('X-API-Key');
    const result = await manager.rotateKey(oldKey);
    return c.json({
        newKey: result.newKey.key,
        oldKeyExpiresAt: result.oldKeyExpiresAt,
    });
});
```

## Definition of Done
- [x] ApiKeyManager service created
- [x] API key generation with secure random bytes
- [x] Key verification with timing-safe comparison
- [x] Key rotation with grace period
- [x] Immediate key revocation
- [x] Usage tracking
- [x] agentAuth middleware created
- [x] Permission checking middleware
- [x] Agent ownership middleware
- [x] Multiple key extraction methods
- [x] Comprehensive test suite (31 tests)
- [x] TypeScript compilation successful
