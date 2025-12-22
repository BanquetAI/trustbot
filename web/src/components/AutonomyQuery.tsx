import { useState } from 'react';
import type { Agent } from '../types';

/**
 * Autonomy Query System
 *
 * Evaluates agent performance and recommends autonomy level changes.
 * Answers the question: "Should this agent get more freedom?"
 */

interface AutonomyQueryProps {
    agent: Agent;
    onClose: () => void;
    onApprovePromotion?: (agentId: string, newTier: number) => void;
    onDenyPromotion?: (agentId: string, reason: string) => void;
}

interface PerformanceMetric {
    name: string;
    value: number;
    target: number;
    weight: number;
    icon: string;
}

interface AutonomyRecommendation {
    action: 'PROMOTE' | 'MAINTAIN' | 'DEMOTE' | 'PROBATION';
    confidence: number;
    reasoning: string[];
    risks: string[];
    benefits: string[];
    newTier?: number;
}

// Trust tier thresholds
const TIER_THRESHOLDS = [0, 200, 400, 600, 800, 950];
const TIER_NAMES = ['PASSIVE', 'WORKER', 'OPERATIONAL', 'TACTICAL', 'EXECUTIVE', 'SOVEREIGN'];
const TIER_COLORS = ['#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#fbbf24'];

function calculatePerformanceMetrics(agent: Agent): PerformanceMetric[] {
    // Simulated metrics - in production these would come from actual agent data
    const baseMetrics = [
        {
            name: 'Task Success Rate',
            value: 0.85 + (agent.trustScore / 2000),
            target: 0.90,
            weight: 0.25,
            icon: '✅',
        },
        {
            name: 'Decision Accuracy',
            value: 0.78 + (agent.tier * 0.04),
            target: 0.85,
            weight: 0.20,
            icon: '🎯',
        },
        {
            name: 'Response Time',
            value: Math.min(0.95, 0.70 + (agent.trustScore / 1500)),
            target: 0.80,
            weight: 0.15,
            icon: '⚡',
        },
        {
            name: 'Collaboration Score',
            value: 0.82 + Math.random() * 0.1,
            target: 0.85,
            weight: 0.15,
            icon: '🤝',
        },
        {
            name: 'Resource Efficiency',
            value: 0.75 + (agent.tier * 0.05),
            target: 0.80,
            weight: 0.15,
            icon: '📊',
        },
        {
            name: 'Error Recovery',
            value: 0.88 + Math.random() * 0.08,
            target: 0.90,
            weight: 0.10,
            icon: '🔄',
        },
    ];

    return baseMetrics.map(m => ({
        ...m,
        value: Math.min(1, Math.max(0, m.value)),
    }));
}

