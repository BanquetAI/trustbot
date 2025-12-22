import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useState, useCallback, memo } from 'react';

interface LoginScreenProps {
    onLogin: (user?: { email: string; name: string; picture?: string }) => void;
}

// Decode JWT token to get user info
function decodeJwt(token: string): { email: string; name: string; picture?: string } | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        const payload = JSON.parse(jsonPayload);
        return {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
        };
    } catch {
        return null;
    }
}

// Static data - defined outside component to avoid recreation
const features = [
    { icon: '🛡️', title: '6-Tier Trust', desc: 'Graduated autonomy levels' },
    { icon: '👁️', title: 'Real-Time', desc: 'Live agent monitoring' },
    { icon: '📋', title: 'Audit Trail', desc: 'Complete action history' },
] as const;

const DEMO_USER = {
    email: 'demo@trustbot.ai',
    name: 'Demo User',
    picture: undefined,
} as const;

export const LoginScreen = memo(function LoginScreen({ onLogin }: LoginScreenProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSuccess = useCallback((response: CredentialResponse) => {
        setIsLoading(true);
        if (response.credential) {
            const user = decodeJwt(response.credential);
            if (user) {
                sessionStorage.setItem('trustbot_user', JSON.stringify(user));
                sessionStorage.setItem('trustbot_credential', response.credential);
                onLogin(user);
            } else {
                onLogin();
            }
        }
        setIsLoading(false);
    }, [onLogin]);

    const handleError = useCallback(() => {
        console.error('Google Sign-In failed');
        setIsLoading(false);
    }, []);

    const handleDemoMode = useCallback(() => {
        sessionStorage.setItem('trustbot_user', JSON.stringify(DEMO_USER));
        sessionStorage.setItem('trustbot_demo', 'true');
        onLogin(DEMO_USER);
    }, [onLogin]);

    return (
        <div className="login-screen">
            {/* Animated background */}
            <div className="login-bg-pattern" />

            <div className="login-container">
                {/* Logo and branding */}
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <span className="login-logo-bot">🤖</span>
                        <div className="login-logo-pulse" />
                    </div>
                </div>

                <h1 className="login-title">TrustBot HQ</h1>
                <p className="login-tagline">Sleep soundly while your agents work</p>

                {/* Feature highlights */}
                <div className="login-features">
                    {features.map((f, i) => (
                        <div key={i} className="login-feature">
                            <span className="login-feature-icon">{f.icon}</span>
                            <div className="login-feature-text">
                                <strong>{f.title}</strong>
                                <span>{f.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sign in section */}
                <div className="login-auth-section">
                    {isLoading ? (
                        <div className="login-loading">
                            <div className="login-spinner" />
                            <span>Authenticating...</span>
                        </div>
                    ) : (
                        <>
                            <div className="login-google-wrapper">
                                <GoogleLogin
                                    onSuccess={handleSuccess}
                                    onError={handleError}
                                    theme="filled_black"
                                    size="large"
                                    shape="rectangular"
                                    text="signin_with"
                                    logo_alignment="left"
                                />
                            </div>

                            <div className="login-divider">
                                <span>or</span>
                            </div>

                            <button
                                onClick={handleDemoMode}
                                className="login-demo-btn"
                            >
                                Try Demo Mode
                            </button>
                        </>
                    )}
                </div>

                <p className="login-footer">
                    AI Agent Governance Platform
                </p>
            </div>
        </div>
    );
});
