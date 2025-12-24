---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - "_bmad-output/index.md"
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 1
workflowType: 'prd'
lastStep: 11
workflowComplete: true
completedAt: '2025-12-23'
project_name: 'TrustBot'
user_name: 'pilot'
date: '2025-12-22'
partyModeNotes:
  - "Agent Taxonomy System (WIP) - to finalize in future session"
  - "Orchestration Domains and Role Codes need definition"
  - "Urgency Framework added to Governance Model"
  - "AI Governance domain requirements - P1-P5 prioritized"
  - "6 core innovations identified with validation metrics"
  - "SaaS B2B requirements with MVP/Growth/Enterprise phasing"
  - "Platform MVP approach with 3-phase roadmap"
---

# Product Requirements Document - TrustBot

**Author:** pilot
**Date:** 2025-12-22

## Executive Summary

### Vision

Transform the existing TrustBot Console into a comprehensive **Mission Control Dashboard** - a holistic command center where human operators can monitor, manage, and interact with their AI agent workforce through intuitive, UI/UX-friendly module stacks.

### Problem It Solves

Currently, TrustBot provides powerful agent orchestration capabilities, but operators lack a unified view to:
- See all agents and their real-time status at a glance
- Track projects in queue and task pipelines
- Access analytics and performance trends
- Manage schedules and upcoming agent activities
- Review records and audit trails

### What Makes This Special

Mission Control transforms raw capability into **operational clarity**. Users get:
- **Full visibility** without information overload
- **Modular stacks** that surface what matters
- **One dashboard** to rule all agents, tasks, and insights
- **The feeling of control** over autonomous systems

## Project Classification

| Field | Value |
|-------|-------|
| **Technical Type** | web_app / saas_b2b |
| **Domain** | General (AI Agent Management) |
| **Complexity** | Medium |
| **Project Context** | Brownfield - enhancing existing Console.tsx |

### Mission Control Modules

| Module | Description |
|--------|-------------|
| **Agent Overview** | Dashboard to see all agents, their status, trust levels |
| **Task/Project Queue** | Projects in queue, task pipeline visibility |
| **Analytics** | Performance metrics, trends, insights |
| **Agenda/Calendar** | Scheduling, upcoming tasks, time-based views |
| **Record Review** | Audit trail, history, decision records |
| **User Controls** | Existing controls (aggressiveness slider, HITL, etc.) |

## Success Criteria

### User Success

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Time to First Meaningful Insight** | < 2 minutes | User sees ONE clear thing work: agent action → trust update → audit trace |
| **Onboarding Completion** | > 80% complete tutorial | Education builds confidence to use the platform |
| **Task Completion Without Frustration** | Usability testing validates | Default layout works - customization is optional |
| **Overnight Confidence Score** | > 70% "Very Confident" | Users trust agents running while they sleep |
| **Trust System Comprehension** | > 80% can explain tier system | Users understand WHY TrustBot is different |
| **Audit Verify Click-through** | > 50% click "verify hash" once | Users understand tamper-proof value |

**Emotional Journey:**
1. **Anxiety** → "What are these agents doing?"
2. **Understanding** → "I can see exactly what they did and why"
3. **Confidence** → "I trust this system because I can verify it"
4. **Empowerment** → "I feel in control without micromanaging"

**Success Moment:** User traces their first agent action through the audit log and says "Oh, I get it now."

**Core Principle:** *"HITL needs to INSPECT what agents do, not just EXPECT it."* - This is Mission Control's purpose.

### Business Success

| Metric | Target | Timeline |
|--------|--------|----------|
| **Onboarding Completion** | 80% complete full tutorial | Launch |
| **Habitual Use** | Users log in 3+ times/week | 3 months |
| **Self-Service Resolution** | 70% of "what happened?" questions answerable via audit drill-down | 3 months |
| **User Confidence** | NPS > 40 | 6 months |

### Technical Success

| Metric | Target |
|--------|--------|
| **Event Delivery Reliability** | 99.9% - Events we emit are delivered |
| **Audit Log Integrity** | 100% - Hash chain verification passes on every view |
| **Graceful Degradation** | "Last sync: X seconds ago" indicator if connection drops |
| **Dashboard Load** | < 2s initial load |
| **Zero New Infrastructure** | Leverage existing orchestrator, realtime, audit systems |

### Measurable Outcomes

- **Education First**: 100% of new users see guided tutorial (tooltip tour) before full dashboard
- **Transparency Visible**: Every module connects to audit_log for drill-down
- **Contextual Learning**: Pop-up explanations on first trust denial, first approval request, tier changes
- **Links Everywhere**: Every agent reference clickable → Agent Profile

## TrustBot Governance Model

### Core Concepts

| Concept | Nature | Description |
|---------|--------|-------------|
| **Hierarchy** | Fixed | Agent's capabilities - encoded in Agent ID, never changes |
| **Trust** | Dynamic | Score 0-1000, changes based on performance (FICO-style) |
| **Risk** | Per-Action | How dangerous is this action? (1-10 scale) |
| **Urgency** | Per-Action | How quickly must we decide? (immediate vs can wait) |

### Decision Gate Logic

```
Trust Score vs Risk Level → Determines HITL Involvement
Urgency Level → Determines WHEN to involve HITL

High Trust + Low Risk  → Push Through (autonomous)
High Trust + High Risk → Consult Bot Tribunal
Low Trust + Any Risk   → HITL Approval Required

If HITL needed:
  High Urgency → Alert immediately (24/7)
  Low Urgency  → Queue for business hours (bot waits patiently)
```

### Urgency Framework

**Key Insight:** High Risk ≠ High Urgency. A dangerous action that can wait until morning shouldn't wake anyone at 3 AM.

```
                    LOW URGENCY              HIGH URGENCY
                    (Can wait)               (Needs NOW)
                ┌─────────────────────┬─────────────────────┐
   HIGH RISK    │  📋 QUEUED          │  🚨 IMMEDIATE       │
                │  Morning decision   │  Wake them up       │
                │  Bot waits patiently│  All channels       │
                ├─────────────────────┼─────────────────────┤
   LOW RISK     │  📊 SCHEDULED       │  📱 NOTIFICATION    │
                │  Daily/weekly digest│  FYI, no action     │
                │  Review in reports  │  needed             │
                └─────────────────────┴─────────────────────┘
```