function calculateRecommendation(agent: Agent, metrics: PerformanceMetric[]): AutonomyRecommendation {
    // Calculate weighted score
    const weightedScore = metrics.reduce((acc, m) => acc + (m.value / m.target) * m.weight, 0);
    const normalizedScore = Math.min(1, weightedScore);

    // Determine current tier progress
    const currentTierMin = TIER_THRESHOLDS[agent.tier];
    const nextTierMin = TIER_THRESHOLDS[agent.tier + 1] || 1000;
    const tierProgress = (agent.trustScore - currentTierMin) / (nextTierMin - currentTierMin);

    // Metrics above target
    const exceedingMetrics = metrics.filter(m => m.value >= m.target);
    const failingMetrics = metrics.filter(m => m.value < m.target * 0.8);

    // Determine recommendation
    let action: AutonomyRecommendation['action'];
    let confidence: number;
    const reasoning: string[] = [];
    const risks: string[] = [];
    const benefits: string[] = [];
    let newTier: number | undefined;

    if (normalizedScore >= 0.95 && tierProgress >= 0.8 && agent.tier < 5) {
        action = 'PROMOTE';
        confidence = 0.85 + (normalizedScore - 0.95) * 2;
        newTier = agent.tier + 1;

        reasoning.push(`Agent exceeds ${exceedingMetrics.length}/${metrics.length} performance targets`);
        reasoning.push(`Trust score ${agent.trustScore} is ${Math.round(tierProgress * 100)}% to next tier`);
        reasoning.push(`Weighted performance score: ${(normalizedScore * 100).toFixed(1)}%`);

        benefits.push(`Reduced HITL overhead for ${TIER_NAMES[newTier]} operations`);
        benefits.push('Improved task throughput and autonomy');
        benefits.push('Demonstrate trust system effectiveness');

        risks.push('Higher-tier decisions have greater impact if incorrect');
        risks.push('May require monitoring period after promotion');
    } else if (failingMetrics.length >= 3 || normalizedScore < 0.7) {
        action = 'DEMOTE';
        confidence = 0.75;
        newTier = Math.max(0, agent.tier - 1);

        reasoning.push(`Agent failing ${failingMetrics.length} critical metrics`);
        reasoning.push(`Performance score ${(normalizedScore * 100).toFixed(1)}% below acceptable threshold`);

        benefits.push('Reduced risk from underperforming agent');
        benefits.push('Increased oversight and error prevention');

        risks.push('May impact team morale and agent self-improvement');
        risks.push('Could trigger defensive behavior patterns');
    } else if (failingMetrics.length >= 1) {
        action = 'PROBATION';
        confidence = 0.80;

        reasoning.push(`Agent underperforming in: ${failingMetrics.map(m => m.name).join(', ')}`);
        reasoning.push('Recommend focused improvement period before reassessment');

        benefits.push('Targeted improvement opportunity');
        benefits.push('Clear expectations for advancement');

        risks.push('Extended probation may demotivate agent');
    } else {
        action = 'MAINTAIN';
        confidence = 0.90;

        reasoning.push('Agent performing at expected level for current tier');
        reasoning.push(`${exceedingMetrics.length} metrics exceeding targets, ${failingMetrics.length} below`);
        reasoning.push('Continue current autonomy level');

        benefits.push('Stable, predictable performance');
        benefits.push('No disruption to current workflows');

        risks.push('Potential stagnation without growth incentives');
    }

    return {
        action,
        confidence: Math.min(0.99, confidence),
        reasoning,
        risks,
        benefits,
        newTier,
    };
}

