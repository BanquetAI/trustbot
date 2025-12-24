/**
 * Memory API Routes
 *
 * REST endpoints for Aria's memory system.
 *
 * Epic: Aria Memory & Knowledge System
 */

import { Hono } from 'hono';
import {
    getConversationMemoryService,
    getKnowledgeStoreService,
    getEmbeddingService,
} from '../../core/memory';
import type {
    ConversationEntryInput,
    KnowledgeEntryInput,
    KnowledgeSearchOptions,
} from '../../core/memory/types';

const memoryRoutes = new Hono();

// ============================================================================
// Conversation Endpoints
// ============================================================================

/**
 * Store a conversation message
 */
memoryRoutes.post('/conversations', async (c) => {
    try {
        const body = await c.req.json<ConversationEntryInput>();
        const service = getConversationMemoryService();
        const entry = await service.storeMessage(body);
        return c.json(entry, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Get session history
 */
memoryRoutes.get('/conversations/session/:sessionId', async (c) => {
    try {
        const sessionId = c.req.param('sessionId');
        const limit = parseInt(c.req.query('limit') || '50');
        const service = getConversationMemoryService();
        const history = await service.getSessionHistory(sessionId, limit);
        return c.json(history);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Get user history
 */
memoryRoutes.get('/conversations/user/:userId', async (c) => {
    try {
        const userId = c.req.param('userId');
        const limit = parseInt(c.req.query('limit') || '100');
        const service = getConversationMemoryService();
        const history = await service.getUserHistory(userId, limit);
        return c.json(history);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Search conversations semantically
 */
memoryRoutes.post('/conversations/search', async (c) => {
    try {
        const { query, userId, sessionId, limit, similarityThreshold } = await c.req.json();
        const service = getConversationMemoryService();
        const results = await service.searchConversations(query, {
            userId,
            sessionId,
            limit,
            similarityThreshold,
        });
        return c.json(results);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Get recent context for RAG
 */
memoryRoutes.get('/conversations/context/:userId', async (c) => {
    try {
        const userId = c.req.param('userId');
        const maxTokens = parseInt(c.req.query('maxTokens') || '1000');
        const sessionId = c.req.query('sessionId');
        const service = getConversationMemoryService();
        const context = await service.getRecentContext(userId, maxTokens, sessionId);
        return c.json(context);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Get conversation statistics
 */
memoryRoutes.get('/conversations/stats', async (c) => {
    try {
        const userId = c.req.query('userId');
        const service = getConversationMemoryService();
        const stats = await service.getStats(userId);
        return c.json(stats);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// ============================================================================
// Knowledge Endpoints
// ============================================================================

/**
 * Store knowledge entry
 */
memoryRoutes.post('/knowledge', async (c) => {
    try {
        const body = await c.req.json<KnowledgeEntryInput>();
        const service = getKnowledgeStoreService();
        const entry = await service.store(body);
        return c.json(entry, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Search knowledge semantically
 */
memoryRoutes.post('/knowledge/search', async (c) => {
    try {
        const { query, ...options } = await c.req.json<{ query: string } & KnowledgeSearchOptions>();
        const service = getKnowledgeStoreService();
        const results = await service.search(query, options);
        return c.json(results);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Get knowledge by category
 */
memoryRoutes.get('/knowledge/category/:category', async (c) => {
    try {
        const category = c.req.param('category') as any;
        const subcategory = c.req.query('subcategory');
        const limit = parseInt(c.req.query('limit') || '50');
        const service = getKnowledgeStoreService();
        const entries = await service.getByCategory(category, subcategory, limit);
        return c.json(entries);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Get knowledge entry by ID
 */
memoryRoutes.get('/knowledge/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const service = getKnowledgeStoreService();
        const entry = await service.getById(id);
        if (!entry) {
            return c.json({ error: 'Knowledge entry not found' }, 404);
        }
        return c.json(entry);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Update knowledge entry
 */
memoryRoutes.patch('/knowledge/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const updates = await c.req.json<Partial<KnowledgeEntryInput>>();
        const service = getKnowledgeStoreService();
        const entry = await service.update(id, updates);
        return c.json(entry);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Verify knowledge entry (HITL)
 */
memoryRoutes.post('/knowledge/:id/verify', async (c) => {
    try {
        const id = c.req.param('id');
        const { verifiedBy } = await c.req.json<{ verifiedBy: string }>();
        const service = getKnowledgeStoreService();
        const entry = await service.verify(id, verifiedBy);
        return c.json(entry);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Archive knowledge entry
 */
memoryRoutes.delete('/knowledge/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const service = getKnowledgeStoreService();
        await service.archive(id);
        return c.json({ success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Get agent-specific knowledge
 */
memoryRoutes.get('/knowledge/agent/:agentId', async (c) => {
    try {
        const agentId = c.req.param('agentId');
        const service = getKnowledgeStoreService();
        const entries = await service.getAgentKnowledge(agentId);
        return c.json(entries);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Get system architecture knowledge
 */
memoryRoutes.get('/knowledge/system/architecture', async (c) => {
    try {
        const service = getKnowledgeStoreService();
        const entries = await service.getSystemArchitecture();
        return c.json(entries);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Get knowledge statistics
 */
memoryRoutes.get('/knowledge/stats', async (c) => {
    try {
        const service = getKnowledgeStoreService();
        const stats = await service.getStats();
        return c.json(stats);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Seed system knowledge
 */
memoryRoutes.post('/knowledge/seed', async (c) => {
    try {
        const service = getKnowledgeStoreService();
        const count = await service.seedSystemKnowledge();
        return c.json({ seeded: count });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// ============================================================================
// Embedding Endpoints
// ============================================================================

/**
 * Generate embedding for text
 */
memoryRoutes.post('/embed', async (c) => {
    try {
        const { text } = await c.req.json<{ text: string }>();
        const service = getEmbeddingService();
        const result = await service.embed(text);
        return c.json({
            embedding: result.embedding,
            tokensUsed: result.tokensUsed,
            cached: result.cached,
            dimensions: result.embedding.length,
        });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

/**
 * Get embedding service stats
 */
memoryRoutes.get('/embed/stats', async (c) => {
    try {
        const service = getEmbeddingService();
        const stats = service.getCacheStats();
        return c.json(stats);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// ============================================================================
// Health Check
// ============================================================================

memoryRoutes.get('/health', async (c) => {
    try {
        // Quick health check
        const conversationService = getConversationMemoryService();
        const knowledgeService = getKnowledgeStoreService();

        return c.json({
            status: 'ok',
            services: {
                conversations: 'ready',
                knowledge: 'ready',
                embeddings: 'ready',
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        return c.json(
            {
                status: 'error',
                error: error.message,
            },
            500
        );
    }
});

export { memoryRoutes };