**What Makes Something URGENT (24/7 Alert):**
- Active security breach in progress
- System going down / outage
- Money actively leaving incorrectly
- Legal/compliance deadline closing NOW
- External system failing us
- Customer-facing impact happening

**What Can Wait for Daylight:**
- Database cleanup/maintenance
- Batch processing decisions
- Data validation issues
- Policy violations (non-immediate)
- Internal optimization choices
- Backend maintenance

**The Pattern:** Urgency = Active harm happening NOW or irreversible window closing

### Urgency Rules (Org-Configurable)

Organizations define their own urgency triggers:

```yaml
urgency_rules:
  immediate_24_7:              # Wake them up
    - action_type: "security_*"
    - affected_system: "payments"
    - affected_system: "auth"
    - external_dependency_failing: true
    - customer_facing_impact: true
    - compliance_deadline_hours: < 4

  business_hours_queue:        # Can wait
    - action_type: "database_*"
    - action_type: "batch_*"
    - action_type: "cleanup_*"
    - internal_only: true
    - no_active_harm: true

  default: queue               # Conservative: queue unless proven urgent
```

**Evolution:** Orgs learn over time what truly needs 3 AM alerts vs what can wait. Default is conservative (queue everything except obvious emergencies).

### Fading HITL Model

| Trust Level | HITL Involvement | Agent Experience |
|-------------|------------------|------------------|
| **New (0-200)** | Approval required | "May I?" |
| **Learning (200-400)** | Notified, can rollback | "I'm doing this..." |
| **Trusted (400-600)** | Notified async, rollback available | "I did this." |
| **Confident (600-800)** | Scheduled reports, spot-checks | "Here's my week." |
| **Sovereign (800-1000)** | Shadow monitoring, exception alerts | "Trust but verify." |

**Key:** HITL involvement FADES but never DISAPPEARS. Even Sovereign agents are shadow monitored.

### Bot Tribunal

- **Members:** 3 agents consult on high-risk decisions
- **Rule:** Unanimous required, else escalate to HITL
- **Override:** HITL can rollback tribunal decisions

### Rollback & Forgiveness

- **Standard Window:** 24 hours for most actions
- **Extended Window:** Longer for high-impact decisions (not forever)
- **Forgiveness:** Trust recovers over time if agent demonstrates learning
- **Positive Reinforcement:** HITL can mark actions "that was cool" → trust boost

## Agent Identification System (WIP)

### Format: `HH-OO-RR-II`

| Position | Meaning | Values |
|----------|---------|--------|
| HH | Hierarchy Level | 00-08 agents, 90-99 humans |
| OO | Orchestration Domain | 00-99 (area of operation) |
| RR | Role Code | 00-99 (specific function) |
| II | Instance | 00=genesis, 01-99, 100+ |

### Hierarchy Levels (HH)

| Code | Level | Description |
|------|-------|-------------|
| 00 | FOUNDATION | Core infrastructure |
| 01 | OBSERVER | Passive monitoring |
| 02 | WORKER | Task execution |
| 03 | SPECIALIST | Domain expert |
| 04 | COORDINATOR | Multi-agent orchestration |
| 05 | TACTICAL | Strategic decisions |
| 06 | EXECUTIVE | High-stakes autonomy |
| 07 | SOVEREIGN | Self-directing |
| 08 | ARCHITECT | Creates other agents |
| 90-99 | HUMAN | Human participants (90=Operator → 96=CEO) |

### Display Format

```
[Trust Badge] HH-OO-RR-II  Trust: XXX  │  Status: State
     │              │           │              │
     │              │           │              └── Dynamic status
     │              │           └── Dynamic trust score
     │              └── Fixed Agent ID (birth capabilities)
     └── Visual tier indicator
```

**To Finalize:** Orchestration Domains (OO), Role Codes (RR), specific rollback windows

## Product Scope

### Design Principles

- **Mission Control IS about control** - Users can alter settings, not read-only
- **Links everywhere** - Every reference clickable to detail view
- **Agent ID visible everywhere** - Consistent identification system
- **Approvals link out for now** - Show pending, link to approve elsewhere (MVP)

### MVP - Minimum Viable Product

1. **Agent Overview Module** - Real-time status, trust scores, clickable to Agent Profile
2. **Task Pipeline Module** - Action requests (pending/executing/completed), links to details
3. **Record Review Module** - Audit trail with hash verification badge visible
4. **User Controls** - Existing aggressiveness slider, HITL toggle
5. **Onboarding Tutorial** - Tooltip tour walkthrough
6. **Contextual Learning Moments** - First denial, first approval, tier changes explained
7. **Consistent Agent IDs** - `<AgentLink>` component used everywhere

### Growth Features (Post-MVP)

- Analytics Module (trends, graphs)
- Agenda/Calendar Module
- Advanced Filtering
- Export Reports (PDF/CSV)
- Module Customization (drag/drop)
- In-dashboard approval actions

### Vision (Future)

- Predictive Insights
- Comparative Analytics
- Mobile App with push notifications
- Multi-Org Dashboard
- Full Agent Taxonomy with all domains/roles defined

## User Journeys

### User Type Overview

| ID Pattern | Role | Mission Control Focus |
|------------|------|----------------------|
| 90-XX-XX-XX | Operator | Day-to-day monitoring, approvals, rollbacks |
| 91-XX-XX-XX | Supervisor | Team oversight, pattern detection, escalations |
| 92-XX-XX-XX | Director | Executive KPIs, rule approval, fleet health |
| 90-03-XX-XX | Compliance | Audit investigation, evidence packages |

---

### Journey 1: Alex Chen - First Day at Mission Control

**User Type:** Operator (90-00-00-12)
**Context:** New hire at fintech startup, first experience with AI agent management

**The Story:**

Alex Chen joins DataFlow AI as an Operations Analyst. Managing autonomous AI agents feels unsettling - "agents making decisions while I sleep" is anxiety-inducing. Day one, coffee in hand, Alex logs into TrustBot for the first time.

Instead of an overwhelming dashboard, a friendly tooltip tour begins: *"Let's take 2 minutes to show you how transparency works here."*

