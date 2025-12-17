// TrustBot HQ - Main Application
import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Building } from './components/Building';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { BlackboardModal } from './components/BlackboardModal';
import { RoomModal } from './components/RoomModal';
import { BlueprintSelector } from './components/BlueprintSelector';
import { IntegrationConfig } from './components/IntegrationConfig';
import { HITLExplanation } from './components/HITLExplanation';
import { AgentListModal } from './components/AgentListModal';
import { TrustBreakdownModal } from './components/TrustBreakdownModal';
import { BlackboardFilterModal } from './components/BlackboardFilterModal';
import { MetricsDashboard } from './components/MetricsDashboard';
import { ConnectionStatusModal } from './components/ConnectionStatusModal';
import { AgentProfilePage } from './components/AgentProfilePage';
import { TaskBoard } from './components/TaskBoard';
import { SmartBlackboard } from './components/SmartBlackboard';
import { SkillsManagementModal } from './components/SkillsManagementModal';
import { CommsDashboard } from './components/CommsDashboard';
import { MobileNav } from './components/MobileNav';
import { GenesisProtocol, isGenesisComplete, resetGenesis } from './components/GenesisProtocol';
import { HelpPanel } from './components/HelpPanel';
import { useSystemState, useApprovals, api, type Agent as APIAgent } from './api';
import type { SystemState, Agent } from './types';

// Fallback state when API is not available
const fallbackState: SystemState = {
    agents: [
        { id: 'exec-1', name: 'T5-EXECUTOR', type: 'EXECUTOR', tier: 5, status: 'IDLE', location: { floor: 'EXECUTIVE', room: 'EXECUTOR_OFFICE' }, trustScore: 1000, capabilities: ['execution'], skills: [], parentId: null },
        { id: 'plan-1', name: 'T5-PLANNER', type: 'PLANNER', tier: 5, status: 'WORKING', location: { floor: 'EXECUTIVE', room: 'PLANNER_OFFICE' }, trustScore: 980, capabilities: ['strategy'], skills: [], parentId: null },
        { id: 'valid-1', name: 'T5-VALIDATOR', type: 'VALIDATOR', tier: 5, status: 'IDLE', location: { floor: 'EXECUTIVE', room: 'VALIDATOR_OFFICE' }, trustScore: 990, capabilities: ['audit'], skills: [], parentId: null },
        { id: 'evolve-1', name: 'T5-EVOLVER', type: 'EVOLVER', tier: 5, status: 'WORKING', location: { floor: 'EXECUTIVE', room: 'EVOLVER_OFFICE' }, trustScore: 970, capabilities: ['optimize'], skills: [], parentId: null },
        { id: 'spawn-1', name: 'T5-SPAWNER', type: 'SPAWNER', tier: 5, status: 'IDLE', location: { floor: 'EXECUTIVE', room: 'SPAWNER_OFFICE' }, trustScore: 985, capabilities: ['spawn'], skills: [], parentId: null },
        { id: 'listen-1', name: 'DecisionListener', type: 'LISTENER', tier: 0, status: 'WORKING', location: { floor: 'OPERATIONS', room: 'LISTENER_STATION' }, trustScore: 40, capabilities: ['listen'], skills: [], parentId: null },
        { id: 'listen-2', name: 'CommunicationListener', type: 'LISTENER', tier: 0, status: 'IDLE', location: { floor: 'OPERATIONS', room: 'LISTENER_STATION' }, trustScore: 45, capabilities: ['listen'], skills: [], parentId: null },
        { id: 'asst-1', name: 'ResearchAssistant', type: 'WORKER', tier: 1, status: 'IDLE', location: { floor: 'OPERATIONS', room: 'ASSISTANT_DESK_A' }, trustScore: 80, capabilities: ['research'], skills: [], parentId: null },
    ],
    blackboardEntries: [
        { id: 'bb-1', type: 'OBSERVATION', title: 'T5-EXECUTOR Online', content: 'System initialized successfully.', author: 'exec-1', priority: 'HIGH', status: 'OPEN', timestamp: new Date() },
        { id: 'bb-2', type: 'DECISION', title: 'Morning check-in initiated', content: 'Routine diagnostics started.', author: 'plan-1', priority: 'MEDIUM', status: 'RESOLVED', timestamp: new Date() },
        { id: 'bb-3', type: 'TASK', title: 'Daily strategic review', content: 'Analyzing previous day metrics.', author: 'plan-1', priority: 'HIGH', status: 'IN_PROGRESS', timestamp: new Date() },
        { id: 'bb-4', type: 'PATTERN', title: 'Efficiency improvement detected', content: 'Optimization algorithm updated.', author: 'evolve-1', priority: 'LOW', status: 'OPEN', timestamp: new Date() },
    ],
    meetings: [],
    hitlLevel: 100,
    avgTrust: 847,
    totalAgents: 8,
    uptime: 0,
};

