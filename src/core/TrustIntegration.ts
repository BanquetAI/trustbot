/**
 * Trust Integration
 *
 * Bridges AgentWorkLoop with ATSF-Core TrustEngine.
 * Records behavioral signals from task execution and uses trust scores
 * for tier-gated task assignment.
 */

import {
    createTrustEngine,
    TrustEngine,
    TRUST_THRESHOLDS,
    TRUST_LEVEL_NAMES,
    type TrustRecord,
    type TrustSignal,
    type TrustTierChangedEvent,
    type TrustFailureDetectedEvent,
} from '@vorionsys/atsf-core';
import { createFileProvider, type FilePersistenceProvider } from '@vorionsys/atsf-core/persistence';
import type { TrustLevel } from '@vorionsys/atsf-core/types';
import { EventEmitter } from 'eventemitter3';
import type { WorkLoopAgent, WorkTask, TaskExecutionResult } from './AgentWorkLoop.js';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

export interface TrustIntegrationConfig {
    /** Enable automatic signal recording (default: true) */
    enabled?: boolean;
    /** Decay rate per interval (default: 0.01 = 1%) */
    decayRate?: number;
    /** Decay interval in ms (default: 60000 = 1 minute) */
    decayIntervalMs?: number;
    /** Signal value below which is considered failure (default: 0.3) */
    failureThreshold?: number;
    /** Multiplier for decay when failures detected (default: 3.0) */
    acceleratedDecayMultiplier?: number;
    /** Path to persist trust records (default: ./trust-data.json) */
    persistencePath?: string;
    /** Auto-save interval in ms (default: 30000 = 30 seconds) */
    autoSaveIntervalMs?: number;
}

interface TrustIntegrationEvents {
    'trust:agent_promoted': (agentId: string, newTier: number, previousTier: number) => void;
    'trust:agent_demoted': (agentId: string, newTier: number, previousTier: number) => void;
    'trust:failure_detected': (agentId: string, failureCount: number) => void;
    'trust:score_updated': (agentId: string, score: number, tier: number) => void;
}

// ============================================================================
// Signal Type Definitions
// ============================================================================

/**
 * Signal types for work-loop integration across all trust dimensions
 */
export const WORK_LOOP_SIGNALS = {
    // -------------------------------------------------------------------------
    // Behavioral signals (40% weight)
    // -------------------------------------------------------------------------
    TASK_COMPLETED: 'behavioral.task_completed',
    TASK_FAILED: 'behavioral.task_failed',
    TASK_TIMEOUT: 'behavioral.task_timeout',
    VALIDATION_PASSED: 'behavioral.validation_passed',
    VALIDATION_FAILED: 'behavioral.validation_failed',
    OBJECTIVE_DECOMPOSED: 'behavioral.objective_decomposed',
    RECOVERY_SUCCESS: 'behavioral.recovery_success',
    RECOVERY_FAILED: 'behavioral.recovery_failed',

    // -------------------------------------------------------------------------
    // Compliance signals (25% weight)
    // -------------------------------------------------------------------------
    ESCALATION_PROPER: 'compliance.escalation_proper',
    POLICY_VIOLATION: 'compliance.policy_violation',
    TIER_RESPECTED: 'compliance.tier_respected',           // Stayed within tier bounds
    TIER_EXCEEDED: 'compliance.tier_exceeded',             // Attempted task above tier
    TIMEOUT_RESPECTED: 'compliance.timeout_respected',     // Completed within timeout
    RETRY_LIMIT_RESPECTED: 'compliance.retry_limit_respected', // Didn't exceed retries
    CONSTRAINT_FOLLOWED: 'compliance.constraint_followed', // Followed task constraints

    // -------------------------------------------------------------------------
    // Identity signals (20% weight)
    // -------------------------------------------------------------------------
    AGENT_REGISTERED: 'identity.agent_registered',         // Initial registration
    ROLE_CONSISTENT: 'identity.role_consistent',           // Acting within role
    ROLE_VIOLATION: 'identity.role_violation',             // Acting outside role
    CAPABILITY_VERIFIED: 'identity.capability_verified',   // Demonstrated capability
    SESSION_ACTIVE: 'identity.session_active',             // Continuous operation

    // -------------------------------------------------------------------------
    // Context signals (15% weight)
    // -------------------------------------------------------------------------
    APPROPRIATE_TASK: 'context.appropriate_task',          // Task matches agent context
    DEPENDENCY_SATISFIED: 'context.dependency_satisfied',  // Proper dependency handling
    PRIORITY_APPROPRIATE: 'context.priority_appropriate',  // Handled priority correctly
    WORKLOAD_BALANCED: 'context.workload_balanced',        // Not overloaded
} as const;

