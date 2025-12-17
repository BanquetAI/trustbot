import React, { useEffect, useState } from 'react';
import type { Task } from '../types';
import { api } from '../api';

/**
 * Task Board (Active Blackboard)
 * 
 * Displays active tasks in a tabular format as requested:
 * Task, ID#, Created By, Handler, % Complete, Next Steps.
 */

interface TaskBoardProps {
    onClose: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ onClose }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await api.getTasks();
                setTasks(data.tasks);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
        const interval = setInterval(fetchTasks, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'var(--text-muted)';
            case 'ASSIGNED': return 'var(--accent-blue)';
            case 'IN_PROGRESS': return 'var(--accent-cyan)';
            case 'COMPLETED': return 'var(--accent-green)';
            case 'FAILED': return 'var(--accent-red)';
            default: return 'var(--text-primary)';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '1100px', height: '80vh', display: 'flex', flexDirection: 'column' }}
            >
                <div className="modal-header">
                    <h2>📋 Active Task Board</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <div style={{ flex: '0 0 80px' }}>ID #</div>
                            <div style={{ flex: '1 1 250px' }}>TASK</div>
                            <div style={{ flex: '0 0 120px' }}>CREATED BY</div>
                            <div style={{ flex: '0 0 150px' }}>HANDLER</div>
                            <div style={{ flex: '0 0 100px' }}>% COMPLETE</div>
                            <div style={{ flex: '1 1 200px' }}>NEXT STEPS</div>
                            <div style={{ flex: '0 0 100px' }}>STATUS</div>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading && tasks.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                        ) : tasks.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No active tasks. Try asking a Planner to "plan [goal]".
                            </div>
                        ) : (
                            tasks.map(task => (
                                <div
                                    key={task.id}
                                    style={{
                                        display: 'flex',
                                        padding: '12px 16px',
                                        borderBottom: '1px solid var(--border-color)',
                                        alignItems: 'center',
                                        fontSize: '0.85rem',
                                        transition: 'background 0.15s ease'
                                    }}
                                    className="task-row"
                                >
                                    {/* ID */}
                                    <div style={{ flex: '0 0 80px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                        #{task.id.split('-')[1]}
                                    </div>

                                    {/* Task */}
                                    <div style={{ flex: '1 1 250px', fontWeight: 500, paddingRight: '12px' }}>
                                        {task.description}
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.type}</div>
                                    </div>

                                    {/* Created By */}
                                    <div style={{ flex: '0 0 120px', color: 'var(--text-secondary)' }}>
                                        {task.creator}
                                    </div>

                                    {/* Handler */}
                                    <div style={{ flex: '0 0 150px' }}>
                                        {task.assigneeName ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '2px 8px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.8rem'
                                            }}>
                                                🤖 {task.assigneeName}
                                            </span>
                                        ) : (
                                            <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Unassigned</span>
                                        )}
                                    </div>

                                    {/* % Complete */}
                                    <div style={{ flex: '0 0 100px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${task.progress || 0}%`,
                                                height: '100%',
                                                background: getStatusColor(task.status),
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '0.75rem', width: '30px' }}>{task.progress || 0}%</div>
                                    </div>

                                    {/* Next Steps */}
                                    <div style={{ flex: '1 1 200px', paddingRight: '16px', color: 'var(--text-secondary)' }}>
                                        {task.nextSteps || '-'}
                                    </div>

                                    {/* Status */}
                                    <div style={{ flex: '0 0 100px' }}>
                                        <span style={{
                                            color: getStatusColor(task.status),
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            border: `1px solid ${getStatusColor(task.status)}`,
                                            opacity: 0.8
                                        }}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