The tour highlights each module: Agent Overview (trust scores like credit scores), Task Pipeline (everything in flight), Record Review (audit trail with hash verification). Alex notices one agent with a yellow status - a denied action.

Clicking through, Alex sees the Trust Gate in action: an agent tried to write to production but its trust score (423) was below the required threshold (600). The system queued it for human approval. Alex reviews the details, sees exactly what the agent wanted to do, and clicks **Approve** - their first HITL action.

A popup explains: *"This agent's trust score will increase because you validated its judgment. Over time, it'll need fewer approvals."*

By 9:15 AM - 12 minutes after login - Alex has completed the tour, understood trust scoring, approved their first action, and seen the audit trail with hash verification. The anxiety is gone, replaced by understanding.

**Success Moment:** Alex traces their first agent action through the audit log and says "Oh, I get it now."

---

### Journey 2: Alex Chen - Morning Queue Review

**User Type:** Operator (90-00-00-12)
**Context:** 3 months in, agents running overnight batch jobs

**The Story:**

Friday morning, 7:15 AM. Alex arrives and opens Mission Control:

```
📋 QUEUED DECISIONS: 1 awaiting your review
```

Not a panic alert. Just a queue.

The detail shows an overnight action: Agent 04-01-33-00 attempted to delete 847,000 "stale" records. Risk: CRITICAL (9/10). Urgency: LOW. The bot is waiting patiently.

A tooltip explains: *"This is a database batch operation with no active customer impact. High-risk decisions that can wait are queued for business hours."*

Alex reviews the tribunal vote (2-1 DENY due to volume anomaly), samples the affected records, and spots the problem: timestamp corruption from a migration made recent records look stale. 73,000 records would have been wrongly deleted.

With coffee and full alertness, Alex clicks **"Deny + Investigate"** and documents the finding. Crisis averted - without anyone losing sleep.

**Contrast:** Later that week, Alex DOES get a 2 AM alert - suspicious API activity on the payment processor. That one couldn't wait. The system knows the difference.

**Key Principle:** High Risk ≠ High Urgency. The bot waits when it can.

---

### Journey 3: Sarah Martinez - The Escalation Lands

**User Type:** Supervisor (91-00-00-03)
**Context:** Team lead overseeing 4 operators and 40+ agents

**The Story:**

Friday morning, 7:42 AM. Sarah's phone shows a notification:

```
📋 Investigation flagged by your team
Operator: Alex Chen | Agent: COORDINATOR-PRIME
Action: cascade_delete DENIED
```

Sarah opens her Supervisor Dashboard - a different view than Alex sees. She can see all 4 operators and 43 agents at once. Today shows: 12 decisions made, 3 queued, 1 investigation (NEW).

Drilling into Alex's investigation, Sarah sees something Alex couldn't: **pattern analysis across the team**. Three other agents processed migration data this week. One batch was approved by Jordan on Tuesday. Another by Priya on Wednesday.

Sarah's eyes widen. *This might be bigger than one agent.*

She clicks **"Expand Investigation"** to add the related agents. Then she initiates a **Rollback Review** on Tuesday's batch - and confirms 7,800 records there had the same timestamp corruption.

By 8:30 AM, Sarah has identified a systemic issue, initiated rollback of potentially bad data, coordinated across her team, and escalated to Data Engineering.

At standup, Jordan asks nervously: "Did I mess up?" Sarah shakes her head: "The agent's trust score was high enough that it didn't trigger tribunal. That's not your fault - it's a gap in our rules. We'll fix it."

**Key Principle:** Supervisors see patterns across operators. Incidents become rule improvements.

---

### Journey 4: Michael Torres - The Executive View

**User Type:** Director (92-00-00-01)
**Context:** Oversees 3 supervisors, 12 operators, 120+ agents

**The Story:**

Every Friday at 2 PM, Michael spends 20 minutes with Mission Control. Not to approve actions - but to understand fleet health.

His Executive Dashboard shows high-level KPIs:

- **127 agents** (+3 vs last month)
- **Trust health:** +12 avg score this week (689 → 701)
- **HITL load:** -23% vs last month (847 → 652 decisions)
- **Autonomous rate:** 78.3% (up from 71%)
- **Active incidents:** 1 (INC-2024-1247)

Michael clicks the incident. He doesn't see granular details - he sees an executive summary:

> Timestamp corruption caused 3 agents to flag incorrect records. Tribunal caught the largest batch (847K). One smaller batch required rollback. Root cause: migration script. No customer impact. Estimated cost avoided: ~$180,000.

He notices: **"Pending: Rule approval (requires Director sign-off)"**

Sarah proposed a new rule: bulk operations always require tribunal review regardless of trust score. Impact analysis shows +4 tribunals/week, -0.3% autonomous rate. Acceptable trade-off.

Michael clicks **"Approve Rule"** and adds: "Good catch. Let's add quarterly tribunal rule reviews to governance calendar."

He also notes: Alex Chen flagged as top performer (most investigations that prevented issues). Marcus Webb flagged for coaching (highest rollback rate). Mental note to ask Sarah.

By 2:20 PM, Michael has reviewed fleet health, understood the incident, approved governance changes, and drafted a one-paragraph summary for his VP.

**Key Principle:** Executives see trends, not trees. Business impact language. 20 minutes, done.

---

### Journey 5: Diana Walsh - The Compliance Deep Dive

**User Type:** Compliance Analyst (90-03-00-02)
**Context:** Responding to regulatory inquiry about customer data

**The Story:**

Monday morning, Diana gets an urgent email from Legal:

> We received an inquiry from the State Data Protection Authority. Customer claims we deleted their account data without authorization on December 17th. We need complete audit trail. Deadline: Wednesday 5 PM.

Diana opens the Audit Investigation Center and runs a Customer Data Trail search for ID 44521, December 1-22.

The system returns everything: 7 events, every touch, every decision, every hash verified.

The timeline shows:
- Dec 3: Routine validation check (PASS, account active)
- Dec 17 03:14: Flagged for deletion (FALSE MATCH - timestamp corruption)
- Dec 17 03:14: Tribunal convened, voted 2-1 DENY
- Dec 17 07:38: Alex Chen DENIED + INVESTIGATE
- Dec 17 08:42: Investigation opened by Sarah Martinez
- Dec 18 11:15: Data integrity verified - ALL DATA INTACT
- Dec 20 14:30: Governance rule updated by Michael Torres

