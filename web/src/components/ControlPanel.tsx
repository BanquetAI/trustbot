import { useState } from 'react';
import { api } from '../api';

interface ControlPanelProps {
    hitlLevel: number;
    onSetHITL: (level: number) => void;
    onSpawn: (name: string, type: string, tier: number) => void;
    onClose: () => void;
    onAdvanceDay: () => void;
}

export function ControlPanel({ hitlLevel, onSetHITL, onSpawn, onClose, onAdvanceDay }: ControlPanelProps) {
    const [spawnName, setSpawnName] = useState('');
    const [spawnType, setSpawnType] = useState('WORKER');
    const [spawnTier, setSpawnTier] = useState(1);
    const [localHITL, setLocalHITL] = useState(hitlLevel);

    // Tick system state
    const [tickLoading, setTickLoading] = useState(false);
    const [tickResult, setTickResult] = useState<{
        processed: number;
        assigned: number;
        completed: number;
        events: string[];
    } | null>(null);

    // Task creation state
    const [taskDescription, setTaskDescription] = useState('');
    const [taskLoading, setTaskLoading] = useState(false);
    const [taskMessage, setTaskMessage] = useState('');

    const handleSpawn = () => {
        if (spawnName.trim()) {
            onSpawn(spawnName, spawnType, spawnTier);
            setSpawnName('');
        }
    };

    const handleTick = async () => {
        setTickLoading(true);
        setTickResult(null);
        try {
            const result = await api.tick();
            setTickResult({
                processed: result.processed,
                assigned: result.assigned,
                completed: result.completed,
                events: result.events || [],
            });
        } catch (e) {
            console.error('Tick failed:', e);
        }
        setTickLoading(false);
    };

    const handleCreateTask = async () => {
        if (!taskDescription.trim()) return;
        setTaskLoading(true);
        setTaskMessage('');
        try {
            const result = await api.createTask(taskDescription, 'Founder', 'NORMAL');
            setTaskMessage(result.message || 'Task created!');
            setTaskDescription('');
        } catch (e) {
            setTaskMessage('Failed to create task');
        }
        setTaskLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal control-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🎛️ Control Panel</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-content">
                    {/* Agent Tick System */}
                    <div className="control-section" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-green)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                        <h3 style={{ color: 'var(--accent-green)', marginTop: 0 }}>⚡ Agent Work Loop</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            Trigger agents to process tasks, make progress, and complete work.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={handleTick}
                            disabled={tickLoading}
                            style={{ width: '100%', marginBottom: '12px' }}
                        >
                            {tickLoading ? '⏳ Processing...' : '▶️ Run Agent Tick'}
                        </button>

                        {tickResult && (
                            <div style={{ fontSize: '0.85rem', background: 'var(--bg-card)', padding: '12px', borderRadius: '6px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{tickResult.processed}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Processed</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{tickResult.assigned}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assigned</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{tickResult.completed}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Completed</div>
                                    </div>
                                </div>
                                {tickResult.events.length > 0 && (
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                                        {tickResult.events.map((e, i) => (
                                            <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{e}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Create Task */}
                    <div className="control-section" style={{ marginBottom: '20px' }}>
                        <h3>📝 Create Task for Agents</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Research market trends, Analyze user data..."
                                value={taskDescription}
                                onChange={e => setTaskDescription(e.target.value)}
                                className="spawn-input"
                                style={{ flex: 1 }}
                                onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={handleCreateTask}
                                disabled={taskLoading || !taskDescription.trim()}
                            >
                                {taskLoading ? '...' : 'Create'}
                            </button>
                        </div>
                        {taskMessage && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', marginTop: '8px' }}>
                                {taskMessage}
                            </div>
                        )}
                    </div>

                    {/* HITL Level Control */}
                    <div className="control-section">
                        <h3>📊 Governance Level</h3>
                        <div className="hitl-slider-container">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={localHITL}
                                onChange={e => setLocalHITL(Number(e.target.value))}
                                onMouseUp={() => onSetHITL(localHITL)}
                                onTouchEnd={() => onSetHITL(localHITL)}
                                className="hitl-slider"
                            />
                            <div className="hitl-value">{localHITL}%</div>
                        </div>
                        <p className="helper-text">
                            {localHITL >= 80 ? '🔒 Full oversight - all decisions require approval' :
                                localHITL >= 50 ? '🔓 Shared control - major decisions need approval' :
                                    localHITL >= 20 ? '🤖 Mostly autonomous - only critical decisions escalate' :
                                        '🚀 Full autonomy - system operates independently'}
                        </p>
                    </div>

                    {/* Spawn Agent */}
                    <div className="control-section">
                        <h3>🏭 Spawn New Agent</h3>
                        <div className="spawn-form">
                            <input
                                type="text"
                                placeholder="Agent name..."
                                value={spawnName}
                                onChange={e => setSpawnName(e.target.value)}
                                className="spawn-input"
                            />
                            <select
                                value={spawnType}
                                onChange={e => setSpawnType(e.target.value)}
                                className="spawn-select"
                            >
                                <option value="LISTENER">👂 Listener (T0)</option>
                                <option value="WORKER">🤖 Worker (T1)</option>
                                <option value="SPECIALIST">🔧 Specialist (T2)</option>
                                <option value="ORCHESTRATOR">📋 Orchestrator (T3)</option>
                            </select>
                            <select
                                value={spawnTier}
                                onChange={e => setSpawnTier(Number(e.target.value))}
                                className="spawn-select"
                            >
                                <option value={0}>Tier 0</option>
                                <option value={1}>Tier 1</option>
                                <option value={2}>Tier 2</option>
                                <option value={3}>Tier 3</option>
                            </select>
                            <button className="btn btn-primary" onClick={handleSpawn}>
                                Spawn
                            </button>
                        </div>
                    </div>

                    {/* MCP Tools */}
                    <div className="control-section" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid var(--accent-purple)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                        <h3 style={{ color: 'var(--accent-purple)', marginTop: 0 }}>🔌 MCP Integration</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            External AI clients (Claude Desktop, Cursor) can control agents via MCP.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => window.open('/api/mcp', '_blank')}
                                style={{ fontSize: '0.8rem' }}
                            >
                                📋 View MCP Tools
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => window.open('/api/delegate', '_blank')}
                                style={{ fontSize: '0.8rem' }}
                            >
                                🔀 Delegation Rules
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => window.open('/api/stream', '_blank')}
                                style={{ fontSize: '0.8rem' }}
                            >
                                📡 Stream Snapshot
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => window.open('/api/executor', '_blank')}
                                style={{ fontSize: '0.8rem' }}
                            >
                                🤖 Executor Info
                            </button>
                        </div>
                        <div style={{ marginTop: '12px', padding: '8px', background: 'var(--bg-card)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <strong>MCP Endpoint:</strong> <code style={{ color: 'var(--accent-cyan)' }}>/api/mcp</code><br />
                            <strong>10 Tools:</strong> get_state, list_agents, create_task, delegate_task, spawn_agent, etc.
                        </div>
                    </div>

                    {/* Trust Tier Info */}
                    <div className="control-section" style={{ marginBottom: '20px' }}>
                        <h3>🏆 Trust Tier System</h3>
                        <div style={{ fontSize: '0.8rem', display: 'grid', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '4px' }}>
                                <span>🔴 ELITE (950+)</span><span>Full Control</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                                <span>🟢 CERTIFIED (800+)</span><span>Delegate + Spawn</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px' }}>
                                <span>🟣 VERIFIED (600+)</span><span>Can Delegate</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px' }}>
                                <span>🔵 TRUSTED (400+)</span><span>Must Execute</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '4px' }}>
                                <span>🟡 PROBATIONARY (200+)</span><span>Must Execute</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(107, 114, 128, 0.1)', borderRadius: '4px' }}>
                                <span>⚫ UNTRUSTED (0+)</span><span>Must Execute</span>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Max 2 delegations per task. After that, agent MUST execute.
                        </p>
                    </div>

                    {/* Time Control */}
                    <div className="control-section">
                        <h3>⏰ Time Control</h3>
                        <button className="btn btn-secondary" onClick={onAdvanceDay}>
                            ⏭️ Advance to Next Day
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
