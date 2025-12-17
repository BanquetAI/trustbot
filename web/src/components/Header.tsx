import type { SystemState } from '../types';

interface HeaderProps {
    state: SystemState;
    onOpenControls?: () => void;
    onOpenBlueprints?: () => void;
    onOpenIntegrations?: () => void;
    onOpenHITLExplanation?: () => void;
    onOpenAgentList?: () => void;
    onOpenTrustBreakdown?: () => void;
    onOpenMetrics?: () => void;
    onOpenConnectionStatus?: () => void;
    onOpenTasks?: () => void;
    onOpenBlackboard?: () => void;
    onOpenAdminSkills?: () => void;
    onOpenComms?: () => void;
    apiConnected?: boolean;
}

export function Header({ state, onOpenControls, onOpenBlueprints, onOpenIntegrations, onOpenHITLExplanation, onOpenAgentList, onOpenTrustBreakdown, onOpenMetrics, onOpenConnectionStatus, onOpenTasks, onOpenBlackboard, onOpenAdminSkills, onOpenComms, apiConnected }: HeaderProps) {
    const formatUptime = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const clickableStyle = {
        cursor: 'pointer',
        transition: 'transform 0.15s ease, opacity 0.15s ease',
    };

    return (
        <header className="header">
            <div className="header-title">
                <span className="icon">🏢</span>
                <div>
                    <h1>TrustBot Headquarters</h1>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Tier 5 Super-Autonomous Agent System
                        <span
                            onClick={onOpenConnectionStatus}
                            title="Click for connection details"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: apiConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: apiConnected ? 'var(--accent-green)' : 'var(--accent-blue)',
                                fontSize: '0.625rem',
                                cursor: onOpenConnectionStatus ? 'pointer' : 'default',
                                transition: 'opacity 0.15s ease',
                            }}
                            onMouseOver={e => onOpenConnectionStatus && (e.currentTarget.style.opacity = '0.7')}
                            onMouseOut={e => onOpenConnectionStatus && (e.currentTarget.style.opacity = '1')}
                        >
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: apiConnected ? 'var(--accent-green)' : 'var(--accent-blue)',
                                animation: apiConnected ? 'none' : 'pulse 2s infinite',
                            }} />
                            {apiConnected ? 'LIVE' : 'DEMO'} ↗
                        </span>
                    </span>
                </div>
            </div>

            <div className="header-stats">
                <div
                    className="stat-item"
                    style={onOpenHITLExplanation ? clickableStyle : {}}
                    onClick={onOpenHITLExplanation}
                    onMouseOver={e => onOpenHITLExplanation && (e.currentTarget.style.opacity = '0.8')}
                    onMouseOut={e => onOpenHITLExplanation && (e.currentTarget.style.opacity = '1')}
                    title="Click for HITL explanation"
                >
                    <span className="stat-value" style={{ color: 'var(--accent-gold)' }}>
                        {state.hitlLevel}%
                    </span>
                    <span className="stat-label">HITL Level ↗</span>
                </div>

                <div
                    className="stat-item"
                    style={onOpenAgentList ? clickableStyle : {}}
                    onClick={onOpenAgentList}
                    onMouseOver={e => onOpenAgentList && (e.currentTarget.style.opacity = '0.8')}
                    onMouseOut={e => onOpenAgentList && (e.currentTarget.style.opacity = '1')}
                    title="Click for agent directory"
                >
                    <span className="stat-value" style={{ color: 'var(--accent-green)' }}>
                        {state.totalAgents}
                    </span>
                    <span className="stat-label">Agents ↗</span>
                </div>

                <div
                    className="stat-item"
                    style={onOpenTrustBreakdown ? clickableStyle : {}}
                    onClick={onOpenTrustBreakdown}
                    onMouseOver={e => onOpenTrustBreakdown && (e.currentTarget.style.opacity = '0.8')}
                    onMouseOut={e => onOpenTrustBreakdown && (e.currentTarget.style.opacity = '1')}
                    title="Click for trust breakdown"
                >
                    <span className="stat-value" style={{ color: 'var(--accent-blue)' }}>
                        {state.avgTrust}
                    </span>
                    <span className="stat-label">Avg Trust ↗</span>
                </div>

                <div className="stat-item">
                    <span className="stat-value" style={{ color: 'var(--accent-purple)' }}>
                        {new Date().toLocaleTimeString("en-US", {
                            timeZone: "America/New_York",
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                        })}
                    </span>
                    <span className="stat-label">Company Time (EST)</span>
                </div>

                <div className="stat-item">
                    <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                        {formatUptime(state.uptime)}
                    </span>
                    <span className="stat-label">Uptime</span>
                </div>

                {onOpenControls && (
                    <button
                        className="btn btn-primary"
                        onClick={onOpenControls}
                        style={{ marginLeft: '16px' }}
                    >
                        🎛️ Controls
                    </button>
                )}

                {onOpenBlueprints && (
                    <button
                        className="btn btn-secondary"
                        onClick={onOpenBlueprints}
                    >
                        🏭 Blueprints
                    </button>
                )}

                {onOpenTasks && (
                    <button
                        className="btn btn-secondary"
                        onClick={onOpenTasks}
                    >
                        📋 Tasks
                    </button>
                )}

                {onOpenBlackboard && (
                    <button
                        className="btn btn-secondary"
                        onClick={onOpenBlackboard}
                        style={{ border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)', background: 'rgba(147, 51, 234, 0.1)' }}
                    >
                        🔮 Conclave
                    </button>
                )}

                {onOpenIntegrations && (
                    <button
                        className="btn btn-secondary"
                        onClick={onOpenIntegrations}
                    >
                        🔌 Integrations
                    </button>
                )}

                {onOpenComms && (
                    <button
                        className="btn btn-secondary"
                        onClick={onOpenComms}
                        style={{ border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)' }}
                    >
                        💬 Chat
                    </button>
                )}

                {onOpenMetrics && (
                    <button
                        className="btn btn-secondary"
                        onClick={onOpenMetrics}
                    >
                        📊 Metrics
                    </button>
                )}

                {onOpenAdminSkills && (
                    <button
                        className="btn btn-secondary"
                        onClick={onOpenAdminSkills}
                        title="Admin Skills Panel"
                        style={{ border: '1px solid var(--accent-orange)', color: 'var(--accent-orange)', background: 'rgba(249, 115, 22, 0.1)' }}
                    >
                        🔐 Admin
                    </button>
                )}
            </div>
        </header>
    );
}
