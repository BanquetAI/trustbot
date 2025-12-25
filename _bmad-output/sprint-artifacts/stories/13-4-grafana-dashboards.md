# Story 13.4: Grafana Dashboards

## Story Info
- **Epic**: 13 - Observability & Monitoring
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR85 (Pre-built Grafana dashboards for system visualization)

## User Story

As a DevOps engineer,
I want pre-built Grafana dashboards,
So that I can visualize system health.

## Acceptance Criteria

### AC1: API Performance Dashboard
**Given** API metrics are being collected
**When** I view the API Performance dashboard
**Then** I see latency, errors, and throughput metrics

### AC2: Agent Fleet Dashboard
**Given** agent metrics are being collected
**When** I view the Agent Fleet dashboard
**Then** I see connections, status, and trust distribution

### AC3: Decision Pipeline Dashboard
**Given** decision metrics are being collected
**When** I view the Decision Pipeline dashboard
**Then** I see queue depth and processing time

### AC4: Trust System Dashboard
**Given** trust metrics are being collected
**When** I view the Trust System dashboard
**Then** I see score changes and tier movements

## Technical Implementation

### Dashboard Overview

| Dashboard | Purpose | Key Panels |
|-----------|---------|------------|
| API Performance | Monitor API health | Request rate, error rate, latency percentiles |
| Agent Fleet | Monitor agent status | Online/offline counts, trust distribution, WebSocket activity |
| Decision Pipeline | Monitor decisions | Queue depth, processing rate, outcomes |
| Trust System | Monitor trust | Score distribution, tier transitions, events |

### API Performance Dashboard

`infra/grafana/dashboards/api-performance.json`

**Overview Row:**
- Request Rate (req/sec)
- Error Rate (5xx %)
- P95 Latency
- Uptime

**Request Metrics Row:**
- Request Rate by Method (GET, POST, PUT, DELETE)
- Request Rate by Status Code (200, 201, 400, 404, 500)

**Latency Row:**
- Latency Percentiles (p50, p90, p95, p99)
- P95 Latency by Endpoint

**Errors Row:**
- Error Rate by Endpoint (4xx and 5xx)

### Agent Fleet Dashboard

`infra/grafana/dashboards/agent-fleet.json`

**Fleet Overview Row:**
- Online Agents count
- Offline Agents count
- WebSocket Connections count
- P95 Heartbeat Latency

**Trust Distribution Row:**
- Trust Tier Distribution (pie chart: VERIFIED, TRUSTED, STANDARD, PROBATION)
- Trust Score Distribution Over Time (avg, min, max)

**Trust Changes Row:**
- Trust Score Changes (increases vs decreases)
- Trust Tier Transitions

**WebSocket Activity Row:**
- WebSocket Connections Over Time
- WebSocket Message Rate (inbound/outbound)

### Decision Pipeline Dashboard

`infra/grafana/dashboards/decision-pipeline.json`

**Pipeline Overview Row:**
- Queue Depth
- Processing Rate (decisions/min)
- P95 Processing Time
- Approval Rate

**Decision Outcomes Row:**
- Decision Outcomes (pie chart: approved, denied, pending)
- Decision Outcomes Over Time

**Processing Sources Row:**
- Processing Source (pie chart: auto_approval, tribunal, hitl)
- Decisions by Source Over Time

**Queue & Latency Row:**
- Queue Depth by Urgency (immediate, high, normal, low)
- Decision Processing Duration by Source

### Trust System Dashboard

`infra/grafana/dashboards/trust-system.json`

**Trust Overview Row:**
- Average Trust Score
- Trust Increases (1h)
- Trust Decreases (1h)
- Tier Changes (1h)

**Trust Score Distribution Row:**
- Individual Trust Scores (with tier threshold lines)

**Trust Events Row:**
- Trust Events by Type (task_completed, task_failed, etc.)
- Tier Transitions

**Trust by Organization Row:**
- Average Trust Score by Organization
- Trust Changes by Organization (1h)

### Dashboard Variables

All dashboards support:
- `${datasource}` - Prometheus data source selector

### Installation

1. Import dashboards via Grafana UI:
   - Go to Dashboards > Import
   - Upload JSON file or paste content
   - Select Prometheus data source

2. Using Grafana provisioning:
```yaml
# grafana/provisioning/dashboards/trustbot.yml
apiVersion: 1
providers:
  - name: 'TrustBot'
    orgId: 1
    folder: 'TrustBot'
    type: file
    options:
      path: /var/lib/grafana/dashboards/trustbot
```

3. Copy dashboards to provisioning path:
```bash
cp infra/grafana/dashboards/*.json /var/lib/grafana/dashboards/trustbot/
```

### Docker Compose Integration

```yaml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - ./infra/grafana/dashboards:/var/lib/grafana/dashboards
      - ./infra/grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Prometheus Queries Used

| Metric | Query |
|--------|-------|
| Request Rate | `sum(rate(trustbot_http_requests_total[5m]))` |
| Error Rate | `sum(rate(trustbot_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(trustbot_http_requests_total[5m]))` |
| P95 Latency | `histogram_quantile(0.95, sum(rate(trustbot_http_request_duration_seconds_bucket[5m])) by (le))` |
| Queue Depth | `sum(trustbot_decision_queue_depth)` |
| Approval Rate | `sum(rate(trustbot_decisions_processed_total{outcome="approved"}[1h])) / sum(rate(trustbot_decisions_processed_total[1h]))` |
| Avg Trust Score | `avg(trustbot_trust_score_current)` |

### Files Created

| File | Purpose |
|------|---------|
| `infra/grafana/dashboards/api-performance.json` | API Performance dashboard |
| `infra/grafana/dashboards/agent-fleet.json` | Agent Fleet dashboard |
| `infra/grafana/dashboards/decision-pipeline.json` | Decision Pipeline dashboard |
| `infra/grafana/dashboards/trust-system.json` | Trust System dashboard |

### Dashboard Panel Counts

| Dashboard | Panels |
|-----------|--------|
| API Performance | 13 |
| Agent Fleet | 14 |
| Decision Pipeline | 14 |
| Trust System | 13 |
| **Total** | **54** |

## Definition of Done
- [x] API Performance dashboard created
- [x] Agent Fleet dashboard created
- [x] Decision Pipeline dashboard created
- [x] Trust System dashboard created
- [x] All dashboards use Prometheus data source
- [x] Variable support for data source selection
- [x] Overview stats panels
- [x] Time series visualizations
- [x] Pie charts for distributions
- [x] Threshold coloring for alerts
- [x] Dashboard documentation
- [x] 54 total panels across 4 dashboards