export function AutonomyQuery({ agent, onClose, onApprovePromotion, onDenyPromotion }: AutonomyQueryProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [denialReason, setDenialReason] = useState('');
    const [showDenialForm, setShowDenialForm] = useState(false);

    const metrics = calculatePerformanceMetrics(agent);
    const recommendation = calculateRecommendation(agent, metrics);

    const actionColors = {
        PROMOTE: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#10b981' },
        MAINTAIN: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#3b82f6' },
        DEMOTE: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444' },
        PROBATION: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#f59e0b' },
    };

    const actionIcons = {
        PROMOTE: '⬆️',
        MAINTAIN: '➡️',
        DEMOTE: '⬇️',
        PROBATION: '⏳',
    };

    const colors = actionColors[recommendation.action];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '600px', maxHeight: '90vh' }}
            >
                {/* Header */}
                <div className="modal-header" style={{ borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>🔮</span>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Autonomy Query</h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Should {agent.name} get more freedom?
                            </p>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Agent Info */}
                <div style={{
                    padding: '16px 20px',
                    background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${TIER_COLORS[agent.tier]}, ${TIER_COLORS[Math.min(5, agent.tier + 1)]})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: 'white',
                        fontWeight: 700,
                    }}>
                        T{agent.tier}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{agent.name}</div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            gap: '12px',
                        }}>
                            <span>{agent.type}</span>
                            <span>•</span>
                            <span style={{ color: TIER_COLORS[agent.tier] }}>{TIER_NAMES[agent.tier]}</span>
                            <span>•</span>
                            <span>Trust: {agent.trustScore}</span>
                        </div>
                    </div>
                </div>

                {/* Recommendation Banner */}
                <div style={{
                    margin: '20px',
                    padding: '20px',
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: '12px',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px',
                    }}>
                        <span style={{ fontSize: '2rem' }}>{actionIcons[recommendation.action]}</span>
                        <div>
                            <div style={{
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: colors.text,
                            }}>
                                Recommendation: {recommendation.action}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Confidence: {(recommendation.confidence * 100).toFixed(0)}%
                            </div>
                        </div>
                    </div>

                    {recommendation.newTier !== undefined && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px',
                            background: 'var(--bg-card)',
                            borderRadius: '8px',
                            marginBottom: '12px',
                        }}>
                            <span style={{
                                padding: '4px 10px',
                                background: TIER_COLORS[agent.tier],
                                borderRadius: '6px',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                            }}>
                                T{agent.tier} {TIER_NAMES[agent.tier]}
                            </span>
                            <span style={{ fontSize: '1.25rem' }}>→</span>
                            <span style={{
                                padding: '4px 10px',
                                background: TIER_COLORS[recommendation.newTier],
                                borderRadius: '6px',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                            }}>
                                T{recommendation.newTier} {TIER_NAMES[recommendation.newTier]}
                            </span>
                        </div>
                    )}

                    {/* Reasoning */}
                    <div style={{ marginBottom: '12px' }}>
                        {recommendation.reasoning.map((r, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: '8px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '4px',
                            }}>
                                <span>•</span>
                                <span>{r}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Metrics */}
                <div style={{ padding: '0 20px 20px' }}>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span>📊 Performance Metrics</span>
                        <span>{showDetails ? '▲' : '▼'}</span>
                    </button>

                    {showDetails && (
                        <div style={{
                            marginTop: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}>
                            {metrics.map((metric, i) => {
                                const percentage = Math.round(metric.value * 100);
                                const isGood = metric.value >= metric.target;
                                return (
                                    <div key={i} style={{
                                        padding: '12px',
                                        background: 'var(--bg-card)',
                                        borderRadius: '8px',
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '6px',
                                        }}>
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.8rem',
                                            }}>
                                                {metric.icon} {metric.name}
                                            </span>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                color: isGood ? 'var(--accent-green)' : 'var(--accent-gold)',
                                            }}>
                                                {percentage}% / {Math.round(metric.target * 100)}%
                                            </span>
                                        </div>
                                        <div style={{
                                            height: '6px',
                                            background: 'var(--bg-lighter)',
                                            borderRadius: '3px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                left: `${metric.target * 100}%`,
                                                top: 0,
                                                bottom: 0,
                                                width: '2px',
                                                background: 'var(--text-muted)',
                                            }} />
                                            <div style={{
                                                height: '100%',
                                                width: `${percentage}%`,
                                                background: isGood
                                                    ? 'var(--accent-green)'
                                                    : percentage >= metric.target * 80
                                                        ? 'var(--accent-gold)'
                                                        : 'var(--accent-red)',
                                                borderRadius: '3px',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Benefits & Risks */}
                <div style={{
                    padding: '0 20px 20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                }}>
                    <div style={{
                        padding: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--accent-green)',
                            marginBottom: '8px',
                        }}>
                            ✅ Benefits
                        </div>
                        {recommendation.benefits.map((b, i) => (
                            <div key={i} style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '4px',
                            }}>
                                • {b}
                            </div>
                        ))}
                    </div>
                    <div style={{
                        padding: '12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--accent-red)',
                            marginBottom: '8px',
                        }}>
                            ⚠️ Risks
                        </div>
                        {recommendation.risks.map((r, i) => (
                            <div key={i} style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-secondary)',
                                marginBottom: '4px',
                            }}>
                                • {r}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Denial Form */}
                {showDenialForm && (
                    <div style={{
                        padding: '0 20px 20px',
                    }}>
                        <textarea
                            value={denialReason}
                            onChange={e => setDenialReason(e.target.value)}
                            placeholder="Reason for denying this recommendation..."
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem',
                                resize: 'none',
                                minHeight: '80px',
                            }}
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                }}>
                    {recommendation.action === 'PROMOTE' && (
                        <>
                            <button
                                onClick={() => {
                                    if (showDenialForm && denialReason) {
                                        onDenyPromotion?.(agent.id, denialReason);
                                        onClose();
                                    } else {
                                        setShowDenialForm(true);
                                    }
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: showDenialForm ? 'var(--accent-red)' : 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: showDenialForm ? 'white' : 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {showDenialForm ? '✕ Confirm Denial' : '✕ Deny Promotion'}
                            </button>
                            <button
                                onClick={() => {
                                    onApprovePromotion?.(agent.id, recommendation.newTier!);
                                    onClose();
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, var(--accent-green), #059669)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                ✓ Approve Promotion
                            </button>
                        </>
                    )}

                    {recommendation.action === 'MAINTAIN' && (
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                background: 'var(--accent-blue)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                            }}
                        >
                            ✓ Acknowledge
                        </button>
                    )}

                    {(recommendation.action === 'DEMOTE' || recommendation.action === 'PROBATION') && (
                        <>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '10px 20px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Override Decision
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '10px 20px',
                                    background: colors.border,
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                ✓ Accept Recommendation
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AutonomyQuery;
