---
project_name: 'TrustBot'
user_name: 'pilot'
date: '2025-12-23'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 45
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in the TrustBot Mission Control project. Focus on unobvious details that agents might miss._

---

## Technology Stack & Versions

### Core Technologies

| Technology | Version | Notes |
|------------|---------|-------|
| TypeScript | ^5.3.3 | Strict mode enabled |
| Node.js | 20+ | ES2022 target |
| Hono | ^4.11.1 | API framework |
| React | ^18.2.0 | Frontend |
| Vite | ^5.0.8 | Build tool |
| Supabase | ^2.89.0 | Database + Auth + Realtime |
| Vitest | ^4.0.16 | Testing framework |
| EventEmitter3 | ^5.0.1 | Event system |

### Key Dependencies

- `@anthropic-ai/sdk` ^0.39.0 - Claude AI integration
- `uuid` ^9.0.0 - ID generation
- `date-fns` ^3.0.0 - Date utilities
- `zod` - Input validation (architecture requirement)
- `zustand` - State management (architecture requirement)

---

## Critical Implementation Rules

### TypeScript Rules

**CRITICAL - These cause subtle bugs if ignored:**

- **`noUncheckedIndexedAccess: true`** - Array/object access returns `T | undefined`. Always handle:
  ```typescript
  // WRONG
  const item = items[0];
  item.name; // Error: item might be undefined

  // CORRECT
  const item = items[0];
  if (item) {
    item.name;
  }
  ```

- **ES Module imports require `.js` extension:**
  ```typescript
  // WRONG
  import { TrustEngine } from './TrustEngine';

  // CORRECT
  import { TrustEngine } from './TrustEngine.js';
  ```

- **Use `import type` for type-only imports:**
  ```typescript
  import type { AgentId, TrustLevel } from '../types.js';
  ```

- **Strict null checks enabled** - Never assume values exist without checking

### Hono API Rules

- **Route prefix:** All Mission Control routes under `/api/v1/mission-control/*`
- **Error format:** RFC 7807 Problem Details
  ```typescript
  return c.json({ type: 'validation_error', title: 'Bad Request', status: 400, detail: 'message' }, 400);
  ```
- **RBAC middleware pattern:**
  ```typescript
  app.get('/route', requireRole('supervisor', 'director'), handler);
  ```
- **Cursor pagination for lists:** `?cursor=xyz&limit=50`

### React Rules

- **Functional components only** - No class components
- **Zustand for state:** `useMissionControlStore()` pattern
- **Optimistic updates:** Update UI immediately, reconcile on server response
- **Component pattern:** Compound components for modules
  ```typescript
  <Module.Header />
  <Module.Body />
  <Module.Footer />
  ```
- **Memo for expensive components:** Use `React.memo()` for list items

### Supabase Rules

- **Row-Level Security (RLS):** All queries filtered by `org_id` automatically
- **Channel naming:** `org:{orgId}`, `agent:{agentId}`, `queue:{orgId}`
- **Event format:** `{ type: string, payload: T, timestamp: string, orgId: string }`
- **Real-time subscriptions:** Use granular channels, not broadcast all

---

## Testing Rules

### Test Structure

- **Co-locate tests:** `feature.ts` → `feature.test.ts` (same directory)
- **Test framework:** Vitest with `globals: true`
- **Coverage threshold:** 70% minimum (statements, branches, functions, lines)