// ============================================================================
// Trust Integration
// ============================================================================

export class TrustIntegration extends EventEmitter<TrustIntegrationEvents> {
    private trustEngine: TrustEngine;
    private persistence: FilePersistenceProvider;
    private enabled: boolean;
    private agentTierCache: Map<string, number> = new Map();
    private initialized: boolean = false;
    private initPromise: Promise<void> | null = null;

    constructor(config: TrustIntegrationConfig = {}) {
        super();

        this.enabled = config.enabled ?? true;

        // Create file persistence provider (use DATA_DIR env var for Fly.io volume)
        const dataDir = process.env.DATA_DIR || '.';
        const persistencePath = config.persistencePath ?? join(dataDir, 'trust-data.json');
        this.persistence = createFileProvider({
            path: persistencePath,
            autoSaveIntervalMs: config.autoSaveIntervalMs ?? 30000, // 30 second auto-save
            prettyPrint: true,
        });

        this.trustEngine = createTrustEngine({
            decayRate: config.decayRate ?? 0.01,
            decayIntervalMs: config.decayIntervalMs ?? 60000,
            failureThreshold: config.failureThreshold ?? 0.3,
            acceleratedDecayMultiplier: config.acceleratedDecayMultiplier ?? 3.0,
            failureWindowMs: 3600000, // 1 hour
            minFailuresForAcceleration: 2,
            persistence: this.persistence,
            autoPersist: true,
        });

        // Listen to trust engine events
        this.setupEventListeners();

        // Start initialization (non-blocking)
        this.initPromise = this.initialize();

        console.log(`[TrustIntegration] Initialized with ATSF-Core TrustEngine (persistence: ${persistencePath})`);
    }

    /**
     * Initialize persistence and load existing trust records
     */
    private async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Initialize persistence provider
            await this.persistence.initialize();

            // Load existing records into trust engine
            const loadedCount = await this.trustEngine.loadFromPersistence();

