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
import type { TrustLevel } from '@vorionsys/atsf-core/types';
import { EventEmitter } from 'eventemitter3';
import type { WorkLoopAgent, WorkTask, TaskExecutionResult } from './AgentWorkLoop.js';

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
 * Behavioral signal types for work-loop integration
 */
export const WORK_LOOP_SIGNALS = {
    // Task completion signals
    TASK_COMPLETED: 'behavioral.task_completed',
    TASK_FAILED: 'behavioral.task_failed',
    TASK_TIMEOUT: 'behavioral.task_timeout',

    // Validation signals
    VALIDATION_PASSED: 'behavioral.validation_passed',
    VALIDATION_FAILED: 'behavioral.validation_failed',

    // Planning signals
    OBJECTIVE_DECOMPOSED: 'behavioral.objective_decomposed',

    // Recovery signals
    RECOVERY_SUCCESS: 'behavioral.recovery_success',
    RECOVERY_FAILED: 'behavioral.recovery_failed',

    // Compliance signals
    ESCALATION_PROPER: 'compliance.escalation_proper',
    POLICY_VIOLATION: 'compliance.policy_violation',
} as const;

// ============================================================================
// Trust Integration
// ============================================================================

export class TrustIntegration extends EventEmitter<TrustIntegrationEvents> {
    private trustEngine: TrustEngine;
    private enabled: boolean;
    private agentTierCache: Map<string, number> = new Map();

    constructor(config: TrustIntegrationConfig = {}) {
        super();

        this.enabled = config.enabled ?? true;

        this.trustEngine = createTrustEngine({
            decayRate: config.decayRate ?? 0.01,
            decayIntervalMs: config.decayIntervalMs ?? 60000,
            failureThreshold: config.failureThreshold ?? 0.3,
            acceleratedDecayMultiplier: config.acceleratedDecayMultiplier ?? 3.0,
            failureWindowMs: 3600000, // 1 hour
            minFailuresForAcceleration: 2,
        });

        // Listen to trust engine events
        this.setupEventListeners();

        console.log('[TrustIntegration] Initialized with ATSF-Core TrustEngine');
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
     * Initialize trust for a new agent
     */
    async initializeAgent(agent: WorkLoopAgent): Promise<TrustRecord> {
        // Map work-loop tier to ATSF trust level
        const initialLevel = this.workLoopTierToTrustLevel(agent.tier);

        const record = await this.trustEngine.initializeEntity(agent.id, initialLevel);
        this.agentTierCache.set(agent.id, record.level);

        console.log(`[TrustIntegration] Initialized agent ${agent.name} at T${record.level} (score: ${record.score})`);

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
}

// Singleton instance
export const trustIntegration = new TrustIntegration();