Diana clicks **"Generate Evidence Package"** - a 12-page PDF with:
- Executive summary: NO DATA WAS DELETED
- Complete event timeline with hashes
- Hash chain integrity report: PASSED (no tampering)
- Tribunal deliberation records
- HITL decision documentation
- Governance corrective action

Diana attests to completeness and sends to Legal.

Wednesday: The regulator closes the inquiry with **"No Violation - Adequate Safeguards Demonstrated."**

**Key Principle:** Every touch logged. Cryptographic proof. One-click evidence packages.

---

### Journey Requirements Summary

| Capability Area | Requirements |
|-----------------|--------------|
| **Onboarding** | Tooltip tour (< 2 min), contextual learning popups, first-action celebration |
| **Queue Management** | Morning queue view, urgency display, time-in-queue, "why it waited" explanation |
| **Agent Display** | Status colors, trust scores, clickable to profile, AgentLink component everywhere |
| **Decision Flow** | View details, sample data, approve/deny/investigate, trust impact preview |
| **Audit Trail** | Hash verification badges, timeline view, tamper-proof indicators |
| **Team Oversight** | Supervisor dashboard, cross-operator visibility, pattern detection |
| **Investigation** | Expand scope, link related events, rollback review |
| **Executive View** | KPIs, trends, autonomous rate, HITL load, incident summaries |
| **Rule Governance** | Propose rules, impact analysis, director approval workflow |
| **Compliance** | Customer data trail, evidence package generator, chain integrity report |
| **Alerts** | Mobile alerts for urgent items, queue notifications for non-urgent |
| **Human Metrics** | Operator performance, coaching signals, recognition |

### User Type Capabilities Matrix

| Capability | Operator | Supervisor | Director | Compliance |
|------------|----------|------------|----------|------------|
| View own queue | ✅ | ✅ | - | - |
| Approve/Deny actions | ✅ | ✅ | - | - |
| Initiate investigation | ✅ | ✅ | - | - |
| View team activity | - | ✅ | ✅ | - |
| Expand investigation scope | - | ✅ | ✅ | - |
| Initiate rollback review | - | ✅ | ✅ | - |
| Approve rule changes | - | - | ✅ | - |
| View fleet KPIs | - | ✅ | ✅ | - |
| Generate evidence packages | - | - | - | ✅ |
| Verify hash chains | ✅ | ✅ | ✅ | ✅ |
| Customer data trail | - | - | - | ✅ |

## Domain-Specific Requirements

### AI Agent Governance - Regulatory Landscape

TrustBot operates in an emerging regulatory landscape for AI governance:

| Regulation | Status | Relevance |
|------------|--------|-----------|
| **EU AI Act** | Enacted 2024 | High-risk AI requires human oversight, transparency, audit trails |
| **NIST AI RMF** | Published 2023 | AI risk management framework, accountability standards |
| **US Executive Order on AI** | Oct 2023 | Safety, security, trustworthiness requirements |
| **State-level AI Laws** | Emerging | Colorado, California exploring AI accountability |

### Key Domain Concerns (Prioritized)

| Priority | Requirement | Regulatory Driver |
|----------|-------------|-------------------|
| **P1** | Accountability Chain | Liability protection, enterprise adoption |
| **P2** | HITL Quality Metrics | EU AI Act "meaningful oversight" |
| **P3** | Explainability Reports | EU AI Act Article 14, NIST framework |
| **P4** | Trust Score Auditing | Algorithmic accountability, bias prevention |
| **P5** | Data Lineage | GDPR/CCPA data subject rights |

### P1: Accountability Chain

**Purpose:** Document clear liability trail for every agent decision.

Every action creates an immutable accountability chain showing:
- **Level 1: Agent** - What the agent decided and why
- **Level 2: Tribunal** - How peer agents evaluated the decision
- **Level 3: HITL (Operator)** - Human decision with review time and context
- **Level 4: Supervisor** - Escalation handling and pattern response
- **Level 5: Organization** - Governance-level accountability

**Key Principle:** At every level, record WHO decided, WHAT they decided, and WHY they're accountable.

### P2: HITL Quality Metrics

**Purpose:** Prove human oversight is "meaningful" not rubber-stamping.

Tracked metrics:
- **Review Time** - Time spent before decision (<5 sec = potential rubber-stamp)
- **Detail Views** - Did they view agent reasoning? Sample data?
- **Context Depth** - Information consumed before approving
- **Reversal Rate** - Self-correction indicator
- **Pattern Diversity** - Critical thinking vs automation bias

**Automation Bias Alerts:** System flags potential rubber-stamping patterns for supervisor review.

### P3: Explainability Reports

**Purpose:** One-click regulatory documentation for any AI decision.

Report includes:
- Decision summary and outcome
- Agent policy interpretation and confidence
- Risk assessment factors
- Automated safeguards triggered (Trust Gate, Tribunal)
- Human oversight details (who, duration, information reviewed, rationale)
- Outcome verification and corrective actions
- Cryptographic attestation

**Regulation Reference:** EU AI Act Article 14 (Human Oversight)

### P4: Trust Score Auditing

**Purpose:** Algorithmic transparency and fairness.

For any agent, show:
- Score composition (factors, weights, impacts)
- Score history with event correlation
- Recent events affecting score
- Challenge option for human review

**Key Principle:** Trust scores must be explainable and challengeable, like credit scores.

### P5: Data Lineage

**Purpose:** Privacy compliance and data subject rights.

Track for any data subject:
- Which agents accessed their data
- What actions were taken (read, write, flag, delete)
- What fields were accessed
- Purpose of each access
- Modifications, exports, deletions
- Right to explanation availability

**Regulation Reference:** GDPR Article 15 (Right of Access), Article 22 (Automated Decision-Making)

### Implementation Phasing

| Requirement | MVP | Growth | Rationale |
|-------------|-----|--------|-----------|
| **Accountability Chain** | ✅ | - | Foundation for enterprise trust |
| **HITL Quality Metrics** | ✅ | - | Core differentiator for EU AI Act compliance |
| **Explainability Reports** | - | ✅ | Enhancement for regulated industries |
| **Trust Score Auditing** | - | ✅ | Important but not blocking for MVP |
| **Data Lineage** | - | ✅ | Privacy feature, parallel development |

