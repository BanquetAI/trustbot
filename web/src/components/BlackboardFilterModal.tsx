import React from 'react';
import type { BlackboardEntry } from '../types';

/**
 * Blackboard Filter Modal
 * 
 * Shows blackboard entries filtered by type with details.
 */

interface BlackboardFilterModalProps {
    entries: BlackboardEntry[];
    filterType: string;
    onClose: () => void;
    onSelectEntry?: (entryId: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; description: string }> = {
    PROBLEM: {
        icon: '🔴',
        color: 'var(--accent-red)',
        description: 'Issues requiring attention and resolution'
    },
    SOLUTION: {
        icon: '✅',
        color: 'var(--accent-green)',
        description: 'Proposed or implemented solutions'
    },
    DECISION: {
        icon: '⚡',
        color: 'var(--accent-gold)',
        description: 'Important decisions made by agents'
    },
    PATTERN: {
        icon: '🔮',
        color: 'var(--accent-purple)',
        description: 'Identified patterns and insights'
    },
    OBSERVATION: {
        icon: '👁️',
        color: 'var(--accent-cyan)',
        description: 'Observations from agent activities'
    },
    TASK: {
        icon: '📋',
        color: 'var(--accent-blue)',
        description: 'Active tasks and assignments'
    },
};

const PRIORITY_COLORS: Record<string, string> = {
    HIGH: 'var(--accent-red)',
    MEDIUM: 'var(--accent-gold)',
    LOW: 'var(--accent-green)',
};

const STATUS_BADGES: Record<string, { color: string; bg: string }> = {
    OPEN: { color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.15)' },
    IN_PROGRESS: { color: 'var(--accent-gold)', bg: 'rgba(245, 158, 11, 0.15)' },
    RESOLVED: { color: 'var(--accent-green)', bg: 'rgba(16, 185, 129, 0.15)' },
    BLOCKED: { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.15)' },
};

export const BlackboardFilterModal: React.FC<BlackboardFilterModalProps> = ({
    entries,
    filterType,
    onClose,
    onSelectEntry,
}) => {
    const config = TYPE_CONFIG[filterType] || { icon: '📄', color: 'var(--text-muted)', description: 'Entries' };
    const filteredEntries = entries.filter(e => e.type === filterType);

    const formatTime = (date: Date): string => {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>{config.icon}</span>
                        <div>
                            <h2 style={{ margin: 0 }}>{filterType.charAt(0) + filterType.slice(1).toLowerCase()}s</h2>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {config.description}
                            </span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-content" style={{ overflowY: 'auto', maxHeight: '60vh' }}>
                    {/* Stats Bar */}
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '20px',
                    }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: config.color }}>
                                {filteredEntries.length}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                                {filteredEntries.filter(e => e.status === 'OPEN').length}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OPEN</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                                {filteredEntries.filter(e => e.status === 'IN_PROGRESS').length}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IN PROGRESS</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                                {filteredEntries.filter(e => e.status === 'RESOLVED').length}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RESOLVED</div>
                        </div>
                    </div>

                    {/* Entries List */}
                    {filteredEntries.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            color: 'var(--text-muted)',
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                            <div>No {filterType.toLowerCase()}s found</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredEntries.map(entry => {
                                const statusStyle = STATUS_BADGES[entry.status] || STATUS_BADGES.OPEN;
                                return (
                                    <div
                                        key={entry.id}
                                        onClick={() => onSelectEntry?.(entry.id)}
                                        style={{
                                            padding: '16px',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: `4px solid ${config.color}`,
                                            cursor: onSelectEntry ? 'pointer' : 'default',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseOver={e => onSelectEntry && (e.currentTarget.style.transform = 'translateX(4px)')}
                                        onMouseOut={e => onSelectEntry && (e.currentTarget.style.transform = 'translateX(0)')}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div style={{ fontWeight: 600, flex: 1 }}>{entry.title}</div>
                                            <div style={{
                                                fontSize: '0.65rem',
                                                padding: '2px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                background: statusStyle.bg,
                                                color: statusStyle.color,
                                                fontWeight: 600,
                                            }}>
                                                {entry.status.replace('_', ' ')}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <span>Author: {entry.author}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: PRIORITY_COLORS[entry.priority] || 'var(--text-muted)',
                                                }} />
                                                {entry.priority}
                                            </span>
                                            <span>{formatTime(entry.timestamp)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlackboardFilterModal;
