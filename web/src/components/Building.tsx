import type { Agent, BlackboardEntry } from '../types';
import { TrustTierBadge } from './TrustTierBadge';

interface RoomInfo {
    id: string;
    name: string;
    icon: string;
}

interface BuildingProps {
    agents: Agent[];
    selectedAgent: string | null;
    onSelectAgent: (id: string) => void;
    onSelectRoom?: (room: RoomInfo) => void;
    blackboardEntries?: BlackboardEntry[];
    onSelectBlackboardType?: (type: string) => void;
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

const ROOM_CONFIG = {
    EXECUTIVE: [
        { id: 'EXECUTOR_OFFICE', name: 'Executor Office', icon: '🎖️' },
        { id: 'PLANNER_OFFICE', name: 'Planner Office', icon: '🧠' },
        { id: 'VALIDATOR_OFFICE', name: 'Validator Office', icon: '🛡️' },
        { id: 'EVOLVER_OFFICE', name: 'Evolver Office', icon: '🧬' },
        { id: 'SPAWNER_OFFICE', name: 'Spawner Office', icon: '🏭' },
        { id: 'CONFERENCE_ROOM_A', name: 'Conference Room A', icon: '📋' },
    ],
    OPERATIONS: [
        { id: 'LISTENER_STATION', name: 'Listener Station', icon: '👂' },
        { id: 'ASSISTANT_DESK_A', name: 'Assistant Desk A', icon: '🤖' },
        { id: 'ASSISTANT_DESK_B', name: 'Assistant Desk B', icon: '🤖' },
        { id: 'VIDEO_CONFERENCE', name: 'Video Conference Bay', icon: '📺' },
        { id: 'CONFERENCE_ROOM_B', name: 'Conference Room B', icon: '📋' },
    ],
};

function Room({
    room,
    agents,
    isSelected,
    onSelectAgent,
    onSelectRoom
}: {
    room: RoomInfo;
    agents: Agent[];
    isSelected: boolean;
    onSelectAgent: (id: string) => void;
    onSelectRoom?: (room: RoomInfo) => void;
}) {
    const hasActiveMeeting = agents.some(a => a.status === 'IN_MEETING');

    const handleRoomClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectRoom?.(room);
    };

    const handleAgentClick = (e: React.MouseEvent, agentId: string) => {
        e.stopPropagation();
        onSelectAgent(agentId);
    };

    return (
        <div
            className={`room ${hasActiveMeeting ? 'meeting' : ''} ${isSelected ? 'active' : ''}`}
            onClick={handleRoomClick}
        >
            <div className="room-header">
                <span className="room-icon">{room.icon}</span>
                <span className="room-name">{room.name}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--accent-blue)', fontSize: '0.75rem' }}>→</span>
            </div>

            {agents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {agents.map(agent => (
                        <div
                            key={agent.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '4px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                            }}
                            onClick={(e) => handleAgentClick(e, agent.id)}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div className={`agent-avatar tier-${agent.tier}`}>
                                {AGENT_ICONS[agent.type] ?? '🤖'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{agent.name}</span>
                                    <TrustTierBadge tier={agent.tier} size="small" />
                                </div>
                                <div className="room-status">
                                    <span className={`status-dot ${agent.status.toLowerCase()}`} />
                                    <span>{agent.status}</span>
                                </div>
                            </div>
                            <span style={{ color: 'var(--accent-blue)', fontSize: '0.625rem' }}>→</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="room-status" style={{ marginTop: '8px' }}>
                    <span className="status-dot idle" />
                    <span>Empty</span>
                </div>
            )}
        </div>
    );
}

export function Building({ agents, selectedAgent, onSelectAgent, onSelectRoom, blackboardEntries = [], onSelectBlackboardType }: BuildingProps) {
    const getAgentsInRoom = (floor: string, roomId: string) => {
        return agents.filter(a => a.location.floor === floor && a.location.room === roomId);
    };

    // Count blackboard entries by type
    const getTypeCount = (type: string) => blackboardEntries.filter(e => e.type === type).length;

    return (
        <div className="building-view">
            {/* Executive Floor */}
            <div className="floor animate-in">
                <div className="floor-header">
                    <span>👔</span>
                    <span className="floor-name">Executive Floor - T5 Orchestrators</span>
                </div>
                <div className="floor-rooms">
                    {ROOM_CONFIG.EXECUTIVE.map(room => (
                        <Room
                            key={room.id}
                            room={room}
                            agents={getAgentsInRoom('EXECUTIVE', room.id)}
                            isSelected={getAgentsInRoom('EXECUTIVE', room.id).some(a => a.id === selectedAgent)}
                            onSelectAgent={onSelectAgent}
                            onSelectRoom={onSelectRoom}
                        />
                    ))}
                </div>
            </div>

            {/* Operations Floor */}
            <div className="floor animate-in" style={{ animationDelay: '100ms' }}>
                <div className="floor-header">
                    <span>⚙️</span>
                    <span className="floor-name">Operations Floor - Listeners & Assistants</span>
                </div>
                <div className="floor-rooms">
                    {ROOM_CONFIG.OPERATIONS.map(room => (
                        <Room
                            key={room.id}
                            room={room}
                            agents={getAgentsInRoom('OPERATIONS', room.id)}
                            isSelected={getAgentsInRoom('OPERATIONS', room.id).some(a => a.id === selectedAgent)}
                            onSelectAgent={onSelectAgent}
                            onSelectRoom={onSelectRoom}
                        />
                    ))}
                </div>
            </div>

            {/* Blackboard Section */}
            <div className="floor glass-card animate-in" style={{ animationDelay: '200ms' }}>
                <div className="floor-header">
                    <span>📊</span>
                    <span className="floor-name">Blackboard - Shared Intelligence</span>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '12px',
                    padding: '12px'
                }}>
                    {[
                        { label: 'Problems', type: 'PROBLEM', color: 'var(--accent-red)' },
                        { label: 'Solutions', type: 'SOLUTION', color: 'var(--accent-green)' },
                        { label: 'Decisions', type: 'DECISION', color: 'var(--accent-gold)' },
                        { label: 'Patterns', type: 'PATTERN', color: 'var(--accent-purple)' },
                        { label: 'Observations', type: 'OBSERVATION', color: 'var(--accent-cyan)' },
                        { label: 'Tasks', type: 'TASK', color: 'var(--accent-blue)' },
                    ].map(item => (
                        <div
                            key={item.label}
                            onClick={() => onSelectBlackboardType?.(item.type)}
                            title={`View all ${item.label}`}
                            style={{
                                textAlign: 'center',
                                padding: '12px',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: `3px solid ${item.color}`,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{getTypeCount(item.type)}</div>
                            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label} ↗</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
