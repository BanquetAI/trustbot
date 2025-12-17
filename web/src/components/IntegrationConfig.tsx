import { useState, useEffect } from 'react';
// [Deleted MCP Import]
type ToolDefinition = any; // Fallback
import { api } from '../api';

// ============================================================================
// Integration Data
// ============================================================================

interface Integration {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    search?: string;
    guide?: string;
    helpUrl?: string;
    fields: { key: string; label: string; type: string; required: boolean }[];
}

const CATEGORIES = ['ALL', 'AI', 'WEB', 'SOCIAL', 'BUSINESS', 'CRM', 'ANALYTICS'];

const INTEGRATIONS: Integration[] = [
    // AI
    { id: 'openai', name: 'OpenAI', description: 'GPT-4, DALL-E APIs', category: 'AI', icon: '🤖', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }], guide: 'Get your API Key from platform.openai.com. You must have billing set up.', helpUrl: 'https://platform.openai.com/api-keys' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude AI models', category: 'AI', icon: '🧠', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }], helpUrl: 'https://console.anthropic.com/' },
    { id: 'google-ai', name: 'Google AI', description: 'Gemini models', category: 'AI', icon: '✨', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }], guide: 'Get your API key from Google AI Studio.', helpUrl: 'https://aistudio.google.com/app/apikey' },
    { id: 'mistral', name: 'Mistral AI', description: 'Open weights models', category: 'AI', icon: '🌪️', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }] },
    { id: 'cohere', name: 'Cohere', description: 'Enterprise LLMs', category: 'AI', icon: '🖇️', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }] },
    { id: 'huggingface', name: 'Hugging Face', description: 'Open source hub', category: 'AI', icon: '🤗', status: 'DISCONNECTED', fields: [{ key: 'accessToken', label: 'Access Token', type: 'password', required: true }] },
    { id: 'perplexity', name: 'Perplexity', description: 'Online LLM API', category: 'AI', icon: '🔮', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }] },

    // Web Search
    { id: 'serper', name: 'Serper.dev', description: 'Google Search API', category: 'WEB', icon: '🔍', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }], guide: 'Sign up for a free account at serper.dev to get 2,500 free queries.', helpUrl: 'https://serper.dev' },
    { id: 'brave', name: 'Brave Search', description: 'Privacy search API', category: 'WEB', icon: '🦁', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }] },
    { id: 'tavily', name: 'Tavily', description: 'Search for Agents', category: 'WEB', icon: '🕵️', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }] },

    // Social
    { id: 'twitter', name: 'Twitter/X', description: 'Read and post tweets', category: 'SOCIAL', icon: '🐦', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }, { key: 'apiSecret', label: 'API Secret', type: 'password', required: true }], guide: 'Requires a Developer Account with Elevated access for v2 API', helpUrl: 'https://developer.twitter.com/en/portal/dashboard' },
    { id: 'linkedin', name: 'LinkedIn', description: 'Professional network', category: 'SOCIAL', icon: '💼', status: 'DISCONNECTED', fields: [{ key: 'accessToken', label: 'Access Token', type: 'password', required: true }] },
    { id: 'discord', name: 'Discord', description: 'Bot and webhooks', category: 'SOCIAL', icon: '🎮', status: 'DISCONNECTED', fields: [{ key: 'botToken', label: 'Bot Token', type: 'password', required: true }], guide: 'Create an Application in Discord Developer Portal, add a Bot user, and copy the Token.', helpUrl: 'https://discord.com/developers/applications' },
    { id: 'reddit', name: 'Reddit', description: 'Community discussions', category: 'SOCIAL', icon: '👽', status: 'DISCONNECTED', fields: [{ key: 'clientId', label: 'Client ID', type: 'string', required: true }, { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true }] },
    { id: 'telegram', name: 'Telegram', description: 'Messaging bot', category: 'SOCIAL', icon: '✈️', status: 'DISCONNECTED', fields: [{ key: 'botToken', label: 'Bot Token', type: 'password', required: true }], guide: 'Talk to @BotFather on Telegram to create a new bot and get the HTTP API Token.' },
    { id: 'youtube', name: 'YouTube', description: 'Video platform', category: 'SOCIAL', icon: '📺', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }] },
    { id: 'instagram', name: 'Instagram', description: 'Visual media', category: 'SOCIAL', icon: '📸', status: 'DISCONNECTED', fields: [{ key: 'accessToken', label: 'Access Token', type: 'password', required: true }] },

    // Business
    { id: 'slack', name: 'Slack', description: 'Team messaging', category: 'BUSINESS', icon: '💬', status: 'DISCONNECTED', fields: [{ key: 'botToken', label: 'Bot Token', type: 'password', required: true }], guide: 'Create an App, enable Socket Mode, and add Bot Token Scopes.' },
    { id: 'gmail', name: 'Gmail', description: 'Email access', category: 'BUSINESS', icon: '📧', status: 'DISCONNECTED', fields: [{ key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true }] },
    { id: 'google-calendar', name: 'Google Calendar', description: 'Calendar management', category: 'BUSINESS', icon: '📅', status: 'DISCONNECTED', fields: [{ key: 'refreshToken', label: 'Refresh Token', type: 'password', required: true }] },
    { id: 'notion', name: 'Notion', description: 'Workspace docs', category: 'BUSINESS', icon: '📝', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'Integration Token', type: 'password', required: true }], guide: 'Create an Internal Integration in Notion Settings > Connections.' },
    { id: 'teams', name: 'Microsoft Teams', description: 'Enterprise chat', category: 'BUSINESS', icon: '👥', status: 'DISCONNECTED', fields: [{ key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true }] },
    { id: 'zoom', name: 'Zoom', description: 'Video conferencing', category: 'BUSINESS', icon: '📹', status: 'DISCONNECTED', fields: [{ key: 'jwtToken', label: 'JWT Token', type: 'password', required: true }] },
    { id: 'trello', name: 'Trello', description: 'Project boards', category: 'BUSINESS', icon: '🗂️', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }, { key: 'token', label: 'Token', type: 'password', required: true }] },
    { id: 'asana', name: 'Asana', description: 'Task management', category: 'BUSINESS', icon: '⚪', status: 'DISCONNECTED', fields: [{ key: 'accessToken', label: 'Access Token', type: 'password', required: true }] },
    { id: 'stripe', name: 'Stripe', description: 'Payments platform', category: 'BUSINESS', icon: '💳', status: 'DISCONNECTED', fields: [{ key: 'secretKey', label: 'Secret Key', type: 'password', required: true }], guide: 'Use a Test Mode Secret Key (sk_test_...) for development.' },
    { id: 'airtable', name: 'Airtable', description: 'Spreadsheet db', category: 'BUSINESS', icon: '📊', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }] },

    // CRM
    { id: 'hubspot', name: 'HubSpot', description: 'CRM and marketing', category: 'CRM', icon: '🔶', status: 'DISCONNECTED', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }] },
    { id: 'salesforce', name: 'Salesforce', description: 'Enterprise CRM', category: 'CRM', icon: '☁️', status: 'DISCONNECTED', fields: [{ key: 'accessToken', label: 'Access Token', type: 'password', required: true }, { key: 'instanceUrl', label: 'Instance URL', type: 'text', required: true }] },
    { id: 'zoho', name: 'Zoho CRM', description: 'Business suite', category: 'CRM', icon: '🇿', status: 'DISCONNECTED', fields: [{ key: 'accessToken', label: 'Access Token', type: 'password', required: true }] },
];