// Modal state types
type ModalType = 'none' | 'agent' | 'blackboard' | 'room' | 'controls' | 'blueprints' | 'integrations' | 'hitl' | 'agentList' | 'trustBreakdown' | 'blackboardFilter' | 'metrics' | 'connectionStatus' | 'tasks' | 'adminSkills' | 'comms';

interface RoomInfo {
    id: string;
    name: string;
    icon: string;
}

function App() {
    // Try to use API, fallback to local state
    const { state: apiState, loading, error } = useSystemState();
    const approvals = useApprovals();

    const [localState, setLocalState] = useState<SystemState>(fallbackState);
    const [activeModal, setActiveModal] = useState<ModalType>('none');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 768); // Only collapsed on mobile
    const [selectedBlackboardType, setSelectedBlackboardType] = useState<string | null>(null);

    // User assistance state
    const [showGenesis, setShowGenesis] = useState(() => !isGenesisComplete());
    const [showHelpPanel, setShowHelpPanel] = useState(false);

    // Initial Load: Sync Settings
    useEffect(() => {
        api.getSettings().then(settings => {
            if (settings?.mcp) {
                // [Deleted MCP Config]
            }
        }).catch(e => console.warn('Failed to sync settings', e));
    }, []);

    // Auth state
    const [authenticated, setAuthenticated] = useState(() => {
        return sessionStorage.getItem('trustbot_auth') === 'true';
    });

    const handleLogin = () => {
        setAuthenticated(true);
        sessionStorage.setItem('trustbot_auth', 'true');
    };

    // Calculate uptime or use local
    // If API state is present, we still want the UI to tick.
    // We'll use localState.uptime as the visual counter, initialized from API if possible?
    // Actually, simple session timer is best for this view.

    // Merge API state with local state format
    const state: SystemState = apiState ? {
        agents: apiState.agents.map((a: APIAgent) => ({
            id: a.id,
            name: a.name,
            type: a.type as Agent['type'],
            tier: a.tier as Agent['tier'],
            status: a.status,
            location: { floor: a.location.floor as 'EXECUTIVE' | 'OPERATIONS' | 'WORKSPACE', room: a.location.room },
            trustScore: a.trustScore,
            capabilities: a.capabilities,
            skills: a.skills || [], // Default to empty if missing
            parentId: a.parentId,
            childIds: a.childIds,
        })),
        blackboardEntries: apiState.blackboard.map(b => ({
            id: b.id,
            type: b.type as any,
            title: b.title,
            content: b.content as string,
            author: b.author,
            priority: b.priority as any,
            status: b.status as any,
            timestamp: new Date(b.createdAt),
            comments: b.comments?.map((c: any) => ({
                author: c.author,
                text: c.text,
                timestamp: new Date(c.timestamp)
            })),
        })),
        meetings: [],
        hitlLevel: apiState.hitlLevel,
        avgTrust: apiState.avgTrust,
        totalAgents: apiState.agents.length,
        uptime: localState.uptime,
        persistenceMode: apiState.persistenceMode,
    } : localState;

    // Fetch persistent uptime from API, then tick locally
    useEffect(() => {
        // Initial fetch from API
        api.getUptime()
            .then(data => {
                if (data?.uptime) {
                    setLocalState(s => ({ ...s, uptime: data.uptime }));
                }
            })
            .catch(() => {
                // Fallback: keep local uptime
            });

        // Tick every second
        const interval = setInterval(() => {
            setLocalState(s => ({ ...s, uptime: s.uptime + 1 }));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Keyboard accessibility - Escape to close modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && activeModal !== 'none') {
                setActiveModal('none');
                setSelectedAgentId(null);
                setSelectedEntryId(null);
                setSelectedRoom(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeModal]);

    // Get selected data
    const selectedAgent = state.agents.find(a => a.id === selectedAgentId);
    const selectedEntry = state.blackboardEntries.find(e => e.id === selectedEntryId);
    const roomAgents = selectedRoom
        ? state.agents.filter(a => a.location.room === selectedRoom.id)
        : [];

    if (!authenticated) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    // Navigation handlers
    const openAgent = (agentId: string) => {
        setSelectedAgentId(agentId);
        setActiveModal('agent');
    };

    const openEntry = (entryId: string) => {
        setSelectedEntryId(entryId);
        setActiveModal('blackboard');
    };

    const openRoom = (room: RoomInfo) => {
        setSelectedRoom(room);
        setActiveModal('room');
    };

    const closeModal = () => {
        setActiveModal('none');
    };

    // API handlers
    const handleSpawnAgent = async (name: string, type: string, tier: number) => {
        try {
            await api.spawnAgent({ name, type, tier });
        } catch {
            const newAgent: Agent = {
                id: `local-${Date.now()}`,
                name,
                type: type as Agent['type'],
                tier: tier as Agent['tier'],
                status: 'IDLE',
                location: { floor: 'OPERATIONS', room: 'SPAWN_BAY' },
                trustScore: tier * 50 + 50,
                capabilities: ['work'],
                skills: [],
                parentId: null,
            };
            setLocalState(s => ({
                ...s,
                agents: [...s.agents, newAgent],
                totalAgents: s.totalAgents + 1,
            }));
        }
    };

    const handleSetHITL = async (level: number) => {
        try {
            await api.setHITL(level);
        } catch {
            setLocalState(s => ({ ...s, hitlLevel: level }));
        }
    };

    const handleSendCommand = async (command: string) => {
        if (selectedAgentId && selectedAgent) {
            try {
                const result = await api.sendCommand(selectedAgentId, command, {
                    name: selectedAgent.name,
                    type: selectedAgent.type,
                    status: selectedAgent.status,
                    trustScore: selectedAgent.trustScore,
                });
                return result ? {
                    command: result.command,
                    response: result.response,
                    timestamp: result.timestamp,
                } : null;
            } catch {
                // Return simulated fallback response
                return {
                    command,
                    response: `✅ Command "${command}" received. (Demo mode - API unavailable)`,
                    timestamp: new Date().toISOString(),
                };
            }
        }
        return null;
    };

    return (
        <div className="app-container">
            <Header
                state={state}
                onOpenControls={() => setActiveModal('controls')}
                onOpenBlueprints={() => setActiveModal('blueprints')}
                onOpenTasks={() => setActiveModal('tasks')}
                onOpenBlackboard={() => setActiveModal('blackboard')}
                onOpenIntegrations={() => setActiveModal('integrations')}
                onOpenHITLExplanation={() => setActiveModal('hitl')}
                onOpenAgentList={() => setActiveModal('agentList')}
                onOpenTrustBreakdown={() => setActiveModal('trustBreakdown')}
                onOpenMetrics={() => setActiveModal('metrics')}
                onOpenConnectionStatus={() => setActiveModal('connectionStatus')}
                onOpenAdminSkills={() => setActiveModal('adminSkills')}
                onOpenComms={() => setActiveModal('comms')}
                apiConnected={!error && !loading}
            />
            <div className="main-content">
                <Building
                    agents={state.agents}
                    selectedAgent={selectedAgentId}
                    onSelectAgent={openAgent}
                    onSelectRoom={openRoom}
                    blackboardEntries={state.blackboardEntries}
                    onSelectBlackboardType={(type) => {
                        setSelectedBlackboardType(type);
                        setActiveModal('blackboardFilter');
                    }}
                />

                {/* Sidebar Overlay (mobile) */}
                <div
                    className={`sidebar-overlay ${sidebarCollapsed ? 'hidden' : ''}`}
                    onClick={() => setSidebarCollapsed(true)}
                />

                <Sidebar
                    entries={state.blackboardEntries}
                    selectedAgent={selectedAgent}
                    hitlLevel={state.hitlLevel}
                    approvals={approvals}
                    onApprove={async (id, approved) => {
                        try {
                            await api.approve(id, approved);
                        } catch {
                            // Ignore
                        }
                    }}
                    onSelectEntry={openEntry}
                    onSelectAgent={openAgent}
                    onOpenHITLExplanation={() => setActiveModal('hitl')}
                    onOpenMissionControl={() => setActiveModal('blackboard')}
                    collapsed={sidebarCollapsed}
                    onClose={() => setSidebarCollapsed(true)}
                />
            </div>

            {/* Mobile Sidebar Toggle */}
            <button
                className="sidebar-toggle"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? 'Open Panel' : 'Close Panel'}
                aria-label={sidebarCollapsed ? 'Open sidebar panel' : 'Close sidebar panel'}
                aria-expanded={!sidebarCollapsed}
            >
                {sidebarCollapsed ? '📋' : '✕'}
            </button>

            {/* Control Panel Modal */}
            {activeModal === 'controls' && (
                <ControlPanel
                    hitlLevel={state.hitlLevel}
                    onSetHITL={handleSetHITL}
                    onSpawn={handleSpawnAgent}
                    onClose={closeModal}
                    onAdvanceDay={async () => {
                        try {
                            await api.advanceDay();
                        } catch {
                            // Ignore
                        }
                    }}
                />
            )}

            {/* Agent Detail Modal */}
            {activeModal === 'agent' && selectedAgent && (
                <AgentProfilePage
                    agent={selectedAgent}
                    allAgents={state.agents}
                    blackboardEntries={state.blackboardEntries}
                    onClose={closeModal}
                    onViewAgent={(id) => {
                        setSelectedAgentId(id);
                        // Modal stays open, just updates the agent
                    }}
                    onSendCommand={handleSendCommand}
                />
            )}

            {/* Blackboard Entry Modal */}
            {activeModal === 'blackboard' && selectedEntry && (
                <BlackboardModal
                    entry={selectedEntry}
                    onClose={closeModal}
                    onViewAuthor={(authorId) => {
                        closeModal();
                        setTimeout(() => openAgent(authorId), 100);
                    }}
                />
            )}

            {/* Room Modal */}
            {activeModal === 'room' && selectedRoom && (
                <RoomModal
                    room={selectedRoom}
                    agents={roomAgents}
                    onClose={closeModal}
                    onViewAgent={(agentId) => {
                        closeModal();
                        setTimeout(() => openAgent(agentId), 100);
                    }}
                />
            )}

            {/* Blueprint Selector */}
            {activeModal === 'blueprints' && (
                <BlueprintSelector
                    onSpawn={(blueprint, name) => {
                        handleSpawnAgent(name, blueprint.category, blueprint.tier);
                    }}
                    onClose={closeModal}
                />
            )}

            {/* Integration Config */}
            {activeModal === 'integrations' && (
                <IntegrationConfig onClose={closeModal} />
            )}

            {/* HITL Explanation */}
            {activeModal === 'hitl' && (
                <HITLExplanation currentLevel={state.hitlLevel} onClose={closeModal} />
            )}

            {/* Agent List */}
            {activeModal === 'agentList' && (
                <AgentListModal agents={state.agents} onClose={closeModal} onSelectAgent={(id) => {
                    closeModal();
                    setTimeout(() => openAgent(id), 100);
                }} />
            )}

            {/* Smart Blackboard */}
            {activeModal === 'blackboard' && (
                <SmartBlackboard entries={state.blackboardEntries} agents={state.agents} onClose={closeModal} />
            )}

            {/* Trust Breakdown */}
            {activeModal === 'trustBreakdown' && (
                <TrustBreakdownModal agents={state.agents} avgTrust={state.avgTrust} onClose={closeModal} />
            )}

            {/* Blackboard Filter */}
            {activeModal === 'blackboardFilter' && selectedBlackboardType && (
                <BlackboardFilterModal
                    entries={state.blackboardEntries}
                    filterType={selectedBlackboardType}
                    onClose={closeModal}
                    onSelectEntry={(id) => {
                        closeModal();
                        setTimeout(() => openEntry(id), 100);
                    }}
                />
            )}

            {/* Metrics Dashboard */}
            {activeModal === 'metrics' && (
                <MetricsDashboard
                    agents={state.agents}
                    blackboardEntries={state.blackboardEntries}
                    hitlLevel={state.hitlLevel}
                    avgTrust={state.avgTrust}
                    uptime={state.uptime}
                    onClose={closeModal}
                    onViewAgent={(id) => {
                        closeModal();
                        setTimeout(() => openAgent(id), 100);
                    }}
                />
            )}

            {activeModal === 'connectionStatus' && (
                <ConnectionStatusModal
                    isConnected={!!((apiState as any)?.uptime && (apiState as any).uptime > 0) || !loading}
                    persistenceMode={state.persistenceMode}
                    onClose={closeModal}
                />
            )}

            {/* Task Board */}
            {activeModal === 'tasks' && (
                <TaskBoard onClose={closeModal} />
            )}

            {/* Admin Skills Panel */}
            {activeModal === 'adminSkills' && (
                <SkillsManagementModal onClose={closeModal} />
            )}

            {activeModal === 'comms' && (
                <CommsDashboard onClose={closeModal} />
            )}

            {/* Mobile Bottom Navigation */}
            <MobileNav
                onOpenControls={() => setActiveModal('controls')}
                onOpenTasks={() => setActiveModal('tasks')}
                onOpenComms={() => setActiveModal('comms')}
                onOpenMetrics={() => setActiveModal('metrics')}
                onOpenBlackboard={() => setActiveModal('blackboard')}
                onOpenIntegrations={() => setActiveModal('integrations')}
                onOpenBlueprints={() => setActiveModal('blueprints')}
                onOpenAdminSkills={() => setActiveModal('adminSkills')}
            />

            {/* Help Button (fixed position) */}
            <button
                onClick={() => setShowHelpPanel(true)}
                title="Help & Documentation"
                aria-label="Open help panel"
                style={{
                    position: 'fixed',
                    bottom: '80px',
                    right: '20px',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                ?
            </button>

            {/* Genesis Protocol (agent-guided onboarding for first-time users) */}
            {showGenesis && (
                <GenesisProtocol
                    onComplete={() => setShowGenesis(false)}
                />
            )}

            {/* Help Panel (slide-in sidebar) */}
            <HelpPanel
                isOpen={showHelpPanel}
                onClose={() => setShowHelpPanel(false)}
                onRestartTour={() => {
                    resetGenesis();
                    setShowGenesis(true);
                }}
            />
        </div>
    );
}

export default App;
