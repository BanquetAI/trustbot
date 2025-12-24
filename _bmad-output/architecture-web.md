# Architecture - Web (Frontend)

## Overview

The TrustBot Web UI is a React single-page application providing a visual interface for AI agent governance.

**Project Type:** web
**Framework:** React 18.2
**Build Tool:** Vite 5.0
**Language:** TypeScript 5.2
**Deployment:** Vercel

## Architecture Pattern

**Component-Based SPA** with centralized state management via React hooks.

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
│                    (App.tsx)                                │
├─────────────────────────────────────────────────────────────┤
│  Views/Pages                                                │
│  ├── LoginScreen (Authentication)                           │
│  ├── Console (Main Dashboard)                               │
│  ├── AgentProfilePage (Agent Details)                       │
│  └── SkillLibrary (Skills Browser)                          │
├─────────────────────────────────────────────────────────────┤
│  Feature Components (40+)                                   │
│  ├── Agent: AgentControlPanel, AgentListModal...            │
│  ├── Trust: TrustScoreGauge, TrustTierBadge...              │
│  ├── Tasks: TaskBoard, PendingActionsPanel...               │
│  ├── Governance: CouncilPanel, DelegationModal...           │
│  └── Onboarding: GenesisProtocol, SpawnWizard...            │
├─────────────────────────────────────────────────────────────┤
│  Services                                                   │
│  ├── api.ts (API client)                                    │
│  └── @anthropic-ai/sdk (Claude AI)                          │
├─────────────────────────────────────────────────────────────┤
│  Styling                                                    │
│  └── index.css (2500+ lines)                                │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
web/
├── src/
│   ├── App.tsx                   # Main app component
│   ├── api.ts                    # API client
│   ├── index.css                 # Global styles (2500+ lines)
│   ├── components/
│   │   ├── LoginScreen.tsx       # Authentication
│   │   ├── Console.tsx           # Main dashboard
│   │   ├── AgentProfilePage.tsx  # Agent details
│   │   ├── NavBar.tsx            # Navigation
│   │   │
│   │   ├── # Agent Components
│   │   ├── AgentControlPanel.tsx
│   │   ├── AgentListModal.tsx
│   │   ├── AgentPermissionsPanel.tsx
│   │   ├── AgentTaskQueue.tsx
│   │   │
│   │   ├── # Trust Components
│   │   ├── TrustScoreGauge.tsx
│   │   ├── TrustTierBadge.tsx
│   │   ├── TrustBreakdownModal.tsx
│   │   │
│   │   ├── # Task Components
│   │   ├── TaskBoard.tsx
│   │   ├── PendingActionsPanel.tsx
│   │   ├── CompletedTodayCard.tsx
│   │   │
│   │   ├── # Governance Components
│   │   ├── CouncilPanel.tsx
│   │   ├── DelegationModal.tsx
│   │   ├── HITLExplanation.tsx
│   │   ├── AutonomyBudgetWidget.tsx
│   │   │
│   │   ├── # Skills Components
│   │   ├── SkillLibrary.tsx
│   │   ├── SkillsManagementModal.tsx
│   │   │
│   │   ├── # Onboarding Components
│   │   ├── GenesisProtocol.tsx
│   │   ├── GuidedOnboarding.tsx
│   │   ├── SpawnWizard.tsx
│   │   ├── SpawnTutorial.tsx
│   │   │
│   │   ├── # Dashboard Components
│   │   ├── MetricsDashboard.tsx
│   │   ├── InsightsPanel.tsx
│   │   ├── ThoughtLogPanel.tsx
│   │   │
│   │   └── ui/                   # Reusable UI primitives
│   │
│   └── main.tsx                  # Entry point
├── public/
│   └── trustbot-intro.mp4        # Intro video
├── index.html
├── vite.config.ts
├── vercel.json
└── package.json
```

## Component Categories

### Authentication & Onboarding
| Component | Purpose |
|-----------|---------|
| LoginScreen | Video background login with Google OAuth |
| GenesisProtocol | First-time user guided tour |
| GuidedOnboarding | Interactive onboarding flow |
| SpawnWizard | Agent creation wizard |
| SpawnTutorial | Agent spawning tutorial |

### Agent Management
| Component | Purpose |
|-----------|---------|
| AgentProfilePage | Detailed agent view with tabs |
| AgentControlPanel | Agent action controls |
| AgentListModal | Agent roster browser |
| AgentPermissionsPanel | Permission management |
| AgentTaskQueue | Agent's task list |

### Trust Visualization
| Component | Purpose |
|-----------|---------|
| TrustScoreGauge | Circular trust score display |
| TrustTierBadge | Tier indicator badge |
| TrustBreakdownModal | Trust score breakdown details |

### Governance
| Component | Purpose |
|-----------|---------|
| CouncilPanel | Multi-agent governance dashboard |
| DelegationModal | Task delegation interface |
| HITLExplanation | Human-in-the-loop education |
| AutonomyBudgetWidget | Autonomy budget display |
| ControlPanel | System-wide controls |

### Skills
| Component | Purpose |
|-----------|---------|
| SkillLibrary | Browse 130 agent skills |
| SkillsManagementModal | Assign/manage skills |

### Dashboard
| Component | Purpose |
|-----------|---------|
| Console | Main application dashboard |
| MetricsDashboard | System metrics |
| CompletedTodayCard | Daily completed tasks |
| InsightsPanel | AI-generated insights |
| ThoughtLogPanel | Agent thought stream |

## Key Features

### Visual Metaphor
The UI uses a "building" metaphor where agents work in an office building:
- Executive floor for T5 agents
- Operations floor for workers
- Visual agent movement and status

### AI Integration
- **Claude AI** via @anthropic-ai/sdk
- Natural language commands
- AI-assisted insights

### Real-time Updates
- WebSocket/polling for live updates
- Optimistic UI updates
- Toast notifications

## Deployment

**Platform:** Vercel
**Framework:** Vite
**Cron Job:** `/api/tick` every minute
**Rewrites:** `/api/*` proxied to backend

```bash
npm run build      # Build for production
vercel --prod      # Deploy to Vercel
```

## Development

```bash
cd web
npm install
npm run dev        # Start dev server (localhost:3000)
```

---

*Generated by BMad Method document-project workflow*
