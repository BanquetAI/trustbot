import { useState } from 'react';

interface LoginScreenProps {
    onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded access code
        if (code.toLowerCase() === 'trustbot') {
            onLogin();
        } else {
            setError(true);
            setCode('');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <form onSubmit={handleSubmit} style={{
                background: 'var(--bg-card)',
                padding: '40px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
                <h1 style={{ marginBottom: '8px' }}>Security Check</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                    Enter the system access code to proceed.
                </p>

                <input
                    type="password"
                    value={code}
                    onChange={e => { setCode(e.target.value); setError(false); }}
                    placeholder="Access Code"
                    autoFocus
                    className="spawn-input"
                    style={{
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        letterSpacing: '4px',
                        marginBottom: '16px'
                    }}
                />

                {error && (
                    <div style={{ color: 'var(--accent-red)', marginBottom: '16px', fontSize: '0.875rem' }}>
                        Incorrect access code
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                >
                    Unlock System
                </button>
            </form>
        </div>
    );
}
