# Story 1.5: Agent Profile Navigation with AgentLink

## Story Info
- **Epic**: 1 - Mission Control Core & Agent Visibility
- **Status**: done
- **Completed**: 2025-12-23
- **FRs Covered**: FR2

## User Story

As an operator,
I want to click on any agent reference to navigate to their profile,
So that I can quickly investigate specific agents.

## Acceptance Criteria

### AC1: Clickable Agent References
**Given** an agent ID appears anywhere in Mission Control
**When** I click on the agent reference
**Then** I navigate to the Agent Profile page for that agent
**And** the URL updates to `/agents/{agentId}`

### AC2: Agent Profile Page
**Given** I'm viewing an Agent Profile page
**When** the page loads
**Then** I see complete agent details including trust history, recent actions, status
**And** I can navigate back to the dashboard

### AC3: Agent ID Tooltips
**Given** an agent ID is displayed in text format
**When** rendered
**Then** the ID shows the hierarchy (HH-OO-RR-II format) with tooltips explaining each segment

## Technical Implementation

### Files to Create
- `web/src/components/mission-control/shared/AgentLink.tsx` - Clickable agent reference component
- `web/src/components/mission-control/shared/AgentLink.test.tsx` - Tests

### Files to Modify
- `web/src/components/AgentProfilePage.tsx` - Support deep linking and Mission Control integration
- `web/src/components/mission-control/modules/AgentOverviewModule.tsx` - Use AgentLink

### Implementation Notes

#### AgentLink Component
```typescript
interface AgentLinkProps {
  agentId: string;
  agentName?: string;
  showId?: boolean;      // Show ID alongside name
  showTooltip?: boolean; // Show hierarchy tooltip
  className?: string;
}

// Usage
<AgentLink agentId="01-MC-OP-42" agentName="DataProcessor-Alpha" />
```

#### ID Format Tooltip Content
```typescript
const ID_SEGMENTS = {
  HH: 'Hierarchy Level (00-99)',
  OO: 'Organization Code',
  RR: 'Role Code (OP=Operator, SV=Supervisor, etc.)',
  II: 'Instance Number',
};

// Tooltip shows:
// "01-MC-OP-42"
// HH: 01 - Hierarchy Level 1
// OO: MC - Mission Control Org
// RR: OP - Operator Role
// II: 42 - Instance 42
```

#### AgentProfilePage Enhancements
- Add route parameter handling for `/agents/:agentId`
- Add back navigation to dashboard
- Ensure RLS filters to current org (security)
- Display:
  - Agent basic info (name, ID, status)
  - Trust score with history chart
  - Recent actions list
  - Parent/child agent relationships

#### Navigation Integration
- Use React Router's `useNavigate` for programmatic navigation
- Ensure browser back button works correctly
- Add breadcrumb: "Dashboard > Agent: {name}"

### Dependencies
- Story 1.3 (AgentOverviewModule to use AgentLink)
- Story 1.4 (TrustBadge for profile page)

## Definition of Done
- [x] AgentLink component with click navigation
- [x] Tooltip explaining ID format segments
- [x] AgentProfilePage enhanced for Mission Control
- [x] Deep linking support (/agents/:agentId)
- [x] Back navigation to dashboard
- [x] Breadcrumb navigation
- [x] All agent references use AgentLink consistently
- [x] Unit tests for AgentLink
- [x] Integration test for navigation flow
