# Story 8.6: Urgency Level Configuration

## Story Info
- **Epic**: 8 - Onboarding & Education
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR54

## User Story

As a supervisor,
I want to configure urgency level rules,
So that action requests are properly prioritized based on our organization's needs.

## Acceptance Criteria

### AC1: View Urgency Rules
**Given** I am a supervisor
**When** I access the urgency configuration panel
**Then** I see all configured urgency rules for my organization

### AC2: Rule Display
**Given** urgency rules are displayed
**When** viewing a rule
**Then** I see: name, description, condition, urgency level, enabled status

### AC3: Urgency Levels
**Given** I am creating or editing a rule
**When** selecting urgency level
**Then** options include: low, medium, high, immediate

### AC4: Rule Conditions
**Given** I am creating a rule
**When** defining the condition
**Then** I can specify: field, operator (equals, greater_than, etc.), value

### AC5: Escalation Timeouts
**Given** the configuration panel is open
**When** viewing escalation settings
**Then** I see timeout durations for each urgency level

## Technical Implementation

### API Endpoints
- GET /api/v1/mission-control/settings/urgency - Get urgency configuration
- PUT /api/v1/mission-control/settings/urgency - Update configuration
- POST /api/v1/mission-control/settings/urgency/rules - Add new rule
- DELETE /api/v1/mission-control/settings/urgency/rules/:id - Remove rule

### Files Created/Modified
- web/src/components/mission-control/shared/HelpPanel.tsx (UrgencyConfigPanel, UrgencyRuleCard)
- UrgencyRule, UrgencyRuleConfig types

### Component Structure
```typescript
interface UrgencyRuleCardProps {
  rule: UrgencyRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

<UrgencyConfigPanel>
  <EscalationTimeouts config={urgencyConfig} />
  <UrgencyRuleList>
    {rules.map(rule => (
      <UrgencyRuleCard key={rule.id} rule={rule} />
    ))}
  </UrgencyRuleList>
  <AddRuleButton onClick={openRuleForm} />
</UrgencyConfigPanel>
```

### Helper Functions
```typescript
export function getUrgencyColor(level: UrgencyRule['urgencyLevel']): string {
  const colors = {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#ef4444',
    immediate: '#dc2626'
  };
  return colors[level];
}
```

## Definition of Done
- [x] UrgencyConfigPanel component
- [x] UrgencyRuleCard component with enable/disable toggle
- [x] getUrgencyColor helper function
- [x] GET /settings/urgency endpoint
- [x] PUT /settings/urgency endpoint
- [x] UrgencyRule, UrgencyRuleConfig types
- [x] Escalation timeout configuration display
- [x] Rule condition display

## Deliverables
- `src/api/routes/mission-control/index.ts` (settings/urgency endpoints)
- `web/src/components/mission-control/shared/HelpPanel.tsx` (UrgencyConfigPanel, UrgencyRuleCard)
- `web/src/types.ts` (UrgencyRule, UrgencyRuleConfig types)
