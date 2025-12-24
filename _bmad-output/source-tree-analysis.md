# Source Tree Analysis

## Repository Structure

```
trustbot-system/                    # Project root
├── src/                            # Backend source (TypeScript)
│   ├── index.ts                    # Main entry point
│   ├── types.ts                    # Core type definitions
│   │
│   ├── api/                        # REST API layer
│   │   ├── index.ts                # API entry point
│   │   ├── UnifiedWorkflowAPI.ts   # Main API server (2800+ lines)
│   │   └── middleware/
│   │       ├── security.ts         # CORS, rate limiting, auth
│   │       └── validation.ts       # Request validation
│   │
│   ├── core/                       # Core business logic
│   │   ├── index.ts                # Core exports
│   │   ├── TrustEngine.ts          # Trust scoring system
│   │   ├── TrustScoreCalculator.ts # FICO-style calculator
│   │   ├── SecurityLayer.ts        # Auth, authz, audit
│   │   ├── Blackboard.ts           # Stigmergic coordination
│   │   ├── PersistenceLayer.ts     # State persistence
│   │   ├── SupabasePersistence.ts  # Supabase integration
│   │   ├── HITLGateway.ts          # Human-in-the-loop
│   │   ├── MessageBus.ts           # Event bus
│   │   ├── MemoryStore.ts          # In-memory storage
│   │   ├── TimeManager.ts          # Time management
│   │   ├── CryptographicAuditLogger.ts  # Tamper-proof audit
│   │   │
│   │   ├── council/                # Multi-agent governance
│   │   │   ├── CouncilService.ts
│   │   │   └── CouncilMemberRegistry.ts
│   │   │
│   │   ├── delegation/             # Task delegation
│   │   │   └── DelegationManager.ts
│   │   │
│   │   ├── autonomy/               # Autonomy tracking
│   │   │   └── AutonomyBudget.ts
│   │   │
│   │   ├── config/                 # Configuration
│   │   │   └── features.ts
│   │   │
│   │   └── types/                  # Core types
│   │       ├── trust.ts
│   │       └── audit.ts
│   │
│   ├── agents/                     # Agent implementations
│   │   ├── index.ts
│   │   └── BaseAgent.ts            # Base agent class
│   │
│   ├── orchestrators/              # T5 Supreme Orchestrators
│   │   └── ...
│   │
│   ├── skills/                     # Skills library
│   │   ├── index.ts                # 130 skills
│   │   └── integration.ts          # Agent skill integration
│   │
│   ├── mcp/                        # Model Context Protocol
│   │   └── ...
│   │
│   └── game/                       # Game mode
│       └── index.ts
│
├── web/                            # Frontend (React)
│   ├── src/
│   │   ├── main.tsx                # Entry point
│   │   ├── App.tsx                 # Main component
│   │   ├── api.ts                  # API client
│   │   ├── index.css               # Styles (2500+ lines)
│   │   └── components/             # 40+ components
│   │       ├── LoginScreen.tsx
│   │       ├── Console.tsx
│   │       ├── AgentProfilePage.tsx
│   │       └── ...
│   ├── public/
│   │   └── trustbot-intro.mp4
│   ├── index.html
│   ├── vite.config.ts
│   ├── vercel.json
│   └── package.json
│
├── supabase/                       # Database
│   └── schema.sql                  # PostgreSQL schema
│
├── docs/                           # Documentation
│   ├── PRODUCT_SPEC.md
│   └── DEMO_FLOW.md
│
├── scripts/                        # Utility scripts
│   └── ...
│
├── _bmad-output/                   # Generated documentation
│   ├── index.md
│   ├── project-overview.md
│   ├── architecture-api.md
│   ├── architecture-web.md
│   └── stories/                    # Epic files
│
├── dist/                           # Build output
├── coverage/                       # Test coverage
├── node_modules/
│
├── package.json                    # Backend dependencies
├── tsconfig.json                   # TypeScript config
├── vitest.config.ts                # Test config
├── Dockerfile                      # Docker build
├── fly.toml                        # Fly.io config
└── README.md
```

## Critical Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `src/api/` | REST API server | UnifiedWorkflowAPI.ts (main) |
| `src/core/` | Business logic | TrustEngine, SecurityLayer, Blackboard |
| `src/skills/` | Skills library | 130 agent skills |
| `web/src/components/` | React UI | 40+ components |
| `supabase/` | Database schema | schema.sql |

## Entry Points

| Part | Entry Point | Command |
|------|-------------|---------|
| API | `src/api/index.ts` | `npm run api` |
| Web | `web/src/main.tsx` | `npm run web` |
| Game | `src/game/index.ts` | `npm run game` |
| Tests | `src/**/*.test.ts` | `npm test` |

## Integration Points

```
┌────────────┐     HTTP/REST      ┌────────────┐
│   web/     │ ─────────────────► │   src/api/ │
│  (React)   │                    │   (Hono)   │
└────────────┘                    └─────┬──────┘
                                        │
                                        │ SQL
                                        ▼
                                  ┌────────────┐
                                  │  supabase/ │
                                  │ (Postgres) │
                                  └────────────┘
```

---

*Generated by BMad Method document-project workflow*
