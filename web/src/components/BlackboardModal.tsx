import type { BlackboardEntry } from '../types';

interface BlackboardModalProps {
    entry: BlackboardEntry;
    onClose: () => void;
    onViewAuthor: (authorId: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
    PROBLEM: '🔴',
    SOLUTION: '🟢',
    DECISION: '🟡',
    OBSERVATION: '🔵',
    TASK: '📋',
    PATTERN: '🟣',
};

const TYPE_COLORS: Record<string, string> = {
    PROBLEM: 'var(--accent-red)',
    SOLUTION: 'var(--accent-green)',
    DECISION: 'var(--accent-gold)',
    OBSERVATION: 'var(--accent-cyan)',
    TASK: 'var(--accent-blue)',
    PATTERN: 'var(--accent-purple)',
};

export function BlackboardModal({ entry, onClose, onViewAuthor }: BlackboardModalProps) {
    const formatDate = (date: Date): string => {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal blackboard-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ borderLeftColor: TYPE_COLORS[entry.type], borderLeftWidth: '4px', borderLeftStyle: 'solid' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>{TYPE_ICONS[entry.type] ?? '📝'}</span>
                        <div>
                            <h2 style={{ fontSize: '1rem' }}>{entry.title}</h2>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.type}</span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-content">
                    {/* Status Badge */}
                    <div style={{ marginBottom: '16px' }}>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: entry.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.2)' :
                                entry.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.2)' :
                                    'rgba(107, 114, 128, 0.2)',
                            color: entry.status === 'RESOLVED' ? 'var(--accent-green)' :
                                entry.status === 'IN_PROGRESS' ? 'var(--accent-blue)' :
                                    'var(--text-muted)',
                        }}>
                            {entry.status}
                        </span>
                        <span style={{
                            marginLeft: '8px',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: 'var(--accent-gold)',
                        }}>
                            {entry.priority} Priority
                        </span>
                    </div>

                    {/* Meta Info */}
                    <div className="agent-section">
                        <h3>Details</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            background: 'var(--bg-card)',
                            padding: '12px',
                            borderRadius: '8px'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created</span>
                                <div style={{ fontSize: '0.875rem' }}>{formatDate(entry.timestamp)}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Author</span>
                                <button
                                    onClick={() => onViewAuthor(entry.author)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--accent-blue)',
                                        cursor: 'pointer',
                                        padding: 0,
                                        fontSize: '0.875rem',
                                        textDecoration: 'underline',
                                    }}
                                >
                                    View Agent →
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="agent-section">
                        <h3>Actions</h3>
                        <div className="action-buttons">
                            {entry.status === 'OPEN' && (
                                <>
                                    <button className="btn btn-primary">
                                        ✋ Claim Task
                                    </button>
                                    <button className="btn btn-secondary">
                                        💡 Add Solution
                                    </button>
                                </>
                            )}
                            {entry.status === 'IN_PROGRESS' && (
                                <button className="btn btn-primary">
                                    ✅ Mark Resolved
                                </button>
                            )}
                            <button className="btn btn-secondary">
                                🔗 Link Related
                            </button>
                            <button className="btn btn-secondary">
                                📋 Copy ID
                            </button>
                        </div>
                    </div>

                    {/* Related Items Placeholder */}
                    <div className="agent-section">
                        <h3>Related Items</h3>
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-card)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem'
                        }}>
                            No related items yet. Click "Link Related" to connect.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
