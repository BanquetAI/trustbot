// TrustBot HQ - Main Application with Aria Console
import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Console } from './components/Console';
import { ControlPanel } from './components/ControlPanel';
import { BlueprintSelector } from './components/BlueprintSelector';
import { IntegrationConfig } from './components/IntegrationConfig';
import { HITLExplanation } from './components/HITLExplanation';
import { AgentListModal } from './components/AgentListModal';
import { TrustBreakdownModal } from './components/TrustBreakdownModal';
import { MetricsDashboard } from './components/MetricsDashboard';
import { ConnectionStatusModal } from './components/ConnectionStatusModal';
import { AgentProfilePage } from './components/AgentProfilePage';
import { TaskBoard } from './components/TaskBoard';
import { SkillsManagementModal } from './components/SkillsManagementModal';
import { CommsDashboard } from './components/CommsDashboard';
import { GenesisProtocol, isGenesisComplete, resetGenesis } from './components/GenesisProtocol';
import { HelpPanel } from './components/HelpPanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorBanner } from './components/ErrorBanner';
import { ThoughtLogPanel } from './components/ThoughtLogPanel';
import { GameUXProvider, AchievementToast, type Achievement } from './components/GameUX';
import { SkillLibrary } from './components/SkillLibrary';
import { AutonomyQuery } from './components/AutonomyQuery';
import { RequestGrantPanel } from './components/RequestGrantPanel';
import { CodeGovernance } from './components/CodeGovernance';
import { GuidedOnboarding } from './components/GuidedOnboarding';
import { ToastProvider, useToast } from './components/ui';
import { useTrustBot } from './hooks';
import { api } from './api';

// Modal state types - simplified for Console-first architecture
type ModalType = 'none' | 'agent' | 'blackboard' | 'controls' | 'blueprints' | 'integrations' | 'hitl' | 'agentList' | 'trustBreakdown' | 'metrics' | 'connectionStatus' | 'tasks' | 'adminSkills' | 'comms' | 'thoughtLog' | 'skillLibrary' | 'autonomyQuery' | 'requestGrant' | 'codeGovernance' | 'guidedOnboarding';

