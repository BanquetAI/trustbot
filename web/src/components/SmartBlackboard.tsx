import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { BlackboardEntry, Agent } from '../types';

/**
 * Mission Control (Smart Blackboard)
 *
 * Central interactive hub for "The Genesis Protocol".
 * Allows user to view blackboard streams and interact with
 * Founding Fathers (Meta-Agents) via threaded comments.
 */

interface SmartBlackboardProps {
    entries: BlackboardEntry[];
    agents: Agent[];
    onClose: () => void;
}

const AGENT_COLORS: Record<string, string> = {
    'The Architect': 'var(--accent-purple)',
    'The Recruiter': 'var(--accent-gold)',
    'The Overseer': 'var(--accent-red)',
    'Founder': 'var(--text-primary)',
};

export const SmartBlackboard: React.FC<SmartBlackboardProps> = ({ entries, agents, onClose }) => {
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [commentInput, setCommentInput] = useState('');
    const [localEntries, setLocalEntries] = useState<BlackboardEntry[]>(entries);

    // Sync local state when props change
    useEffect(() => {
        setLocalEntries(entries);
        // Default to first entry if none selected
        if (!selectedEntryId && entries.length > 0) {
            setSelectedEntryId(entries[0].id);
        }
    }, [entries]);

    const selectedEntry = localEntries.find(e => e.id === selectedEntryId);

    const handlePostComment = async () => {
        if (!selectedEntryId || !commentInput.trim()) return;

        // Optimistic update
        const newComment = {
            author: 'Founder',
            text: commentInput,
            timestamp: new Date().toISOString()
        };

        const updatedEntries = localEntries.map(e =>
            e.id === selectedEntryId
                ? { ...e, comments: [...(e.comments || []), newComment] }
                : e
        );
        setLocalEntries(updatedEntries);
        setCommentInput('');

        try {
            await api.postComment(selectedEntryId, newComment.text, 'Founder');
            // In a real app, we'd refetch or wait for push update
        } catch (err) {
            console.error('Failed to post comment', err);
        }
    };

    const getAgentName = (id: string) => {
        const agent = agents.find(a => a.id === id);
        return agent ? agent.name : id;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: '1200px',
                    height: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2>Mission Control</h2>
                        <span className="badge" style={{ background: 'var(--bg-tertiary)', fontSize: '0.8rem' }}>
                            Swarm Intelligence Hub
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* LEFT PANEL: Stream/List */}
                    <div style={{
                        width: '350px',
                        borderRight: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--bg-secondary)'
                    }}>
                        <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            ACTIVE CONVERSATIONS
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {localEntries.map(entry => (
                                <div
                                    key={entry.id}
                                    onClick={() => setSelectedEntryId(entry.id)}
                                    style={{
                                        padding: '16px',
                                        cursor: 'pointer',
                                        background: selectedEntryId === entry.id ? 'var(--bg-primary)' : 'transparent',
                                        borderBottom: '1px solid var(--border-color)',
                                        borderLeft: selectedEntryId === entry.id ? '3px solid var(--accent-blue)' : '3px solid transparent',
                                        transition: 'background 0.1s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
                                            {entry.type}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: 500, marginBottom: '4px', fontSize: '0.9rem' }}>
                                        {entry.title}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {entry.content}
                                    </div>
                                    {/* Author & Reply Count */}
                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            👤 {getAgentName(entry.author)}
                                        </span>
                                        {entry.comments && entry.comments.length > 0 && (
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                • {entry.comments.length} replies
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Thread View */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                        {selectedEntry ? (
                            <>
                                {/* Thread Header */}
                                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <span className={`badge badge-${selectedEntry.priority.toLowerCase()}`}>
                                            {selectedEntry.priority}
                                        </span>
                                        <span className={`badge badge-${selectedEntry.status.toLowerCase()}`}>
                                            {selectedEntry.status}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>{selectedEntry.title}</h3>
                                    <div style={{
                                        padding: '16px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: '4px solid var(--accent-purple)',
                                        fontSize: '0.95rem',
                                        lineHeight: 1.5
                                    }}>
                                        <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-purple)', fontSize: '0.8rem' }}>
                                            {getAgentName(selectedEntry.author)} wrote:
                                        </div>
                                        {selectedEntry.content}
                                    </div>
                                </div>

                                {/* Comments Stream */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {selectedEntry.comments?.map((comment, idx) => {
                                        const authorName = getAgentName(comment.author) || comment.author;
                                        const isFounder = authorName === 'Founder';

                                        return (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isFounder ? 'flex-end' : 'flex-start',
                                            }}>
                                                <div style={{
                                                    maxWidth: '80%',
                                                    background: isFounder ? 'var(--accent-blue-dim)' : 'var(--bg-tertiary)',
                                                    padding: '12px 16px',
                                                    borderRadius: isFounder ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                                    border: isFounder ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                                                }}>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        marginBottom: '4px',
                                                        color: AGENT_COLORS[authorName] || 'var(--text-secondary)'
                                                    }}>
                                                        {authorName}
                                                        <span style={{ fontWeight: 400, marginLeft: '8px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                                            {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                                                        {comment.text}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Reply Box */}
                                <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <input
                                            type="text"
                                            placeholder="Reply as Founder..."
                                            value={commentInput}
                                            onChange={e => setCommentInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-primary)'
                                            }}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            onClick={handlePostComment}
                                            disabled={!commentInput.trim()}
                                        >
                                            Send
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                                        Guide your agents: The Architect, Recruiter, Overseer, Head of Ops, and Evolver.
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
                                Select a conversation to view details
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