### Compliance Positioning

TrustBot's governance model positions it for:
- **EU AI Act Compliance** - Built-in human oversight with quality metrics
- **Enterprise Adoption** - Clear accountability chain reduces liability concerns
- **Regulated Industries** - Explainability reports ready for auditors
- **Algorithmic Fairness** - Transparent, auditable trust scoring
- **Privacy Compliance** - Data lineage for GDPR/CCPA readiness

## Innovation & Novel Patterns

### Core Innovation Thesis

TrustBot introduces a paradigm shift in AI agent management: **Governable Autonomy**. Rather than the binary choice of "human-controlled" or "fully autonomous," TrustBot creates a graduated, transparent, accountable system where AI agents earn trust through demonstrated performance - like humans do.

### Detected Innovation Areas

#### 1. FICO-Style Trust Scoring for AI Agents

**The Innovation:** Apply credit-scoring principles to AI agent autonomy.

| Traditional Approach | TrustBot Approach |
|---------------------|-------------------|
| Binary: trusted or not trusted | Graduated: 0-1000 continuous score |
| Static permissions | Dynamic permissions based on performance |
| One-size-fits-all oversight | Personalized oversight per agent |

**Why It's Novel:** No existing standard for quantifying AI trust. Current AI safety frameworks focus on model alignment, not operational trust. TrustBot treats agent trust like financial creditworthiness - earned, tracked, transparent.

**Validation:** Track correlation between trust scores and actual agent reliability.

#### 2. Fading HITL Model

**The Innovation:** Human oversight that decreases with proven trust, but never fully disappears.

| Trust Level | HITL Involvement |
|-------------|------------------|
| New (0-200) | Approval required |
| Learning (200-400) | Notified, can rollback |
| Trusted (400-600) | Notified async |
| Confident (600-800) | Scheduled reports |
| Sovereign (800-1000) | Shadow monitoring |

**Why It's Novel:** Most systems are binary - either HITL or autonomous. The graduated fade with "shadow monitoring" at the top tier means humans are never completely out of the loop.

**Validation:** Measure HITL workload reduction as fleet trust scores rise.

#### 3. Bot Tribunal (AI Agents Governing AI Agents)

**The Innovation:** High-risk decisions reviewed by a panel of 3 AI agents before execution or human escalation.

- Specialized roles (risk, recommendation, verification)
- Must be unanimous or escalate to humans
- Creates deliberation records for audit
- Can be overridden by HITL

**Why It's Novel:** This is not ensemble decision-making. The tribunal deliberates with reasoning, has specialized roles, and escalates disagreement to humans.

**Validation:** Measure tribunal catch rate (issues caught before human review).

#### 4. Risk ≠ Urgency Framework

**The Innovation:** Decouple "how dangerous" from "how quickly must we decide."

| Scenario | Risk | Urgency | Response |
|----------|------|---------|----------|
| Database cleanup | HIGH | LOW | Morning queue |
| Security breach | HIGH | HIGH | Immediate alert |
| Routine validation | LOW | LOW | Daily digest |

**Why It's Novel:** Every alerting system conflates risk with urgency. TrustBot separates them - high-risk doesn't mean wake them at 3 AM.

**Validation:** Track 3 AM alert reduction and decision quality for queued items.

#### 5. Accountability Chain

**The Innovation:** Immutable, multi-level liability documentation for every AI decision.

- Level 1: Agent - What it decided and why
- Level 2: Tribunal - How peers evaluated it
- Level 3: HITL - Human decision with context
- Level 4: Supervisor - Escalation handling
- Level 5: Organization - Governance response

**Why It's Novel:** Current AI audit trails focus on model inputs/outputs. TrustBot documents WHO is responsible at each level with cryptographic proof.

**Validation:** Test evidence package acceptance by regulators.

#### 6. Agent Taxonomy System (HH-OO-RR-II)

**The Innovation:** A Dewey Decimal-style identification system for AI agents.

- Encodes meaning (hierarchy, role, domain) in the ID
- Enables instant classification from ID alone
- Includes humans in the same system
- Designed for century-scale growth

**Why It's Novel:** Agent IDs are typically arbitrary strings. The taxonomy makes IDs meaningful and memorable.

**Validation:** Test operator recall of agent types from IDs.

### Market Context & Competitive Landscape

| Category | Examples | TrustBot Differentiation |
|----------|----------|-------------------------|
| **AI Orchestration** | LangChain, AutoGPT | Focus on chaining, not governance |
| **MLOps Platforms** | MLflow, Weights & Biases | Model lifecycle, not agent autonomy |
| **AI Safety Tools** | Constitutional AI | Training-time, not runtime governance |
| **Enterprise AI** | Azure AI, AWS Bedrock | Infrastructure, not operational trust |
| **RPA Governance** | UIPath, Automation Anywhere | Bot automation, not AI intelligence |

**TrustBot's Unique Position:** First platform focused on **operational governance of autonomous AI agents** with quantified trust, graduated oversight, and regulatory-ready audit trails.

### Validation Approach Summary

| Innovation | Key Metric | Success Indicator |
|------------|------------|-------------------|
| Trust Scoring | Reliability correlation | Score predicts outcomes |
| Fading HITL | HITL workload reduction | 50%+ reduction at scale |
| Bot Tribunal | Catch rate | >80% issues caught before HITL |
| Risk ≠ Urgency | 3 AM alert reduction | 90%+ reduction |
| Accountability Chain | Audit response time | <1 hour for evidence package |
| Agent Taxonomy | Operator recall | >90% correct classification |

### Risk Mitigation

| Innovation | Risk | Mitigation |
|------------|------|------------|
| Trust Scoring | Score gaming | Multi-factor scoring, anomaly detection |
| Fading HITL | Over-trust | Shadow monitoring never stops |
| Bot Tribunal | Tribunal collusion | Rotating tribunal membership |
| Risk ≠ Urgency | Missed urgent issue | Conservative defaults, org-configurable |
| Accountability | Chain tampering | Cryptographic hash verification |
| Taxonomy | Namespace exhaustion | 10,000+ role combinations, extensible |

## SaaS B2B Specific Requirements

### Project-Type Overview

