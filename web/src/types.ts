export type AgentStatus = 'IDLE' | 'WORKING' | 'IN_MEETING' | 'ERROR' | 'TERMINATED';
export type AgentType = 'EXECUTOR' | 'PLANNER' | 'VALIDATOR' | 'EVOLVER' | 'SPAWNER' | 'LISTENER' | 'WORKER';

// ============================================================================
// TRUST TIER SYSTEM - Anti-Delegation Rules
// ============================================================================

export enum TrustTier {
    UNTRUSTED = 0,
    PROBATIONARY = 1,
    TRUSTED = 2,
    VERIFIED = 3,
    CERTIFIED = 4,
    ELITE = 5,
}

export const TIER_CONFIG = {
    [TrustTier.UNTRUSTED]: {
        name: 'Untrusted',
        color: '#6b7280',
        threshold: 0,
        canDelegate: false,
        canSpawn: false,
        maxConcurrentTasks: 1,
    },
    [TrustTier.PROBATIONARY]: {
        name: 'Probationary',
        color: '#f59e0b',
        threshold: 200,
        canDelegate: false,
        canSpawn: false,
        maxConcurrentTasks: 1,
    },
    [TrustTier.TRUSTED]: {
        name: 'Trusted',
        color: '#3b82f6',
        threshold: 400,
        canDelegate: false,
        canSpawn: false,
        maxConcurrentTasks: 3,
    },
    [TrustTier.VERIFIED]: {
        name: 'Verified',
        color: '#8b5cf6',
        threshold: 600,
        canDelegate: true,
        canSpawn: false,
        maxConcurrentTasks: 5,
    },
    [TrustTier.CERTIFIED]: {
        name: 'Certified',
        color: '#10b981',
        threshold: 800,
        canDelegate: true,
        canSpawn: true,
        maxConcurrentTasks: 10,
    },
    [TrustTier.ELITE]: {
        name: 'Elite',
        color: '#f43f5e',
        threshold: 950,
        canDelegate: true,
        canSpawn: true,
        maxConcurrentTasks: Infinity,
    },
} as const;

export const EXECUTION_RULES = {
    MAX_DELEGATIONS: 2,
    TRUST_REWARDS: {
        TASK_COMPLETED: 10,
        TASK_REVIEWED_GOOD: 5,
        SUBTASK_COMPLETED: 3,
    },
    TRUST_PENALTIES: {
        TASK_FAILED: -15,
        TASK_TIMEOUT: -10,
        INVALID_DELEGATION: -20,
        EXCESSIVE_DELEGATION: -25,
    },
} as const;

// Helper: Get tier from trust score
export function getTierFromScore(score: number): TrustTier {
    for (const tier of [
        TrustTier.ELITE,
        TrustTier.CERTIFIED,
        TrustTier.VERIFIED,
        TrustTier.TRUSTED,
        TrustTier.PROBATIONARY,
    ]) {
        if (score >= TIER_CONFIG[tier].threshold) {
            return tier;
        }
    }
    return TrustTier.UNTRUSTED;
}

// Helper: Check if agent must execute (cannot delegate)
export function mustAgentExecute(agent: Agent, task: Task): boolean {
    const tier = getTierFromScore(agent.trustScore);
    // Low tiers must execute
    if (!TIER_CONFIG[tier].canDelegate) return true;
    // Max delegations reached
    if ((task.currentDelegations || 0) >= EXECUTION_RULES.MAX_DELEGATIONS) return true;
    return false;
}

export interface AgentLocation {
    floor: 'EXECUTIVE' | 'OPERATIONS' | 'WORKSPACE';
    room: string;
}

export interface Agent {
    id: string;
    name: string;
    type: AgentType;
    tier: number;
    status: AgentStatus;
    location: AgentLocation;
    trustScore: number;
    capabilities: string[];
    skills?: string[];
    parentId: string | null;
    childIds?: string[];
}

export interface BlackboardEntry {
    id: string;
    type: 'PROBLEM' | 'SOLUTION' | 'DECISION' | 'OBSERVATION' | 'TASK' | 'PATTERN';
    title: string;
    author: string;
    content: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
    timestamp: Date;
    comments?: { author: string; text: string; timestamp: Date | string }[];
}

export interface ChatMessage {
    id: string;
    channelId: string;
    senderId: string;
    content: string;
    timestamp: string;
    type: 'TEXT' | 'CODE' | 'ALERT';
}

export interface ChatChannel {
    id: string;
    name: string;
    type: 'PUBLIC' | 'DM';
    participants?: string[];
}

export interface Meeting {
    id: string;
    title: string;
    participants: string[];
    location: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface SystemState {
    agents: Agent[];
    blackboardEntries: BlackboardEntry[];
    meetings: Meeting[];
    hitlLevel: number;
    avgTrust: number;
    totalAgents: number;
    uptime: number;
    persistenceMode?: 'postgres' | 'memory';
}

export interface Task {
    id: string;
    description: string;
    type: string;
    creator: string;
    priority: string;
    status: string;
    assignee: string | null;
    assigneeName: string | null;
    progress: number;
    nextSteps: string;
    createdAt: string;
    updatedAt: string;
    // Anti-delegation tracking
    requiredTier?: TrustTier;
    maxDelegations?: number;
    currentDelegations?: number;
    delegationHistory?: Array<{ from: string; to: string; timestamp: string }>;
    // Execution results
    result?: {
        summary: string;
        completedBy: string;
        duration: string;
        confidence: number;
    };
    startedAt?: string;
    completedAt?: string;
}

export interface ApprovalRequest {
    id: string;
    type: 'SPAWN' | 'DECISION' | 'STRATEGY';
    requestor: string;
    summary: string;
    details: unknown;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}
