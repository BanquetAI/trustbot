/**
 * Unified Workflow API
 *
 * Single source of truth for all workflows - from task creation through
 * agent execution. Implements the "Completed Today" dashboard and
 * "Aggressiveness Slider" for human-controlled autonomy levels.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'eventemitter3';

import { TrustEngine } from '../core/TrustEngine.js';
import { Blackboard } from '../core/Blackboard.js';
import { SecurityLayer, type AuthToken, type AuditAction, type AuditEntry, type Permission } from '../core/SecurityLayer.js';
// Security middleware imports
import {
    corsMiddleware,
    rateLimitMiddleware,
    securityHeadersMiddleware,
    requestIdMiddleware,
    type CORSConfig,
    type RateLimitConfig,
} from './middleware/security.js';
import {
    validate,
    validateCreateTask,
    validateSpawnAgent,
    validateDelegationRequest,
    validateVote,
    validateAuth,
    validateAggressiveness,
} from './middleware/validation.js';
import { PersistenceLayer, type PersistedState } from '../core/PersistenceLayer.js';
import { SupabasePersistence, hasSupabaseConfig, getSupabasePersistence, type Agent as SupabaseAgent } from '../core/SupabasePersistence.js';
// Epic 5: Import new core services
import { CryptographicAuditLogger } from '../core/CryptographicAuditLogger.js';
import { CouncilService } from '../core/council/CouncilService.js';
import { CouncilMemberRegistry } from '../core/council/CouncilMemberRegistry.js';
import { DelegationManager } from '../core/delegation/DelegationManager.js';
import { AutonomyBudgetService } from '../core/autonomy/AutonomyBudget.js';
import type { AgentId, AgentTier } from '../types.js';
import type { CryptographicAuditEntry } from '../core/types/audit.js';

// ============================================================================
// Types
// ============================================================================

// Advisor configuration - maps custom names to providers
export interface AdvisorConfig {
    name: string;                        // Display name (e.g., "Jarvis")
    provider: 'claude' | 'grok' | 'openai' | 'gemini';
    aliases: string[];                   // Alternative names (e.g., ["j", "jarv"])
    personality?: string;                // Custom system prompt/personality
    icon?: string;                       // Custom emoji icon
    enabled: boolean;                    // Is this advisor available?
}

export interface AriaSettings {
    enabled: boolean;                    // Is Aria AI enabled?
    mode: 'single' | 'all' | 'select';   // Use single provider, all, or selected ones
    defaultProvider?: 'claude' | 'grok' | 'openai' | 'gemini';
    enabledProviders: Array<'claude' | 'grok' | 'openai' | 'gemini'>;
    synthesize: boolean;                 // Auto-synthesize multi-provider responses
    maxTokensPerQuery: number;           // Token limit per query
    dailyQueryLimit: number;             // Max queries per day (0 = unlimited)
    queriesUsedToday: number;            // Counter for daily queries
    // Configurable advisors
    advisors: AdvisorConfig[];           // Custom advisor configurations
    councilName: string;                 // Name for the group (default: "council")
    councilAliases: string[];            // Aliases for the group (e.g., ["advisors", "team"])
}

// Default advisor configurations
const defaultAdvisors: AdvisorConfig[] = [
    {
        name: 'Claude',
        provider: 'claude',
        aliases: ['anthropic', 'sonnet', 'opus'],
        personality: 'You are Claude, a thoughtful and analytical AI assistant. You excel at nuanced reasoning and careful consideration of complex topics.',
        icon: '🧠',
        enabled: true,
    },
    {
        name: 'Grok',
        provider: 'grok',
        aliases: ['x', 'xai', 'elon'],
        personality: 'You are Grok, a witty and irreverent AI with a sense of humor. You provide insightful answers with occasional dry wit.',
        icon: '⚡',
        enabled: true,
    },
    {
        name: 'GPT',
        provider: 'openai',
        aliases: ['openai', 'chatgpt', 'o1'],
        personality: 'You are GPT, a helpful and versatile AI assistant. You aim to be clear, accurate, and comprehensive.',
        icon: '🤖',
        enabled: true,
    },
    {
        name: 'Gemini',
        provider: 'gemini',
        aliases: ['google', 'bard', 'deepmind'],
        personality: 'You are Gemini, a knowledgeable AI with access to broad information. You excel at research and comprehensive answers.',
        icon: '💎',
        enabled: true,
    },
];

// Default Aria settings
const defaultAriaSettings: AriaSettings = {
    enabled: true,
    mode: 'single',
    defaultProvider: 'claude',
    enabledProviders: ['claude', 'grok', 'openai', 'gemini'],
    synthesize: true,
    maxTokensPerQuery: 2000,
    dailyQueryLimit: 0,  // unlimited
    queriesUsedToday: 0,
    advisors: defaultAdvisors,
    councilName: 'council',
    councilAliases: ['advisors', 'team', 'minds', 'ais', 'everyone', 'all'],
};

// In-memory settings (would be persisted in real implementation)
let ariaSettings: AriaSettings = { ...defaultAriaSettings };

export interface WorkflowTask {
    id: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'QUEUED' | 'PENDING_APPROVAL' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    assignedTo?: string;
    delegationCount: number;
    requiredTier: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: unknown;
    approvalRequired: boolean;
    approvedBy?: string;
}

export interface CompletedTodaySummary {
    date: string;
    totalCompleted: number;
    totalFailed: number;
    totalPending: number;
    byAgent: Record<string, number>;
    byPriority: Record<string, number>;
    avgCompletionTimeMs: number;
    trustChanges: {
        rewards: number;
        penalties: number;
        netChange: number;
    };
    autonomyMetrics: {
        autoApproved: number;
        humanApproved: number;
        humanRejected: number;
    };
}

export interface AggressivenessConfig {
    level: number;              // 0-100 (maps to inverse of HITL level)
    autoApproveUpToTier: number;  // Auto-approve tasks below this tier
    maxDelegationDepth: number;   // Max delegation chain length
    trustRewardMultiplier: number;  // Higher = faster trust building
    trustPenaltyMultiplier: number; // Higher = stricter penalties
}

// ============================================================================
// Events
// ============================================================================

interface WorkflowEvents {
    'task:created': (task: WorkflowTask) => void;
    'task:assigned': (task: WorkflowTask, agentId: string) => void;
    'task:completed': (task: WorkflowTask) => void;
    'task:failed': (task: WorkflowTask, reason: string) => void;
    'aggressiveness:changed': (oldLevel: number, newLevel: number) => void;
    'approval:required': (task: WorkflowTask) => void;
    'approval:granted': (taskId: string, approver: string) => void;
}

// ============================================================================
// Unified Workflow Engine
// ============================================================================

export class UnifiedWorkflowEngine extends EventEmitter<WorkflowEvents> {
    private tasks: Map<string, WorkflowTask> = new Map();
    private completedToday: WorkflowTask[] = [];
    private aggressiveness: AggressivenessConfig;
    private trustEngine: TrustEngine;
    private blackboard: Blackboard;
    private security: SecurityLayer;
    private persistence: PersistenceLayer | null;
    private lastDayReset: Date;

    constructor(
        trustEngine?: TrustEngine,
        blackboard?: Blackboard,
        security?: SecurityLayer,
        persistence?: PersistenceLayer
    ) {
        super();
        this.trustEngine = trustEngine ?? new TrustEngine();
        this.blackboard = blackboard ?? new Blackboard();
        this.security = security ?? new SecurityLayer();
        this.persistence = persistence ?? null;
        this.lastDayReset = new Date();
        this.lastDayReset.setHours(0, 0, 0, 0);

        // Default aggressiveness (conservative start)
        this.aggressiveness = {
            level: 0,                    // Start fully conservative (100% HITL)
            autoApproveUpToTier: 1,      // Only auto-approve T1 tasks
            maxDelegationDepth: 3,
            trustRewardMultiplier: 1.0,
            trustPenaltyMultiplier: 1.0,
        };

        // Load persisted state if available
        if (this.persistence) {
            this.loadPersistedState();
        }
    }

    /**
     * Load state from persistence layer
     */
    private loadPersistedState(): void {
        if (!this.persistence) return;

        if (this.persistence.load()) {
            // Restore tasks
            const tasks = this.persistence.getTasks();
            tasks.forEach(task => this.tasks.set(task.id, task));

            // Restore aggressiveness
            this.aggressiveness = this.persistence.getAggressiveness();

            // Restore completed today
            this.completedToday = this.persistence.getCompletedToday();

            console.log(`📂 Loaded persisted state: ${tasks.length} tasks, aggressiveness=${this.aggressiveness.level}`);
        }
    }

    /**
     * Persist current state
     */
    private persistState(): void {
        if (!this.persistence) return;

        this.persistence.setTasks(Array.from(this.tasks.values()));
        this.persistence.setAggressiveness(this.aggressiveness);
        this.persistence.markDirty();
    }

    /**
     * Get persistence layer for manual operations
     */
    getPersistence(): PersistenceLayer | null {
        return this.persistence;
    }

    // -------------------------------------------------------------------------
    // Task Management
    // -------------------------------------------------------------------------

    createTask(params: {
        title: string;
        description: string;
        priority?: WorkflowTask['priority'];
        requiredTier?: number;
    }): WorkflowTask {
        const task: WorkflowTask = {
            id: uuidv4(),
            title: params.title,
            description: params.description,
            priority: params.priority ?? 'MEDIUM',
            status: 'QUEUED',
            delegationCount: 0,
            requiredTier: params.requiredTier ?? 2,
            createdAt: new Date(),
            approvalRequired: this.requiresApproval(params.requiredTier ?? 2),
        };

        this.tasks.set(task.id, task);

        // Post to blackboard
        this.blackboard.post({
            type: 'TASK',
            title: task.title,
            author: 'WORKFLOW_ENGINE',
            content: { taskId: task.id, description: task.description },
            priority: task.priority,
        });

        this.emit('task:created', task);

        // Check if needs approval
        if (task.approvalRequired) {
            task.status = 'PENDING_APPROVAL';
            this.emit('approval:required', task);
        }

        // Persist state
        this.persistState();

        return task;
    }

    assignTask(taskId: string, agentId: string, tokenId: string): WorkflowTask | null {
        const task = this.tasks.get(taskId);
        if (!task) return null;

        // Verify agent has permission
        this.security.requireAuth(tokenId, 'BLACKBOARD_POST', 'ASSIGN_TASK');

        task.assignedTo = agentId;
        task.status = 'IN_PROGRESS';
        task.startedAt = new Date();

        this.emit('task:assigned', task, agentId);

        return task;
    }

    completeTask(taskId: string, result: unknown, tokenId: string): WorkflowTask | null {
        const task = this.tasks.get(taskId);
        if (!task) return null;

        task.status = 'COMPLETED';
        task.completedAt = new Date();
        task.result = result;

        // Add to completed today
        this.checkDayReset();
        this.completedToday.push(task);

        // Reward the agent
        if (task.assignedTo) {
            const rewardAmount = this.calculateReward(task);
            this.trustEngine.reward(task.assignedTo, rewardAmount, `Completed task: ${task.title}`);
        }

        this.emit('task:completed', task);

        // Persist state
        this.persistState();

        return task;
    }

    failTask(taskId: string, reason: string, tokenId: string): WorkflowTask | null {
        const task = this.tasks.get(taskId);
        if (!task) return null;

        task.status = 'FAILED';
        task.completedAt = new Date();
        task.result = { error: reason };

        // Penalize the agent
        if (task.assignedTo) {
            const penaltyAmount = this.calculatePenalty(task);
            this.trustEngine.penalize(task.assignedTo, penaltyAmount, `Failed task: ${task.title} - ${reason}`);
        }

        this.emit('task:failed', task, reason);

        // Persist state
        this.persistState();

        return task;
    }

    approveTask(taskId: string, approver: string): WorkflowTask | null {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== 'PENDING_APPROVAL') return null;

        task.approvedBy = approver;
        task.status = 'QUEUED';

        this.emit('approval:granted', taskId, approver);

        // Persist state
        this.persistState();

        return task;
    }

    // -------------------------------------------------------------------------
    // Aggressiveness Slider
    // -------------------------------------------------------------------------

    setAggressiveness(level: number, tokenId: string): AggressivenessConfig {
        // Only human can change aggressiveness
        this.security.requireAuth(tokenId, 'HITL_MODIFY', 'SET_AGGRESSIVENESS');

        const oldLevel = this.aggressiveness.level;
        const newLevel = Math.max(0, Math.min(100, level));

        this.aggressiveness = {
            level: newLevel,
            autoApproveUpToTier: Math.floor(newLevel / 20) + 1,  // 0-20: T1, 21-40: T2, etc.
            maxDelegationDepth: Math.floor(newLevel / 25) + 2,   // 2-6 based on level
            trustRewardMultiplier: 1 + (newLevel / 100),          // 1.0 - 2.0
            trustPenaltyMultiplier: 2 - (newLevel / 100),         // 2.0 - 1.0 (stricter when conservative)
        };

        // Sync with HITL level (inverse relationship)
        this.trustEngine.setHITLLevel(100 - newLevel);

        this.security.logAudit({
            action: 'CONFIG_CHANGE',
            actor: { type: 'HUMAN', id: 'OPERATOR' },
            details: {
                setting: 'AGGRESSIVENESS',
                oldLevel,
                newLevel,
                newConfig: this.aggressiveness,
            },
            outcome: 'SUCCESS',
        });

        this.emit('aggressiveness:changed', oldLevel, newLevel);

        // Persist state
        this.persistState();

        return this.aggressiveness;
    }

    getAggressiveness(): AggressivenessConfig {
        return { ...this.aggressiveness };
    }

    // -------------------------------------------------------------------------
    // Completed Today Dashboard
    // -------------------------------------------------------------------------

    getCompletedToday(): CompletedTodaySummary {
        this.checkDayReset();

        const completed = this.completedToday.filter(t => t.status === 'COMPLETED');
        const failed = this.completedToday.filter(t => t.status === 'FAILED');
        const pending = Array.from(this.tasks.values()).filter(
            t => t.status === 'QUEUED' || t.status === 'PENDING_APPROVAL' || t.status === 'IN_PROGRESS'
        );

        // Calculate by agent
        const byAgent: Record<string, number> = {};
        completed.forEach(t => {
            if (t.assignedTo) {
                byAgent[t.assignedTo] = (byAgent[t.assignedTo] ?? 0) + 1;
            }
        });

        // Calculate by priority
        const byPriority: Record<string, number> = {};
        completed.forEach(t => {
            byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
        });

        // Average completion time
        const completionTimes = completed
            .filter(t => t.startedAt && t.completedAt)
            .map(t => t.completedAt!.getTime() - t.startedAt!.getTime());
        const avgCompletionTimeMs = completionTimes.length > 0
            ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
            : 0;

        // Autonomy metrics
        const autoApproved = completed.filter(t => !t.approvalRequired).length;
        const humanApproved = completed.filter(t => t.approvalRequired && t.approvedBy).length;
        const humanRejected = failed.filter(t => t.approvalRequired).length;

        return {
            date: this.lastDayReset.toISOString().split('T')[0]!,
            totalCompleted: completed.length,
            totalFailed: failed.length,
            totalPending: pending.length,
            byAgent,
            byPriority,
            avgCompletionTimeMs: Math.round(avgCompletionTimeMs),
            trustChanges: {
                rewards: completed.length * 10 * this.aggressiveness.trustRewardMultiplier,
                penalties: failed.length * 15 * this.aggressiveness.trustPenaltyMultiplier,
                netChange: (completed.length * 10) - (failed.length * 15),
            },
            autonomyMetrics: {
                autoApproved,
                humanApproved,
                humanRejected,
            },
        };
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private requiresApproval(tier: number): boolean {
        return tier > this.aggressiveness.autoApproveUpToTier;
    }

    private calculateReward(task: WorkflowTask): number {
        const baseReward = 10;
        const priorityMultiplier = { LOW: 0.5, MEDIUM: 1, HIGH: 1.5, CRITICAL: 2 };
        return Math.floor(
            baseReward *
            priorityMultiplier[task.priority] *
            this.aggressiveness.trustRewardMultiplier
        );
    }

    private calculatePenalty(task: WorkflowTask): number {
        const basePenalty = 15;
        const priorityMultiplier = { LOW: 0.5, MEDIUM: 1, HIGH: 1.5, CRITICAL: 2 };
        return Math.floor(
            basePenalty *
            priorityMultiplier[task.priority] *
            this.aggressiveness.trustPenaltyMultiplier
        );
    }

    private checkDayReset(): void {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        if (todayStart > this.lastDayReset) {
            // New day - archive old tasks
            this.completedToday = [];
            this.lastDayReset = todayStart;
        }
    }

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------

    getTasks(): WorkflowTask[] {
        return Array.from(this.tasks.values());
    }

    getTask(id: string): WorkflowTask | undefined {
        return this.tasks.get(id);
    }

    getPendingApprovals(): WorkflowTask[] {
        return Array.from(this.tasks.values()).filter(t => t.status === 'PENDING_APPROVAL');
    }

    getSecurityLayer(): SecurityLayer {
        return this.security;
    }

    getTrustEngine(): TrustEngine {
        return this.trustEngine;
    }

    getBlackboard(): Blackboard {
        return this.blackboard;
    }

    logAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
        this.security.logAudit(entry);
    }
}

