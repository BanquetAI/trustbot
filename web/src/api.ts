/**
 * API Hooks for React
 * 
 * Provides data fetching and mutation hooks for the TrustBot API.
 * Auto-detects Vercel (production) vs local development.
 */

// Use relative path for Vercel, absolute for local dev
const API_BASE = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api'  // Vercel - uses serverless functions
    : 'http://localhost:3001/api';  // Local dev - uses Express server

// ============================================================================
// Types
// ============================================================================
import type { Agent, BlackboardEntry, ApprovalRequest, Task, ChatMessage } from './types';

// Re-export types for consumers that import from api.ts
export type { Agent, BlackboardEntry, ApprovalRequest, Task, ChatMessage } from './types';

// API Response type (matches actual API shape, differs from frontend SystemState)
export interface APISystemState {
    agents: Array<Agent & { childIds?: string[]; skills?: string[] }>;
    blackboard: Array<{
        id: string;
        type: string;
        title: string;
        content: unknown;
        author: string;
        priority: string;
        status: string;
        createdAt: string;
        comments?: Array<{ author: string; text: string; timestamp: string }>;
    }>;
    hitlLevel: number;
    avgTrust: number;
    day?: number;
    events?: string[];
    persistenceMode?: 'postgres' | 'memory';
}

// ============================================================================
// Fetch Helpers
// ============================================================================

async function fetchAPI<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

