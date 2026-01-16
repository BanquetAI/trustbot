/**
 * Work Loop API Routes
 *
 * Exposes the AgentWorkLoop functionality via HTTP endpoints.
 * Enables submitting objectives, monitoring execution, and viewing stats.
 */

import { Hono } from 'hono';
import { agentWorkLoop, AgentRole } from '../../core/AgentWorkLoop.js';
import { workLoopPersistence } from '../../core/WorkLoopPersistence.js';

const app = new Hono();

// ============================================================================
// Initialize T5 Agents in Work Loop
// ============================================================================

let initialized = false;

function ensureInitialized() {
    if (initialized) return;

    // Register the T5 executive agents
    const t5Agents: Array<{ id: string; name: string; role: AgentRole; tier: number }> = [
        { id: 'exec-1', name: 'T5-EXECUTOR', role: 'EXECUTOR', tier: 5 },
        { id: 'plan-1', name: 'T5-PLANNER', role: 'PLANNER', tier: 5 },
        { id: 'valid-1', name: 'T5-VALIDATOR', role: 'VALIDATOR', tier: 5 },
        { id: 'evolve-1', name: 'T5-EVOLVER', role: 'EVOLVER', tier: 5 },
        { id: 'spawn-1', name: 'T5-SPAWNER', role: 'SPAWNER', tier: 5 },
    ];

    for (const agent of t5Agents) {
        agentWorkLoop.registerAgent(agent);
    }

    // Start the work loop
    agentWorkLoop.start();

    // Set up event logging
    agentWorkLoop.on('task:claimed', (agent, task) => {
        console.log(`[WorkLoop] ${agent.name} claimed: ${task.title}`);
    });

    agentWorkLoop.on('task:completed', (agent, task, result) => {
        console.log(`[WorkLoop] ${agent.name} completed: ${task.title} (${result.confidence}% confidence)`);
    });

    agentWorkLoop.on('task:failed', (agent, task, error) => {
        console.log(`[WorkLoop] ${agent.name} failed: ${task.title} - ${error}`);
    });

    agentWorkLoop.on('objective:decomposed', (task, subtasks) => {
        console.log(`[WorkLoop] Objective decomposed into ${subtasks.length} subtasks`);
    });

    agentWorkLoop.on('escalation', (agent, task, reason) => {
        console.log(`[WorkLoop] ESCALATION: ${task.title} - ${reason}`);
    });

    // Validation loop events
    agentWorkLoop.on('validation:queued', (originalTask, validationTask) => {
        console.log(`[ValidationLoop] Queued validation for: ${originalTask.title}`);
    });

    agentWorkLoop.on('validation:passed', (originalTask, score) => {
        console.log(`[ValidationLoop] ✓ PASSED: ${originalTask.title} (score: ${score}%)`);
    });

    agentWorkLoop.on('validation:failed', (originalTask, score, feedback) => {
        console.log(`[ValidationLoop] ✗ FAILED: ${originalTask.title} (score: ${score}%) - ${feedback.substring(0, 100)}...`);
    });

    agentWorkLoop.on('validation:requeued', (originalTask, attempt) => {
        console.log(`[ValidationLoop] Re-queued for improvement: ${originalTask.title} (attempt ${attempt})`);
    });

    initialized = true;
    console.log('[WorkLoop] Initialized with 5 T5 agents (Validation Loop enabled)');
}

// ============================================================================
// Routes
// ============================================================================

// GET /work-loop/status - Get work loop status and stats
app.get('/status', (c) => {
    ensureInitialized();
    const stats = agentWorkLoop.getStats();
    const agents = agentWorkLoop.getAllAgents();

    return c.json({
        running: true,
        agents: agents.map(a => ({
            id: a.id,
            name: a.name,
            role: a.role,
            tier: a.tier,
            status: a.status,
            currentTaskId: a.currentTaskId,
            executionCount: a.executionCount,
            successCount: a.successCount,
            successRate: a.executionCount > 0
                ? Math.round((a.successCount / a.executionCount) * 100)
                : 100,
        })),
        stats,
    });
});

// POST /work-loop/objective - Submit a new objective for autonomous execution
app.post('/objective', async (c) => {
    ensureInitialized();

    const body = await c.req.json() as {
        title: string;
        description: string;
        priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };

    if (!body.title || !body.description) {
        return c.json({ error: 'title and description required' }, 400);
    }

    const task = agentWorkLoop.submitObjective(
        body.title,
        body.description,
        body.priority || 'MEDIUM'
    );

    return c.json({
        success: true,
        message: `Objective submitted. T5-PLANNER will decompose it into subtasks.`,
        objective: {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            createdAt: new Date(task.createdAt).toISOString(),
        },
    });
});

// POST /work-loop/task - Submit a direct task (bypasses planning)
app.post('/task', async (c) => {
    ensureInitialized();

    const body = await c.req.json() as {
        title: string;
        description: string;
        type?: 'OBJECTIVE' | 'SUBTASK' | 'VALIDATION' | 'PLANNING';
        priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        requiredTier?: number;
        requiredRole?: AgentRole;
    };

    if (!body.title || !body.description) {
        return c.json({ error: 'title and description required' }, 400);
    }

    const task = agentWorkLoop.submitTask({
        title: body.title,
        description: body.description,
        type: body.type || 'SUBTASK',
        priority: body.priority || 'MEDIUM',
        requiredTier: body.requiredTier || 2,
        requiredRole: body.requiredRole,
        timeoutMs: 30000,
        maxRetries: 3,
    });

    return c.json({
        success: true,
        task: {
            id: task.id,
            title: task.title,
            type: task.type,
            priority: task.priority,
            status: task.status,
            requiredTier: task.requiredTier,
            requiredRole: task.requiredRole,
        },
    });
});

