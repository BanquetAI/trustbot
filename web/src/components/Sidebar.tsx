import { useState } from 'react';
import type { Agent, BlackboardEntry } from '../types';
import type { ApprovalRequest } from '../types';
import { api } from '../api';

interface SidebarProps {
    entries: BlackboardEntry[];
    selectedAgent: Agent | undefined;
    hitlLevel: number;
    approvals?: ApprovalRequest[];
    onApprove?: (id: string, approved: boolean) => void;
    onSelectEntry?: (entryId: string) => void;
    onSelectAgent?: (agentId: string) => void;
    onOpenHITLExplanation?: () => void;
    onOpenMissionControl?: () => void;
    collapsed?: boolean;
    onClose?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
    PROBLEM: 'var(--accent-red)',
    SOLUTION: 'var(--accent-green)',
    DECISION: 'var(--accent-gold)',
    OBSERVATION: 'var(--accent-cyan)',
    TASK: 'var(--accent-blue)',
    PATTERN: 'var(--accent-purple)',
};

const TYPE_ICONS: Record<string, string> = {
    PROBLEM: '⚠️',
    SOLUTION: '✅',
    DECISION: '⚖️',
    OBSERVATION: '👁️',
    TASK: '📋',
    PATTERN: '🔮',
};

const ENTRY_TYPES = ['ALL', 'TASK', 'SOLUTION', 'PROBLEM', 'DECISION', 'OBSERVATION', 'PATTERN'];

