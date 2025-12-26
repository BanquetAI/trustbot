/**
 * Tasks Page - Task Board with Kanban-style columns
 */
import { TaskBoard } from '../components/TaskBoard';

export function TasksPage() {
    return (
        <div className="tasks-page">
            <TaskBoard onClose={() => {}} />
        </div>
    );
}
