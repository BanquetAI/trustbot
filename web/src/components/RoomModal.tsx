import React from 'react';
import { api } from '../api';
import type { Agent } from '../types';

interface RoomModalProps {
    room: { id: string; name: string; icon: string };
    agents: Agent[];
    onClose: () => void;
    onViewAgent: (agentId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
    IDLE: 'var(--text-muted)',
    WORKING: 'var(--accent-blue)',
    IN_MEETING: 'var(--accent-purple)',
    ERROR: 'var(--accent-red)',
};

export function RoomModal({ room, agents, onClose, onViewAgent }: RoomModalProps) {
    const [showBroadcast, setShowBroadcast] = React.useState(false);
    const [broadcastMsg, setBroadcastMsg] = React.useState('');
    const [showMeeting, setShowMeeting] = React.useState(false);
    const [meetingTopic, setMeetingTopic] = React.useState('');
    const [processing, setProcessing] = React.useState(false);

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setProcessing(true);
        try {
            await api.broadcast(room.id, broadcastMsg);
            alert(`Broadcast sent to ${room.name}`);
            setShowBroadcast(false);
            setBroadcastMsg('');
        } catch (e) {
            console.error(e);
            alert('Failed to broadcast');
        }
        setProcessing(false);
    };

    const handleSchedule = async () => {
        if (!meetingTopic.trim()) return;
        setProcessing(true);
        try {
            await api.scheduleMeeting(room.id, meetingTopic, 30); // Default 30 min
            alert(`Meeting "${meetingTopic}" scheduled in ${room.name}`);
            setShowMeeting(false);
            setMeetingTopic('');
        } catch (e) {
            console.error(e);
            alert('Failed to schedule meeting');
        }
        setProcessing(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal room-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '2rem' }}>{room.icon}</span>
                        <div>
                            <h2 style={{ fontSize: '1.25rem' }}>{room.name}</h2>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {agents.length} {agents.length === 1 ? 'occupant' : 'occupants'}
                            </span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-content">
                    {agents.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {agents.map(agent => (
                                <div
                                    key={agent.id}
                                    onClick={() => onViewAgent(agent.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        background: 'var(--bg-card)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div className={`agent-avatar tier-${agent.tier}`}>
                                        T{agent.tier}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{agent.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{agent.type}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: STATUS_COLORS[agent.status]
                                            }}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {agent.status}
                                        </span>
                                        <span style={{ color: 'var(--accent-blue)', marginLeft: '8px' }}>→</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            padding: '32px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🚪</div>
                            <div>This room is currently empty</div>
                            <div style={{ fontSize: '0.75rem', marginTop: '8px' }}>Use Broadcast to summon agents here.</div>
                        </div>
                    )}

                    {/* Room Actions */}
                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        {!showBroadcast && !showMeeting && (
                            <div className="action-buttons">
                                <button className="btn btn-secondary" onClick={() => setShowBroadcast(true)}>
                                    📢 Broadcast to Room
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowMeeting(true)}>
                                    📅 Schedule Meeting
                                </button>
                            </div>
                        )}

                        {showBroadcast && (
                            <div className="animate-fade-in">
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>📡 Send Message to Room</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="spawn-input"
                                        placeholder="Announcement or summons..."
                                        value={broadcastMsg}
                                        onChange={e => setBroadcastMsg(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="btn btn-primary" onClick={handleBroadcast} disabled={processing}>
                                        {processing ? '...' : 'Send'}
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => setShowBroadcast(false)}>Cancel</button>
                                </div>
                            </div>
                        )}

                        {showMeeting && (
                            <div className="animate-fade-in">
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 600 }}>🗓️ Book Meeting Room ({room.name})</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="spawn-input"
                                        placeholder="Meeting Topic..."
                                        value={meetingTopic}
                                        onChange={e => setMeetingTopic(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="btn btn-primary" onClick={handleSchedule} disabled={processing}>
                                        {processing ? '...' : 'Book'}
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => setShowMeeting(false)}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
