import { useState, useEffect } from 'react';

interface OnboardingStep {
    id: string;
    title: string;
    content: string;
    target?: string; // CSS selector for highlight
    position?: 'center' | 'top' | 'bottom';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to TrustBot HQ',
        content: 'This is your command center for managing an autonomous AI agent swarm. Agents work together, earn trust, and complete tasks. Let me show you around!',
        position: 'center',
    },
    {
        id: 'agents',
        title: 'Your AI Agents',
        content: 'The Executive Floor houses your T5 orchestrators - The Architect, Recruiter, Overseer, Head of Ops, and Evolver. Each has unique capabilities. Click any agent to see details.',
        target: '.floor',
        position: 'top',
    },
    {
        id: 'trust',
        title: 'Trust Tier System',
        content: 'Agents earn trust (0-1000) by completing tasks. Higher trust = more permissions:\n\n• ELITE (950+): Full control\n• CERTIFIED (800+): Can spawn agents\n• VERIFIED (600+): Can delegate\n• Below 600: Must execute tasks directly',
        position: 'center',
    },
    {
        id: 'delegation',
        title: 'Anti-Delegation Rules',
        content: 'To prevent infinite delegation loops:\n\n• Only VERIFIED+ agents can delegate\n• Max 2 delegations per task\n• After that, agent MUST execute\n\nThis ensures work actually gets done!',
        position: 'center',
    },
    {
        id: 'blackboard',
        title: 'Shared Blackboard',
        content: 'Agents post Problems, Solutions, Decisions, and Observations here. It\'s the shared intelligence layer. You can filter by type and add comments.',
        target: '.blackboard-section',
        position: 'bottom',
    },
    {
        id: 'controls',
        title: 'Control Panel',
        content: 'Click the ⚙️ gear icon to open controls:\n\n• Run Agent Tick - process pending tasks\n• Create Tasks - give agents work\n• Spawn Agents - add new workers\n• MCP Tools - external AI integration',
        position: 'center',
    },
    {
        id: 'mcp',
        title: 'MCP Integration',
        content: 'TrustBot has 10 MCP tools that let Claude Desktop, Cursor, or other AI clients control your agent swarm. Access via /api/mcp endpoint.',
        position: 'center',
    },
    {
        id: 'ready',
        title: 'You\'re Ready!',
        content: 'That\'s the basics! Remember:\n\n• Create tasks for agents to work on\n• Run ticks to process work\n• Watch trust scores evolve\n• Check blackboard for results\n\nClick "Get Started" to begin.',
        position: 'center',
    },
];

const STORAGE_KEY = 'trustbot_onboarding_complete';

interface OnboardingTourProps {
    onComplete: () => void;
    forceShow?: boolean;
}

export function OnboardingTour({ onComplete, forceShow = false }: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Check if user has already completed onboarding
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed || forceShow) {
            setVisible(true);
        }
    }, [forceShow]);

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setVisible(false);
        onComplete();
    };

    if (!visible) return null;

    const step = ONBOARDING_STEPS[currentStep];
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
        }}>
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
            }}>
                {/* Progress bar */}
                <div style={{
                    height: '4px',
                    background: 'var(--bg-secondary)',
                }}>
                    <div style={{
                        height: '100%',
                        width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
                        background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
                        transition: 'width 0.3s ease',
                    }} />
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {/* Step indicator */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                    }}>
                        <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                        }}>
                            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                        </span>
                        <button
                            onClick={handleSkip}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                padding: '4px 8px',
                            }}
                        >
                            Skip Tour
                        </button>
                    </div>

                    {/* Title */}
                    <h2 style={{
                        margin: '0 0 16px 0',
                        fontSize: '1.5rem',
                        color: 'var(--text-primary)',
                    }}>
                        {step.title}
                    </h2>

                    {/* Content */}
                    <p style={{
                        margin: '0 0 24px 0',
                        fontSize: '0.95rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line',
                    }}>
                        {step.content}
                    </p>

                    {/* Navigation */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                    }}>
                        <button
                            onClick={handlePrev}
                            disabled={isFirstStep}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'transparent',
                                color: isFirstStep ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: isFirstStep ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem',
                                opacity: isFirstStep ? 0.5 : 1,
                            }}
                        >
                            ← Back
                        </button>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {ONBOARDING_STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: idx === currentStep ? 'var(--accent-blue)' :
                                                   idx < currentStep ? 'var(--accent-green)' : 'var(--bg-secondary)',
                                        transition: 'background 0.2s ease',
                                    }}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                            }}
                        >
                            {isLastStep ? 'Get Started →' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export function to reset onboarding
export function resetOnboarding() {
    localStorage.removeItem(STORAGE_KEY);
}

// Export function to check if onboarding is complete
export function isOnboardingComplete(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
}
