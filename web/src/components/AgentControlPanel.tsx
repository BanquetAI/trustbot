import React, { useState } from 'react';
import { Tooltip } from './Tooltip';
import type { Agent } from '../types';

/**
 * Agent Control Panel
 *
 * Comprehensive control interface for managing agent state,
 * permissions, assignments, and lifecycle actions.
 */

interface AgentControlPanelProps {
    agent: Agent;
    onPause?: (agentId: string) => void;
    onResume?: (agentId: string) => void;
    onEvaluateAutonomy?: (agentId: string) => void;
    onReassign?: (agentId: string, newRole?: string, newLocation?: string) => void;
    onEditPermissions?: (agentId: string) => void;
    onDelete?: (agentId: string) => void;
    onTerminate?: (agentId: string) => void;
    onAdjustTrust?: (agentId: string, delta: number, reason: string) => void;
    onOpenTaskQueue?: () => void;
}

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: string;
    onConfirm: () => void;
    onCancel: () => void;
    requireReason?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    title,
    message,
    confirmLabel,
    confirmColor,
    onConfirm,
    onCancel,
    requireReason = false,
}) => {
    const [reason, setReason] = useState('');

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    maxWidth: '400px',
                    width: '90%',
                    border: '1px solid var(--border-color)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem' }}>{title}</h3>
                <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {message}
                </p>

                {requireReason && (
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Enter reason (required)..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            resize: 'none',
                            minHeight: '60px',
                            marginBottom: '16px',
                        }}
                    />
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (requireReason && !reason.trim()) return;
                            onConfirm();
                        }}
                        disabled={requireReason && !reason.trim()}
                        style={{
                            padding: '8px 16px',
                            background: confirmColor,
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: requireReason && !reason.trim() ? 'not-allowed' : 'pointer',
                            opacity: requireReason && !reason.trim() ? 0.5 : 1,
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AgentControlPanel: React.FC<AgentControlPanelProps> = ({
    agent,
    onPause,
    onResume,
    onEvaluateAutonomy,
    onReassign,
    onEditPermissions,
    onDelete,
    onTerminate,
    onAdjustTrust,
    onOpenTaskQueue,
}) => {
    const [confirmAction, setConfirmAction] = useState<{
        type: 'delete' | 'terminate' | 'pause' | 'demote' | null;
        title: string;
        message: string;
        confirmLabel: string;
        confirmColor: string;
        onConfirm: () => void;
        requireReason?: boolean;
    } | null>(null);

    const isPaused = agent.status === 'IDLE' || agent.status === 'TERMINATED';
    const isWorking = agent.status === 'WORKING';

    const ActionButton: React.FC<{
        icon: string;
        label: string;
        tooltip: string;
        onClick: () => void;
        color?: string;
        disabled?: boolean;
        variant?: 'default' | 'danger' | 'success' | 'warning';
    }> = ({ icon, label, tooltip, onClick, disabled = false, variant = 'default' }) => {
        const variantStyles = {
            default: {
                bg: 'var(--bg-tertiary)',
                hoverBg: 'var(--bg-secondary)',
                border: 'var(--border-color)',
                color: 'var(--text-primary)',
            },
            danger: {
                bg: 'rgba(239, 68, 68, 0.1)',
                hoverBg: 'rgba(239, 68, 68, 0.2)',
                border: 'rgba(239, 68, 68, 0.3)',
                color: 'var(--accent-red)',
            },
            success: {
                bg: 'rgba(16, 185, 129, 0.1)',
                hoverBg: 'rgba(16, 185, 129, 0.2)',
                border: 'rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-green)',
            },
            warning: {
                bg: 'rgba(245, 158, 11, 0.1)',
                hoverBg: 'rgba(245, 158, 11, 0.2)',
                border: 'rgba(245, 158, 11, 0.3)',
                color: 'var(--accent-gold)',
            },
        };

        const style = variantStyles[variant];

        return (
            <Tooltip title={label} content={tooltip} position="top">
                <button
                    onClick={onClick}
                    disabled={disabled}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '12px 16px',
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        borderRadius: 'var(--radius-md)',
                        color: style.color,
                        fontSize: '0.75rem',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                        transition: 'all 0.15s ease',
                        minWidth: '80px',
                    }}
                    onMouseOver={e => {
                        if (!disabled) {
                            e.currentTarget.style.background = style.hoverBg;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.background = style.bg;
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                    <span style={{ fontWeight: 500 }}>{label}</span>
                </button>
            </Tooltip>
        );
    };

    return (
        <>
            <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                marginBottom: '20px',
            }}>
                <h3 style={{
                    fontSize: '0.9rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <span>🎮</span> Agent Controls
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                    }}>
                        ID: {agent.structuredId || agent.id.slice(0, 8)}
                    </span>
                </h3>

                {/* Primary Actions Row */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '16px',
                }}>
                    {/* Pause/Resume */}
                    {isWorking && onPause && (
                        <ActionButton
                            icon="⏸️"
                            label="Pause"
                            tooltip="Pause agent's current work. Can be resumed later."
                            onClick={() => setConfirmAction({
                                type: 'pause',
                                title: 'Pause Agent?',
                                message: `This will pause ${agent.name}'s current work. The agent can be resumed later.`,
                                confirmLabel: 'Pause Agent',
                                confirmColor: 'var(--accent-gold)',
                                onConfirm: () => {
                                    onPause(agent.id);
                                    setConfirmAction(null);
                                },
                            })}
                            variant="warning"
                        />
                    )}

                    {isPaused && onResume && (
                        <ActionButton
                            icon="▶️"
                            label="Resume"
                            tooltip="Resume agent's work from paused state."
                            onClick={() => onResume(agent.id)}
                            variant="success"
                        />
                    )}

                    {/* Evaluate Autonomy */}
                    {onEvaluateAutonomy && (
                        <ActionButton
                            icon="🔮"
                            label="Evaluate"
                            tooltip="Run autonomy evaluation to check if agent should be promoted or demoted."
                            onClick={() => onEvaluateAutonomy(agent.id)}
                        />
                    )}

                    {/* Reassign */}
                    {onReassign && (
                        <ActionButton
                            icon="🔄"
                            label="Reassign"
                            tooltip="Reassign agent to a different role, task, or location."
                            onClick={() => onReassign(agent.id)}
                        />
                    )}

                    {/* Edit Permissions */}
                    {onEditPermissions && (
                        <ActionButton
                            icon="🔐"
                            label="Permissions"
                            tooltip="View and modify agent's capabilities and access permissions."
                            onClick={() => onEditPermissions(agent.id)}
                        />
                    )}

                    {/* Task Queue */}
                    {onOpenTaskQueue && (
                        <ActionButton
                            icon="📋"
                            label="Tasks"
                            tooltip="View and manage agent's task queue. Add, remove, or reorder tasks."
                            onClick={onOpenTaskQueue}
                        />
                    )}
                </div>

                {/* Trust Adjustment */}
                {onAdjustTrust && (
                    <div style={{
                        padding: '12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '16px',
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            marginBottom: '10px',
                            color: 'var(--text-muted)',
                        }}>
                            Quick Trust Adjustment
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                                { delta: -50, label: '-50', color: 'var(--accent-red)' },
                                { delta: -10, label: '-10', color: 'var(--accent-gold)' },
                                { delta: 10, label: '+10', color: 'var(--accent-blue)' },
                                { delta: 50, label: '+50', color: 'var(--accent-green)' },
                            ].map(({ delta, label, color }) => (
                                <button
                                    key={delta}
                                    onClick={() => {
                                        const reason = prompt(`Reason for ${label} trust adjustment:`);
                                        if (reason) {
                                            onAdjustTrust(agent.id, delta, reason);
                                        }
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'var(--bg-secondary)',
                                        border: `1px solid ${color}`,
                                        borderRadius: 'var(--radius-sm)',
                                        color: color,
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Danger Zone */}
                <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.05)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginBottom: '10px',
                        color: 'var(--accent-red)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        <span>⚠️</span> Danger Zone
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {onTerminate && (
                            <ActionButton
                                icon="🛑"
                                label="Terminate"
                                tooltip="Permanently stop agent. Cannot be undone."
                                onClick={() => setConfirmAction({
                                    type: 'terminate',
                                    title: 'Terminate Agent?',
                                    message: `This will permanently terminate ${agent.name}. This action cannot be undone. The agent will stop all work immediately.`,
                                    confirmLabel: 'Terminate',
                                    confirmColor: 'var(--accent-red)',
                                    requireReason: true,
                                    onConfirm: () => {
                                        onTerminate(agent.id);
                                        setConfirmAction(null);
                                    },
                                })}
                                variant="danger"
                            />
                        )}

                        {onDelete && (
                            <ActionButton
                                icon="🗑️"
                                label="Delete"
                                tooltip="Archive and remove agent from the system."
                                onClick={() => setConfirmAction({
                                    type: 'delete',
                                    title: 'Delete Agent?',
                                    message: `This will archive ${agent.name} and remove them from the active agent list. Archived data can be recovered later if needed.`,
                                    confirmLabel: 'Delete & Archive',
                                    confirmColor: 'var(--accent-red)',
                                    onConfirm: () => {
                                        onDelete(agent.id);
                                        setConfirmAction(null);
                                    },
                                })}
                                variant="danger"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmAction && (
                <ConfirmModal
                    title={confirmAction.title}
                    message={confirmAction.message}
                    confirmLabel={confirmAction.confirmLabel}
                    confirmColor={confirmAction.confirmColor}
                    onConfirm={confirmAction.onConfirm}
                    onCancel={() => setConfirmAction(null)}
                    requireReason={confirmAction.requireReason}
                />
            )}
        </>
    );
};

export default AgentControlPanel;
