import React from 'react';
import { TrustTierBadge } from './TrustTierBadge';
import type { Agent } from '../types';

/**
 * Agent List Modal
 * 
 * Displays all agents with their trust tiers and links to profiles.
 */

interface AgentListModalProps {
    agents: Agent[];
    onClose: () => void;
    onSelectAgent: (id: string) => void;
}

const AGENT_ICONS: Record<string, string> = {
    EXECUTOR: '🎖️',
    PLANNER: '🧠',
    VALIDATOR: '🛡️',
    EVOLVER: '🧬',
    SPAWNER: '🏭',
    LISTENER: '👂',
    WORKER: '🤖',
    SPECIALIST: '🔧',
    ORCHESTRATOR: '📋',
};

const STATUS_COLORS: Record<string, string> = {
    IDLE: 'var(--text-muted)',
    WORKING: 'var(--accent-green)',
    IN_MEETING: 'var(--accent-blue)',
    WAITING: 'var(--accent-gold)',
    SUSPENDED: 'var(--accent-red)',
};

export const AgentListModal: React.FC<AgentListModalProps> = ({ agents, onClose, onSelectAgent }) => {
    // Group agents by tier
    const agentsByTier = agents.reduce((acc, agent) => {
        const tier = agent.tier;
        if (!acc[tier]) acc[tier] = [];
        acc[tier].push(agent);
        return acc;
    }, {} as Record<number, Agent[]>);

    const sortedTiers = Object.keys(agentsByTier)
        .map(Number)
        .sort((a, b) => b - a);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh' }}>
                <div className="modal-header">
                    <h2>🤖 Agent Directory ({agents.length} Agents)</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-content" style={{ overflowY: 'auto', maxHeight: '60vh' }}>
                    {sortedTiers.map(tier => (
                        <div key={tier} style={{ marginBottom: '24px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '12px',
                                paddingBottom: '8px',
                                borderBottom: '1px solid var(--border-color)',
                            }}>
                                <TrustTierBadge tier={tier} size="medium" />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {agentsByTier[tier].length} agent{agentsByTier[tier].length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {agentsByTier[tier].map(agent => (
                                    <div
                                        key={agent.id}
                                        onClick={() => {
                                            onSelectAgent(agent.id);
                                            onClose();
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                                            e.currentTarget.style.transform = 'translateX(4px)';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.background = 'var(--bg-secondary)';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        {/* Icon */}
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'var(--bg-tertiary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.2rem',
                                        }}>
                                            {AGENT_ICONS[agent.type] ?? '🤖'}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                                                {agent.name}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {agent.type} • {agent.location.floor} / {agent.location.room}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '0.75rem',
                                            color: STATUS_COLORS[agent.status] || 'var(--text-muted)',
                                        }}>
                                            <span style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: STATUS_COLORS[agent.status] || 'var(--text-muted)',
                                            }} />
                                            {agent.status}
                                        </div>

                                        {/* Arrow */}
                                        <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem' }}>→</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AgentListModal;
