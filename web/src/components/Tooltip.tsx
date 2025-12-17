import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export function Tooltip({ content, children, position = 'top', delay = 300 }: TooltipProps) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const timeoutRef = useRef<number | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => {
        timeoutRef.current = window.setTimeout(() => {
            setVisible(true);
            updatePosition();
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setVisible(false);
    };

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();

        let top = 0, left = 0;

        switch (position) {
            case 'top':
                top = rect.top - 8;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + rect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - 8;
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + 8;
                break;
        }

        setCoords({ top, left });
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        transform: position === 'top' ? 'translate(-50%, -100%)' :
                   position === 'bottom' ? 'translate(-50%, 0)' :
                   position === 'left' ? 'translate(-100%, -50%)' :
                   'translate(0, -50%)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '0.8rem',
        color: 'var(--text-primary)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 9999,
        maxWidth: '250px',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s ease',
    };

    return (
        <div
            ref={triggerRef}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            style={{ display: 'inline-flex' }}
        >
            {children}
            {visible && (
                <div style={tooltipStyle}>
                    {content}
                </div>
            )}
        </div>
    );
}

// Pre-defined tooltips for common elements
export const TOOLTIPS = {
    // Trust System
    trustScore: "Agent's reputation score (0-1000). Higher = more permissions.",
    trustTier: "Trust level determines what actions an agent can perform.",
    canDelegate: "VERIFIED+ (600+) agents can pass tasks to others.",
    canSpawn: "CERTIFIED+ (800+) agents can create new agents.",
    mustExecute: "This agent must complete tasks directly - cannot delegate.",

    // Task System
    taskStatus: "PENDING → IN_PROGRESS → COMPLETED/FAILED",
    delegation: "Tasks can be delegated max 2 times, then must be executed.",
    tickSystem: "Each tick processes pending tasks and advances agent work.",

    // Blackboard
    blackboard: "Shared intelligence board where agents post findings.",
    blackboardProblem: "Issues identified that need solving.",
    blackboardSolution: "Proposed or implemented solutions.",
    blackboardDecision: "Key decisions made by agents or humans.",

    // MCP
    mcpTools: "Model Context Protocol - lets external AI control agents.",
    mcpEndpoint: "Connect Claude Desktop or Cursor to /api/mcp",

    // HITL
    hitlLevel: "Human-In-The-Loop: How much oversight you want.",
    hitlHigh: "Full oversight - all decisions need your approval.",
    hitlLow: "Full autonomy - agents operate independently.",

    // Agents
    agentStatus: "IDLE = available, WORKING = busy, IN_MEETING = collaborating",
    agentType: "Role determines capabilities and task assignments.",
};
