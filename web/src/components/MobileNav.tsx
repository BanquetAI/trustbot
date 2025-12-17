import { useState } from 'react';

interface MobileNavProps {
    onOpenControls: () => void;
    onOpenTasks: () => void;
    onOpenComms: () => void;
    onOpenMetrics: () => void;
    onOpenBlackboard: () => void;
    onOpenIntegrations: () => void;
    onOpenBlueprints: () => void;
    onOpenAdminSkills: () => void;
    activeView?: string;
}

export function MobileNav({
    onOpenControls,
    onOpenTasks,
    onOpenComms,
    onOpenMetrics,
    onOpenBlackboard,
    onOpenIntegrations,
    onOpenBlueprints,
    onOpenAdminSkills,
}: MobileNavProps) {
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);

    return (
        <>
            {/* More Menu Overlay */}
            {moreMenuOpen && (
                <div
                    className="mobile-more-overlay"
                    onClick={() => setMoreMenuOpen(false)}
                >
                    <div
                        className="mobile-more-menu"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="mobile-more-header">
                            <span>More Options</span>
                            <button onClick={() => setMoreMenuOpen(false)}>✕</button>
                        </div>
                        <div className="mobile-more-grid">
                            <button onClick={() => { onOpenControls(); setMoreMenuOpen(false); }}>
                                <span className="mobile-more-icon">🎛️</span>
                                <span>Controls</span>
                            </button>
                            <button onClick={() => { onOpenBlueprints(); setMoreMenuOpen(false); }}>
                                <span className="mobile-more-icon">🏭</span>
                                <span>Blueprints</span>
                            </button>
                            <button onClick={() => { onOpenIntegrations(); setMoreMenuOpen(false); }}>
                                <span className="mobile-more-icon">🔌</span>
                                <span>Integrations</span>
                            </button>
                            <button onClick={() => { onOpenBlackboard(); setMoreMenuOpen(false); }}>
                                <span className="mobile-more-icon">🔮</span>
                                <span>Conclave</span>
                            </button>
                            <button onClick={() => { onOpenAdminSkills(); setMoreMenuOpen(false); }}>
                                <span className="mobile-more-icon">🔐</span>
                                <span>Admin</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <nav className="mobile-bottom-nav">
                <button className="mobile-nav-item" onClick={onOpenTasks}>
                    <span className="mobile-nav-icon">📋</span>
                    <span className="mobile-nav-label">Tasks</span>
                </button>
                <button className="mobile-nav-item" onClick={onOpenComms}>
                    <span className="mobile-nav-icon">💬</span>
                    <span className="mobile-nav-label">Chat</span>
                </button>
                <button className="mobile-nav-item mobile-nav-center" onClick={onOpenControls}>
                    <span className="mobile-nav-icon-center">🎛️</span>
                </button>
                <button className="mobile-nav-item" onClick={onOpenMetrics}>
                    <span className="mobile-nav-icon">📊</span>
                    <span className="mobile-nav-label">Metrics</span>
                </button>
                <button className="mobile-nav-item" onClick={() => setMoreMenuOpen(true)}>
                    <span className="mobile-nav-icon">☰</span>
                    <span className="mobile-nav-label">More</span>
                </button>
            </nav>
        </>
    );
}
