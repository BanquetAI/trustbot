/**
 * Base AI Agent for TrustBot
 *
 * Abstract base class for connecting LLM providers to TrustBot Mission Control.
 * Extend this class to create provider-specific agents (Claude, Gemini, Grok, etc.)
 */

import 'dotenv/config';

// Types for task handling
export interface Task {
    id: string;
    title: string;
    description: string;
    type?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    context?: Record<string, unknown>;
}

export interface TaskResult {
    summary: string;
    confidence: number;
    data?: Record<string, unknown>;
}

export interface AgentConfig {
    name: string;
    type: string;
    tier: number;
    capabilities: string[];
    skills: string[];
    provider: string;
}

export interface LLMResponse {
    content: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
}

/**
 * Abstract base class for AI-powered TrustBot agents
 */
export abstract class BaseAIAgent {
    protected config: AgentConfig;
    protected agentId: string | null = null;
    protected apiBaseUrl: string;
    protected tokenId: string | null = null;
    protected masterKey: string;

    constructor(config: AgentConfig) {
        this.config = config;
        this.apiBaseUrl = process.env.TRUSTBOT_API_URL || 'https://trustbot-api.fly.dev';
        this.masterKey = process.env.MASTER_KEY || 'trustbot-master-key-2025';
    }

    /**
     * Initialize the agent - register with TrustBot and get auth token
     */
    async initialize(): Promise<void> {
        console.log(`\n🤖 Initializing ${this.config.name} (${this.config.provider})...`);

        // Get auth token
        const authRes = await fetch(`${this.apiBaseUrl}/auth/human`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ masterKey: this.masterKey }),
        });

        if (!authRes.ok) {
            throw new Error(`Failed to authenticate: ${await authRes.text()}`);
        }

        const auth = await authRes.json() as { tokenId: string };
        this.tokenId = auth.tokenId;
        console.log(`   ✅ Authenticated with TrustBot`);

        // Spawn agent
        const spawnRes = await fetch(`${this.apiBaseUrl}/api/spawn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: this.config.name,
                type: this.config.type.toUpperCase(),
                tier: this.config.tier,
                capabilities: this.config.capabilities,
                skills: this.config.skills,
            }),
        });

        if (!spawnRes.ok) {
            throw new Error(`Failed to spawn agent: ${await spawnRes.text()}`);
        }

        const spawn = await spawnRes.json() as { agent: { id: string } };
        this.agentId = spawn.agent.id;
        console.log(`   ✅ Agent spawned: ${this.agentId}`);
    }

    /**
     * Process a task using the LLM
     */
    async processTask(task: Task): Promise<TaskResult> {
        console.log(`\n📋 Processing task: ${task.title}`);
        console.log(`   Priority: ${task.priority}`);
        console.log(`   Description: ${task.description.substring(0, 100)}...`);

        const startTime = Date.now();

        try {
            // Build prompt for LLM
            const prompt = this.buildTaskPrompt(task);

            // Call LLM provider
            console.log(`   🧠 Calling ${this.config.provider}...`);
            const response = await this.callLLM(prompt);

            const duration = Date.now() - startTime;
            console.log(`   ⏱️  Completed in ${duration}ms`);

            // Parse response into result
            const result = this.parseResponse(response, task);
            console.log(`   📊 Confidence: ${result.confidence}%`);

            return result;
        } catch (error) {
            console.error(`   ❌ Error: ${error}`);
            throw error;
        }
    }

    /**
     * Build a prompt for the LLM based on the task
     */
    protected buildTaskPrompt(task: Task): string {
        return `You are an AI agent working within the TrustBot system. Your role is to complete tasks efficiently and accurately.

TASK: ${task.title}

DESCRIPTION:
${task.description}

PRIORITY: ${task.priority}

${task.context ? `CONTEXT:\n${JSON.stringify(task.context, null, 2)}` : ''}

Please complete this task. Provide:
1. A clear summary of what you accomplished
2. Any relevant data or results
3. Your confidence level (0-100) in the completion

Respond in JSON format:
{
    "summary": "Brief description of what was accomplished",
    "confidence": 85,
    "data": { "any": "relevant data" }
}`;
    }

    /**
     * Parse LLM response into TaskResult
     */
    protected parseResponse(response: LLMResponse, task: Task): TaskResult {
        try {
            // Try to parse JSON from response
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    summary: parsed.summary || 'Task completed',
                    confidence: Math.min(100, Math.max(0, parsed.confidence || 80)),
                    data: {
                        ...parsed.data,
                        provider: this.config.provider,
                        tokens: response.usage,
                    },
                };
            }
        } catch {
            // If JSON parsing fails, use the raw response
        }

        return {
            summary: response.content.substring(0, 200),
            confidence: 75,
            data: {
                rawResponse: response.content,
                provider: this.config.provider,
            },
        };
    }

    /**
     * Create a task, process it, and complete it
     */
    async executeTask(title: string, description: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'): Promise<void> {
        if (!this.agentId || !this.tokenId) {
            throw new Error('Agent not initialized. Call initialize() first.');
        }

        // Create task
        const createRes = await fetch(`${this.apiBaseUrl}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                priority,
                requiredTier: this.config.tier,
                approvalRequired: false,
            }),
        });

        if (!createRes.ok) {
            throw new Error(`Failed to create task: ${await createRes.text()}`);
        }

        const task = await createRes.json() as Task;
        console.log(`\n✅ Task created: ${task.id}`);

        // Assign to self
        const assignRes = await fetch(`${this.apiBaseUrl}/tasks/${task.id}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentId: this.agentId,
                tokenId: this.tokenId,
            }),
        });

        if (!assignRes.ok) {
            throw new Error(`Failed to assign task: ${await assignRes.text()}`);
        }
        console.log(`   ✅ Task assigned to ${this.config.name}`);

        // Process with LLM
        const result = await this.processTask(task);

        // Complete task
        const completeRes = await fetch(`${this.apiBaseUrl}/tasks/${task.id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                result,
                tokenId: this.tokenId,
            }),
        });

        if (!completeRes.ok) {
            throw new Error(`Failed to complete task: ${await completeRes.text()}`);
        }

        console.log(`\n🎉 Task completed successfully!`);
        console.log(`   Summary: ${result.summary}`);
    }

    /**
     * Abstract method - implement in subclass to call specific LLM provider
     */
    abstract callLLM(prompt: string): Promise<LLMResponse>;

    /**
     * Get agent info
     */
    getInfo(): { agentId: string | null; config: AgentConfig } {
        return {
            agentId: this.agentId,
            config: this.config,
        };
    }
}
