import React, { useState } from 'react';
import { TrustTierBadge } from './TrustTierBadge';
import type { Agent, BlackboardEntry } from '../types';

/**
 * Agent Profile Page
 * 
 * Detailed view of an agent with trust history, capabilities,
 * activity log, and relationship to other agents.
 */

interface CommandResponse {
    command: string;
    response: string;
    timestamp: string;
}

interface AgentProfilePageProps {
    agent: Agent;
    allAgents: Agent[];
    blackboardEntries: BlackboardEntry[];
    onClose: () => void;
    onViewAgent?: (agentId: string) => void;
    onSendCommand?: (command: string) => Promise<CommandResponse | null>;
}

const AGENT_ICONS: Record<string, string> = {
    EXECUTOR: '🎖️',
    PLANNER: '🧠',
    VALIDATOR: '🛡️',
    EVOLVER: '🧬',
    SPAWNER: '🏭',
    LISTENER: '👂',
    WORKER: '🤖',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    IDLE: { bg: 'rgba(107, 114, 128, 0.2)', color: 'var(--text-muted)' },
    WORKING: { bg: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-green)' },
    IN_MEETING: { bg: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-blue)' },
    ERROR: { bg: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)' },
};

export const AgentProfilePage: React.FC<AgentProfilePageProps> = ({
    agent,
    allAgents,
    blackboardEntries,
    onClose,
    onViewAgent,
    onSendCommand,
}) => {
    const [commandHistory, setCommandHistory] = useState<CommandResponse[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const icon = AGENT_ICONS[agent.type] || '🤖';
    const statusStyle = STATUS_COLORS[agent.status] || STATUS_COLORS.IDLE;

    // Get agent's blackboard entries
    const agentEntries = blackboardEntries.filter(e => e.author === agent.id);

    // Get related agents (same location or parent/child relationships)
    const relatedAgents = allAgents.filter(a =>
        a.id !== agent.id && (
            a.location.room === agent.location.room ||
            a.id === agent.id // Parent/child would go here
        )
    ).slice(0, 5);

    // Calculate trust progress to next tier
    const tierThresholds = [0, 200, 400, 600, 800, 950];
    const currentTierMin = tierThresholds[agent.tier] || 0;
    const nextTierMin = tierThresholds[agent.tier + 1] || 1000;
    const progress = ((agent.trustScore - currentTierMin) / (nextTierMin - currentTierMin)) * 100;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '800px', maxHeight: '90vh' }}
                role="dialog"
                aria-labelledby="agent-profile-title"
            >
                {/* Header */}
                <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            border: `3px solid ${statusStyle.color}`,
                        }}>
                            {icon}
                        </div>
                        <div>
                            <h2 id="agent-profile-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {agent.name}
                                <TrustTierBadge tier={agent.tier} size="medium" />
                            </h2>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {agent.type} • {agent.location.floor} / {agent.location.room}
                            </div>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '8px',
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-full)',
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                            }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: statusStyle.color,
                                    animation: agent.status === 'WORKING' ? 'pulse 2s infinite' : 'none',
                                }} />
                                {agent.status}
                            </div>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="modal-content" style={{ overflowY: 'auto', maxHeight: '70vh' }}>
                    {/* Trust Score Section */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        marginBottom: '20px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>🏆 Trust Score</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                                {agent.trustScore} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 1000</span>
                            </span>
                        </div>
                        <div style={{
                            height: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                width: `${Math.min(progress, 100)}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
                            {agent.tier < 5 ? `${Math.round(progress)}% to Tier ${agent.tier + 1}` : '✨ Maximum Tier'}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '12px',
                        marginBottom: '20px',
                    }}>
                        <div style={{
                            textAlign: 'center',
                            padding: '16px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                                {agentEntries.length}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CONTRIBUTIONS</div>
                        </div>
                        <div style={{
                            textAlign: 'center',
                            padding: '16px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                                {agentEntries.filter(e => e.status === 'RESOLVED').length}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RESOLVED</div>
                        </div>
                        <div style={{
                            textAlign: 'center',
                            padding: '16px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                                T{agent.tier}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TIER</div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        marginBottom: '20px',
                    }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>📋 Recent Activity</h3>
                        {agentEntries.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {agentEntries.slice(0, 5).map(entry => (
                                    <div key={entry.id} style={{
                                        padding: '10px 12px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-sm)',
                                        borderLeft: '3px solid var(--accent-blue)',
                                        fontSize: '0.8rem',
                                    }}>
                                        <div style={{ fontWeight: 500 }}>{entry.title}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            {entry.type} • {entry.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
                                No recent activity
                            </div>
                        )}
                    </div>

                    {/* Related Agents */}
                    {relatedAgents.length > 0 && (
                        <div style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '20px',
                            marginBottom: '20px',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>👥 Nearby Agents</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {relatedAgents.map(a => (
                                    <div
                                        key={a.id}
                                        onClick={() => onViewAgent?.(a.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: onViewAgent ? 'pointer' : 'default',
                                            transition: 'transform 0.1s ease',
                                        }}
                                        onMouseOver={e => onViewAgent && (e.currentTarget.style.transform = 'scale(1.02)')}
                                        onMouseOut={e => onViewAgent && (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        <span>{AGENT_ICONS[a.type] || '🤖'}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{a.name}</span>
                                        <TrustTierBadge tier={a.tier} size="small" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Command Input */}
                    {onSendCommand && (
                        <div style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '20px',
                        }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>💬 Send Command</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Enter command..."
                                    disabled={isProcessing}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.85rem',
                                        opacity: isProcessing ? 0.6 : 1,
                                    }}
                                    onKeyDown={async e => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim() && !isProcessing) {
                                            const cmd = e.currentTarget.value.trim();
                                            e.currentTarget.value = '';
                                            setIsProcessing(true);
                                            const response = await onSendCommand(cmd);
                                            if (response) {
                                                setCommandHistory(prev => [response, ...prev].slice(0, 5));
                                            }
                                            setIsProcessing(false);
                                        }
                                    }}
                                    aria-label="Command input"
                                />
                                <button
                                    className="btn btn-primary"
                                    disabled={isProcessing}
                                    style={{ opacity: isProcessing ? 0.6 : 1 }}
                                    onClick={async e => {
                                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                                        if (input.value.trim() && !isProcessing) {
                                            const cmd = input.value.trim();
                                            input.value = '';
                                            setIsProcessing(true);
                                            const response = await onSendCommand(cmd);
                                            if (response) {
                                                setCommandHistory(prev => [response, ...prev].slice(0, 5));
                                            }
                                            setIsProcessing(false);
                                        }
                                    }}
                                >
                                    {isProcessing ? '⏳' : 'Send'}
                                </button>
                            </div>

                            {/* Command Response History */}
                            {commandHistory.length > 0 && (
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-green)' }}>
                                        📨 Response:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {commandHistory.map((item, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    padding: '12px',
                                                    background: idx === 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    borderLeft: `3px solid ${idx === 0 ? 'var(--accent-green)' : 'var(--border-color)'}`,
                                                    opacity: idx === 0 ? 1 : 0.6,
                                                }}
                                            >
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'monospace' }}>
                                                    &gt; {item.command}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                    {item.response}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Available Commands */}
                            <div style={{
                                marginTop: '16px',
                                padding: '12px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: '3px solid var(--accent-cyan)',
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-cyan)' }}>
                                    📋 Available Commands:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {[
                                        { cmd: 'status', desc: 'Check current status' },
                                        { cmd: 'report', desc: 'Generate activity report' },
                                        { cmd: 'pause', desc: 'Pause current task' },
                                        { cmd: 'resume', desc: 'Resume paused task' },
                                        { cmd: 'prioritize <task>', desc: 'Set task priority' },
                                        { cmd: 'collaborate <agent>', desc: 'Request collaboration' },
                                        { cmd: 'review', desc: 'Request trust review' },
                                        { cmd: 'help', desc: 'Show all commands' },
                                    ].map(({ cmd, desc }) => (
                                        <div
                                            key={cmd}
                                            title={desc}
                                            style={{
                                                padding: '4px 10px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.7rem',
                                                fontFamily: 'monospace',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s ease',
                                            }}
                                            onClick={() => {
                                                const input = document.querySelector<HTMLInputElement>('input[aria-label="Command input"]');
                                                if (input) {
                                                    input.value = cmd;
                                                    input.focus();
                                                }
                                            }}
                                            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                                            onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                        >
                                            {cmd}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    💡 Click a command to insert it, or type your own custom command
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentProfilePage;