TrustBot is an enterprise SaaS B2B platform with:
- **Architecture:** Multi-part (Hono API + React SPA)
- **Deployment:** Fly.io (API) + Vercel (Web)
- **Database:** Supabase/PostgreSQL
- **Real-time:** Supabase Channels

### Multi-Tenancy Model

| Aspect | Approach |
|--------|----------|
| **Isolation** | Data isolation by `org_id` foreign key |
| **Schema** | Shared schema, row-level security |
| **Hierarchy** | Flat orgs (parent/child deferred to Growth) |
| **Onboarding** | Self-service signup with org creation |

### Permission Model (RBAC)

| Code | Role | Permissions |
|------|------|-------------|
| 90 | Operator | Own queue, approve/deny, investigate |
| 91 | Supervisor | Team view, expand scope, rollback |
| 92-93 | Manager/Director | Fleet KPIs, approve rules |
| 94-96 | VP/C-Suite/CEO | Full org access, governance |
| 90-03 | Compliance | Audit access, evidence packages |

### Integration Capabilities

| Feature | MVP | Growth |
|---------|-----|--------|
| REST API | ✅ 70+ endpoints | Enhanced |
| API Keys | ✅ Per-org keys | Per-user keys |
| Rate Limiting | ✅ Default limits | Configurable |
| Webhooks | - | ✅ Event notifications |
| Custom Integrations | - | ✅ Marketplace |

**Real-Time Channels:**
- `org:{orgId}` - Agent events, trust changes
- `user:{userId}` - Personal notifications
- `alerts:{orgId}` - Urgent escalations

### Enterprise Features

| Feature | MVP | Growth | Enterprise |
|---------|-----|--------|------------|
| **Authentication** | Email/Password | OAuth (Google) | SSO/SAML |
| **Audit Logs** | ✅ Full | ✅ Full | ✅ + Export |
| **Data Residency** | US (default) | - | Region selection |
| **SLA** | 99.5% | 99.9% | 99.99% |
| **Support** | Community | Email | Dedicated CSM |

### Scalability Targets

| Metric | MVP | Growth | Enterprise |
|--------|-----|--------|------------|
| Agents per org | 50 | 500 | 5,000+ |
| Concurrent users | 10 | 100 | 1,000+ |
| Actions per day | 10K | 100K | 1M+ |
| Audit retention | 90 days | 1 year | 7 years |
| Real-time latency | <2s | <500ms | <200ms |

### Technical Architecture

**API Design:**
- RESTful with versioned endpoints (`/api/v1/...`)
- JSON response format with pagination
- JWT tokens with refresh rotation
- Rate limiting per org and endpoint

**Security:**
- HTTPS everywhere
- API key authentication for integrations
- Input validation and sanitization
- Row-level security at database

**Infrastructure:**
- Connection pooling for database
- CDN for static assets
- Structured logging and error tracking
- Health check endpoints

### Implementation Phasing

**MVP Focus:**
1. Core Mission Control modules
2. Basic RBAC (Operator, Supervisor, Director)
3. Self-service org creation
4. Email authentication
5. Supabase real-time

**Growth Additions:**
1. Webhooks for external integrations
2. OAuth providers
3. Advanced analytics module
4. API key management UI
5. Export functionality

**Enterprise Additions:**
1. SSO/SAML integration
2. Data residency options
3. White-labeling
4. Dedicated support
5. Custom SLAs

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Platform MVP - Build the governance foundation that enables future expansion

**Rationale:**
- Core infrastructure (trust engine, audit, tribunal) is the differentiator
- Governance model enables all future features
- Early adopters need a solid foundation to build upon
- Education-first approach proves value before adding complexity

**Resource Requirements:**
- Small team (2-4 developers)
- Leverage existing 70+ API endpoints
- Brownfield enhancement of Console.tsx

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

| Journey | MVP Support | Notes |
|---------|-------------|-------|
| Operator Onboarding | ✅ Full | Education is priority #1 |
| Morning Queue Review | ✅ Full | Urgency framework essential |
| Supervisor Escalation | ✅ Full | Pattern detection core value |
| Executive Weekly Review | ⏳ Basic | KPIs only, not full analytics |
| Compliance Deep Dive | ⏳ Basic | Audit trail, not full packages |

**Must-Have Modules:**

| Module | MVP Scope |
|--------|-----------|
| Agent Overview | Real-time status, trust scores, clickable profiles, AgentLink everywhere |
| Task Pipeline | Pending/executing/completed, morning queue, urgency indicators |
| Record Review | Audit trail with hash verification badges |
| User Controls | Existing aggressiveness slider, HITL toggle |
| Onboarding | Tooltip tour (<2 min), contextual learning popups |

**Must-Have Governance:**

| Feature | MVP Scope |
|---------|-----------|
| Accountability Chain | 5-level documentation for every decision |
| HITL Quality Metrics | Review time, detail views, basic tracking |
| Urgency Framework | Risk ≠ Urgency, morning queue, 24/7 for critical |
| Bot Tribunal | 3-agent voting, escalation on disagreement |
| Fading HITL | Trust-based oversight levels |

**Must-Have SaaS:**

| Feature | MVP Scope |
|---------|-----------|
| Multi-tenancy | Org isolation by org_id |
| RBAC | Operator, Supervisor, Director, Compliance |
| Authentication | Email/password |
| Real-time | Supabase channels |
| API | Existing 70+ endpoints |

### Post-MVP Features (Phase 2: Growth)

**Enhanced Journeys:**
- Full Executive Dashboard with analytics
- Complete Compliance Evidence Packages
- Mobile alerts for urgent items

**Additional Modules:**
- Analytics Module (trends, graphs, time-series)
- Agenda/Calendar Module (scheduled tasks)
- Advanced Filtering (agent, capability, time, tier)
- Export Reports (PDF/CSV)

**Enhanced Governance:**
- Explainability Reports (one-click regulatory packages)
- Trust Score Auditing (full breakdown, challenge option)
- Automation Bias Alerts (flag rubber-stamping)
- Rule Suggestion Engine

**Enhanced SaaS:**
- Webhooks for external integrations
- OAuth providers (Google)
- API key management UI
- Data export functionality
- Configurable rate limits

### Future Features (Phase 3: Enterprise)