// ============================================================================
// Hono API Routes
// ============================================================================

export function createWorkflowAPI(engine: UnifiedWorkflowEngine, supabase: SupabasePersistence | null = null): Hono {
    const app = new Hono();

    // Security middleware stack
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3005',
        'http://localhost:5173',
        'http://localhost:5174',
        '*.vercel.app',
    ];

    app.use('*', requestIdMiddleware());
    app.use('*', corsMiddleware({ allowedOrigins }));
    app.use('*', securityHeadersMiddleware());
    app.use('*', rateLimitMiddleware({
        windowMs: 60000,     // 1 minute
        maxRequests: 100,    // 100 requests per minute
        skipPaths: ['/health', '/api/health'],
    }));

    // Health check
    app.get('/health', (c) => c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: supabase ? 'supabase' : 'file',
    }));

    // -------------------------------------------------------------------------
    // Legacy API Compatibility Layer (/api/*)
    // Enables web UI to work with unified server on single port
    // -------------------------------------------------------------------------

    // Agent type for API responses
    type APIAgent = {
        id: string;
        name: string;
        type: string;
        tier: number;
        status: string;
        location: { floor: string; room: string };
        trustScore: number;
        capabilities: string[];
        skills: string[];
        parentId: string | null;
        childIds: string[];
        createdAt: string;
    };

    // Demo agents for fallback when no Supabase
    const demoAgents: APIAgent[] = [
        { id: 'exec-1', name: 'T5-EXECUTOR', type: 'EXECUTOR', tier: 5, status: 'IDLE', location: { floor: 'EXECUTIVE', room: 'EXECUTOR_OFFICE' }, trustScore: 1000, capabilities: ['execution'], skills: [], parentId: null, childIds: [], createdAt: new Date().toISOString() },
        { id: 'plan-1', name: 'T5-PLANNER', type: 'PLANNER', tier: 5, status: 'WORKING', location: { floor: 'EXECUTIVE', room: 'PLANNER_OFFICE' }, trustScore: 980, capabilities: ['strategy'], skills: [], parentId: null, childIds: [], createdAt: new Date().toISOString() },
        { id: 'valid-1', name: 'T5-VALIDATOR', type: 'VALIDATOR', tier: 5, status: 'IDLE', location: { floor: 'EXECUTIVE', room: 'VALIDATOR_OFFICE' }, trustScore: 990, capabilities: ['audit'], skills: [], parentId: null, childIds: [], createdAt: new Date().toISOString() },
        { id: 'evolve-1', name: 'T5-EVOLVER', type: 'EVOLVER', tier: 5, status: 'WORKING', location: { floor: 'EXECUTIVE', room: 'EVOLVER_OFFICE' }, trustScore: 970, capabilities: ['optimize'], skills: [], parentId: null, childIds: [], createdAt: new Date().toISOString() },
        { id: 'spawn-1', name: 'T5-SPAWNER', type: 'SPAWNER', tier: 5, status: 'IDLE', location: { floor: 'EXECUTIVE', room: 'SPAWNER_OFFICE' }, trustScore: 985, capabilities: ['spawn'], skills: [], parentId: null, childIds: [], createdAt: new Date().toISOString() },
    ];

    // Helper to convert Supabase agent to API format
    const formatAgent = (a: SupabaseAgent): APIAgent => ({
        id: a.id,
        name: a.name,
        type: a.type,
        tier: a.tier,
        status: a.status,
        location: { floor: a.floor, room: a.room },
        trustScore: a.trust_score,
        capabilities: a.capabilities,
        skills: a.skills,
        parentId: a.parent_id,
        childIds: [],
        createdAt: a.created_at,
    });

    // GET /api/state - Full system state (legacy format)
    app.get('/api/state', async (c) => {
        const trustStats = engine.getTrustEngine().getStats();
        const blackboard = engine.getBlackboard();

        // Get agents from Supabase or use demo
        let agents: APIAgent[] = demoAgents;
        let persistenceMode = 'file';
        if (supabase) {
            try {
                const dbAgents = await supabase.getAgents();
                if (dbAgents.length > 0) {
                    agents = dbAgents.map(formatAgent);
                }
                persistenceMode = 'supabase';
            } catch (e) {
                console.error('Supabase agents error:', e);
            }
        }

        return c.json({
            agents,
            blackboard: blackboard.getAllEntries().map((e: any) => ({
                id: e.id,
                type: e.type,
                title: e.title,
                content: e.content,
                author: e.author,
                priority: e.priority,
                status: e.status,
                createdAt: e.createdAt.toISOString(),
            })),
            hitlLevel: trustStats.hitlLevel,
            avgTrust: trustStats.avgTrust,
            day: 1,
            events: [],
            persistenceMode,
        });
    });

    // GET /api/agents - List all agents
    app.get('/api/agents', async (c) => {
        if (supabase) {
            try {
                const dbAgents = await supabase.getAgents();
                if (dbAgents.length > 0) {
                    return c.json(dbAgents.map(formatAgent));
                }
            } catch (e) {
                console.error('Supabase agents error:', e);
            }
        }
        return c.json(demoAgents);
    });

    // POST /api/spawn - Spawn a new agent
    app.post('/api/spawn', async (c) => {
        const body = await c.req.json<{ name: string; type: string; tier: number }>();

        if (supabase) {
            try {
                const agent = await supabase.createAgent({
                    id: uuidv4(),
                    name: body.name,
                    type: body.type,
                    tier: body.tier,
                    status: 'IDLE',
                    trust_score: body.tier * 150 + 100,
                    floor: body.tier >= 4 ? 'EXECUTIVE' : 'OPERATIONS',
                    room: 'SPAWN_BAY',
                    capabilities: [],
                    skills: [],
                    parent_id: null,
                });
                return c.json({ success: true, agent: formatAgent(agent) });
            } catch (e) {
                console.error('Supabase spawn error:', e);
                return c.json({ error: (e as Error).message }, 500);
            }
        }

        // Fallback to demo response
        return c.json({ success: true, agent: { id: uuidv4(), name: body.name, type: body.type, tier: body.tier } });
    });

    // GET /api/stats - Quick stats
    app.get('/api/stats', (c) => {
        const trustStats = engine.getTrustEngine().getStats();
        return c.json({
            hitlLevel: trustStats.hitlLevel,
            avgTrust: trustStats.avgTrust,
            agentCount: demoAgents.length,
            day: 1,
        });
    });

    // GET /api/uptime - Server uptime
    const serverStartTime = Date.now();
    app.get('/api/uptime', (c) => {
        const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
        return c.json({
            uptime,
            formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
            startTimeISO: new Date(serverStartTime).toISOString(),
        });
    });

    // GET /api/blackboard - Blackboard entries
    app.get('/api/blackboard', (c) => {
        const blackboard = engine.getBlackboard();
        return c.json(blackboard.getAllEntries().map((e: any) => ({
            id: e.id,
            type: e.type,
            title: e.title,
            content: e.content,
            author: e.author,
            priority: e.priority,
            status: e.status,
            createdAt: e.createdAt.toISOString(),
        })));
    });

    // POST /api/hitl - Set HITL level
    app.post('/api/hitl', async (c) => {
        const body = await c.req.json<{ level: number }>();
        engine.getTrustEngine().setHITLLevel(body.level);
        return c.json({ success: true, hitlLevel: body.level });
    });

    // GET /api/approvals - Pending approvals (legacy format)
    app.get('/api/approvals', (c) => c.json([]));

    // GET /api/settings - System settings
    app.get('/api/settings', (c) => c.json({}));

    // POST /api/settings - Update settings
    app.post('/api/settings', (c) => c.json({ success: true }));

    // -------------------------------------------------------------------------
    // Dashboard Endpoints
    // -------------------------------------------------------------------------

    // GET /dashboard/today - Completed today summary
    app.get('/dashboard/today', (c) => {
        return c.json(engine.getCompletedToday());
    });

    // GET /dashboard/aggressiveness - Current aggressiveness config
    app.get('/dashboard/aggressiveness', (c) => {
        return c.json(engine.getAggressiveness());
    });

    // POST /dashboard/aggressiveness - Set aggressiveness level
    app.post('/dashboard/aggressiveness', async (c) => {
        const body = await c.req.json<{ level: number; tokenId: string }>();
        try {
            const config = engine.setAggressiveness(body.level, body.tokenId);
            return c.json(config);
        } catch (error) {
            return c.json({ error: (error as Error).message }, 403);
        }
    });

    // -------------------------------------------------------------------------
    // Task Endpoints
    // -------------------------------------------------------------------------

    // GET /tasks - List all tasks
    app.get('/tasks', (c) => {
        return c.json(engine.getTasks());
    });

    // GET /tasks/:id - Get single task
    app.get('/tasks/:id', (c) => {
        const task = engine.getTask(c.req.param('id'));
        if (!task) return c.json({ error: 'Task not found' }, 404);
        return c.json(task);
    });

    // POST /tasks - Create new task
    app.post('/tasks', async (c) => {
        const body = await c.req.json<{
            title: string;
            description: string;
            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
            requiredTier?: number;
        }>();
        const task = engine.createTask(body);
        return c.json(task, 201);
    });

    // POST /tasks/:id/assign - Assign task to agent
    app.post('/tasks/:id/assign', async (c) => {
        const body = await c.req.json<{ agentId: string; tokenId: string }>();
        try {
            const task = engine.assignTask(c.req.param('id'), body.agentId, body.tokenId);
            if (!task) return c.json({ error: 'Task not found' }, 404);
            return c.json(task);
        } catch (error) {
            return c.json({ error: (error as Error).message }, 403);
        }
    });

    // POST /tasks/:id/complete - Mark task complete
    app.post('/tasks/:id/complete', async (c) => {
        const body = await c.req.json<{ result: unknown; tokenId: string }>();
        try {
            const task = engine.completeTask(c.req.param('id'), body.result, body.tokenId);
            if (!task) return c.json({ error: 'Task not found' }, 404);
            return c.json(task);
        } catch (error) {
            return c.json({ error: (error as Error).message }, 403);
        }
    });

    // POST /tasks/:id/fail - Mark task failed
    app.post('/tasks/:id/fail', async (c) => {
        const body = await c.req.json<{ reason: string; tokenId: string }>();
        try {
            const task = engine.failTask(c.req.param('id'), body.reason, body.tokenId);
            if (!task) return c.json({ error: 'Task not found' }, 404);
            return c.json(task);
        } catch (error) {
            return c.json({ error: (error as Error).message }, 403);
        }
    });

    // POST /tasks/:id/delegate - Delegate task to another agent
    app.post('/tasks/:id/delegate', async (c) => {
        const body = await c.req.json<{ fromAgentId: string; toAgentId: string; reason?: string; tokenId: string }>();
        try {
            const task = engine.getTask(c.req.param('id'));
            if (!task) return c.json({ error: 'Task not found' }, 404);

            const config = engine.getAggressiveness();
            if (task.delegationCount >= config.maxDelegationDepth) {
                return c.json({ error: `Max delegation depth (${config.maxDelegationDepth}) reached` }, 400);
            }

            // Update task with new assignee and increment delegation count
            task.assignedTo = body.toAgentId;
            task.delegationCount++;

            // Log delegation
            engine.logAudit({
                action: 'TASK_DELEGATED',
                actor: { type: 'AGENT', id: body.fromAgentId },
                outcome: 'SUCCESS',
                details: {
                    taskId: task.id,
                    fromAgent: body.fromAgentId,
                    toAgent: body.toAgentId,
                    reason: body.reason || 'No reason provided',
                    delegationNumber: task.delegationCount,
                },
            });

            return c.json({
                success: true,
                task: {
                    id: task.id,
                    status: task.status,
                    assignee: task.assignedTo,
                    delegationCount: task.delegationCount,
                    remainingDelegations: config.maxDelegationDepth - task.delegationCount,
                    canDelegateAgain: task.delegationCount < config.maxDelegationDepth,
                },
                message: `Task delegated from ${body.fromAgentId} to ${body.toAgentId}`,
            });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 403);
        }
    });

    // GET /delegate - Get delegation rules
    app.get('/delegate', (c) => {
        const config = engine.getAggressiveness();
        return c.json({
            rules: {
                maxDelegations: config.maxDelegationDepth,
                minTierToDelegate: 'T3',
                penalties: { excessiveDelegation: -20, delegationToUnqualified: -50 },
            },
            tiers: [
                { level: 5, name: 'ELITE', threshold: 950, canDelegate: true },
                { level: 4, name: 'CERTIFIED', threshold: 800, canDelegate: true },
                { level: 3, name: 'VERIFIED', threshold: 600, canDelegate: true },
                { level: 2, name: 'TRUSTED', threshold: 400, canDelegate: false },
                { level: 1, name: 'PROBATIONARY', threshold: 200, canDelegate: false },
                { level: 0, name: 'UNTRUSTED', threshold: 0, canDelegate: false },
            ],
        });
    });

    // -------------------------------------------------------------------------
    // Approval Endpoints
    // -------------------------------------------------------------------------

    // GET /approvals - List pending approvals
    app.get('/approvals', (c) => {
        return c.json(engine.getPendingApprovals());
    });

    // POST /approvals/:id - Approve/reject task
    app.post('/approvals/:id', async (c) => {
        const body = await c.req.json<{ approve: boolean; tokenId: string }>();
        const security = engine.getSecurityLayer();

        try {
            security.requireAuth(body.tokenId, 'HITL_MODIFY', 'APPROVE_TASK');

            if (body.approve) {
                const task = engine.approveTask(c.req.param('id'), 'HUMAN_OPERATOR');
                if (!task) return c.json({ error: 'Task not found or not pending' }, 404);
                return c.json(task);
            } else {
                const task = engine.failTask(c.req.param('id'), 'Rejected by human operator', body.tokenId);
                if (!task) return c.json({ error: 'Task not found' }, 404);
                return c.json(task);
            }
        } catch (error) {
            return c.json({ error: (error as Error).message }, 403);
        }
    });

    // -------------------------------------------------------------------------
    // Trust & Security Endpoints
    // -------------------------------------------------------------------------

    // GET /trust/stats - Trust statistics
    app.get('/trust/stats', (c) => {
        return c.json(engine.getTrustEngine().getStats());
    });

    // GET /security/audit - Audit log
    app.get('/security/audit', async (c) => {
        const security = engine.getSecurityLayer();
        const limit = parseInt(c.req.query('limit') ?? '50');
        return c.json(security.getAuditLog({ limit }));
    });

    // POST /auth/human - Issue human token
    app.post('/auth/human', async (c) => {
        const body = await c.req.json<{ masterKey: string }>();
        const security = engine.getSecurityLayer();
        try {
            const token = security.issueHumanToken(body.masterKey);
            return c.json({ tokenId: token.id, expiresAt: token.expiresAt });
        } catch (error) {
            return c.json({ error: 'Invalid master key' }, 401);
        }
    });

    // -------------------------------------------------------------------------
    // TRUST-5.1: Trust Component Endpoints
    // -------------------------------------------------------------------------

    // GET /trust/:agentId/components - Get trust component breakdown
    app.get('/trust/:agentId/components', (c) => {
        const agentId = c.req.param('agentId') as AgentId;
        const trustEngine = engine.getTrustEngine();

        const trust = trustEngine.getTrust(agentId);
        if (!trust) {
            return c.json({ error: 'Agent not found' }, 404);
        }

        const enhanced = trustEngine.getEnhancedTrust(agentId);

        if (enhanced) {
            return c.json({
                agentId,
                finalScore: enhanced.ficoScore,
                tier: enhanced.level,
                components: enhanced.components,
                trend: enhanced.ficoScore > trust.numeric ? 'rising' :
                       enhanced.ficoScore < trust.numeric ? 'falling' : 'stable',
                lastUpdated: enhanced.lastCalculated.toISOString(),
            });
        }

        // Fallback for legacy scoring
        return c.json({
            agentId,
            finalScore: trust.numeric,
            tier: trust.level,
            components: null,
            trend: 'stable',
            lastUpdated: trust.lastVerified.toISOString(),
        });
    });

    // GET /trust/:agentId/history - Get trust score history
    app.get('/trust/:agentId/history', (c) => {
        const agentId = c.req.param('agentId') as AgentId;
        const days = parseInt(c.req.query('days') ?? '30');
        const trustEngine = engine.getTrustEngine();

        const trust = trustEngine.getTrust(agentId);
        if (!trust) {
            return c.json({ error: 'Agent not found' }, 404);
        }

        // For now, return current snapshot (history would require persistence)
        // In production, this would query stored historical data
        return c.json([{
            date: new Date().toISOString().split('T')[0],
            score: trust.numeric,
            level: trust.level,
            earned: trust.earned,
            penalties: trust.penalties,
        }]);
    });

    // -------------------------------------------------------------------------
    // TRUST-5.2: Audit Verification Endpoints
    // -------------------------------------------------------------------------

    // Cryptographic audit logger instance
    const auditLogger = new CryptographicAuditLogger();

    // GET /audit/verify - Verify audit chain integrity
    app.get('/audit/verify', async (c) => {
        const start = c.req.query('start') ? parseInt(c.req.query('start')!) : undefined;
        const end = c.req.query('end') ? parseInt(c.req.query('end')!) : undefined;

        const status = await auditLogger.verifyChain({ startSequence: start, endSequence: end });

        return c.json({
            isValid: status.isValid,
            lastVerified: new Date().toISOString(),
            entriesVerified: status.entriesVerified,
            brokenAt: status.brokenAt,
            error: status.error,
        });
    });

    // GET /audit/export - Export audit log
    app.get('/audit/export', async (c) => {
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');
        const format = c.req.query('format') ?? 'json';

        // Get all entries and filter by date if specified
        let entries: CryptographicAuditEntry[] = auditLogger.getAllEntries();

        if (startDate) {
            const start = new Date(startDate);
            entries = entries.filter(e => e.timestamp >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            entries = entries.filter(e => e.timestamp <= end);
        }

        // Verify chain for export
        const verification = await auditLogger.verifyChain();

        if (format === 'csv') {
            const headers = 'timestamp,action,actorType,actorId,outcome,hash\n';
            const rows = entries.map(e =>
                `${e.timestamp.toISOString()},${e.action},${e.actor.type},${e.actor.id},${e.outcome},${e.entryHash}`
            ).join('\n');

            c.header('Content-Type', 'text/csv');
            c.header('Content-Disposition', 'attachment; filename="audit-export.csv"');
            return c.body(headers + rows);
        }

        return c.json({
            exported: new Date().toISOString(),
            chainValid: verification.isValid,
            entriesCount: entries.length,
            entries: entries.map(e => ({
                id: e.id,
                timestamp: e.timestamp.toISOString(),
                action: e.action,
                actor: e.actor,
                target: e.target,
                outcome: e.outcome,
                hash: e.entryHash,
            })),
        });
    });

    // -------------------------------------------------------------------------
    // TRUST-5.3: Council Endpoints
    // -------------------------------------------------------------------------

    // Council service and member registry instances
    const memberRegistry = new CouncilMemberRegistry();
    const councilService = new CouncilService(memberRegistry);

    // GET /council/reviews - List pending reviews
    app.get('/council/reviews', (c) => {
        const reviews = councilService.getPendingReviews();
        return c.json(reviews.map(r => ({
            id: r.id,
            type: r.requestType,
            requesterId: r.requesterId,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            expiresAt: r.expiresAt.toISOString(),
            votesReceived: r.votes.size,
            requiredVotes: r.requiredVotes,
            priority: r.priority,
        })));
    });

    // GET /council/reviews/:id - Get review details
    app.get('/council/reviews/:id', (c) => {
        const reviewId = c.req.param('id');
        const review = councilService.getReview(reviewId);

        if (!review) {
            return c.json({ error: 'Review not found' }, 404);
        }

        // Convert votes Map to array
        const votesArray = Array.from(review.votes.entries()).map(([agentId, v]) => ({
            agentId,
            vote: v.vote,
            reasoning: v.reasoning,
            confidence: v.confidence,
            timestamp: v.timestamp.toISOString(),
        }));

        return c.json({
            id: review.id,
            type: review.requestType,
            requesterId: review.requesterId,
            status: review.status,
            context: review.context,
            createdAt: review.createdAt.toISOString(),
            expiresAt: review.expiresAt.toISOString(),
            votes: votesArray,
            outcome: review.outcome,
            requiredVotes: review.requiredVotes,
            priority: review.priority,
            reviewers: review.reviewers.map(r => r.agentId),
        });
    });

    // POST /council/reviews/:id/vote - Submit vote
    app.post('/council/reviews/:id/vote', async (c) => {
        const reviewId = c.req.param('id');
        const body = await c.req.json<{
            agentId: string;
            vote: 'approve' | 'reject' | 'abstain';
            reasoning: string;
            confidence: number;
        }>();

        try {
            const review = await councilService.submitVote({
                reviewId,
                voterId: body.agentId as AgentId,
                vote: body.vote,
                reasoning: body.reasoning,
                confidence: body.confidence,
            });

            return c.json({
                success: true,
                reviewId: review.id,
                status: review.status,
                outcome: review.outcome,
                votesReceived: review.votes.size,
            });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 400);
        }
    });

    // GET /council/members - List council members
    app.get('/council/members', (c) => {
        const members = memberRegistry.getMembers();
        return c.json(members.map(m => ({
            agentId: m.agentId,
            tier: m.tier,
            specialization: m.specialization,
            joinedAt: m.joinedAt.toISOString(),
            activeReviews: m.activeReviews,
            totalVotes: m.totalVotes,
            agreementRate: m.agreementRate,
        })));
    });

    // -------------------------------------------------------------------------
    // TRUST-5.4: Delegation & Budget Endpoints
    // -------------------------------------------------------------------------

    // Delegation manager and autonomy budget instances
    const delegationManager = new DelegationManager();
    const autonomyBudget = new AutonomyBudgetService();

    // POST /delegation/request - Create delegation request
    app.post('/delegation/request', async (c) => {
        const body = await c.req.json<{
            agentId: string;
            capabilities: string[];
            reason: string;
            duration: number;
        }>();

        try {
            const request = await delegationManager.requestCapabilities({
                agentId: body.agentId as AgentId,
                capabilities: body.capabilities as Permission[],
                reason: body.reason,
                duration: body.duration,
            });

            return c.json({
                id: request.id,
                status: request.status,
                capabilities: request.requestedCapabilities,
                duration: request.duration,
                approvedBy: request.approvedBy,
                expiresAt: request.expiresAt?.toISOString(),
                autoApproved: request.approvedBy === 'AUTO',
            });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 400);
        }
    });

    // GET /delegation/:agentId/active - List active delegations
    app.get('/delegation/:agentId/active', (c) => {
        const agentId = c.req.param('agentId') as AgentId;
        const delegations = delegationManager.getActiveDelegations(agentId);

        return c.json(delegations.map(d => ({
            id: d.id,
            capabilities: d.capabilities,
            grantedAt: d.grantedAt.toISOString(),
            expiresAt: d.expiresAt.toISOString(),
            reason: d.reason,
            approvedBy: d.approvedBy,
            usageCount: d.usageCount,
        })));
    });

    // DELETE /delegation/:id - Revoke delegation (human only)
    app.delete('/delegation/:id', async (c) => {
        const delegationId = c.req.param('id');
        const body = await c.req.json<{ reason: string; tokenId: string }>();

        try {
            // Verify human auth
            engine.getSecurityLayer().requireAuth(body.tokenId, 'HITL_MODIFY', 'REVOKE_DELEGATION');

            const revoked = await delegationManager.revokeDelegation(delegationId, body.reason);

            if (!revoked) {
                return c.json({ error: 'Delegation not found' }, 404);
            }

            return c.json({ success: true, revoked: delegationId });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 403);
        }
    });

    // GET /autonomy/:agentId/budget - Get current budget status
    app.get('/autonomy/:agentId/budget', async (c) => {
        const agentId = c.req.param('agentId') as AgentId;

        try {
            const summary = await autonomyBudget.getBudgetSummary(agentId);

            // Calculate time until reset (midnight UTC)
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
            tomorrow.setUTCHours(0, 0, 0, 0);
            const resetsIn = tomorrow.getTime() - now.getTime();

            return c.json({
                agentId: summary.agentId,
                tier: summary.tier,
                actions: {
                    used: summary.actions.used,
                    max: summary.actions.max,
                    remaining: summary.actions.remaining,
                    percentage: summary.actions.percentUsed,
                },
                delegations: {
                    used: summary.delegations.used,
                    max: summary.delegations.max,
                    remaining: summary.delegations.remaining,
                },
                tokens: {
                    spent: summary.tokens.spent,
                    max: summary.tokens.max,
                    remaining: summary.tokens.remaining,
                },
                resetsIn,
                resetsAt: tomorrow.toISOString(),
            });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 400);
        }
    });

    // POST /autonomy/:agentId/action - Record action (internal use)
    app.post('/autonomy/:agentId/action', async (c) => {
        const agentId = c.req.param('agentId') as AgentId;
        const body = await c.req.json<{
            actionType: string;
            cost?: number;
            tokenCost?: number;
        }>();

        try {
            await autonomyBudget.recordAction({
                agentId,
                actionType: body.actionType,
                cost: body.cost,
                tokenCost: body.tokenCost,
            });

            const summary = await autonomyBudget.getBudgetSummary(agentId);

            return c.json({
                success: true,
                remaining: summary.actions.remaining,
                percentUsed: summary.actions.percentUsed,
            });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 400);
        }
    });

    // -------------------------------------------------------------------------
    // AI Provider Endpoints
    // -------------------------------------------------------------------------

    // GET /ai/providers - List available AI providers
    app.get('/ai/providers', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            return c.json({
                available: client.getAvailableProviders(),
                default: client.getDefaultProvider(),
                models: {
                    claude: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-20250514',
                    grok: process.env.GROK_MODEL ?? 'grok-beta',
                    openai: process.env.OPENAI_MODEL ?? 'gpt-4-turbo-preview',
                    gemini: process.env.GEMINI_MODEL ?? 'gemini-pro',
                },
            });
        } catch (error) {
            return c.json({ available: [], default: null, error: (error as Error).message });
        }
    });

    // POST /ai/complete - Send completion request to AI
    app.post('/ai/complete', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const body = await c.req.json<{
                messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
                provider?: 'claude' | 'grok' | 'openai' | 'gemini';
                model?: string;
                maxTokens?: number;
                temperature?: number;
            }>();

            const result = await client.complete(body.messages, {
                provider: body.provider,
                model: body.model,
                maxTokens: body.maxTokens,
                temperature: body.temperature,
            });

            return c.json(result);
        } catch (error) {
            return c.json({ error: (error as Error).message }, 500);
        }
    });

    // POST /ai/ask - Simple question/answer
    app.post('/ai/ask', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const body = await c.req.json<{
                prompt: string;
                provider?: 'claude' | 'grok' | 'openai' | 'gemini';
            }>();

            const response = await client.ask(body.prompt, { provider: body.provider });
            return c.json({ response, provider: body.provider ?? client.getDefaultProvider() });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 500);
        }
    });

    // POST /ai/agent-reason - Agent reasoning endpoint
    app.post('/ai/agent-reason', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const body = await c.req.json<{
                agentName: string;
                agentRole: string;
                task: string;
                context?: string;
                provider?: 'claude' | 'grok' | 'openai' | 'gemini';
            }>();

            const result = await client.agentReason(body);
            return c.json(result);
        } catch (error) {
            return c.json({ error: (error as Error).message }, 500);
        }
    });

    // POST /ai/set-default - Set default AI provider
    app.post('/ai/set-default', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const body = await c.req.json<{ provider: 'claude' | 'grok' | 'openai' | 'gemini' }>();

            client.setDefaultProvider(body.provider);
            return c.json({ success: true, default: body.provider });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 400);
        }
    });

    // POST /ai/configure - Configure a provider with API key
    app.post('/ai/configure', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const body = await c.req.json<{
                provider: 'claude' | 'grok' | 'openai' | 'gemini';
                apiKey: string;
                model?: string;
                setAsDefault?: boolean;
            }>();

            if (!body.provider || !body.apiKey) {
                return c.json({ error: 'provider and apiKey are required' }, 400);
            }

            client.configureProvider(body.provider, body.apiKey, body.model);

            if (body.setAsDefault) {
                client.setDefaultProvider(body.provider);
            }

            return c.json({
                success: true,
                provider: body.provider,
                isDefault: client.getDefaultProvider() === body.provider,
                available: client.getAvailableProviders(),
            });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 500);
        }
    });

    // POST /ai/test - Test a provider connection
    app.post('/ai/test', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const body = await c.req.json<{ provider: 'claude' | 'grok' | 'openai' | 'gemini' }>();

            const result = await client.testProvider(body.provider);
            return c.json(result);
        } catch (error) {
            return c.json({ success: false, error: (error as Error).message }, 500);
        }
    });

    // DELETE /ai/provider/:type - Remove a provider
    app.delete('/ai/provider/:type', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const providerType = c.req.param('type') as 'claude' | 'grok' | 'openai' | 'gemini';

            client.removeProvider(providerType);
            return c.json({
                success: true,
                removed: providerType,
                available: client.getAvailableProviders(),
                default: client.getDefaultProvider(),
            });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 500);
        }
    });

    // GET /ai/info - Get detailed provider info
    app.get('/ai/info', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            return c.json({
                providers: client.getProviderInfo(),
                default: client.getDefaultProvider(),
                allProviderTypes: ['claude', 'grok', 'openai', 'gemini'],
            });
        } catch (error) {
            return c.json({ error: (error as Error).message }, 500);
        }
    });

    // -------------------------------------------------------------------------
    // Aria AI Interpretation Endpoint
    // -------------------------------------------------------------------------

    // POST /ai/aria/interpret - Interpret user message for agent routing
    app.post('/ai/aria/interpret', async (c) => {
        try {
            // Check if Aria AI is enabled
            if (!ariaSettings.enabled) {
                return c.json({
                    success: false,
                    error: 'Aria AI is disabled',
                    interpretation: {
                        action: 'CHAT',
                        params: {},
                        response: "Aria AI is currently disabled. You can enable it in settings, or use direct commands like `help`, `status`, or `agents`.",
                        confidence: 0,
                    },
                });
            }

            // Check daily limit
            if (ariaSettings.dailyQueryLimit > 0 && ariaSettings.queriesUsedToday >= ariaSettings.dailyQueryLimit) {
                return c.json({
                    success: false,
                    error: 'Daily query limit reached',
                    interpretation: {
                        action: 'CHAT',
                        params: {},
                        response: `Daily query limit (${ariaSettings.dailyQueryLimit}) reached. Please use direct commands or wait until tomorrow.`,
                        confidence: 0,
                    },
                });
            }

            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const body = await c.req.json<{
                message: string;
                context?: {
                    agents?: Array<{ id: string; name: string; type: string; tier: number; status: string }>;
                    pendingApprovals?: number;
                    hitlLevel?: number;
                    recentTasks?: Array<{ title: string; status: string }>;
                };
            }>();

            // Increment query counter
            ariaSettings.queriesUsedToday++;

            // Build context string for the AI
            const contextParts: string[] = [];
            if (body.context?.agents) {
                const agentSummary = body.context.agents.map(a => `${a.name} (${a.type}, T${a.tier}, ${a.status})`).join(', ');
                contextParts.push(`Active agents: ${agentSummary}`);
            }
            if (body.context?.pendingApprovals) {
                contextParts.push(`Pending approvals: ${body.context.pendingApprovals}`);
            }
            if (body.context?.hitlLevel !== undefined) {
                contextParts.push(`HITL level: ${body.context.hitlLevel}%`);
            }

            const systemPrompt = `You are Aria, an AI assistant for TrustBot - an autonomous agent orchestration system.
Your job is to interpret user messages and determine what action they want to take.

Available actions:
- SPAWN: Create a new agent (needs: name, type, tier)
- TASK: Create a new task (needs: description, priority?)
- STATUS: Show system status
- AGENTS: List agents (optional: filter)
- AGENT_DETAIL: Show specific agent (needs: agent identifier)
- APPROVE: Approve a request (needs: id)
- DENY: Deny a request (needs: id, reason?)
- HITL: Set governance level (needs: level 0-100)
- TICK: Run agent work cycle
- HELP: Show help
- CHAT: General conversation/question (no specific action)

Agent types: EXECUTOR, PLANNER, VALIDATOR, EVOLVER, SPAWNER, LISTENER, WORKER, SPECIALIST, ORCHESTRATOR
Priority levels: LOW, NORMAL, HIGH, CRITICAL
Tiers: 0-5 (0=Untrusted, 5=Elite)

${contextParts.length > 0 ? '\nCurrent context:\n' + contextParts.join('\n') : ''}

Respond with a JSON object containing:
{
  "action": "<ACTION_TYPE>",
  "params": { <action-specific parameters> },
  "response": "<friendly message to show the user>",
  "confidence": <0.0-1.0>
}

If the user's intent is unclear or just conversational, use action "CHAT" and respond naturally.`;

            const result = await client.complete([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: body.message },
            ], {
                maxTokens: 500,
                temperature: 0.3,
            });

            // Parse the AI response
            try {
                // Try to extract JSON from the response
                const jsonMatch = result.content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return c.json({
                        success: true,
                        interpretation: parsed,
                        provider: result.provider,
                        model: result.model,
                    });
                }
            } catch {
                // If JSON parsing fails, treat as chat response
            }

            // Fallback: treat as conversational
            return c.json({
                success: true,
                interpretation: {
                    action: 'CHAT',
                    params: {},
                    response: result.content,
                    confidence: 0.5,
                },
                provider: result.provider,
                model: result.model,
            });
        } catch (error) {
            // Fallback when AI is unavailable
            return c.json({
                success: false,
                error: (error as Error).message,
                interpretation: {
                    action: 'CHAT',
                    params: {},
                    response: "I'm having trouble connecting to my AI backend. Please try using direct commands like `help`, `status`, or `agents`.",
                    confidence: 0,
                },
            });
        }
    });

    // POST /ai/aria/gather - Gather perspectives from all AI providers
    app.post('/ai/aria/gather', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const body = await c.req.json<{
                question: string;
                context?: string;
                synthesize?: boolean;
            }>();

            const availableProviders = client.getAvailableProviders();

            if (availableProviders.length === 0) {
                return c.json({
                    success: false,
                    error: 'No AI providers configured',
                    perspectives: [],
                    providers: [],
                });
            }

            const result = await client.gatherPerspectives(
                body.question,
                body.context,
                body.synthesize ?? true
            );

            return c.json({
                success: true,
                question: body.question,
                perspectives: result.perspectives,
                synthesis: result.synthesis,
                providers: result.providers,
                providersQueried: result.perspectives.length,
                providersSucceeded: result.perspectives.filter(p => p.success).length,
            });
        } catch (error) {
            return c.json({
                success: false,
                error: (error as Error).message,
                perspectives: [],
                providers: [],
            });
        }
    });

    // GET /ai/aria/settings - Get Aria AI settings
    app.get('/ai/aria/settings', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();

            return c.json({
                success: true,
                settings: ariaSettings,
                availableProviders: client.getAvailableProviders(),
                defaultProvider: client.getDefaultProvider(),
            });
        } catch (error) {
            return c.json({
                success: false,
                error: (error as Error).message,
                settings: ariaSettings,
            });
        }
    });

    // POST /ai/aria/settings - Update Aria AI settings
    app.post('/ai/aria/settings', async (c) => {
        try {
            const body = await c.req.json<Partial<AriaSettings>>();

            // Update settings
            ariaSettings = {
                ...ariaSettings,
                ...body,
                // Ensure arrays are properly handled
                enabledProviders: body.enabledProviders ?? ariaSettings.enabledProviders,
            };

            return c.json({
                success: true,
                settings: ariaSettings,
            });
        } catch (error) {
            return c.json({
                success: false,
                error: (error as Error).message,
            });
        }
    });

    // GET /ai/aria/advisors - Get all configured advisors
    app.get('/ai/aria/advisors', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const available = client.getAvailableProviders();

            // Mark which advisors have available providers
            const advisorsWithStatus = ariaSettings.advisors.map(advisor => ({
                ...advisor,
                available: available.includes(advisor.provider),
            }));

            return c.json({
                success: true,
                advisors: advisorsWithStatus,
                councilName: ariaSettings.councilName,
                councilAliases: ariaSettings.councilAliases,
                availableProviders: available,
            });
        } catch (error) {
            return c.json({
                success: false,
                error: (error as Error).message,
                advisors: ariaSettings.advisors,
            });
        }
    });

    // POST /ai/aria/advisors - Add or update an advisor
    app.post('/ai/aria/advisors', async (c) => {
        try {
            const body = await c.req.json<AdvisorConfig>();

            // Validate required fields
            if (!body.name || !body.provider) {
                return c.json({
                    success: false,
                    error: 'Advisor requires name and provider',
                }, 400);
            }

            // Validate provider is valid
            const validProviders = ['claude', 'grok', 'openai', 'gemini'];
            if (!validProviders.includes(body.provider)) {
                return c.json({
                    success: false,
                    error: `Invalid provider. Valid providers: ${validProviders.join(', ')}`,
                }, 400);
            }

            // Find existing advisor by name (case-insensitive)
            const existingIndex = ariaSettings.advisors.findIndex(
                a => a.name.toLowerCase() === body.name.toLowerCase()
            );

            const newAdvisor: AdvisorConfig = {
                name: body.name,
                provider: body.provider,
                aliases: body.aliases || [],
                personality: body.personality,
                icon: body.icon || '🤖',
                enabled: body.enabled !== false,
            };

            if (existingIndex >= 0) {
                // Update existing
                ariaSettings.advisors[existingIndex] = newAdvisor;
            } else {
                // Add new
                ariaSettings.advisors.push(newAdvisor);
            }

            return c.json({
                success: true,
                advisor: newAdvisor,
                action: existingIndex >= 0 ? 'updated' : 'created',
                advisors: ariaSettings.advisors,
            });
        } catch (error) {
            return c.json({
                success: false,
                error: (error as Error).message,
            });
        }
    });

    // DELETE /ai/aria/advisors/:name - Remove an advisor
    app.delete('/ai/aria/advisors/:name', async (c) => {
        try {
            const name = c.req.param('name');

            const existingIndex = ariaSettings.advisors.findIndex(
                a => a.name.toLowerCase() === name.toLowerCase()
            );

            if (existingIndex < 0) {
                return c.json({
                    success: false,
                    error: `Advisor "${name}" not found`,
                }, 404);
            }

            const removed = ariaSettings.advisors.splice(existingIndex, 1)[0];

            return c.json({
                success: true,
                removed: removed,
                advisors: ariaSettings.advisors,
            });
        } catch (error) {
            return c.json({
                success: false,
                error: (error as Error).message,
            });
        }
    });

    // POST /ai/aria/council - Update council settings (name and aliases)
    app.post('/ai/aria/council', async (c) => {
        try {
            const body = await c.req.json<{
                name?: string;
                aliases?: string[];
            }>();

            if (body.name) {
                ariaSettings.councilName = body.name;
            }
            if (body.aliases) {
                ariaSettings.councilAliases = body.aliases;
            }

            return c.json({
                success: true,
                councilName: ariaSettings.councilName,
                councilAliases: ariaSettings.councilAliases,
            });
        } catch (error) {
            return c.json({
                success: false,
                error: (error as Error).message,
            });
        }
    });

    // POST /ai/aria/consult - Ask a specific provider for targeted knowledge
    app.post('/ai/aria/consult', async (c) => {
        try {
            const { getAIClient } = await import('../core/AIProvider.js');
            const client = getAIClient();
            const body = await c.req.json<{
                question: string;
                provider: 'claude' | 'grok' | 'openai' | 'gemini';
                advisorName?: string;  // Optional: use named advisor's personality
                role?: string;
                context?: string;
            }>();

            if (!client.hasProvider(body.provider)) {
                return c.json({
                    success: false,
                    error: `Provider ${body.provider} is not configured`,
                    availableProviders: client.getAvailableProviders(),
                });
            }

            // Find advisor config if specified or matching provider
            let advisorPersonality = '';
            let advisorIcon = '🤖';
            let advisorName = body.provider.toUpperCase();

            if (body.advisorName) {
                const advisor = ariaSettings.advisors.find(
                    a => a.name.toLowerCase() === body.advisorName!.toLowerCase() ||
                         a.aliases.some(alias => alias.toLowerCase() === body.advisorName!.toLowerCase())
                );
                if (advisor) {
                    advisorPersonality = advisor.personality || '';
                    advisorIcon = advisor.icon || '🤖';
                    advisorName = advisor.name;
                }
            } else {
                // Use personality from advisor matching this provider
                const advisor = ariaSettings.advisors.find(a => a.provider === body.provider);
                if (advisor) {
                    advisorPersonality = advisor.personality || '';
                    advisorIcon = advisor.icon || '🤖';
                    advisorName = advisor.name;
                }
            }

            const rolePrompt = body.role
                ? `You are acting as ${body.role}. `
                : advisorPersonality
                    ? advisorPersonality + ' '
                    : '';

            const result = await client.complete([
                { role: 'system', content: `${rolePrompt}Provide helpful, accurate, and actionable information.` },
                { role: 'user', content: body.context ? `Context: ${body.context}\n\nQuestion: ${body.question}` : body.question },
            ], {
                provider: body.provider,
                maxTokens: 1500,
                temperature: 0.7,
            });

            return c.json({
                success: true,
                provider: body.provider,
                advisorName,
                advisorIcon,
                model: result.model,
                response: result.content,
                usage: result.usage,
            });
        } catch (error) {
            return c.json({
                success: false,
                error: (error as Error).message,
            });
        }
    });

    return app;
}

