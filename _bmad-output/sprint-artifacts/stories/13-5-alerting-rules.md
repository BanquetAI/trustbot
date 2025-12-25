# Story 13.5: Alerting Rules

## Story Info
- **Epic**: 13 - Observability & Monitoring
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR86 (Alerting rules for proactive issue notification)

## User Story

As a DevOps engineer,
I want alerting rules,
So that I'm notified of issues before users are impacted.

## Acceptance Criteria

### AC1: High Error Rate Alert
**Given** API errors are occurring
**When** 5xx error rate exceeds 5% for 5 minutes
**Then** a critical alert is triggered

### AC2: Slow API Alert
**Given** API latency is degraded
**When** P99 latency exceeds 2s for 5 minutes
**Then** a warning alert is triggered

### AC3: Queue Backup Alert
**Given** decisions are backing up
**When** queue depth exceeds 100 for 30 minutes
**Then** a warning alert is triggered

### AC4: Agent Disconnections Alert
**Given** agents are disconnecting
**When** more than 10% of fleet is offline
**Then** a critical alert is triggered

## Technical Implementation

### Alert Rules Overview

| Alert | Condition | Severity | Duration |
|-------|-----------|----------|----------|
| HighErrorRate | >5% 5xx | Critical | 5 min |
| SlowAPIResponse | p99 > 2s | Warning | 5 min |
| CriticalAPILatency | p95 > 5s | Critical | 5 min |
| APIDown | target down | Critical | 1 min |
| UnusuallyHighRequestRate | >10k req/s | Warning | 5 min |
| DecisionQueueBackup | >100 pending | Warning | 30 min |
| CriticalDecisionQueueBackup | >500 pending | Critical | 15 min |
| HighUrgentDecisionQueue | >10 immediate | Warning | 5 min |
| SlowDecisionProcessing | p95 > 5m | Warning | 10 min |
| HighDecisionDenialRate | >30% denied | Warning | 1 hr |
| MassAgentDisconnections | >10% offline | Critical | 5 min |
| AllAgentsOffline | 0 online | Critical | 2 min |
| HighAgentHeartbeatLatency | p95 > 1s | Warning | 5 min |
| WebSocketConnectionDrop | >20% drop | Warning | 2 min |
| MassTrustScoreDrops | >100/hr | Warning | 15 min |
| MultipleTierDemotions | >5/hr to PROBATION | Warning | 15 min |
| LowAverageTrustScore | avg < 500 | Warning | 1 hr |
| HighMemoryUsage | >2GB | Warning | 10 min |
| HighCPUUsage | >80% | Warning | 10 min |
| NodeJSEventLoopLag | >100ms | Warning | 5 min |
| ProcessRestarted | uptime < 5m | Info | 0 min |

### Alert Categories

#### API Health Alerts
```yaml
- alert: HighErrorRate
  expr: |
    (sum(rate(trustbot_http_requests_total{status_code=~"5.."}[5m]))
    / sum(rate(trustbot_http_requests_total[5m]))) > 0.05
  for: 5m
  labels:
    severity: critical
    team: platform
```

#### Decision Pipeline Alerts
```yaml
- alert: DecisionQueueBackup
  expr: sum(trustbot_decision_queue_depth) > 100
  for: 30m
  labels:
    severity: warning
    team: platform
```

#### Agent Fleet Alerts
```yaml
- alert: MassAgentDisconnections
  expr: |
    (sum(trustbot_agents_connected{status="offline"})
    / (sum(trustbot_agents_connected{status="online"}) + sum(trustbot_agents_connected{status="offline"}))) > 0.1
  for: 5m
  labels:
    severity: critical
    team: platform
```

#### Trust System Alerts
```yaml
- alert: MassTrustScoreDrops
  expr: sum(increase(trustbot_trust_score_changes_total{direction="decrease"}[1h])) > 100
  for: 15m
  labels:
    severity: warning
    team: operations
```

### Alertmanager Configuration

Alerts are routed based on severity and team:

| Severity | Routing |
|----------|---------|
| Critical | PagerDuty + Slack #trustbot-critical |
| Warning | Slack #trustbot-alerts |
| Info | Slack #trustbot-alerts (1h group interval) |

Team-specific routing:
- `team: security` -> #security-alerts
- `team: operations` -> #ops-alerts

### Inhibition Rules

1. Warning alerts are inhibited when critical alert is firing
2. All alerts inhibited when APIDown is firing

### Integration Setup

#### Slack Integration

1. Create Slack App with webhook
2. Set environment variable:
   ```bash
   export SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...'
   ```

3. Configure channels:
   - `#trustbot-alerts` - Warning and info alerts
   - `#trustbot-critical` - Critical alerts
   - `#security-alerts` - Security team alerts
   - `#ops-alerts` - Operations team alerts

#### PagerDuty Integration

1. Create PagerDuty service
2. Get routing key
3. Set environment variable:
   ```bash
   export PAGERDUTY_ROUTING_KEY='...'
   ```

4. Configure service integrations in PagerDuty

### Recording Rules

Pre-computed aggregations for performance:

```yaml
- record: trustbot:http_requests:rate5m
  expr: sum(rate(trustbot_http_requests_total[5m])) by (method, path, status_code)

- record: trustbot:http_latency:p95
  expr: histogram_quantile(0.95, sum(rate(trustbot_http_request_duration_seconds_bucket[5m])) by (le))

- record: trustbot:decisions:rate5m
  expr: sum(rate(trustbot_decisions_processed_total[5m])) by (outcome, source)

- record: trustbot:agents:total
  expr: sum(trustbot_agents_connected) by (status)

- record: trustbot:trust:average
  expr: avg(trustbot_trust_score_current)
```

### Docker Compose Integration

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./infra/prometheus:/etc/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--web.enable-lifecycle'

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./infra/prometheus/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    environment:
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
      - PAGERDUTY_ROUTING_KEY=${PAGERDUTY_ROUTING_KEY}
```

### Files Created

| File | Purpose |
|------|---------|
| `infra/prometheus/alerts.yml` | Prometheus alerting rules |
| `infra/prometheus/alertmanager.yml` | Alertmanager configuration |
| `infra/prometheus/prometheus.yml` | Prometheus configuration |

### Alert Count by Category

| Category | Alert Count |
|----------|-------------|
| API Health | 5 |
| Decision Pipeline | 5 |
| Agent Fleet | 4 |
| Trust System | 3 |
| Infrastructure | 4 |
| **Total** | **21** |

## Definition of Done
- [x] Prometheus alerting rules created
- [x] API health alerts (error rate, latency, down)
- [x] Decision pipeline alerts (queue backup, slow processing)
- [x] Agent fleet alerts (disconnections, heartbeat)
- [x] Trust system alerts (score drops, tier demotions)
- [x] Infrastructure alerts (memory, CPU, event loop)
- [x] Alertmanager configuration
- [x] Slack integration configuration
- [x] PagerDuty integration configuration
- [x] Severity-based routing
- [x] Team-based routing
- [x] Inhibition rules
- [x] Recording rules for performance
- [x] 21 total alerting rules