**Advanced Capabilities:**
- Data Lineage (full GDPR/privacy compliance)
- Predictive Insights ("Agent X trending toward trust drop")
- Comparative Analytics (fleet-wide benchmarks)
- Multi-Org Dashboard (enterprise view)

**Enterprise SaaS:**
- SSO/SAML integration
- Data residency options
- White-labeling
- Dedicated CSM support
- Custom SLAs (99.99%)
- Org hierarchies (parent/child)

**Platform Features:**
- Integration marketplace
- Custom agent templates
- Webhook event expansion
- Bulk operations API

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Real-time at scale | Medium | High | Supabase proven, upgrade path clear |
| Hash chain performance | Low | Medium | Async verification, batch on read |
| Browser performance | Medium | Medium | Virtual scrolling, lazy loading |

**Market Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| "Do we need governance?" | Medium | High | Education-first onboarding proves value |
| Enterprise sales cycle | High | Medium | Start SMB, land-and-expand |
| Regulatory uncertainty | Low | Medium | Built for EU AI Act, adaptable |

**Resource Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Small team capacity | Medium | Medium | Clear MVP/Growth boundaries |
| Scope creep | High | High | Phase gates, user acceptance before next |
| Technical debt | Medium | Medium | Refactor window between phases |

### MVP Success Criteria

**Launch Readiness Checklist:**

- [ ] Operator can complete onboarding in <2 minutes
- [ ] Morning queue displays overnight decisions with urgency
- [ ] Audit trail shows hash verification for all entries
- [ ] Supervisor can see team-wide patterns
- [ ] Basic KPIs visible for executives
- [ ] All 4 RBAC roles functional
- [ ] Real-time updates within 2 seconds

**Validation Metrics (First 90 Days):**

| Metric | Target |
|--------|--------|
| Onboarding completion | >80% |
| Daily active users | 3+ logins/week |
| HITL decision time | Tracked baseline |
| Overnight confidence | Survey >50% |

## Functional Requirements

### Agent Visibility & Management

- **FR1:** Operators can view all agents in their organization with real-time status
- **FR2:** Users can click any agent reference to navigate to its detailed profile
- **FR3:** Users can see agent trust scores displayed numerically with visual tier badges
- **FR4:** Users can identify agent hierarchy level and role from the Agent ID (HH-OO-RR-II format)
- **FR5:** Users can see agent status indicators (active, pending, idle, error)
- **FR6:** Users can view agent trust score history and trend direction

### Task & Queue Management

- **FR7:** Operators can view pending action requests requiring their approval
- **FR8:** Operators can view currently executing tasks with progress indicators
- **FR9:** Operators can view completed task history
- **FR10:** Operators can view a morning queue of overnight decisions awaiting review
- **FR11:** Operators can see urgency indicators (immediate vs queued) for pending decisions
- **FR12:** Operators can see time-in-queue duration for pending decisions
- **FR13:** Operators can see explanations for why a decision was queued vs immediate

### Decision & Governance Actions

- **FR14:** Operators can approve pending agent actions
- **FR15:** Operators can deny pending agent actions
- **FR16:** Operators can deny and initiate investigation on agent actions
- **FR17:** Users can view trust impact preview before approving/denying
- **FR18:** Users can view sample data affected by pending actions
- **FR19:** Users can view Bot Tribunal voting records for high-risk decisions
- **FR20:** Users can see Trust Gate decisions explaining why actions required approval
- **FR21:** HITLs can override Bot Tribunal decisions with documented rationale
- **FR22:** Directors can approve proposed governance rule changes with impact analysis

### Audit & Compliance

- **FR23:** Users can view chronological audit trail of all agent actions
- **FR24:** Users can verify hash chain integrity with visual verification badges
- **FR25:** Users can view the 5-level accountability chain for any decision
- **FR26:** Compliance analysts can search data trails by customer ID and date range
- **FR27:** Compliance analysts can generate evidence packages with executive summary
- **FR28:** Users can view HITL quality metrics (review time, detail views, context depth)
- **FR29:** Supervisors can receive automation bias alerts for potential rubber-stamping
- **FR30:** System displays tamper-proof indicators on all audit entries

### Investigation & Escalation

- **FR31:** Operators can initiate investigations on suspicious agent behavior
- **FR32:** Supervisors can expand investigation scope to include related agents
- **FR33:** Supervisors can link related events across operators into single investigation
- **FR34:** Supervisors can initiate rollback reviews for potentially incorrect actions
- **FR35:** System can flag pattern anomalies for supervisor review

### Team Oversight

- **FR36:** Supervisors can view all operators under their responsibility
- **FR37:** Supervisors can view cross-operator activity patterns
- **FR38:** Supervisors can view team-wide decision metrics (approvals, denials, investigations)
- **FR39:** Directors can view operator performance indicators (top performers, coaching signals)
- **FR40:** Directors can view supervisor team health metrics

### Executive Reporting

- **FR41:** Executives can view fleet health KPIs (total agents, trust score trends)
- **FR42:** Executives can view HITL load metrics (total decisions, reduction trends)
- **FR43:** Executives can view autonomous rate metrics with trend direction
- **FR44:** Executives can view active incident summaries with business impact
- **FR45:** Executives can view cost avoided estimates from prevented issues

### User Onboarding & Education

- **FR46:** New users receive guided tooltip tour on first login
- **FR47:** Users see contextual learning popup on first trust denial encountered
- **FR48:** Users see contextual learning popup on first approval request
- **FR49:** Users see contextual learning popup on first tier change observed
- **FR50:** Users can access trust system explanations on-demand from any context

### User & Org Management

- **FR51:** Users can authenticate with email and password
- **FR52:** Organizations can assign users to roles (Operator, Supervisor, Director, Compliance)
- **FR53:** Users see only data belonging to their organization
- **FR54:** Organizations can configure urgency rules for their context
- **FR55:** Users receive real-time updates when agent status changes

## Non-Functional Requirements

### Performance

| Metric | MVP | Growth | Enterprise |
|--------|-----|--------|------------|
| **Dashboard initial load** | < 2 seconds | < 1 second | < 500ms |
| **Real-time event delivery** | < 2 seconds | < 500ms | < 200ms |
| **API response time (p95)** | < 500ms | < 200ms | < 100ms |
| **Hash verification** | Async, non-blocking | Async | Async with caching |