async function postAPI<T>(path: string, data: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

// ============================================================================
// API Functions
// ============================================================================

export const api = {
    // GET
    getState: () => fetchAPI<APISystemState>('/state'),
    getAgents: () => fetchAPI<Agent[]>('/agents'),
    getAgent: (id: string) => fetchAPI<Agent>(`/agent/${id}`),
    getBlackboard: () => fetchAPI<BlackboardEntry[]>('/blackboard'),
    getApprovals: () => fetchAPI<ApprovalRequest[]>('/approvals'),
    getStats: () => fetchAPI<{ hitlLevel: number; avgTrust: number; agentCount: number; day: number }>('/stats'),
    getUptime: () => fetchAPI<{ uptime: number; formatted: string; startTimeISO: string }>('/uptime'),
    getTasks: () => fetchAPI<{ tasks: Task[] }>('/tasks'),
    postComment: (entryId: string, comment: string, author: string) =>
        postAPI<{ success: boolean; entry: any }>('/state', { action: 'comment', entryId, comment, author }),

    // POST
    spawnAgent: (params: { name: string; type: string; tier: number }) =>
        postAPI<Agent>('/spawn', params),

    setHITL: (level: number) =>
        postAPI<{ success: boolean; hitlLevel: number }>('/hitl', { level }),

    sendCommand: (target: string, command: string, agent?: { name: string; type: string; status: string; trustScore: number }) =>
        postAPI<{ success: boolean; command: string; response: string; agentType: string; timestamp: string }>('/command', { target, command, agent }),

    broadcast: (target: string, message: string) =>
        postAPI<{ success: boolean; message: string }>('/broadcast', { target, message }),

    scheduleMeeting: (room: string, topic: string, duration: number) =>
        postAPI<{ success: boolean; message: string }>('/meetings', { room, topic, duration }),

    approve: (id: string, approved: boolean) =>
        postAPI<ApprovalRequest>('/approve', { id, approved }),

    postToBlackboard: (params: { type: string; title: string; content: unknown; priority: string }) =>
        postAPI<BlackboardEntry>('/blackboard/post', params),

    postSettings: (category: string, key: string, value: any) =>
        postAPI<{ success: boolean }>('/settings', { category, key, value }),

    getSettings: () => fetchAPI<Record<string, any>>('/settings'),

    advanceDay: () =>
        postAPI<{ success: boolean; day: number }>('/advance-day', {}),

    getSkills: () => fetchAPI<any[]>('/skills'),
    createSkill: (skill: any) => postAPI<any>('/skills', { action: 'create', skill }),

    getChatMessages: (channelId?: string) => fetchAPI<ChatMessage[]>((channelId ? `/chat?channelId=${channelId}` : '/chat')),
    sendChatMessage: (message: Partial<ChatMessage>) => postAPI<ChatMessage>('/chat', { message }),

    // Agent Tick System - triggers the agent work loop
    tick: () => fetchAPI<{
        success: boolean;
        tick: number;
        timestamp: string;
        processed: number;
        assigned: number;
        completed: number;
        queue: { pending: number; inProgress: number; totalTasks: number };
        trustSystem?: {
            avgTrust: number;
            agentsByTier: Record<string, number>;
        };
        events: string[];
        newBlackboardEntries: number;
    }>('/tick'),

    // Create a new task for agents to work on
    createTask: (description: string, creator: string, priority?: string) =>
        postAPI<{ success: boolean; task: any; message: string }>('/tasks', {
            action: 'create',
            description,
            creator,
            priority: priority || 'NORMAL',
        }),

    // Claude API Executor - real LLM reasoning for agents
    executeAgent: (agentId: string, taskId: string, mode: 'auto' | 'real' | 'simulation' = 'auto') =>
        postAPI<{
            success: boolean;
            mode: string;
            action: string;
            message: string;
            agent: { id: string; name: string; trustScore: number; tier: string };
            task: { id: string; status: string; result?: any };
        }>('/executor', { agentId, taskId, mode }),

    // SSE Stream - real-time updates (returns snapshot if not SSE)
    getStreamSnapshot: () => fetchAPI<{
        connected: boolean;
        mode: string;
        state: APISystemState | null;
        tasks: any[];
        trustSystem: {
            distribution: Record<string, number>;
            avgTrust: number;
        };
        timestamp: string;
    }>('/stream'),

    // Task Delegation API
    getDelegationRules: () => fetchAPI<{
        rules: { maxDelegations: number; minTierToDelegate: string; penalties: Record<string, number> };
        tiers: Array<{ level: number; name: string; threshold: number; canDelegate: boolean }>;
    }>('/delegate'),

    getTaskDelegationStatus: (taskId: string) => fetchAPI<{
        taskId: string;
        description: string;
        currentDelegations: number;
        maxDelegations: number;
        remainingDelegations: number;
        canDelegate: boolean;
        delegationHistory: Array<{
            id: string;
            from: { id: string; name: string; trustScore: number; tier: string };
            to: { id: string; name: string; trustScore: number; tier: string };
            reason: string;
            timestamp: string;
            delegationNumber: number;
        }>;
        currentAssignee: string;
    }>(`/delegate?taskId=${taskId}`),

    delegateTask: (taskId: string, fromAgentId: string, toAgentId: string, reason?: string) =>
        postAPI<{
            success: boolean;
            delegation: any;
            task: { id: string; status: string; assignee: string; currentDelegations: number; remainingDelegations: number; canDelegateAgain: boolean };
            message: string;
        }>('/delegate', { taskId, fromAgentId, toAgentId, reason }),

    // MCP Server API
    getMCPTools: () => fetchAPI<{
        name: string;
        version: string;
        description: string;
        tools: Array<{ name: string; description: string; inputSchema: any }>;
    }>('/mcp'),

    callMCPTool: (tool: string, params: Record<string, any> = {}) =>
        postAPI<{ success: boolean; result: any }>('/mcp', { tool, params }),
};

// ============================================================================
// React Hooks
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function useSystemState(pollInterval = 2000) {
    const [state, setState] = useState<APISystemState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const data = await api.getState();
            setState(data);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, pollInterval);
        return () => clearInterval(interval);
    }, [refresh, pollInterval]);

    return { state, error, loading, refresh };
}

export function useApprovals(pollInterval = 3000) {
    const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await api.getApprovals();
                setApprovals(data);
            } catch {
                // Ignore errors
            }
        };

        fetch();
        const interval = setInterval(fetch, pollInterval);
        return () => clearInterval(interval);
    }, [pollInterval]);

    return approvals;
}
