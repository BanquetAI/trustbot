import { useState } from 'react';
import type { Agent } from '../types';

interface AgentModalProps {
    agent: Agent;
    onClose: () => void;
    onSendCommand: (command: string) => void;
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

const STATUS_COLORS: Record<string, string> = {
    IDLE: 'var(--text-muted)',
    WORKING: 'var(--accent-blue)',
    IN_MEETING: 'var(--accent-purple)',
    ERROR: 'var(--accent-red)',
};

interface CommandResponse {
    type: 'success' | 'error' | 'info';
    message: string;
}

export function AgentModal({ agent, onClose, onSendCommand }: AgentModalProps) {
    const [command, setCommand] = useState('');
    const [response, setResponse] = useState<CommandResponse | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    const handleQuickAction = async (action: string) => {
        setLoading(action);
        setResponse(null);

        // Simulate command processing
        await new Promise(r => setTimeout(r, 800));

        switch (action) {
            case 'status':
                onSendCommand('status');
                setResponse({
                    type: 'info',
                    message: `📊 ${agent.name} Status:\n• Current: ${agent.status}\n• Trust: ${agent.trustScore}/1000\n• Location: ${agent.location.room.replace(/_/g, ' ')}\n• Active since: Today 09:00`,
                });
                break;
            case 'report':
                onSendCommand('report');
                setResponse({
                    type: 'success',
                    message: `📋 Report requested from ${agent.name}. Check blackboard for results in ~30 seconds.`,
                });
                break;
            case 'reassign':
                onSendCommand('reassign');
                setResponse({
                    type: 'info',
                    message: `🔄 Reassignment initiated. Select a new task or room for ${agent.name}.`,
                });
                break;
            default:
                onSendCommand(action);
                setResponse({
                    type: 'success',
                    message: `Command "${action}" sent to ${agent.name}.`,
                });
        }

        setLoading(null);
    };

    const handleSendCommand = async () => {
        if (command.trim()) {
            setLoading('custom');
            await new Promise(r => setTimeout(r, 500));
            onSendCommand(command);
            setResponse({
                type: 'success',
                message: `✓ Command sent: "${command}"`,
            });
            setCommand('');
            setLoading(null);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal agent-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="agent-header-info">
                        <span className="agent-icon-large">{AGENT_ICONS[agent.type] ?? '🤖'}</span>
                        <div>
                            <h2>{agent.name}</h2>
                            <span className="agent-type-badge">T{agent.tier} {agent.type}</span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-content">
                    {/* Status */}
                    <div className="agent-status-row">
                        <span
                            className="status-indicator"
                            style={{ background: STATUS_COLORS[agent.status] }}
                        />
                        <span className="status-text">{agent.status}</span>
                        <span className="location-text">
                            📍 {agent.location.room.replace(/_/g, ' ')}
                        </span>
                    </div>

                    {/* Trust Score */}
                    <div className="agent-section">
                        <h3>Trust Score</h3>
                        <div className="trust-display">
                            <div className="trust-value-large">{agent.trustScore}</div>
                            <div className="trust-bar-container">
                                <div
                                    className="trust-bar-fill"
                                    style={{ width: `${agent.trustScore / 10}%` }}
                                />
                            </div>
                        </div>
                        <div className="trust-level-label">
                            {agent.trustScore >= 900 ? 'SOVEREIGN' :
                                agent.trustScore >= 700 ? 'EXECUTIVE' :
                                    agent.trustScore >= 500 ? 'TACTICAL' :
                                        agent.trustScore >= 300 ? 'OPERATIONAL' :
                                            agent.trustScore >= 100 ? 'WORKER' : 'PASSIVE'}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="agent-section">
                        <h3>Quick Actions</h3>
                        <div className="action-buttons">
                            <button
                                className="btn btn-secondary"
                                onClick={() => handleQuickAction('status')}
                                disabled={loading !== null}
                                style={{ opacity: loading === 'status' ? 0.7 : 1 }}
                            >
                                {loading === 'status' ? '⏳' : '📊'} Get Status
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => handleQuickAction('report')}
                                disabled={loading !== null}
                                style={{ opacity: loading === 'report' ? 0.7 : 1 }}
                            >
                                {loading === 'report' ? '⏳' : '📋'} Request Report
                            </button>
                            {agent.tier < 5 && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handleQuickAction('reassign')}
                                    disabled={loading !== null}
                                    style={{ opacity: loading === 'reassign' ? 0.7 : 1 }}
                                >
                                    {loading === 'reassign' ? '⏳' : '🔄'} Reassign
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Response Display */}
                    {response && (
                        <div
                            className="agent-section"
                            style={{
                                padding: '12px',
                                background: response.type === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                                    response.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                                        'rgba(59, 130, 246, 0.1)',
                                borderRadius: '8px',
                                border: `1px solid ${response.type === 'success' ? 'var(--accent-green)' :
                                        response.type === 'error' ? 'var(--accent-red)' :
                                            'var(--accent-blue)'
                                    }`,
                            }}
                        >
                            <div style={{
                                fontSize: '0.875rem',
                                whiteSpace: 'pre-line',
                                color: response.type === 'success' ? 'var(--accent-green)' :
                                    response.type === 'error' ? 'var(--accent-red)' :
                                        'var(--accent-blue)',
                            }}>
                                {response.message}
                            </div>
                            <button
                                onClick={() => setResponse(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.625rem',
                                    marginTop: '8px',
                                    cursor: 'pointer',
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    {/* Command Input */}
                    <div className="agent-section">
                        <h3>Send Custom Command</h3>
                        <div className="command-input-container">
                            <input
                                type="text"
                                placeholder="Enter command..."
                                value={command}
                                onChange={e => setCommand(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendCommand()}
                                className="command-input"
                                disabled={loading !== null}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleSendCommand}
                                disabled={loading !== null || !command.trim()}
                            >
                                {loading === 'custom' ? '⏳' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