            this.initialized = true;
            console.log(`[TrustIntegration] Loaded ${loadedCount} trust records from persistence`);
        } catch (err) {
            console.error('[TrustIntegration] Failed to initialize persistence:', err);
            this.initialized = true; // Mark as initialized anyway to allow operation
        }
    }

    /**
     * Ensure initialization is complete before operations
     */
    private async ensureInitialized(): Promise<void> {
        if (this.initPromise) {
            await this.initPromise;
        }
    }

    /**
     * Gracefully shutdown and save all trust records
     */
    async shutdown(): Promise<void> {
        console.log('[TrustIntegration] Shutting down...');
        try {
            await this.trustEngine.saveToPersistence();
            await this.persistence.close();
            console.log('[TrustIntegration] Shutdown complete, all records saved');
        } catch (err) {
            console.error('[TrustIntegration] Error during shutdown:', err);
        }
    }

    // -------------------------------------------------------------------------
    // Event Listeners
    // -------------------------------------------------------------------------

    private setupEventListeners(): void {
        // Tier change events
        this.trustEngine.on('trust:tier_changed', (event: TrustTierChangedEvent) => {
            const { entityId, newLevel, previousLevel, direction } = event;

            // Update cache
            this.agentTierCache.set(entityId, newLevel);

            if (direction === 'promoted') {
                this.emit('trust:agent_promoted', entityId, newLevel, previousLevel);
                console.log(`[TrustIntegration] Agent ${entityId} PROMOTED: T${previousLevel} -> T${newLevel}`);
            } else {
                this.emit('trust:agent_demoted', entityId, newLevel, previousLevel);
                console.log(`[TrustIntegration] Agent ${entityId} DEMOTED: T${previousLevel} -> T${newLevel}`);
            }
        });

        // Failure detection
        this.trustEngine.on('trust:failure_detected', (event: TrustFailureDetectedEvent) => {
            const { entityId, failureCount, acceleratedDecayActive } = event;
            this.emit('trust:failure_detected', entityId, failureCount);

            if (acceleratedDecayActive) {
                console.log(`[TrustIntegration] Agent ${entityId} accelerated decay ACTIVE (${failureCount} failures)`);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Agent Lifecycle
    // -------------------------------------------------------------------------

    /**
     * Initialize trust for a new agent (or restore from persistence)
     */
    async initializeAgent(agent: WorkLoopAgent): Promise<TrustRecord> {
        await this.ensureInitialized();

        // Check if agent already has trust record from persistence
        const existingRecord = await this.trustEngine.getScore(agent.id);
        if (existingRecord) {
            this.agentTierCache.set(agent.id, existingRecord.level);
            console.log(`[TrustIntegration] Restored agent ${agent.name} from persistence: T${existingRecord.level} (score: ${existingRecord.score})`);
            return existingRecord;
        }

        // Map work-loop tier to ATSF trust level for new agents
        const initialLevel = this.workLoopTierToTrustLevel(agent.tier);

        const record = await this.trustEngine.initializeEntity(agent.id, initialLevel);
        this.agentTierCache.set(agent.id, record.level);

        console.log(`[TrustIntegration] Initialized new agent ${agent.name} at T${record.level} (score: ${record.score})`);

        return record;
    }

    /**
     * Get current trust score for an agent
     */
    async getAgentTrust(agentId: string): Promise<TrustRecord | undefined> {
        return await this.trustEngine.getScore(agentId);
    }

    /**
     * Get the effective tier for an agent based on trust score
     */
    async getEffectiveTier(agentId: string): Promise<number> {
        const record = await this.trustEngine.getScore(agentId);
        if (!record) return 1; // Default to T1 if not found

        // Cache the tier
        this.agentTierCache.set(agentId, record.level);

        return record.level;
    }

    /**
     * Check if agent's trust tier meets requirement
     */
    async meetsRequirement(agentId: string, requiredTier: number): Promise<boolean> {
        const effectiveTier = await this.getEffectiveTier(agentId);
        return effectiveTier >= requiredTier;
    }

    // -------------------------------------------------------------------------
    // Signal Recording
    // -------------------------------------------------------------------------

    /**
     * Record task completion signal
     */
    async recordTaskCompleted(
        agent: WorkLoopAgent,
        task: WorkTask,
        result: TaskExecutionResult
    ): Promise<void> {
        if (!this.enabled) return;

        // Calculate signal value based on confidence and success
        const value = result.success
            ? Math.min(1.0, (result.confidence / 100) * 1.2) // Boost successful completions
            : 0.2;

        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.TASK_COMPLETED, value, {
            taskId: task.id,
            taskType: task.type,
            taskPriority: task.priority,
            confidence: result.confidence,
            duration: result.duration,
            success: result.success,
        });
    }

    /**
     * Record task failure signal
     */
    async recordTaskFailed(
        agent: WorkLoopAgent,
        task: WorkTask,
        error: string
    ): Promise<void> {
        if (!this.enabled) return;

        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.TASK_FAILED, 0.15, {
            taskId: task.id,
            taskType: task.type,
            taskPriority: task.priority,
            error: error.substring(0, 200),
        });
    }

    /**
     * Record task timeout signal
     */
    async recordTaskTimeout(agent: WorkLoopAgent, task: WorkTask): Promise<void> {
        if (!this.enabled) return;

        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.TASK_TIMEOUT, 0.2, {
            taskId: task.id,
            taskType: task.type,
            timeoutMs: task.timeoutMs,
        });
    }

    /**
     * Record validation passed signal
     */
    async recordValidationPassed(
        agent: WorkLoopAgent,
        task: WorkTask,
        score: number
    ): Promise<void> {
        if (!this.enabled) return;

        // Higher validation score = higher signal value
        const value = Math.min(1.0, (score / 100) * 1.1);

        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.VALIDATION_PASSED, value, {
            taskId: task.id,
            validationScore: score,
        });
    }

    /**
     * Record validation failed signal
     */
    async recordValidationFailed(
        agent: WorkLoopAgent,
        task: WorkTask,
        score: number
    ): Promise<void> {
        if (!this.enabled) return;

        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.VALIDATION_FAILED, 0.25, {
            taskId: task.id,
            validationScore: score,
        });
    }

    /**
     * Record objective decomposition signal
     */
    async recordObjectiveDecomposed(
        agent: WorkLoopAgent,
        task: WorkTask,
        subtaskCount: number
    ): Promise<void> {
        if (!this.enabled) return;

        // Reasonable decomposition (2-10 subtasks) gets high signal
        const value = subtaskCount >= 2 && subtaskCount <= 10 ? 0.9 : 0.6;

        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.OBJECTIVE_DECOMPOSED, value, {
            taskId: task.id,
            subtaskCount,
        });
    }

    /**
     * Record recovery signal
     */
    async recordRecovery(agent: WorkLoopAgent, success: boolean): Promise<void> {
        if (!this.enabled) return;

        const signalType = success
            ? WORK_LOOP_SIGNALS.RECOVERY_SUCCESS
            : WORK_LOOP_SIGNALS.RECOVERY_FAILED;

        await this.recordSignal(agent.id, signalType, success ? 0.7 : 0.2, {
            consecutiveFailures: agent.consecutiveFailures,
        });
    }

    /**
     * Record escalation signal
     */
    async recordEscalation(agent: WorkLoopAgent, task: WorkTask, reason: string): Promise<void> {
        if (!this.enabled) return;

        // Proper escalation is good compliance behavior
        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.ESCALATION_PROPER, 0.8, {
            taskId: task.id,
            reason: reason.substring(0, 200),
        });
    }

    // -------------------------------------------------------------------------
    // Compliance Signal Recording (25% weight)
    // -------------------------------------------------------------------------

    /**
     * Record tier compliance signal - agent stayed within tier bounds
     */
    async recordTierCompliance(
        agent: WorkLoopAgent,
        task: WorkTask,
        respected: boolean
    ): Promise<void> {
        if (!this.enabled) return;

        const signalType = respected
            ? WORK_LOOP_SIGNALS.TIER_RESPECTED
            : WORK_LOOP_SIGNALS.TIER_EXCEEDED;

        await this.recordSignal(agent.id, signalType, respected ? 0.9 : 0.2, {
            agentTier: agent.tier,
            requiredTier: task.requiredTier,
            taskId: task.id,
        });
    }

    /**
     * Record timeout compliance signal - task completed within time limit
     */
    async recordTimeoutCompliance(
        agent: WorkLoopAgent,
        task: WorkTask,
        actualDuration: number
    ): Promise<void> {
        if (!this.enabled) return;

        const withinTimeout = actualDuration <= task.timeoutMs;
        // Better score for faster completion (relative to timeout)
        const efficiency = withinTimeout
            ? Math.min(1.0, 1.0 - (actualDuration / task.timeoutMs) * 0.3) // 0.7-1.0 range
            : 0.2;

        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.TIMEOUT_RESPECTED, efficiency, {
            taskId: task.id,
            timeoutMs: task.timeoutMs,
            actualDuration,
            withinTimeout,
        });
    }

    /**
     * Record retry limit compliance
     */
    async recordRetryCompliance(
        agent: WorkLoopAgent,
        task: WorkTask,
        retriesUsed: number
    ): Promise<void> {
        if (!this.enabled) return;

        const withinLimit = retriesUsed <= task.maxRetries;
        // Better score for fewer retries needed
        const efficiency = withinLimit
            ? Math.max(0.5, 1.0 - (retriesUsed / task.maxRetries) * 0.5)
            : 0.2;

        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.RETRY_LIMIT_RESPECTED, efficiency, {
            taskId: task.id,
            maxRetries: task.maxRetries,
            retriesUsed,
            withinLimit,
        });
    }

    /**
     * Record general constraint compliance
     */
    async recordConstraintFollowed(
        agent: WorkLoopAgent,
        constraintType: string,
        followed: boolean
    ): Promise<void> {
        if (!this.enabled) return;

        await this.recordSignal(
            agent.id,
            WORK_LOOP_SIGNALS.CONSTRAINT_FOLLOWED,
            followed ? 0.85 : 0.15,
            { constraintType, followed }
        );
    }

    // -------------------------------------------------------------------------
    // Identity Signal Recording (20% weight)
    // -------------------------------------------------------------------------

    /**
     * Record agent registration identity signal
     */
    async recordAgentRegistered(agent: WorkLoopAgent): Promise<void> {
        if (!this.enabled) return;

        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.AGENT_REGISTERED, 0.9, {
            agentName: agent.name,
            agentRole: agent.role,
            initialTier: agent.tier,
        });
    }

    /**
     * Record baseline signals for all dimensions to establish initial trust
     * Called when an agent is first registered to ensure they maintain their assigned tier
     */
    async recordInitialBaseline(agent: WorkLoopAgent): Promise<void> {
        if (!this.enabled) return;

        // Calculate baseline value based on assigned tier (higher tier = higher baseline)
        // T5 = 1.0, T4 = 0.93, T3 = 0.86, T2 = 0.79, T1 = 0.72
        // Formula: 0.65 + (tier * 0.07)
        const baselineValue = Math.min(1.0, 0.65 + (agent.tier * 0.07));

        // Record baseline signals for ALL FOUR dimensions
        // Behavioral (40% weight)
        await this.recordSignal(agent.id, 'behavioral.baseline', baselineValue, {
            reason: 'Initial registration baseline',
            agentTier: agent.tier,
        });

        // Compliance (25% weight)
        await this.recordSignal(agent.id, 'compliance.baseline', baselineValue, {
            reason: 'Initial registration baseline',
            agentTier: agent.tier,
        });

        // Identity (20% weight)
        await this.recordSignal(agent.id, 'identity.baseline', baselineValue, {
            reason: 'Initial registration baseline',
            agentTier: agent.tier,
        });

        // Context (15% weight)
        await this.recordSignal(agent.id, 'context.baseline', baselineValue, {
            reason: 'Initial registration baseline',
            agentTier: agent.tier,
        });

        console.log(`[TrustIntegration] Recorded baseline signals for ${agent.name} (baseline: ${baselineValue.toFixed(2)})`);
    }

    /**
     * Record role consistency signal - agent acting within its defined role
     */
    async recordRoleConsistency(
        agent: WorkLoopAgent,
        task: WorkTask,
        consistent: boolean
    ): Promise<void> {
        if (!this.enabled) return;

        const signalType = consistent
            ? WORK_LOOP_SIGNALS.ROLE_CONSISTENT
            : WORK_LOOP_SIGNALS.ROLE_VIOLATION;

        await this.recordSignal(agent.id, signalType, consistent ? 0.9 : 0.15, {
            agentRole: agent.role,
            requiredRole: task.requiredRole,
            taskType: task.type,
            taskId: task.id,
        });
    }

    /**
     * Record capability verification signal - agent demonstrated expected capability
     */
    async recordCapabilityVerified(
        agent: WorkLoopAgent,
        capability: string,
        verified: boolean
    ): Promise<void> {
        if (!this.enabled) return;

        await this.recordSignal(
            agent.id,
            WORK_LOOP_SIGNALS.CAPABILITY_VERIFIED,
            verified ? 0.85 : 0.3,
            { capability, verified, agentRole: agent.role }
        );
    }

    /**
     * Record session activity signal - agent maintaining active presence
     */
    async recordSessionActive(agent: WorkLoopAgent): Promise<void> {
        if (!this.enabled) return;

        await this.recordSignal(agent.id, WORK_LOOP_SIGNALS.SESSION_ACTIVE, 0.7, {
            agentName: agent.name,
            status: agent.status,
            executionCount: agent.executionCount,
        });
    }

    // -------------------------------------------------------------------------
    // Context Signal Recording (15% weight)
    // -------------------------------------------------------------------------

    /**
     * Record appropriate task context signal
     */
    async recordAppropriateTask(
        agent: WorkLoopAgent,
        task: WorkTask,
        appropriate: boolean
    ): Promise<void> {
        if (!this.enabled) return;

        await this.recordSignal(
            agent.id,
            WORK_LOOP_SIGNALS.APPROPRIATE_TASK,
            appropriate ? 0.85 : 0.3,
            {
                taskId: task.id,
                taskType: task.type,
                agentRole: agent.role,
                agentTier: agent.tier,
                appropriate,
            }
        );
    }

    /**
     * Record dependency satisfaction signal
     */
    async recordDependencySatisfied(
        agent: WorkLoopAgent,
        task: WorkTask,
        satisfied: boolean
    ): Promise<void> {
        if (!this.enabled) return;

        await this.recordSignal(
            agent.id,
            WORK_LOOP_SIGNALS.DEPENDENCY_SATISFIED,
            satisfied ? 0.9 : 0.2,
            {
                taskId: task.id,
                dependencyCount: task.dependencies?.length || 0,
                satisfied,
            }
        );
    }

    /**
     * Record priority handling signal
     */
    async recordPriorityHandling(
        agent: WorkLoopAgent,
        task: WorkTask,
        handledAppropriately: boolean
    ): Promise<void> {
        if (!this.enabled) return;

        // Higher priority tasks get more weight when handled well
        const priorityMultiplier = task.priority === 'CRITICAL' ? 1.0
            : task.priority === 'HIGH' ? 0.9
            : task.priority === 'MEDIUM' ? 0.8
            : 0.7;

        const value = handledAppropriately ? priorityMultiplier : 0.25;

        await this.recordSignal(
            agent.id,
            WORK_LOOP_SIGNALS.PRIORITY_APPROPRIATE,
            value,
            {
                taskId: task.id,
                priority: task.priority,
                handledAppropriately,
            }
        );
    }

    /**
     * Record workload balance signal
     */
    async recordWorkloadBalance(
        agent: WorkLoopAgent,
        balanced: boolean,
        currentLoad: number,
        maxLoad: number
    ): Promise<void> {
        if (!this.enabled) return;

        const loadRatio = currentLoad / maxLoad;
        // Best score at 50-80% utilization
        const efficiency = balanced
            ? (loadRatio >= 0.5 && loadRatio <= 0.8 ? 0.9 : 0.7)
            : 0.4;

        await this.recordSignal(
            agent.id,
            WORK_LOOP_SIGNALS.WORKLOAD_BALANCED,
            efficiency,
            {
                currentLoad,
                maxLoad,
                loadRatio,
                balanced,
            }
        );
    }

    /**
     * Generic signal recording
     */
    private async recordSignal(
        entityId: string,
        type: string,
        value: number,
        metadata: Record<string, unknown> = {}
    ): Promise<void> {
        const signal: TrustSignal = {
            id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            entityId,
            type,
            value: Math.max(0, Math.min(1, value)), // Clamp to 0-1
            source: 'work-loop',
            timestamp: new Date().toISOString(),
            metadata,
        };

        await this.trustEngine.recordSignal(signal);

        // Get updated score and emit event
        const record = await this.trustEngine.getScore(entityId);
        if (record) {
            this.emit('trust:score_updated', entityId, record.score, record.level);
        }
    }

    // -------------------------------------------------------------------------
    // Utility Methods
    // -------------------------------------------------------------------------

    /**
     * Convert work-loop tier (numeric) to ATSF trust level
     */
    private workLoopTierToTrustLevel(tier: number): TrustLevel {
        // Work-loop uses 1-5, ATSF uses 0-5
        // Map: WL1->T1, WL2->T2, WL3->T3, WL4->T4, WL5->T5
        return Math.min(5, Math.max(0, tier)) as TrustLevel;
    }

    /**
     * Get trust level name
     */
    getTrustLevelName(level: number): string {
        return TRUST_LEVEL_NAMES[level as TrustLevel] || 'Unknown';
    }

    /**
     * Get trust threshold for a level
     */
    getTrustThreshold(level: number): { min: number; max: number } {
        return TRUST_THRESHOLDS[level as TrustLevel] || { min: 0, max: 99 };
    }

    /**
     * Get all agent IDs with trust records
     */
    getTrackedAgents(): string[] {
        return this.trustEngine.getEntityIds();
    }

    /**
     * Check if accelerated decay is active for an agent
     */
    isAcceleratedDecayActive(agentId: string): boolean {
        return this.trustEngine.isAcceleratedDecayActive(agentId);
    }

    /**
     * Get failure count for an agent
     */
    getFailureCount(agentId: string): number {
        return this.trustEngine.getFailureCount(agentId);
    }

    /**
     * Get trust summary for all agents
     */
    async getTrustSummary(): Promise<Array<{
        agentId: string;
        score: number;
        tier: number;
        tierName: string;
        acceleratedDecay: boolean;
        failureCount: number;
    }>> {
        const summary = [];

        for (const agentId of this.trustEngine.getEntityIds()) {
            const record = await this.trustEngine.getScore(agentId);
            if (record) {
                summary.push({
                    agentId,
                    score: record.score,
                    tier: record.level,
                    tierName: this.getTrustLevelName(record.level),
                    acceleratedDecay: this.isAcceleratedDecayActive(agentId),
                    failureCount: this.getFailureCount(agentId),
                });
            }
        }

        return summary;
    }

    /**
     * Enable/disable trust signal recording
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        console.log(`[TrustIntegration] Signal recording ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    /**
     * Check if trust integration is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Reset all trust data - clear persistence and memory
     * Use this to start fresh after data corruption or major changes
     */
    async resetTrust(): Promise<void> {
        await this.ensureInitialized();

        console.log('[TrustIntegration] Resetting all trust data...');

        // Clear in-memory cache
        this.agentTierCache.clear();

        // Clear trust engine records
        for (const entityId of this.trustEngine.getEntityIds()) {
            await this.trustEngine.removeEntity(entityId);
        }

        // Clear persistence
        await this.persistence.clear();

        console.log('[TrustIntegration] Trust data reset complete');
    }

    /**
     * Re-initialize an agent with fresh baseline (use after reset)
     */
    async reinitializeAgent(agent: WorkLoopAgent): Promise<TrustRecord> {
        // Remove any existing record
        const existing = await this.trustEngine.getScore(agent.id);
        if (existing) {
            await this.trustEngine.removeEntity(agent.id);
        }

        // Initialize fresh
        const initialLevel = this.workLoopTierToTrustLevel(agent.tier);
        const record = await this.trustEngine.initializeEntity(agent.id, initialLevel);
        this.agentTierCache.set(agent.id, record.level);

        // Record baseline signals
        await this.recordInitialBaseline(agent);

        // Force persist
        await this.trustEngine.saveToPersistence();

        console.log(`[TrustIntegration] Reinitialized ${agent.name} at T${record.level}`);

        return record;
    }
}

// Singleton instance
export const trustIntegration = new TrustIntegration();