// ============================================================================
// Server Factory
// ============================================================================

export async function startUnifiedWorkflowServer(port: number = 3002): Promise<{
    engine: UnifiedWorkflowEngine;
    masterKey: string;
    persistence: PersistenceLayer;
    supabase: SupabasePersistence | null;
}> {
    const security = new SecurityLayer();
    const persistence = new PersistenceLayer();
    let supabase: SupabasePersistence | null = null;

    // Try to connect to Supabase if configured
    if (hasSupabaseConfig()) {
        console.log('🔌 Supabase configured, connecting...');
        try {
            supabase = getSupabasePersistence();
            const connected = await supabase.connect();
            if (connected) {
                console.log('✅ Supabase connected successfully!');
            } else {
                console.log('⚠️  Supabase connection failed, falling back to file storage');
                supabase = null;
            }
        } catch (error) {
            console.log('⚠️  Supabase error:', (error as Error).message);
            console.log('📁 Falling back to file-based persistence');
            supabase = null;
        }
    } else {
        console.log('📁 No Supabase config found, using file-based persistence');
    }

    const engine = new UnifiedWorkflowEngine(
        new TrustEngine(),
        new Blackboard(),
        security,
        persistence
    );

    // Start auto-save for file persistence
    persistence.startAutoSave();

    const app = createWorkflowAPI(engine, supabase);

    serve({ fetch: app.fetch, port }, () => {
        console.log(`\n🚀 Unified Workflow API running on http://localhost:${port}`);
        console.log(`\n📊 Dashboard: http://localhost:${port}/dashboard/today`);
        console.log(`🎚️  Aggressiveness: http://localhost:${port}/dashboard/aggressiveness`);
        console.log(`📋 Tasks: http://localhost:${port}/tasks`);
        console.log(`✅ Approvals: http://localhost:${port}/approvals`);
        console.log(`\n💾 Persistence: ${supabase ? 'Supabase (Postgres)' : persistence.getDataDir()}`);
        console.log(`\n🔑 Master Key for human auth: ${security.getMasterKey()}\n`);
    });

    return { engine, masterKey: security.getMasterKey(), persistence, supabase };
}