export function IntegrationConfig({ onClose }: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'integrations' | 'mcp'>('integrations');
    const [category, setCategory] = useState('ALL');
    const [integrations, setIntegrations] = useState(INTEGRATIONS);
    const [configuring, setConfiguring] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [connecting, setConnecting] = useState(false);

    // MCP Settings State
    const [mcpEnabled, setMcpEnabled] = useState(true);
    const [mcpMinTier, setMcpMinTier] = useState(1);
    const [toolOverrides, setToolOverrides] = useState<Record<string, { enabled?: boolean; minTier?: number }>>({});
    const [availableTools, _setAvailableTools] = useState<ToolDefinition[]>([]);
    const [mcpSaving, setMcpSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            // 1. Integrations Local Storage
            try {
                const stored = localStorage.getItem('trustbot_integrations');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setIntegrations(prev => prev.map(i =>
                        parsed[i.id] ? { ...i, status: 'CONNECTED' as const } : i
                    ));
                }
            } catch (e) { console.error(e); }

            // 2. Fetch Global Settings (Integrations + MCP)
            try {
                const settings = await api.getSettings();
                if (settings) {
                    // Sync Integrations
                    if (settings.integrations) {
                        setIntegrations(prev => prev.map(i =>
                            settings.integrations[i.id] ? { ...i, status: 'CONNECTED' as const } : i
                        ));
                    }
                    // Sync MCP
                    if (settings.mcp) {
                        if (typeof settings.mcp.enabled !== 'undefined') setMcpEnabled(settings.mcp.enabled);
                        if (typeof settings.mcp.minTier !== 'undefined') setMcpMinTier(settings.mcp.minTier);
                        if (settings.mcp.tools) setToolOverrides(settings.mcp.tools);
                    }
                }
            } catch (e) {
                console.warn('Settings load failed', e);
            }
        };
        loadSettings();
        // setAvailableTools([]);
    }, []);

    const saveMcpSettings = async (enabled: boolean, minTier: number) => {
        setMcpSaving(true);
        try {
            await api.postSettings('mcp', 'config', { enabled, minTier, tools: toolOverrides });
        } catch (e) {
            console.error(e);
            alert('Failed to save MCP settings');
        }
        setMcpSaving(false);
    };

    const handleConnect = async (integration: Integration) => {
        setConnecting(true);
        // 1. Local Persistence
        try {
            const stored = localStorage.getItem('trustbot_integrations');
            const parsed = stored ? JSON.parse(stored) : {};
            parsed[integration.id] = true;
            localStorage.setItem('trustbot_integrations', JSON.stringify(parsed));
        } catch (e) { console.error(e); }

        // 2. Server Verification
        try {
            await api.postSettings('integration', integration.id, formData);
            setIntegrations(prev => prev.map(i =>
                i.id === integration.id ? { ...i, status: 'CONNECTED' as const } : i
            ));
        } catch (e) {
            console.error(e);
            alert(`Verification Failed: ${(e as Error).message}`);
        }
        setConnecting(false);
        setConfiguring(null);
    };

    const handleDisconnect = (id: string) => {
        const stored = localStorage.getItem('trustbot_integrations');
        if (stored) {
            const parsed = JSON.parse(stored);
            delete parsed[id];
            localStorage.setItem('trustbot_integrations', JSON.stringify(parsed));
        }
        setIntegrations(prev => prev.map(i =>
            i.id === id ? { ...i, status: 'DISCONNECTED' as const } : i
        ));
    };

    const filtered = integrations.filter(i => category === 'ALL' || i.category === category);
    const configuringIntegration = integrations.find(i => i.id === configuring);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal integration-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div>
                            <h2 style={{ marginBottom: 0 }}>⚙️ Settings</h2>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-lighter)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <button
                                onClick={() => setActiveTab('integrations')}
                                style={{
                                    border: 'none',
                                    background: activeTab === 'integrations' ? 'var(--accent-blue)' : 'transparent',
                                    color: activeTab === 'integrations' ? 'white' : 'var(--text-muted)',
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Integrations
                            </button>
                            <button
                                onClick={() => setActiveTab('mcp')}
                                style={{
                                    border: 'none',
                                    background: activeTab === 'mcp' ? 'var(--accent-blue)' : 'transparent',
                                    color: activeTab === 'mcp' ? 'white' : 'var(--text-muted)',
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                MCP System
                            </button>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-content" style={{ minHeight: '400px' }}>
                    {activeTab === 'integrations' ? (
                        <>
                            {/* CATEGORY TABS */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        style={{
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            background: category === cat ? 'var(--accent-blue)' : 'var(--bg-card)',
                                            color: category === cat ? 'white' : 'var(--text-secondary)',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
                                {filtered.map(integration => (
                                    <div key={integration.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                        background: 'var(--bg-card)', borderRadius: '8px', marginBottom: '8px',
                                        border: `1px solid ${integration.status === 'CONNECTED' ? 'var(--accent-green)' : 'var(--border-color)'}`
                                    }}>
                                        <span style={{ fontSize: '1.5rem' }}>{integration.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{integration.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{integration.description}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: integration.status === 'CONNECTED' ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                                            {integration.status === 'CONNECTED' ? (
                                                <button onClick={() => handleDisconnect(integration.id)} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>Disconnect</button>
                                            ) : (
                                                <button onClick={() => { setConfiguring(integration.id); setFormData({}); }} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>Connect</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="animate-fade-in">
                            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🛡️ Model Context Protocol (MCP)</h3>
                                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            Global controls for agent tool access and capabilities.
                                        </p>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={mcpEnabled}
                                            onChange={e => {
                                                setMcpEnabled(e.target.checked);
                                                saveMcpSettings(e.target.checked, mcpMinTier); // Auto-save toggle
                                            }}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <div style={{ marginBottom: '32px', opacity: mcpEnabled ? 1 : 0.5, pointerEvents: mcpEnabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                                    <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>
                                        Minimum Agent Tier Access
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="5"
                                            value={mcpMinTier}
                                            onChange={e => setMcpMinTier(parseInt(e.target.value))}
                                            style={{ flex: 1 }}
                                        />
                                        <div style={{
                                            background: 'var(--bg-lighter)',
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            fontWeight: 'bold',
                                            minWidth: '60px',
                                            textAlign: 'center'
                                        }}>
                                            Tier {mcpMinTier}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                        Agents below Tier {mcpMinTier} will be restricted from using external MCP tools.
                                    </p>
                                </div>

                                <button
                                    className="btn btn-primary"
                                    onClick={() => saveMcpSettings(mcpEnabled, mcpMinTier)}
                                    disabled={mcpSaving}
                                >
                                    {mcpSaving ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>


                            {/* Granular Tool Controls */}
                            <div style={{ marginTop: '24px' }}>
                                <h4 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>🔧 Tool Configuration</h4>
                                <div style={{ display: 'grid', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {availableTools.map(tool => {
                                        const override = toolOverrides[tool.id] || {};
                                        const isEnabled = override.enabled !== false; // Default true unless explicitly false
                                        const tier = override.minTier ?? tool.minTier; // Default to tool minTier if no override

                                        return (
                                            <div key={tool.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)',
                                                opacity: mcpEnabled ? 1 : 0.5, pointerEvents: mcpEnabled ? 'auto' : 'none'
                                            }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {tool.name}
                                                        <span style={{ fontSize: '0.7em', background: 'var(--bg-lighter)', padding: '2px 6px', borderRadius: '4px' }}>{tool.id}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tool.description}</div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                                                        <span title="Minimum Tier Required">Tier</span>
                                                        <input
                                                            type="number"
                                                            min="0" max="5"
                                                            value={tier}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                setToolOverrides(prev => ({
                                                                    ...prev,
                                                                    [tool.id]: { ...prev[tool.id], minTier: val }
                                                                }));
                                                            }}
                                                            style={{
                                                                width: '40px', padding: '4px', borderRadius: '4px',
                                                                border: '1px solid var(--border-color)', background: 'var(--bg-lighter)', color: 'var(--text-primary)'
                                                            }}
                                                        />
                                                    </div>
                                                    <label className="switch" style={{ transform: 'scale(0.8)' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isEnabled}
                                                            onChange={(e) => {
                                                                setToolOverrides(prev => ({
                                                                    ...prev,
                                                                    [tool.id]: { ...prev[tool.id], enabled: e.target.checked }
                                                                }));
                                                            }}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent-blue)' }}>System Status</div>
                                        <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                            MCP System is currently <strong>{mcpEnabled ? 'ACTIVE' : 'PAUSED'}</strong>.
                                            {mcpEnabled
                                                ? ` Agents Tier ${mcpMinTier}+ have access to authorized tools.`
                                                : ' No external tool calls will be processed.'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CONFIGURATION MODAL OVERLAY */}
            {
                configuring && configuringIntegration && (
                    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setConfiguring(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <div>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {configuringIntegration.icon} Configure {configuringIntegration.name}
                                    </h3>
                                </div>
                                <button className="close-btn" onClick={() => setConfiguring(null)}>✕</button>
                            </div>
                            <div className="modal-content">
                                {configuringIntegration.guide && (
                                    <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-lighter)', borderRadius: '8px', fontSize: '0.85rem' }}>
                                        <strong>Guide:</strong> {configuringIntegration.guide}
                                        {configuringIntegration.helpUrl && (
                                            <div style={{ marginTop: '8px' }}>
                                                <a href={configuringIntegration.helpUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>View Official Docs →</a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {configuringIntegration.fields.map(field => (
                                    <div key={field.key} style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>{field.label} {field.required && '*'}</label>
                                        <input
                                            type={field.type === 'password' ? 'password' : 'text'}
                                            className="spawn-input"
                                            placeholder={`Enter ${field.label}...`}
                                            value={formData[field.key] || ''}
                                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                        />
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfiguring(null)}>Cancel</button>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleConnect(configuringIntegration)} disabled={connecting}>
                                        {connecting ? 'Verifying...' : 'Connect'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