// GET /work-loop/tasks - Get all tasks
app.get('/tasks', (c) => {
    ensureInitialized();

    const queued = agentWorkLoop.getQueuedTasks();
    const active = agentWorkLoop.getActiveTasks();
    const completed = agentWorkLoop.getCompletedTasks();

    return c.json({
        queued: queued.map(t => ({
            id: t.id,
            title: t.title,
            type: t.type,
            priority: t.priority,
            status: t.status,
            requiredRole: t.requiredRole,
            createdAt: new Date(t.createdAt).toISOString(),
        })),
        active: active.map(t => ({
            id: t.id,
            title: t.title,
            type: t.type,
            priority: t.priority,
            status: t.status,
            assignedTo: t.assignedTo,
            startedAt: t.startedAt ? new Date(t.startedAt).toISOString() : null,
        })),
        completed: completed.slice(-20).map(t => ({
            id: t.id,
            title: t.title,
            type: t.type,
            status: t.status,
            result: t.result ? {
                success: t.result.success,
                confidence: t.result.confidence,
                duration: t.result.duration,
                subtaskCount: t.result.subtasks?.length,
            } : null,
            completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
        })),
        summary: {
            queued: queued.length,
            active: active.length,
            completed: completed.length,
        },
    });
});

// GET /work-loop/task/:id - Get specific task details
app.get('/task/:id', (c) => {
    ensureInitialized();

    const taskId = c.req.param('id');
    const task = agentWorkLoop.getTaskById(taskId);

    if (!task) {
        return c.json({ error: 'Task not found' }, 404);
    }

    return c.json({
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: task.status,
        requiredTier: task.requiredTier,
        requiredRole: task.requiredRole,
        parentTaskId: task.parentTaskId,
        dependencies: task.dependencies,
        assignedTo: task.assignedTo,
        retryCount: task.retryCount,
        maxRetries: task.maxRetries,
        result: task.result,
        createdAt: new Date(task.createdAt).toISOString(),
        startedAt: task.startedAt ? new Date(task.startedAt).toISOString() : null,
        completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    });
});

// POST /work-loop/worker - Spawn a new worker agent
app.post('/worker', async (c) => {
    ensureInitialized();

    const body = await c.req.json() as {
        name: string;
        specialization?: string;
    };

    if (!body.name) {
        return c.json({ error: 'name required' }, 400);
    }

    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const worker = agentWorkLoop.registerAgent({
        id: workerId,
        name: body.name,
        role: 'WORKER',
        tier: 2, // Workers start at T2
    });

    return c.json({
        success: true,
        worker: {
            id: worker.id,
            name: worker.name,
            role: worker.role,
            tier: worker.tier,
            status: worker.status,
        },
    });
});

// DELETE /work-loop/agent/:id - Remove an agent from the work loop
app.delete('/agent/:id', (c) => {
    ensureInitialized();

    const agentId = c.req.param('id');
    const agent = agentWorkLoop.getAgent(agentId);

    if (!agent) {
        return c.json({ error: 'Agent not found' }, 404);
    }

    // Don't allow removing T5 agents
    if (agent.tier === 5) {
        return c.json({ error: 'Cannot remove T5 executive agents' }, 400);
    }

    agentWorkLoop.unregisterAgent(agentId);

    return c.json({
        success: true,
        message: `Agent ${agent.name} removed from work loop`,
    });
});

// POST /work-loop/start - Start the work loop (if stopped)
app.post('/start', (c) => {
    ensureInitialized();
    agentWorkLoop.start();
    return c.json({ success: true, message: 'Work loop started' });
});

// POST /work-loop/stop - Stop the work loop
app.post('/stop', (c) => {
    agentWorkLoop.stop();
    return c.json({ success: true, message: 'Work loop stopped' });
});

// ============================================================================
// Persistence Endpoints
// ============================================================================

// GET /work-loop/persistence - Get persistence status
app.get('/persistence', (c) => {
    return c.json({
        enabled: true,
        filepath: workLoopPersistence.getFilepath(),
        hasState: workLoopPersistence.exists(),
    });
});

// POST /work-loop/save - Manually save state
app.post('/save', (c) => {
    ensureInitialized();
    const success = agentWorkLoop.saveState();
    return c.json({
        success,
        message: success ? 'State saved successfully' : 'Failed to save state',
        filepath: workLoopPersistence.getFilepath(),
    });
});

// POST /work-loop/restore - Manually restore state
app.post('/restore', (c) => {
    const success = agentWorkLoop.restoreState();
    return c.json({
        success,
        message: success ? 'State restored successfully' : 'No saved state found',
    });
});

// ============================================================================
// Validation Loop Endpoints
// ============================================================================

// GET /work-loop/validation - Get validation loop config
app.get('/validation', (c) => {
    ensureInitialized();
    return c.json({
        ...agentWorkLoop.getValidationConfig(),
        description: {
            enabled: 'Whether validation loop is active',
            threshold: 'Score below which tasks are re-executed (0-100)',
            maxAttempts: 'Maximum validation attempts before accepting',
            highPriorityOnly: 'Only validate HIGH/CRITICAL priority tasks',
        },
    });
});

// POST /work-loop/validation - Update validation loop config
app.post('/validation', async (c) => {
    ensureInitialized();

    const body = await c.req.json() as {
        enabled?: boolean;
        threshold?: number;
        maxAttempts?: number;
        highPriorityOnly?: boolean;
    };

    agentWorkLoop.setValidationConfig(body);

    return c.json({
        success: true,
        message: 'Validation loop config updated',
        config: agentWorkLoop.getValidationConfig(),
    });
});

export default app;