export function Sidebar({
    entries,
    selectedAgent,
    approvals = [],
    onApprove,
    onSelectEntry,
    onSelectAgent,
    onOpenMissionControl,
    collapsed = false,
    onClose,
}: SidebarProps) {
    const [filter, setFilter] = useState('ALL');
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [newEntryType, setNewEntryType] = useState('OBSERVATION');
    const [newEntryTitle, setNewEntryTitle] = useState('');
    const [newEntryContent, setNewEntryContent] = useState('');
    const [posting, setPosting] = useState(false);

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const filteredEntries = filter === 'ALL'
        ? entries
        : entries.filter(e => e.type === filter);

    const handlePostEntry = async () => {
        if (!newEntryTitle.trim()) return;
        setPosting(true);
        try {
            await api.postToBlackboard({
                type: newEntryType,
                title: newEntryTitle,
                content: newEntryContent || newEntryTitle,
                priority: 'NORMAL',
            });
            setNewEntryTitle('');
            setNewEntryContent('');
            setShowNewEntry(false);
        } catch (e) {
            console.error('Failed to post entry:', e);
        }
        setPosting(false);
    };

    return (
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Mobile Close Header */}
            <div className="sidebar-header">
                <span style={{ fontWeight: 600 }}>📋 Blackboard</span>
                <button className="sidebar-close" onClick={onClose}>✕</button>
            </div>

            {/* BLACKBOARD TOOLBAR */}
            <div style={{
                padding: '12px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
            }}>
                {/* Header Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.25rem' }}>📝</span>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Blackboard</span>
                        <span style={{
                            background: 'var(--accent-blue)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 600
                        }}>
                            {filteredEntries.length}
                        </span>
                    </div>
                    {onOpenMissionControl && (
                        <button
                            onClick={onOpenMissionControl}
                            style={{
                                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
                                border: 'none',
                                color: 'white',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                            title="Open Mission Control"
                        >
                            Mission Control
                        </button>
                    )}
                </div>

                {/* Filter Pills */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginBottom: '10px',
                }}>
                    {ENTRY_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            style={{
                                padding: '4px 8px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                background: filter === type
                                    ? (type === 'ALL' ? 'var(--accent-blue)' : TYPE_COLORS[type] || 'var(--bg-card)')
                                    : 'var(--bg-card)',
                                color: filter === type ? 'white' : 'var(--text-muted)',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {type === 'ALL' ? '🔍 ALL' : `${TYPE_ICONS[type] || ''} ${type}`}
                        </button>
                    ))}
                </div>

                {/* New Entry Button */}
                <button
                    onClick={() => setShowNewEntry(!showNewEntry)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: showNewEntry ? 'var(--accent-green)' : 'var(--bg-card)',
                        border: '1px dashed var(--border-color)',
                        borderRadius: '6px',
                        color: showNewEntry ? 'white' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                    }}
                >
                    {showNewEntry ? '✕ Cancel' : '➕ New Entry'}
                </button>

                {/* New Entry Form */}
                {showNewEntry && (
                    <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        background: 'var(--bg-card)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                    }}>
                        <select
                            value={newEntryType}
                            onChange={e => setNewEntryType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginBottom: '8px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                fontSize: '0.8rem',
                            }}
                        >
                            <option value="OBSERVATION">👁️ Observation</option>
                            <option value="PROBLEM">⚠️ Problem</option>
                            <option value="DECISION">⚖️ Decision</option>
                            <option value="TASK">📋 Task</option>
                            <option value="PATTERN">🔮 Pattern</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Title..."
                            value={newEntryTitle}
                            onChange={e => setNewEntryTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginBottom: '8px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                fontSize: '0.8rem',
                            }}
                        />
                        <textarea
                            placeholder="Details (optional)..."
                            value={newEntryContent}
                            onChange={e => setNewEntryContent(e.target.value)}
                            rows={2}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginBottom: '8px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                fontSize: '0.8rem',
                                resize: 'none',
                            }}
                        />
                        <button
                            onClick={handlePostEntry}
                            disabled={!newEntryTitle.trim() || posting}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: newEntryTitle.trim() ? 'var(--accent-green)' : 'var(--bg-lighter)',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: newEntryTitle.trim() ? 'pointer' : 'not-allowed',
                            }}
                        >
                            {posting ? '⏳ Posting...' : '📤 Post to Blackboard'}
                        </button>
                    </div>
                )}
            </div>

            {/* ENTRIES LIST */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--spacing-sm)',
            }}>
                {filteredEntries.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: 'var(--text-muted)'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                        <div>{filter === 'ALL' ? 'No entries yet' : `No ${filter} entries`}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                            Create a new entry or run agent tasks
                        </div>
                    </div>
                ) : (
                    filteredEntries.map(entry => (
                        <div
                            key={entry.id}
                            style={{
                                borderLeft: `4px solid ${TYPE_COLORS[entry.type] || 'var(--border-color)'}`,
                                cursor: 'pointer',
                                padding: '12px',
                                marginBottom: '8px',
                                background: 'var(--bg-card)',
                                borderRadius: '0 8px 8px 0',
                                transition: 'all 0.15s ease',
                            }}
                            onClick={() => onSelectEntry?.(entry.id)}
                            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                            onMouseOut={e => e.currentTarget.style.background = 'var(--bg-card)'}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                marginBottom: '6px'
                            }}>
                                <span style={{ fontSize: '1rem' }}>{TYPE_ICONS[entry.type] || '📄'}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        lineHeight: 1.3,
                                        wordBreak: 'break-word'
                                    }}>
                                        {entry.title}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)'
                            }}>
                                <span style={{
                                    background: TYPE_COLORS[entry.type] || 'var(--bg-lighter)',
                                    color: entry.type === 'DECISION' ? 'black' : 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    fontSize: '0.625rem'
                                }}>
                                    {entry.type}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {entry.status} • {formatTime(entry.timestamp)}
                                    {entry.comments && entry.comments.length > 0 && (
                                        <span style={{ marginLeft: '4px' }}>💬{entry.comments.length}</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Approval Queue - Compact */}
            {approvals.length > 0 && (
                <div style={{
                    borderTop: '1px solid var(--border-color)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: 'rgba(251, 191, 36, 0.1)'
                }}>
                    <div style={{
                        fontWeight: 600,
                        marginBottom: '8px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--accent-gold)'
                    }}>
                        ⏳ Pending Approvals
                        <span style={{
                            background: 'var(--accent-gold)',
                            color: 'black',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.625rem',
                            fontWeight: 700
                        }}>
                            {approvals.length}
                        </span>
                    </div>
                    {approvals.slice(0, 2).map(approval => (
                        <div key={approval.id} className="approval-item" style={{ marginBottom: '6px' }}>
                            <div style={{ fontSize: '0.8rem', marginBottom: '6px' }}>{approval.summary}</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn-approve"
                                    onClick={() => onApprove?.(approval.id, true)}
                                    style={{ flex: 1, padding: '6px' }}
                                >
                                    ✓
                                </button>
                                <button
                                    className="btn btn-reject"
                                    onClick={() => onApprove?.(approval.id, false)}
                                    style={{ flex: 1, padding: '6px' }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Agent - Compact Card */}
            {selectedAgent && (
                <div style={{
                    borderTop: '1px solid var(--border-color)',
                    padding: 'var(--spacing-sm) var(--spacing-md)'
                }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px',
                            background: 'var(--bg-card)',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                        onClick={() => onSelectAgent?.(selectedAgent.id)}
                    >
                        <div className={`agent-avatar tier-${selectedAgent.tier}`} style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>
                            T{selectedAgent.tier}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedAgent.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {selectedAgent.type} • Trust: {selectedAgent.trustScore}
                            </div>
                        </div>
                        <span style={{ color: 'var(--accent-blue)' }}>→</span>
                    </div>
                </div>
            )}
        </div>
    );
}