### Test Patterns

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ClassName', () => {
  let instance: ClassName;

  beforeEach(() => {
    instance = new ClassName();
  });

  // ===========================================================================
  // Category Name
  // ===========================================================================

  describe('methodName', () => {
    it('does specific thing', () => {
      // Arrange, Act, Assert
    });
  });
});
```

### Mocking

- Use `vi.fn()` for function mocks
- Use `vi.mock()` for module mocks
- Reset mocks in `beforeEach`

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase.tsx | `AgentOverviewModule.tsx` |
| Services | PascalCase.ts | `TrustEngine.ts` |
| Utilities | camelCase.ts | `hashChain.ts` |
| Tests | *.test.ts | `TrustEngine.test.ts` |
| Types | types.ts or camelCase.ts | `trust.ts` |

### Code

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `TrustScoreCalculator` |
| Functions | camelCase | `calculateTrustScore` |
| Constants | UPPER_SNAKE | `TRUST_INHERITANCE_RATE` |
| Types/Interfaces | PascalCase | `TrustScore`, `AgentId` |
| Events | entity:action | `'trust:created'`, `'agent:status_changed'` |
| Hooks | use{Name} | `useRealtimeConnection` |
| Stores | use{Name}Store | `useMissionControlStore` |

### Database

| Type | Convention | Example |
|------|------------|---------|
| Tables | snake_case, plural | `audit_hashes` |
| Columns | snake_case | `created_at` |
| Indexes | idx_{table}_{cols} | `idx_audit_hashes_entry` |
| Foreign keys | {table}_id | `org_id`, `agent_id` |

### API

| Type | Convention | Example |
|------|------------|---------|
| Routes | kebab-case, plural | `/mission-control/agents` |
| Route params | :camelCase | `:decisionId` |
| Query params | camelCase | `?agentId=xxx` |

---

## Code Organization

### API Structure

```
src/api/
├── routes/mission-control/  # Route handlers
├── middleware/              # Auth, RBAC, audit
└── services/               # Business logic
```

### Frontend Structure

```
web/src/
├── components/mission-control/
│   ├── modules/            # Dashboard modules
│   ├── views/              # Role-specific views
│   └── shared/             # Reusable components
├── stores/                 # Zustand stores
└── hooks/                  # Custom hooks
```

### Type Organization

- Shared types: `src/types.ts` and `src/types/`
- Domain types: `src/core/types/` (trust.ts, audit.ts)
- Frontend types: `web/src/types/`

---

## Critical Don't-Miss Rules

### Anti-Patterns to Avoid

| Bad | Good | Why |
|-----|------|-----|
| `getUserData()` | `getUser()` | Redundant "Data" suffix |
| `{ error: "msg" }` | `{ type, title, status, detail }` | Use RFC 7807 |
| `UserCreated` | `user:created` | Events are lowercase with colon |
| `__tests__/folder` | `*.test.ts` | Co-locate tests |
| `handleApprove()` | `approveDecision()` | Avoid "handle" prefix for actions |
| Missing `.js` in imports | `import from './file.js'` | ES modules require extension |

### Security Rules

- **Never expose `org_id` in URLs** - Use auth context
- **Always validate with Zod** before processing API inputs
- **Hash chain verification** - Never skip on audit reads
- **RBAC check before data access** - Middleware runs first

### Performance Rules

- **Async hash verification** - Never block UI
- **Virtual scroll for long lists** - Don't render 1000+ items
- **Debounce real-time updates** - Batch rapid events
- **LRU cache for hash verification** - 1000 entries, 5min TTL

### Edge Cases

- **New agent with 0 tasks** → Trust score = 50 (neutral), confidence = 0
- **Connection drop** → Show "Last sync: Xs ago" indicator
- **Tribunal tie** → Escalate to HITL (unanimous required)
- **Array access** → Always check for `undefined` due to `noUncheckedIndexedAccess`

---

## Event Patterns

### Typed Event Emitters

```typescript
interface TrustEngineEvents {
  'trust:created': (agentId: AgentId, score: TrustScore) => void;
  'trust:updated': (agentId: AgentId, oldScore: TrustScore, newScore: TrustScore) => void;
}

class TrustEngine extends EventEmitter<TrustEngineEvents> {
  // ...
}
```

### Real-time Event Names

```
agent:status_changed
trust:score_updated
decision:pending
queue:item_resolved
```

---

## Architecture Reference

For complete architectural decisions, see: `_bmad-output/architecture.md`

Key sections:
- Core Architectural Decisions (data, security, API, frontend)
- Implementation Patterns (24 conflict points addressed)
- Project Structure (complete file tree)
- Requirements Mapping (55 FRs, 49 NFRs)

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Check architecture.md for detailed decisions

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

---

_Generated by BMad Method project-context workflow_
_Last Updated: 2025-12-23_
