import React from 'react';

/**
 * Trust Tier Badge Component
 * 
 * Displays an agent's trust tier as a colored badge with
 * appropriate styling based on the 6-tier system.
 */

export enum TrustTier {
    UNTRUSTED = 0,
    PROBATIONARY = 1,
    TRUSTED = 2,
    VERIFIED = 3,
    CERTIFIED = 4,
    ELITE = 5,
}

interface TrustTierBadgeProps {
    tier: TrustTier | number;
    score?: number;
    showScore?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const TIER_CONFIG: Record<number, { name: string; color: string; bgColor: string; icon: string }> = {
    0: { name: 'UNTRUSTED', color: '#ff4444', bgColor: 'rgba(255, 68, 68, 0.15)', icon: '⛔' },
    1: { name: 'PROBATIONARY', color: '#ff8c00', bgColor: 'rgba(255, 140, 0, 0.15)', icon: '🔶' },
    2: { name: 'TRUSTED', color: '#44aaff', bgColor: 'rgba(68, 170, 255, 0.15)', icon: '✓' },
    3: { name: 'VERIFIED', color: '#00cc88', bgColor: 'rgba(0, 204, 136, 0.15)', icon: '✓✓' },
    4: { name: 'CERTIFIED', color: '#aa44ff', bgColor: 'rgba(170, 68, 255, 0.15)', icon: '🏅' },
    5: { name: 'ELITE', color: '#ffd700', bgColor: 'rgba(255, 215, 0, 0.2)', icon: '👑' },
};

const SIZE_STYLES: Record<string, React.CSSProperties> = {
    small: { fontSize: '0.7rem', padding: '2px 6px' },
    medium: { fontSize: '0.8rem', padding: '4px 10px' },
    large: { fontSize: '0.95rem', padding: '6px 14px' },
};

export const TrustTierBadge: React.FC<TrustTierBadgeProps> = ({
    tier,
    score,
    showScore = false,
    size = 'medium',
}) => {
    const config = TIER_CONFIG[tier] || TIER_CONFIG[0];
    const sizeStyle = SIZE_STYLES[size];

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: config.bgColor,
                color: config.color,
                border: `1px solid ${config.color}`,
                borderRadius: '12px',
                fontWeight: 600,
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                ...sizeStyle,
            }}
        >
            <span>{config.icon}</span>
            <span>{config.name}</span>
            {showScore && score !== undefined && (
                <span style={{ opacity: 0.8, fontSize: '0.85em' }}>
                    ({score})
                </span>
            )}
        </span>
    );
};

export default TrustTierBadge;