// Inner app component that can use game context
function AppContent() {
    // Unified TrustBot hook - single source of truth
    const {
        agents,
        blackboardEntries,
        approvals,
        hitlLevel,
        avgTrust,
        uptime,
        loading,
        error,
        persistenceMode,
        spawnAgent,
        setHITL,
        approve,
        refresh,
    } = useTrustBot();

    // Game UX state (for achievements)
    const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);

    const [activeModal, setActiveModal] = useState<ModalType>('none');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

    // User assistance state
    const [showGenesis, setShowGenesis] = useState(() => !isGenesisComplete());
    const [showHelpPanel, setShowHelpPanel] = useState(false);
    const [errorDismissed, setErrorDismissed] = useState(false);

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

    // Keyboard accessibility - Escape to close modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && activeModal !== 'none') {
                setActiveModal('none');
                setSelectedAgentId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeModal]);

    // Get selected data
    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    if (!authenticated) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    // Navigation handlers
    const openAgent = (agentId: string) => {
        setSelectedAgentId(agentId);
        setActiveModal('agent');
    };

    const closeModal = () => {
        setActiveModal('none');
    };

    // API handlers - delegate to hook
    const handleSpawnAgent = async (name: string, type: string, tier: number) => {
        await spawnAgent(name, type, tier);
    };

    const handleSetHITL = async (level: number) => {
        await setHITL(level);
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

    // Show loading overlay on initial load (before any data)
    const showInitialLoading = loading && agents.length === 0;

    // Reset error dismissed when error changes
    const handleRetry = async () => {
        setErrorDismissed(false);
        await refresh();
    };

    return (
        <div className="app-container" style={{ height: '100vh', overflow: 'hidden' }}>
            {/* Initial loading state */}
            {showInitialLoading && <LoadingOverlay />}

            {/* API error banner (dismissible) */}
            {error && !errorDismissed && (
                <ErrorBanner
                    error={error}
                    onRetry={handleRetry}
                    onDismiss={() => setErrorDismissed(true)}
                />
            )}

            {/* Aria Console - Primary Interface */}
            <Console
                agents={agents}
                blackboardEntries={blackboardEntries}
                hitlLevel={hitlLevel}
                approvals={approvals}
                onSpawn={handleSpawnAgent}
                onSetHITL={handleSetHITL}
                onApprove={approve}
                onSelectAgent={openAgent}
                onOpenControls={() => setActiveModal('controls')}
                onOpenAgentList={() => setActiveModal('agentList')}
                onOpenMetrics={() => setActiveModal('metrics')}
                onOpenTasks={() => setActiveModal('tasks')}
                onOpenHelp={() => setShowHelpPanel(true)}
            />

            {/* Control Panel Modal */}
            {activeModal === 'controls' && (
                <ControlPanel
                    hitlLevel={hitlLevel}
                    onSetHITL={handleSetHITL}
                    onSpawn={handleSpawnAgent}
                    onClose={closeModal}
                />
            )}

            {/* Agent Detail Modal */}
            {activeModal === 'agent' && selectedAgent && (
                <AgentProfilePage
                    agent={selectedAgent}
                    allAgents={agents}
                    blackboardEntries={blackboardEntries}
                    onClose={closeModal}
                    onViewAgent={(id) => {
                        setSelectedAgentId(id);
                        // Modal stays open, just updates the agent
                    }}
                    onSendCommand={handleSendCommand}
                    onEvaluateAutonomy={() => {
                        setActiveModal('autonomyQuery');
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
                <HITLExplanation currentLevel={hitlLevel} onClose={closeModal} />
            )}

            {/* Agent List */}
            {activeModal === 'agentList' && (
                <AgentListModal agents={agents} onClose={closeModal} onSelectAgent={(id) => {
                    closeModal();
                    setTimeout(() => openAgent(id), 100);
                }} />
            )}

            {/* Trust Breakdown */}
            {activeModal === 'trustBreakdown' && (
                <TrustBreakdownModal agents={agents} avgTrust={avgTrust} onClose={closeModal} />
            )}

            {/* Blackboard Filter - now integrated into Sidebar with embedded={true} */}

            {/* Metrics Dashboard */}
            {activeModal === 'metrics' && (
                <MetricsDashboard
                    agents={agents}
                    blackboardEntries={blackboardEntries}
                    hitlLevel={hitlLevel}
                    avgTrust={avgTrust}
                    uptime={uptime}
                    onClose={closeModal}
                    onViewAgent={(id) => {
                        closeModal();
                        setTimeout(() => openAgent(id), 100);
                    }}
                />
            )}

            {activeModal === 'connectionStatus' && (
                <ConnectionStatusModal
                    isConnected={!error && !loading}
                    persistenceMode={persistenceMode}
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

            {/* Thought Log Panel */}
            {activeModal === 'thoughtLog' && (
                <ThoughtLogPanel
                    entries={[
                        {
                            id: 'log-1',
                            agentId: 'exec-1',
                            agentName: 'T5-EXECUTOR',
                            timestamp: new Date().toISOString(),
                            observation: {
                                context: 'System initialization sequence',
                                trigger: 'Boot process completed',
                                inputs: { systemState: 'ready', agentCount: 8 },
                            },
                            reasoning: [
                                { step: 1, thought: 'All subsystems are operational', consideration: 'Health check status', conclusion: 'Proceed with initialization' },
                                { step: 2, thought: 'Agent network is stable', consideration: 'Heartbeat signals received', conclusion: 'Network ready for operations' },
                            ],
                            intent: {
                                goal: 'Initialize morning operations',
                                expectedOutcome: 'All agents receive task assignments',
                                confidence: 0.88,
                            },
                            action: {
                                type: 'BROADCAST',
                                description: 'Sent initialization message to all T5 agents',
                                parameters: { recipients: ['plan-1', 'valid-1', 'evolve-1', 'spawn-1'] },
                            },
                            result: {
                                status: 'success',
                                output: 'Morning briefing completed successfully',
                            },
                            delta: {
                                intentMatched: true,
                                trustImpact: 2,
                                lessonsLearned: 'Early initialization improves throughput',
                            },
                        },
                        {
                            id: 'log-2',
                            agentId: 'plan-1',
                            agentName: 'T5-PLANNER',
                            timestamp: new Date(Date.now() - 300000).toISOString(),
                            observation: {
                                context: 'Strategic planning session',
                                trigger: 'Daily objectives review',
                                inputs: { pendingTasks: 12, priority: 'HIGH' },
                            },
                            reasoning: [
                                { step: 1, thought: 'Resource allocation needs optimization', consideration: 'Queue depth increasing', conclusion: 'Rebalancing required' },
                                { step: 2, thought: 'Should delegate routine tasks to T2 agents', consideration: 'Trust scores support delegation', conclusion: 'Safe to delegate 5 tasks' },
                            ],
                            intent: {
                                goal: 'Optimize task distribution',
                                expectedOutcome: 'Reduced queue depth by 40%',
                                confidence: 0.79,
                            },
                            action: {
                                type: 'DELEGATE',
                                description: 'Delegated 5 routine tasks to worker agents',
                                parameters: { taskIds: ['t-101', 't-102', 't-103', 't-104', 't-105'] },
                            },
                            result: {
                                status: 'success',
                                output: 'Tasks successfully delegated',
                                sideEffects: ['Worker load increased 15%'],
                            },
                            delta: {
                                intentMatched: true,
                                trustImpact: 3,
                            },
                        },
                    ]}
                    onClose={closeModal}
                />
            )}

            {/* Skill Library */}
            {activeModal === 'skillLibrary' && (
                <SkillLibrary
                    onClose={closeModal}
                    selectedAgentId={selectedAgentId || undefined}
                    selectedAgentTier={selectedAgent?.tier || 0}
                    selectedAgentTrustScore={selectedAgent?.trustScore || 0}
                    selectedAgentSkills={selectedAgent?.skills || []}
                    onAssignSkill={(skillId, agentId) => {
                        console.log('Assigned skill:', skillId, 'to agent:', agentId);
                        setShowAchievement({
                            id: 'skill-master',
                            title: 'Skill Assigned',
                            description: 'Assigned a new skill to an agent',
                            icon: '🎮',
                            rarity: 'rare',
                            xpReward: 50,
                        });
                    }}
                />
            )}

            {/* Autonomy Query */}
            {activeModal === 'autonomyQuery' && selectedAgent && (
                <AutonomyQuery
                    agent={selectedAgent}
                    onClose={closeModal}
                    onApprovePromotion={(agentId, newTier) => {
                        console.log('Approved promotion:', agentId, 'to tier', newTier);
                        setShowAchievement({
                            id: 'trust-granted',
                            title: 'Trust Granted',
                            description: `Promoted agent to Tier ${newTier}`,
                            icon: '⬆️',
                            rarity: 'epic',
                            xpReward: 150,
                        });
                    }}
                    onDenyPromotion={(agentId, reason) => {
                        console.log('Denied promotion:', agentId, 'reason:', reason);
                    }}
                />
            )}

            {/* Request/Grant Panel */}
            {activeModal === 'requestGrant' && selectedAgent && (
                <RequestGrantPanel
                    currentAgent={selectedAgent}
                    allAgents={agents}
                    onClose={closeModal}
                    onSubmitRequest={(request) => {
                        console.log('Request submitted:', request);
                        setShowAchievement({
                            id: 'help-requested',
                            title: 'Help Requested',
                            description: 'Submitted a request to upper tiers',
                            icon: '🤝',
                            rarity: 'common',
                            xpReward: 25,
                        });
                    }}
                    onGrantRequest={(requestId, capabilities) => {
                        console.log('Request granted:', requestId, capabilities);
                        setShowAchievement({
                            id: 'trust-extended',
                            title: 'Trust Extended',
                            description: 'Granted capabilities to a lower-tier agent',
                            icon: '🎁',
                            rarity: 'rare',
                            xpReward: 75,
                        });
                    }}
                />
            )}

            {/* Code Governance Panel */}
            {activeModal === 'codeGovernance' && (
                <CodeGovernance
                    onClose={closeModal}
                    onApproveChange={(changeId) => {
                        console.log('Approved code change:', changeId);
                        setShowAchievement({
                            id: 'code-approved',
                            title: 'Code Approved',
                            description: 'Approved a code modification request',
                            icon: '✅',
                            rarity: 'rare',
                            xpReward: 50,
                        });
                    }}
                    onRejectChange={(changeId, reason) => {
                        console.log('Rejected code change:', changeId, 'reason:', reason);
                    }}
                />
            )}

            {/* Guided Onboarding Wizard */}
            {activeModal === 'guidedOnboarding' && (
                <GuidedOnboarding
                    onClose={closeModal}
                    onComplete={(config) => {
                        console.log('Onboarding complete:', config);
                        setShowAchievement({
                            id: 'integrations-configured',
                            title: 'Integrations Configured',
                            description: 'Set up MCP, RAG, and API integrations',
                            icon: '🔌',
                            rarity: 'epic',
                            xpReward: 200,
                        });
                    }}
                />
            )}

            {/* Achievement Toast */}
            {showAchievement && (
                <AchievementToast
                    achievement={showAchievement}
                    onClose={() => setShowAchievement(null)}
                />
            )}

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

// Main App wrapper with GameUXProvider and ToastProvider
function App() {
    return (
        <ToastProvider maxToasts={5} defaultDuration={5000}>
            <GameUXProvider>
                <AppContent />
            </GameUXProvider>
        </ToastProvider>
    );
}

export default App;