**Critical Performance Rules:**
- NFR-P1: Real-time agent status updates must be visible within 2 seconds of occurrence
- NFR-P2: Hash chain verification must not block UI rendering
- NFR-P3: Morning queue must load with all overnight decisions within 3 seconds
- NFR-P4: Audit trail pagination must load incrementally without blocking initial view

### Security

**Data Protection:**
- NFR-S1: All data encrypted in transit using TLS 1.3
- NFR-S2: All sensitive data encrypted at rest
- NFR-S3: Audit log entries are immutable with cryptographic hash chain
- NFR-S4: Hash chain integrity verification must pass 100% of the time

**Access Control:**
- NFR-S5: Row-level security enforces org isolation at database layer
- NFR-S6: RBAC restricts functionality by role (Operator, Supervisor, Director, Compliance)
- NFR-S7: JWT tokens expire after 1 hour with refresh rotation
- NFR-S8: API keys scoped per organization with revocation capability

**Input Security:**
- NFR-S9: All user inputs validated and sanitized before processing
- NFR-S10: SQL injection prevention via parameterized queries
- NFR-S11: XSS prevention via output encoding

### Reliability

| Metric | MVP | Growth | Enterprise |
|--------|-----|--------|------------|
| **System availability (SLA)** | 99.5% | 99.9% | 99.99% |
| **Event delivery reliability** | 99.9% | 99.95% | 99.99% |
| **Audit log integrity** | 100% | 100% | 100% |

**Critical Reliability Rules:**
- NFR-R1: Audit log hash chain must NEVER have gaps or inconsistencies
- NFR-R2: Connection drops must show "Last sync: X seconds ago" indicator
- NFR-R3: Failed real-time connections must auto-reconnect within 5 seconds
- NFR-R4: Tribunal decisions must persist even if network fails mid-vote

### Scalability

| Metric | MVP | Growth | Enterprise |
|--------|-----|--------|------------|
| **Agents per organization** | 50 | 500 | 5,000+ |
| **Concurrent users** | 10 | 100 | 1,000+ |
| **Actions per day** | 10,000 | 100,000 | 1,000,000+ |
| **Audit log retention** | 90 days | 1 year | 7 years |

**Scalability Rules:**
- NFR-SC1: System handles 10x user growth with < 10% performance degradation
- NFR-SC2: Database connection pooling prevents connection exhaustion
- NFR-SC3: CDN serves static assets to reduce server load
- NFR-SC4: Audit logs archive to cold storage after retention period

### Integration

**API Design:**
- NFR-I1: REST API with versioned endpoints (/api/v1/...)
- NFR-I2: JSON response format with consistent pagination
- NFR-I3: Rate limiting enforced per org and per endpoint
- NFR-I4: API documentation auto-generated from code

**Real-Time:**
- NFR-I5: Supabase Channels for real-time event delivery
- NFR-I6: Channel namespacing by org_id for isolation
- NFR-I7: Webhooks for external integration (Growth phase)

### Accessibility

**Compliance Target:** WCAG 2.1 Level AA

**Critical Accessibility Rules:**
- NFR-A1: All interactive elements keyboard navigable
- NFR-A2: Color contrast ratio meets AA standards (4.5:1 for normal text)
- NFR-A3: Screen reader compatible with proper ARIA labels
- NFR-A4: Focus indicators visible for all interactive elements
- NFR-A5: Error messages associated with form fields programmatically

### Regulatory Compliance

#### SOC 2 Type II Readiness

**Target:** SOC 2 Type II certification by Growth phase

| Trust Service Criteria | TrustBot Implementation |
|------------------------|------------------------|
| **Security** | Access controls, encryption, audit logging, vulnerability management |
| **Availability** | SLA commitments, monitoring, incident response, disaster recovery |
| **Processing Integrity** | Hash chain verification, tribunal records, decision audit trails |
| **Confidentiality** | Org isolation, encryption at rest, access controls by role |
| **Privacy** | Data lineage tracking, retention policies, deletion capabilities |

**SOC 2 NFRs:**
- NFR-C1: All system access logged with user identity, timestamp, and action
- NFR-C2: Change management documented for all production deployments
- NFR-C3: Incident response procedures documented and tested quarterly
- NFR-C4: Vendor risk assessments for all third-party integrations
- NFR-C5: Annual penetration testing with remediation tracking
- NFR-C6: Employee security training tracked and verified

#### EU AI Act Compliance (2027 Deadline)

**Classification:** TrustBot enables **high-risk AI system governance** (Article 6)

| EU AI Act Requirement | TrustBot Capability |
|-----------------------|---------------------|
| **Human Oversight (Art. 14)** | Fading HITL model with shadow monitoring at all tiers |
| **Transparency (Art. 13)** | Explainability reports, accountability chain, trust score auditing |
| **Record-Keeping (Art. 12)** | Immutable audit logs with cryptographic verification |
| **Accuracy & Robustness (Art. 15)** | Trust scoring validation, tribunal catch rates |
| **Risk Management (Art. 9)** | Risk ≠ Urgency framework, Bot Tribunal review |

**EU AI Act NFRs:**
- NFR-C7: Human oversight quality metrics tracked (review time, context depth, reversal rate)
- NFR-C8: Automation bias detection alerts for potential rubber-stamping
- NFR-C9: One-click explainability reports for any AI decision
- NFR-C10: Audit logs retained minimum 10 years for high-risk decisions
- NFR-C11: Data lineage tracking for all AI-processed personal data
- NFR-C12: Right to explanation available for automated decisions affecting individuals
- NFR-C13: Human can override any AI decision with documented rationale
- NFR-C14: AI system registration documentation exportable for authorities

#### Compliance Phasing

| Requirement | MVP | Growth | Enterprise |
|-------------|-----|--------|------------|
| **Audit logging** | ✅ Full | ✅ Full | ✅ + Export |
| **SOC 2 Type I** | - | ✅ | ✅ |
| **SOC 2 Type II** | - | - | ✅ |
| **EU AI Act basics** | ✅ | ✅ | ✅ |
| **EU AI Act full** | - | ✅ | ✅ |
| **GDPR/CCPA** | ✅ Basics | ✅ Full | ✅ + DPO |

