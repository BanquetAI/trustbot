# Story 2.7: Task Execution Progress View

## Story Info
- **Epic**: 2 - Decision Queue & Morning Review
- **Status**: done
- **Started**: 2025-12-23
- **Completed**: 2025-12-23
- **FRs Covered**: FR8, FR9

## User Story

As an operator,
I want to see the execution progress of approved tasks,
So that I can monitor agent activity and identify any issues.

## Acceptance Criteria

### AC1: Executing Tasks Display
**Given** tasks have been approved
**When** viewing the Task Progress section
**Then** I see a list of currently executing tasks
**And** each task shows progress percentage and status

### AC2: Progress Updates
**Given** a task is executing
**When** its progress changes
**Then** the UI updates to show the new progress
**And** estimated completion time is displayed

### AC3: Completed Tasks View
**Given** tasks have completed execution
**When** viewing recent completions
**Then** I see completed tasks with execution duration
**And** success/failure status is clearly indicated

### AC4: Task Filtering
**Given** multiple tasks in various states
**When** using the filter controls
**Then** I can filter by: executing, completed, failed
**And** counts for each state are shown

## Technical Implementation

### API Specification

#### GET /api/v1/mission-control/tasks/executing
Returns currently executing tasks.

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-001",
      "decisionId": "ar-001",
      "agentId": "worker-1",
      "agentName": "DataProcessor-Alpha",
      "actionType": "data_export",
      "status": "executing",
      "progress": 65,
      "startedAt": "2025-12-23T10:00:00Z",
      "estimatedCompletion": "2025-12-23T10:15:00Z",
      "currentStep": "Processing records 6500 of 10000"
    }
  ],
  "counts": {
    "executing": 2,
    "completed": 15,
    "failed": 1
  }
}
```

#### GET /api/v1/mission-control/tasks/completed
Returns recently completed tasks.

**Query Parameters:**
- `limit` (optional): Max items (default: 20, max: 50)
- `status` (optional): Filter by "success" or "failed"

### Files to Create
- `web/src/components/mission-control/modules/TaskProgressModule.tsx`
- `web/src/components/mission-control/modules/TaskProgressModule.test.tsx`
- `web/src/components/mission-control/shared/ProgressBar.tsx`

### Files to Modify
- `src/api/routes/mission-control/index.ts` - Add task execution endpoints
- `web/src/types.ts` - Add ExecutingTask type

### Dependencies
- Story 2.3 (Approve endpoint creates executing tasks)

## Definition of Done
- [x] GET /api/v1/mission-control/tasks/executing endpoint working
- [x] GET /api/v1/mission-control/tasks/completed endpoint working
- [x] GET /api/v1/mission-control/tasks/:id endpoint working
- [x] TaskProgressModule component created (compound component pattern)
- [x] ProgressBar component created with animated stripes
- [x] Filter by executing/completed/failed
- [x] Progress percentage and estimated time shown
- [x] Unit tests for components (38 tests TaskProgressModule, 33 tests ProgressBar)
- [x] Types added to web/src/types.ts (ExecutingTask, ExecutingTaskCounts)
