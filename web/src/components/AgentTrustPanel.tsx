import React from 'react';
import { TrustTierBadge, TrustTier } from './TrustTierBadge';

/**
 * Agent Trust Panel Component
 * 
 * Displays detailed trust information for an agent including:
 * - Current tier and score
 * - Score breakdown by category
 * - Academy progress (if enrolled)
 * - Recent trust events
 */

interface AcademyProgress {
    enrolled: boolean;
    currentModule: string;
    progress: number;
    modulesCompleted: number;
    totalModules: number;
}

interface TrustEvent {
    id: string;
    type: 'gain' | 'loss' | 'milestone';
    delta: number;
    reason: string;
    timestamp: Date;
}

interface AgentTrustPanelProps {
    agentId: string;
    agentName: string;
    tier: TrustTier | number;
    score: number;
    ceiling: TrustTier | number;
    academy?: AcademyProgress;
    recentEvents?: TrustEvent[];
    onClose?: () => void;
}

const TIER_THRESHOLDS = [
    { tier: 0, min: 0, max: 199, name: 'UNTRUSTED' },
    { tier: 1, min: 200, max: 399, name: 'PROBATIONARY' },
    { tier: 2, min: 400, max: 599, name: 'TRUSTED' },
    { tier: 3, min: 600, max: 799, name: 'VERIFIED' },
    { tier: 4, min: 800, max: 949, name: 'CERTIFIED' },
    { tier: 5, min: 950, max: 1000, name: 'ELITE' },
];

export const AgentTrustPanel: React.FC<AgentTrustPanelProps> = ({
    agentId,
    agentName,
    tier,
    score,
    ceiling,
    academy,
    recentEvents = [],
    onClose,
}) => {
    const currentTierInfo = TIER_THRESHOLDS.find(t => t.tier === tier) || TIER_THRESHOLDS[0];
    const nextTierInfo = TIER_THRESHOLDS.find(t => t.tier === tier + 1);
    const progressToNext = nextTierInfo
        ? Math.min(100, ((score - currentTierInfo.min) / (nextTierInfo.min - currentTierInfo.min)) * 100)
        : 100;

    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary, #1a1a2e)',
            border: '1px solid var(--border-color, #333)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '400px',
            fontFamily: 'system-ui, sans-serif',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary, #fff)', fontSize: '1.1rem' }}>
                        {agentName}
                    </h3>
                    <span style={{ color: 'var(--text-secondary, #888)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {agentId}
                    </span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary, #888)',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Trust Score */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <TrustTierBadge tier={tier} score={score} showScore size="large" />
                    <span style={{ color: 'var(--text-secondary, #888)', fontSize: '0.8rem' }}>
                        Ceiling: <TrustTierBadge tier={ceiling} size="small" />
                    </span>
                </div>

                {/* Progress to next tier */}
                {nextTierInfo && (
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary, #888)', marginBottom: '4px' }}>
                            <span>{score} / {nextTierInfo.min}</span>
                            <span>→ {nextTierInfo.name}</span>
                        </div>
                        <div style={{
                            height: '6px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                width: `${progressToNext}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--accent-cyan, #00d4ff), var(--accent-purple, #a855f7))',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Academy Progress */}
            {academy?.enrolled && (
                <div style={{
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🎓</span>
                        <span style={{ color: '#ffc107', fontWeight: 600 }}>Academy Enrolled</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #888)' }}>
                        <div>Current: {academy.currentModule}</div>
                        <div>Progress: {academy.modulesCompleted} / {academy.totalModules} modules</div>
                    </div>
                    <div style={{
                        height: '4px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        marginTop: '8px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            width: `${academy.progress}%`,
                            height: '100%',
                            backgroundColor: '#ffc107',
                            borderRadius: '2px',
                        }} />
                    </div>
                </div>
            )}

            {/* Recent Events */}
            {recentEvents.length > 0 && (
                <div>
                    <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary, #fff)', fontSize: '0.9rem' }}>
                        Recent Events
                    </h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {recentEvents.slice(0, 5).map(event => (
                            <div
                                key={event.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    fontSize: '0.8rem',
                                }}
                            >
                                <span style={{ color: 'var(--text-secondary, #888)' }}>
                                    {event.reason}
                                </span>
                                <span style={{
                                    color: event.delta > 0 ? '#00cc88' : event.delta < 0 ? '#ff4444' : '#888',
                                    fontWeight: 600,
                                    fontFamily: 'monospace',
                                }}>
                                    {event.delta > 0 ? '+' : ''}{event.delta}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentTrustPanel;
